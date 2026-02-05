/**
 * Update Sets with Categories and Images
 *
 * Usage: STRAPI_TOKEN=xxx node scripts/update-sets.js
 */

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;

if (!STRAPI_TOKEN) {
  console.error('❌ STRAPI_TOKEN required');
  process.exit(1);
}

// Category mapping
const setCategoryMap = {
  '4833': 'schiffe',    // USS Enterprise
  '4836': 'schiffe',    // Bismarck
  '4837': 'schiffe',    // Missouri
  '2559': 'panzer',     // Tiger I
  '2587': 'panzer',     // Panther G
  '2572': 'panzer',     // T-34/85
  '5749': 'flugzeuge',  // B-17G
  '5741': 'flugzeuge',  // Bf 109
  '5728': 'flugzeuge',  // Spitfire
  '2295': 'fahrzeuge',  // Willys MB
};

// Image URLs - Using Unsplash placeholder images by category
const setImageUrls = {
  // Schiffe - Aircraft Carriers and Battleships
  '4833': 'https://images.unsplash.com/photo-1570446899920-a01c9e10b864?w=800&h=600&fit=crop', // USS Enterprise - aircraft carrier
  '4836': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop', // Bismarck - battleship
  '4837': 'https://images.unsplash.com/photo-1590675705532-038e3e9fa5d4?w=800&h=600&fit=crop', // Missouri - battleship
  // Panzer - Tanks
  '2559': 'https://images.unsplash.com/photo-1563396983906-b3795482a59a?w=800&h=600&fit=crop', // Tiger I
  '2587': 'https://images.unsplash.com/photo-1580752300992-559f8e44d683?w=800&h=600&fit=crop', // Panther G
  '2572': 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&h=600&fit=crop', // T-34
  // Flugzeuge - Aircraft
  '5749': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop', // B-17
  '5741': 'https://images.unsplash.com/photo-1616455579100-2ceaa4eb2d37?w=800&h=600&fit=crop', // Bf 109
  '5728': 'https://images.unsplash.com/photo-1568480289356-5a75d0fd47fc?w=800&h=600&fit=crop', // Spitfire
  // Fahrzeuge - Vehicles
  '2295': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop', // Willys Jeep
};

async function apiRequest(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${STRAPI_TOKEN}`,
    },
  };

  if (data) {
    options.body = JSON.stringify({ data });
  }

  const response = await fetch(`${STRAPI_URL}/api${endpoint}`, options);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error}`);
  }

  return response.json();
}

async function uploadImageFromUrl(url, filename) {
  try {
    // Fetch the image
    const imageResponse = await fetch(url);
    if (!imageResponse.ok) {
      console.log(`   ⚠ Could not fetch image from ${url}`);
      return null;
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });

    // Create form data
    const formData = new FormData();
    formData.append('files', blob, filename);

    // Upload to Strapi
    const uploadResponse = await fetch(`${STRAPI_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      console.log(`   ⚠ Upload failed: ${error}`);
      return null;
    }

    const uploadedFiles = await uploadResponse.json();
    return uploadedFiles[0]; // Return first uploaded file
  } catch (error) {
    console.log(`   ⚠ Image upload error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('\n🔄 Updating sets with categories and images...\n');

  try {
    // Get all categories
    console.log('📂 Fetching categories...');
    const categoriesResponse = await apiRequest('/categories');
    const categories = {};
    for (const cat of categoriesResponse.data) {
      categories[cat.slug] = cat;
    }
    console.log(`   Found ${Object.keys(categories).length} categories`);

    // Get manufacturer
    console.log('🏭 Fetching manufacturer...');
    const manufacturerResponse = await apiRequest('/manufacturers?filters[slug][$eq]=cobi');
    const manufacturer = manufacturerResponse.data[0];
    console.log(`   Found manufacturer: ${manufacturer?.name || 'Not found'}`);

    // Get all sets
    console.log('🧱 Fetching sets...');
    const setsResponse = await apiRequest('/sets');
    console.log(`   Found ${setsResponse.data.length} sets\n`);

    // Update each set
    for (const set of setsResponse.data) {
      console.log(`📝 Updating: ${set.setNumber} - ${set.name}`);

      const categorySlug = setCategoryMap[set.setNumber];
      const category = categories[categorySlug];
      const imageUrl = setImageUrls[set.setNumber];

      // Prepare update data
      const updateData = {};

      // Add category if found
      if (category) {
        updateData.category = category.documentId;
        console.log(`   ✓ Category: ${category.name}`);
      }

      // Add manufacturer
      if (manufacturer) {
        updateData.manufacturer = manufacturer.documentId;
        console.log(`   ✓ Manufacturer: ${manufacturer.name}`);
      }

      // Upload and add image
      if (imageUrl) {
        console.log(`   ⏳ Uploading image...`);
        const uploadedImage = await uploadImageFromUrl(imageUrl, `${set.setNumber}.jpg`);
        if (uploadedImage) {
          updateData.images = [uploadedImage.id];
          console.log(`   ✓ Image uploaded`);
        }
      }

      // Update the set if we have data to update
      if (Object.keys(updateData).length > 0) {
        await apiRequest(`/sets/${set.documentId}`, 'PUT', updateData);
        console.log(`   ✓ Set updated\n`);
      } else {
        console.log(`   ⚠ Nothing to update\n`);
      }
    }

    console.log('✅ All sets updated!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
