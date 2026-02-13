/**
 * Cobipedia Translation Script
 * Translates CMS content from German to English and Polish using Claude API.
 *
 * Prerequisites:
 *   1. Strapi i18n must be configured (Phase 1 done)
 *   2. npm install @anthropic-ai/sdk slugify (in cobipedia-cms)
 *
 * Usage:
 *   # Dry run - translate 3 sets, print results, don't write to Strapi
 *   STRAPI_TOKEN=xxx ANTHROPIC_API_KEY=xxx node scripts/translate-content.js --dry-run --limit 3
 *
 *   # Translate only English sets
 *   STRAPI_TOKEN=xxx ANTHROPIC_API_KEY=xxx node scripts/translate-content.js --locale en --type set
 *
 *   # Translate everything
 *   STRAPI_TOKEN=xxx ANTHROPIC_API_KEY=xxx node scripts/translate-content.js
 *
 *   # Resume after interruption (uses progress.json)
 *   STRAPI_TOKEN=xxx ANTHROPIC_API_KEY=xxx node scripts/translate-content.js --resume
 */

const Anthropic = require('@anthropic-ai/sdk').default;
const slugify = require('slugify');
const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================

const STRAPI_URL = process.env.STRAPI_URL || 'https://creative-candy-431b8ede18.strapiapp.com';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const TARGET_LOCALES = ['en', 'pl'];
const SOURCE_LOCALE = 'de';

// Models: Haiku for short content (sets, categories), Sonnet for long content (historical context)
const MODEL_SHORT = 'claude-haiku-4-5-20251001';
const MODEL_LONG = 'claude-sonnet-4-20250514';

const PROGRESS_FILE = path.join(__dirname, 'translate-progress.json');
const PAGE_SIZE = 50;

// Rate limiting
const CLAUDE_DELAY_MS = 250;   // Between Claude API calls
const STRAPI_DELAY_MS = 150;   // Between Strapi write calls

// Content type configurations
const CONTENT_TYPES = {
  category: {
    endpoint: '/categories',
    fields: ['name', 'description'],
    slugField: null, // Category slugs stay global (not localized)
    nameField: 'name',
    model: MODEL_SHORT,
    promptContext: 'a building block set category',
  },
  manufacturer: {
    endpoint: '/manufacturers',
    fields: ['name', 'description'],
    slugField: null,
    nameField: 'name',
    model: MODEL_SHORT,
    promptContext: 'a building block manufacturer',
  },
  series: {
    endpoint: '/all-series',
    fields: ['name', 'description'],
    slugField: null,
    nameField: 'name',
    model: MODEL_SHORT,
    promptContext: 'a building block set series/collection',
  },
  set: {
    endpoint: '/sets',
    fields: ['name', 'subtitle', 'description', 'metaTitle', 'metaDescription'],
    requiredFields: ['setNumber'], // Non-localized required fields that must be sent with every PUT
    slugField: 'slug', // Slug is localized for sets
    nameField: 'name',
    populateImages: true, // Workaround for media bug #25178
    model: MODEL_SHORT,
    promptContext: 'a COBI building block set (like LEGO but focused on military/historical models)',
  },
  'historical-context': {
    endpoint: '/historical-contexts',
    fields: ['title', 'period', 'summary', 'content'],
    slugField: 'slug', // Slug is localized
    nameField: 'title',
    model: MODEL_LONG, // Sonnet for longer historical texts
    promptContext: 'historical context information about a military vehicle/ship/aircraft',
  },
};

// ============================================
// CLI ARGUMENT PARSING
// ============================================

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const RESUME = args.includes('--resume');
const LIMIT = (() => {
  const idx = args.indexOf('--limit');
  return idx !== -1 ? parseInt(args[idx + 1], 10) : 0;
})();
const FILTER_LOCALE = (() => {
  const idx = args.indexOf('--locale');
  return idx !== -1 ? args[idx + 1] : null;
})();
const FILTER_TYPE = (() => {
  const idx = args.indexOf('--type');
  return idx !== -1 ? args[idx + 1] : null;
})();

// ============================================
// UTILITIES
// ============================================

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateSlug(name) {
  return slugify(name, {
    lower: true,
    strict: true,
    locale: 'en', // Use English locale rules for ASCII conversion
  });
}

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return {};
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function isCompleted(progress, type, locale, documentId) {
  return progress[type]?.[locale]?.completed?.includes(documentId);
}

function markCompleted(progress, type, locale, documentId) {
  if (!progress[type]) progress[type] = {};
  if (!progress[type][locale]) progress[type][locale] = { completed: [], errors: [] };
  if (!progress[type][locale].completed.includes(documentId)) {
    progress[type][locale].completed.push(documentId);
  }
}

function markError(progress, type, locale, documentId, error) {
  if (!progress[type]) progress[type] = {};
  if (!progress[type][locale]) progress[type][locale] = { completed: [], errors: [] };
  progress[type][locale].errors.push({ documentId, error: error.message, timestamp: new Date().toISOString() });
}

// ============================================
// STRAPI CLIENT
// ============================================

async function strapiRequest(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STRAPI_TOKEN}`,
    },
  };

  if (data) {
    options.body = JSON.stringify({ data });
  }

  const url = `${STRAPI_URL}/api${endpoint}`;
  const response = await fetch(url, options);

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Strapi ${method} ${endpoint} → ${response.status}: ${errorBody}`);
  }

  return response.json();
}

async function fetchAllEntries(config, locale) {
  const allEntries = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams();
    params.set('locale', locale);
    params.set('pagination[page]', page.toString());
    params.set('pagination[pageSize]', PAGE_SIZE.toString());

    // Request only the fields we need
    const allFields = [...config.fields, ...(config.requiredFields || [])];
    allFields.forEach((field, i) => {
      params.set(`fields[${i}]`, field);
    });
    // Always need documentId and the name field
    params.set(`fields[${allFields.length}]`, 'documentId');

    // If we need images for the media bug workaround
    if (config.populateImages) {
      params.set('populate[images][fields][0]', 'id');
    }

    const response = await strapiRequest(`${config.endpoint}?${params.toString()}`);

    if (response.data && response.data.length > 0) {
      allEntries.push(...response.data);
    }

    const totalPages = response.meta?.pagination?.pageCount || 1;
    hasMore = page < totalPages;
    page++;

    if (hasMore) await sleep(STRAPI_DELAY_MS);
  }

  return allEntries;
}

async function writeLocaleEntry(config, documentId, locale, data) {
  if (DRY_RUN) {
    console.log(`   [DRY RUN] Would PUT ${config.endpoint}/${documentId}?locale=${locale}`);
    console.log(`   Data:`, JSON.stringify(data, null, 2).substring(0, 300));
    return;
  }

  await strapiRequest(`${config.endpoint}/${documentId}?locale=${locale}`, 'PUT', data);
}

// ============================================
// CLAUDE TRANSLATOR
// ============================================

let anthropic;

function getLanguageName(locale) {
  const names = { en: 'English', pl: 'Polish' };
  return names[locale] || locale;
}

function buildPrompt(config, entry, targetLocale) {
  const languageName = getLanguageName(targetLocale);

  // Build the input fields section
  const inputFields = config.fields
    .map((field) => {
      const value = entry[field];
      if (!value || (typeof value === 'string' && !value.trim())) return null;
      return `${field}: ${value}`;
    })
    .filter(Boolean)
    .join('\n');

  // Build the expected output fields
  const outputFields = config.fields
    .filter((field) => entry[field] && (typeof entry[field] !== 'string' || entry[field].trim()))
    .map((f) => `"${f}": "..."`)
    .join(', ');

  return {
    system: `You are a professional translator specializing in military history and building block sets (similar to LEGO). You translate from German to ${languageName}. Always respond with valid JSON only, no markdown.`,
    user: `Translate this ${config.promptContext} info from German to ${languageName}.

Rules:
- Keep proper nouns (ship names, vehicle names, aircraft names, people names) untranslated
- Keep military designations unchanged (e.g. "Sd.Kfz. 234", "M4A3E8", "Bf 109 F-2")
- Translate generic terms: Panzer→Tank, Schiff→Ship, Flugzeug→Aircraft, Kampfpanzer→Battle Tank, etc.
- Keep set numbers and technical specs unchanged
- Keep it concise and factual, maintain the same tone
- If a field is empty or null, omit it from the response

Respond as JSON: {${outputFields}}

Input:
${inputFields}`,
  };
}

async function translateEntry(config, entry, targetLocale) {
  const { system, user } = buildPrompt(config, entry, targetLocale);

  const response = await anthropic.messages.create({
    model: config.model,
    max_tokens: 1024,
    system,
    messages: [{ role: 'user', content: user }],
  });

  const text = response.content[0].text.trim();

  // Parse JSON response, handling potential markdown wrapping
  let jsonText = text;
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    return JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`Failed to parse Claude response as JSON: ${text.substring(0, 200)}`);
  }
}

// ============================================
// MAIN TRANSLATION LOGIC
// ============================================

async function translateContentType(typeName, config, locales, progress) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 Translating: ${typeName}`);
  console.log(`${'='.repeat(60)}`);

  // Fetch all source (DE) entries
  console.log(`   Fetching ${SOURCE_LOCALE} entries...`);
  const entries = await fetchAllEntries(config, SOURCE_LOCALE);
  console.log(`   Found ${entries.length} entries`);

  if (entries.length === 0) {
    console.log(`   ⚠️  No entries found for ${typeName} in locale ${SOURCE_LOCALE}`);
    return;
  }

  const entriesToProcess = LIMIT > 0 ? entries.slice(0, LIMIT) : entries;

  for (const locale of locales) {
    console.log(`\n   🌐 Target locale: ${locale} (${getLanguageName(locale)})`);

    let translated = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < entriesToProcess.length; i++) {
      const entry = entriesToProcess[i];
      const documentId = entry.documentId;
      const displayName = entry[config.nameField] || documentId;

      // Skip if already completed (resume mode)
      if (RESUME && isCompleted(progress, typeName, locale, documentId)) {
        skipped++;
        continue;
      }

      const progress_str = `[${i + 1}/${entriesToProcess.length}]`;

      try {
        // Check if entry has any translatable content
        const hasContent = config.fields.some(
          (f) => entry[f] && (typeof entry[f] !== 'string' || entry[f].trim())
        );
        if (!hasContent) {
          console.log(`   ${progress_str} ⏭️  ${displayName} — no content to translate`);
          markCompleted(progress, typeName, locale, documentId);
          skipped++;
          continue;
        }

        // Translate via Claude
        process.stdout.write(`   ${progress_str} 🔄 ${displayName}...`);
        const translation = await translateEntry(config, entry, locale);
        await sleep(CLAUDE_DELAY_MS);

        // Build the data to write
        const writeData = {};

        // Copy non-localized required fields (e.g. setNumber) from source entry
        if (config.requiredFields) {
          for (const field of config.requiredFields) {
            if (entry[field] !== undefined) {
              writeData[field] = entry[field];
            }
          }
        }

        // Copy translated fields
        for (const field of config.fields) {
          if (translation[field] !== undefined) {
            writeData[field] = translation[field];
          }
        }

        // Generate localized slug if configured
        if (config.slugField && translation[config.nameField]) {
          let slug = generateSlug(translation[config.nameField]);
          // For sets: append setNumber to slug to ensure uniqueness (same pattern as DE slugs)
          if (entry.setNumber) {
            slug = `${slug}-${entry.setNumber}`;
          }
          writeData[config.slugField] = slug;
        }

        // Workaround for media bug #25178: include image IDs
        if (config.populateImages && entry.images) {
          writeData.images = entry.images.map((img) => img.id);
        }

        // Write to Strapi
        await writeLocaleEntry(config, documentId, locale, writeData);
        await sleep(STRAPI_DELAY_MS);

        markCompleted(progress, typeName, locale, documentId);
        translated++;

        const slugInfo = writeData[config.slugField]
          ? ` → slug: ${writeData[config.slugField]}`
          : '';
        console.log(` ✅ ${translation[config.nameField] || ''}${slugInfo}`);

        // Save progress every 10 items
        if (translated % 10 === 0) {
          saveProgress(progress);
        }
      } catch (error) {
        errors++;
        markError(progress, typeName, locale, documentId, error);
        console.log(` ❌ Error: ${error.message.substring(0, 100)}`);
      }
    }

    // Save progress after each locale
    saveProgress(progress);

    console.log(`\n   📊 ${locale}: ${translated} translated, ${skipped} skipped, ${errors} errors`);
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  // Validate env vars
  if (!STRAPI_TOKEN) {
    console.error('❌ STRAPI_TOKEN environment variable is required');
    console.log('   Create an API Token in Strapi Admin: Settings > API Tokens > Full access');
    process.exit(1);
  }

  if (!ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY environment variable is required');
    process.exit(1);
  }

  // Initialize Claude client
  anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  console.log('\n🚀 Cobipedia Translation Script');
  console.log('================================');
  console.log(`   Strapi:     ${STRAPI_URL}`);
  console.log(`   Source:     ${SOURCE_LOCALE}`);
  console.log(`   Targets:    ${FILTER_LOCALE || TARGET_LOCALES.join(', ')}`);
  console.log(`   Type:       ${FILTER_TYPE || 'all'}`);
  console.log(`   Dry run:    ${DRY_RUN ? 'YES' : 'no'}`);
  console.log(`   Resume:     ${RESUME ? 'YES' : 'no'}`);
  console.log(`   Limit:      ${LIMIT || 'none'}`);
  console.log(`   Short model: ${MODEL_SHORT}`);
  console.log(`   Long model:  ${MODEL_LONG}`);
  console.log('');

  // Load or create progress
  const progress = RESUME ? loadProgress() : {};

  // Determine what to translate
  const locales = FILTER_LOCALE ? [FILTER_LOCALE] : TARGET_LOCALES;
  const typeNames = FILTER_TYPE
    ? [FILTER_TYPE]
    : ['category', 'manufacturer', 'series', 'set', 'historical-context'];

  // Quick sanity check: can we reach Strapi?
  try {
    const test = await strapiRequest(`/sets?pagination[pageSize]=1&locale=${SOURCE_LOCALE}`);
    console.log(`   ✅ Strapi reachable — ${test.meta?.pagination?.total || 0} sets in ${SOURCE_LOCALE}`);
  } catch (error) {
    console.error(`   ❌ Cannot reach Strapi: ${error.message}`);
    process.exit(1);
  }

  // Quick sanity check: can we reach Claude?
  try {
    const test = await anthropic.messages.create({
      model: MODEL_SHORT,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Reply with "ok"' }],
    });
    console.log(`   ✅ Claude API reachable`);
  } catch (error) {
    console.error(`   ❌ Cannot reach Claude API: ${error.message}`);
    process.exit(1);
  }

  console.log('');

  // Translate each content type
  const startTime = Date.now();

  for (const typeName of typeNames) {
    const config = CONTENT_TYPES[typeName];
    if (!config) {
      console.error(`   ❌ Unknown content type: ${typeName}`);
      continue;
    }

    await translateContentType(typeName, config, locales, progress);
  }

  // Final summary
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Translation complete! (${duration} minutes)`);

  if (DRY_RUN) {
    console.log('\n⚠️  This was a DRY RUN — no data was written to Strapi.');
    console.log('   Remove --dry-run to write translations.');
  }

  // Print summary from progress
  console.log('\nSummary:');
  for (const [type, localeData] of Object.entries(progress)) {
    for (const [locale, data] of Object.entries(localeData)) {
      const completed = data.completed?.length || 0;
      const errors = data.errors?.length || 0;
      console.log(`   ${type} [${locale}]: ${completed} translated, ${errors} errors`);
    }
  }

  if (!DRY_RUN) {
    console.log(`\nProgress saved to: ${PROGRESS_FILE}`);
  }
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
