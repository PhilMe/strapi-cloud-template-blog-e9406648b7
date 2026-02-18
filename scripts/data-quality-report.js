/**
 * Data Quality Report
 * Checks all sets for completeness and generates a report.
 *
 * Usage: STRAPI_TOKEN=xxx node scripts/data-quality-report.js
 *        STRAPI_TOKEN=xxx node scripts/data-quality-report.js --json
 */

const STRAPI_URL = process.env.STRAPI_URL || 'https://creative-candy-431b8ede18.strapiapp.com';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;

if (!STRAPI_TOKEN) {
  console.error('❌ STRAPI_TOKEN required');
  process.exit(1);
}

const JSON_OUTPUT = process.argv.includes('--json');

const FIELDS_TO_CHECK = [
  { key: 'name', label: 'Name', weight: 10 },
  { key: 'description', label: 'Beschreibung', weight: 8 },
  { key: 'subtitle', label: 'Untertitel', weight: 3 },
  { key: 'metaDescription', label: 'Meta Description', weight: 7 },
  { key: 'images', label: 'Bilder', weight: 10, check: (v) => Array.isArray(v) && v.length > 0 },
  { key: 'pieces', label: 'Teile', weight: 8 },
  { key: 'scale', label: 'Maßstab', weight: 5 },
  { key: 'year', label: 'Jahr', weight: 5 },
  { key: 'msrp', label: 'UVP', weight: 4 },
  { key: 'category', label: 'Kategorie', weight: 9, check: (v) => v && v.id },
  { key: 'affiliateLinks', label: 'Affiliate Links', weight: 7, check: (v) => Array.isArray(v) && v.length > 0 },
  { key: 'historicalContext', label: 'Hist. Kontext', weight: 5, check: (v) => v && v.id },
  { key: 'length', label: 'Dimensionen', weight: 3 },
  { key: 'weight', label: 'Gewicht', weight: 2 },
  { key: 'ean', label: 'EAN', weight: 2 },
  { key: 'minifigures', label: 'Figuren', weight: 3 },
];

async function fetchAllSets() {
  const allSets = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const params = new URLSearchParams();
    params.set('pagination[page]', page.toString());
    params.set('pagination[pageSize]', pageSize.toString());
    params.set('populate', '*');
    params.set('locale', 'de');

    const res = await fetch(`${STRAPI_URL}/api/sets?${params}`, {
      headers: { Authorization: `Bearer ${STRAPI_TOKEN}` },
    });

    if (!res.ok) {
      throw new Error(`Strapi API error: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    allSets.push(...json.data);

    if (page >= json.meta.pagination.pageCount) break;
    page++;
  }

  return allSets;
}

function checkSet(set) {
  const results = {};
  let score = 0;
  let maxScore = 0;
  const missing = [];

  for (const field of FIELDS_TO_CHECK) {
    maxScore += field.weight;
    const value = set[field.key];
    const hasValue = field.check
      ? field.check(value)
      : value !== null && value !== undefined && value !== '';

    results[field.key] = hasValue;
    if (hasValue) {
      score += field.weight;
    } else {
      missing.push(field.label);
    }
  }

  return {
    setNumber: set.setNumber,
    name: set.name,
    score: Math.round((score / maxScore) * 100),
    missing,
    results,
  };
}

async function main() {
  console.log('📊 Data Quality Report');
  console.log('='.repeat(60));

  const sets = await fetchAllSets();
  console.log(`\n→ ${sets.length} Sets geladen\n`);

  const reports = sets.map(checkSet).sort((a, b) => a.score - b.score);

  if (JSON_OUTPUT) {
    // JSON output for dashboard consumption
    const summary = {
      totalSets: reports.length,
      averageScore: Math.round(reports.reduce((sum, r) => sum + r.score, 0) / reports.length),
      fieldStats: {},
      sets: reports,
    };

    for (const field of FIELDS_TO_CHECK) {
      const filled = reports.filter((r) => r.results[field.key]).length;
      summary.fieldStats[field.key] = {
        label: field.label,
        filled,
        missing: reports.length - filled,
        percent: Math.round((filled / reports.length) * 100),
      };
    }

    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  // Field-level stats
  console.log('📋 Feld-Statistiken:');
  console.log('-'.repeat(50));
  for (const field of FIELDS_TO_CHECK) {
    const filled = reports.filter((r) => r.results[field.key]).length;
    const pct = Math.round((filled / reports.length) * 100);
    const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
    console.log(`  ${field.label.padEnd(18)} ${bar} ${pct}% (${filled}/${reports.length})`);
  }

  // Overall stats
  const avg = Math.round(reports.reduce((sum, r) => sum + r.score, 0) / reports.length);
  console.log(`\n📈 Durchschnittliche Vollständigkeit: ${avg}%`);

  // Worst sets
  console.log('\n⚠️  Sets mit niedrigster Vollständigkeit:');
  console.log('-'.repeat(50));
  for (const r of reports.slice(0, 15)) {
    console.log(`  ${r.setNumber.padEnd(8)} ${r.score}% ${r.name}`);
    if (r.missing.length > 0) {
      console.log(`           Fehlt: ${r.missing.join(', ')}`);
    }
  }

  // Perfect sets
  const perfect = reports.filter((r) => r.score === 100);
  console.log(`\n✅ Vollständige Sets (100%): ${perfect.length}/${reports.length}`);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
