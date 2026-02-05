/**
 * Upload local images to Strapi and update Sets
 *
 * Usage:
 * 1. Download images manually from cobibricks.com
 * 2. Save them as: scripts/images/{setNumber}.jpg (e.g., 4837.jpg)
 * 3. Run: STRAPI_TOKEN=xxx node scripts/upload-images.js
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;
const IMAGES_DIR = path.join(__dirname, 'images');

if (!STRAPI_TOKEN) {
  console.error('❌ STRAPI_TOKEN required');
  process.exit(1);
}

// Set numbers to process
const SET_NUMBERS = ['4833', '4836', '4837', '2559', '2587', '2572', '5749', '5741', '5728', '2295'];

async function uploadImage(filepath, filename) {
  const formData = new FormData();
  formData.append('files', fs.createReadStream(filepath), filename);

  const response = await fetch(`${STRAPI_URL}/api/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRAPI_TOKEN}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload failed: ${error}`);
  }

  const result = await response.json();
  return result[0];
}

async function getSetByNumber(setNumber) {
  const response = await fetch(
    `${STRAPI_URL}/api/sets?filters[setNumber][$eq]=${setNumber}`,
    {
      headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get set: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data?.[0] || null;
}

async function updateSetImage(setDocumentId, imageId) {
  const response = await fetch(
    `${STRAPI_URL}/api/sets/${setDocumentId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          images: [imageId],
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Update failed: ${error}`);
  }

  return true;
}

async function main() {
  console.log('\n🖼️  Uploading images to Strapi...\n');

  // Check if form-data is available
  try {
    require.resolve('form-data');
  } catch (e) {
    console.log('Installing form-data package...');
    const { execSync } = require('child_process');
    execSync('npm install form-data', { stdio: 'inherit' });
  }

  for (const setNumber of SET_NUMBERS) {
    console.log(`\n📦 Processing set ${setNumber}...`);

    // Check if image exists
    const jpgPath = path.join(IMAGES_DIR, `${setNumber}.jpg`);
    const pngPath = path.join(IMAGES_DIR, `${setNumber}.png`);
    const webpPath = path.join(IMAGES_DIR, `${setNumber}.webp`);

    let imagePath = null;
    if (fs.existsSync(jpgPath)) imagePath = jpgPath;
    else if (fs.existsSync(pngPath)) imagePath = pngPath;
    else if (fs.existsSync(webpPath)) imagePath = webpPath;

    if (!imagePath) {
      console.log(`   ⚠️ No image found for set ${setNumber}`);
      continue;
    }

    console.log(`   Found: ${path.basename(imagePath)}`);

    // Get set from Strapi
    const set = await getSetByNumber(setNumber);
    if (!set) {
      console.log(`   ⚠️ Set ${setNumber} not found in Strapi`);
      continue;
    }

    console.log(`   Set: ${set.name}`);

    // Upload image
    try {
      console.log(`   ⏳ Uploading image...`);
      const uploaded = await uploadImage(imagePath, path.basename(imagePath));
      console.log(`   ✓ Uploaded: ${uploaded.name}`);

      // Update set
      await updateSetImage(set.documentId, uploaded.id);
      console.log(`   ✓ Set updated with image`);
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n✅ Done!\n');
}

main().catch(console.error);
