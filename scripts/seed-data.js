/**
 * Cobipedia Seed Script
 * Creates sample data in Strapi
 *
 * Usage:
 * 1. Create an API Token in Strapi Admin (Settings > API Tokens > Create new API Token)
 *    - Give it "Full access" permissions
 * 2. Run: STRAPI_TOKEN=your_token_here node scripts/seed-data.js
 */

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;

if (!STRAPI_TOKEN) {
  console.error('❌ STRAPI_TOKEN environment variable is required');
  console.log('\nTo create a token:');
  console.log('1. Go to http://localhost:1337/admin');
  console.log('2. Settings > API Tokens > Create new API Token');
  console.log('3. Give it "Full access" permissions');
  console.log('4. Run: STRAPI_TOKEN=your_token_here node scripts/seed-data.js');
  process.exit(1);
}

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

// ============================================
// SEED DATA
// ============================================

const manufacturer = {
  name: 'COBI',
  slug: 'cobi',
  description: 'Polnischer Hersteller von Klemmbausteinen, spezialisiert auf historische Militärfahrzeuge und lizenzierte Sets.',
  website: 'https://cobi.pl',
  country: 'Polen',
};

const categories = [
  {
    name: 'Schiffe',
    slug: 'schiffe',
    description: 'Kriegsschiffe, U-Boote und Marineschiffe aus verschiedenen Epochen.',
  },
  {
    name: 'Panzer',
    slug: 'panzer',
    description: 'Kampfpanzer, Schützenpanzer und gepanzerte Fahrzeuge.',
  },
  {
    name: 'Flugzeuge',
    slug: 'flugzeuge',
    description: 'Jagdflugzeuge, Bomber und Transportflugzeuge.',
  },
  {
    name: 'Fahrzeuge',
    slug: 'fahrzeuge',
    description: 'LKW, Jeeps und andere Militärfahrzeuge.',
  },
];

const sets = [
  // Schiffe
  {
    setNumber: '4833',
    name: 'USS Enterprise (CV-6)',
    slug: 'uss-enterprise-cv-6',
    subtitle: 'Amerikanischer Flugzeugträger',
    description: 'Die USS Enterprise (CV-6) war der berühmteste amerikanische Flugzeugträger des Zweiten Weltkriegs. Sie nahm an mehr Schlachten teil als jedes andere US-Kriegsschiff und erhielt 20 Battle Stars.',
    pieces: 2510,
    year: 2023,
    scale: '1:300',
    length: 83,
    width: 13,
    height: 19,
    dimensionUnit: 'cm',
    msrp: 249.95,
    currency: 'EUR',
    status: 'available',
    categorySlug: 'schiffe',
  },
  {
    setNumber: '4836',
    name: 'Bismarck',
    slug: 'bismarck',
    subtitle: 'Deutsches Schlachtschiff',
    description: 'Die Bismarck war das erste von zwei Schlachtschiffen der Bismarck-Klasse der deutschen Kriegsmarine. Sie gilt als eines der größten und kampfstärksten Schlachtschiffe ihrer Zeit.',
    pieces: 2789,
    year: 2024,
    scale: '1:300',
    length: 84,
    width: 12,
    height: 23,
    dimensionUnit: 'cm',
    msrp: 279.95,
    currency: 'EUR',
    status: 'available',
    categorySlug: 'schiffe',
  },
  {
    setNumber: '4837',
    name: 'Battleship Missouri (BB-63)',
    slug: 'battleship-missouri-bb-63',
    subtitle: 'Amerikanisches Schlachtschiff',
    description: 'Die USS Missouri (BB-63) ist ein Schlachtschiff der Iowa-Klasse. Berühmt wurde sie als Schauplatz der japanischen Kapitulation am 2. September 1945, die das Ende des Zweiten Weltkriegs markierte.',
    pieces: 2655,
    year: 2024,
    scale: '1:300',
    length: 91,
    width: 11,
    height: 25,
    dimensionUnit: 'cm',
    msrp: 289.95,
    currency: 'EUR',
    status: 'available',
    categorySlug: 'schiffe',
  },
  // Panzer
  {
    setNumber: '2559',
    name: 'Tiger I',
    slug: 'tiger-i',
    subtitle: 'Schwerer deutscher Kampfpanzer',
    description: 'Der Panzerkampfwagen VI Tiger war ein schwerer deutscher Kampfpanzer, der im Zweiten Weltkrieg eingesetzt wurde. Er war für seine schwere Panzerung und die durchschlagskräftige 8,8-cm-Kanone bekannt.',
    pieces: 1225,
    year: 2023,
    scale: '1:28',
    length: 31,
    width: 14,
    height: 12,
    dimensionUnit: 'cm',
    msrp: 109.95,
    currency: 'EUR',
    status: 'available',
    categorySlug: 'panzer',
  },
  {
    setNumber: '2587',
    name: 'Panther G',
    slug: 'panther-g',
    subtitle: 'Deutscher mittlerer Kampfpanzer',
    description: 'Der Panzerkampfwagen V Panther war ein deutscher mittlerer Kampfpanzer des Zweiten Weltkriegs. Er kombinierte Feuerkraft, Schutz und Beweglichkeit auf einzigartige Weise.',
    pieces: 980,
    year: 2024,
    scale: '1:28',
    length: 32,
    width: 12,
    height: 10,
    dimensionUnit: 'cm',
    msrp: 89.95,
    currency: 'EUR',
    status: 'available',
    categorySlug: 'panzer',
  },
  {
    setNumber: '2572',
    name: 'T-34/85',
    slug: 't-34-85',
    subtitle: 'Sowjetischer mittlerer Kampfpanzer',
    description: 'Der T-34 war ein sowjetischer mittlerer Panzer, der ab 1940 gebaut wurde. Die Variante T-34/85 mit der stärkeren 85-mm-Kanone wurde ab 1944 produziert und gilt als einer der besten Panzer des Zweiten Weltkriegs.',
    pieces: 668,
    year: 2023,
    scale: '1:28',
    length: 28,
    width: 11,
    height: 9,
    dimensionUnit: 'cm',
    msrp: 64.95,
    currency: 'EUR',
    status: 'available',
    categorySlug: 'panzer',
  },
  // Flugzeuge
  {
    setNumber: '5749',
    name: 'B-17G Flying Fortress',
    slug: 'b-17g-flying-fortress',
    subtitle: 'Amerikanischer schwerer Bomber',
    description: 'Die Boeing B-17 Flying Fortress war ein viermotoriger schwerer Bomber der US-Luftwaffe im Zweiten Weltkrieg. Sie wurde hauptsächlich für strategische Tagesbombardierungen über Europa eingesetzt.',
    pieces: 1210,
    year: 2024,
    scale: '1:48',
    length: 50,
    width: 66,
    height: 14,
    dimensionUnit: 'cm',
    msrp: 119.95,
    currency: 'EUR',
    status: 'available',
    categorySlug: 'flugzeuge',
  },
  {
    setNumber: '5741',
    name: 'Messerschmitt Bf 109 F-2',
    slug: 'messerschmitt-bf-109-f-2',
    subtitle: 'Deutsches Jagdflugzeug',
    description: 'Die Messerschmitt Bf 109 war eines der wichtigsten deutschen Jagdflugzeuge des Zweiten Weltkriegs. Die F-Variante gilt als eine der ausgereiftesten Versionen dieses Klassikers.',
    pieces: 278,
    year: 2023,
    scale: '1:32',
    length: 29,
    width: 31,
    height: 9,
    dimensionUnit: 'cm',
    msrp: 39.95,
    currency: 'EUR',
    status: 'available',
    categorySlug: 'flugzeuge',
  },
  {
    setNumber: '5728',
    name: 'Supermarine Spitfire Mk.IX',
    slug: 'supermarine-spitfire-mk-ix',
    subtitle: 'Britisches Jagdflugzeug',
    description: 'Die Supermarine Spitfire war das legendäre britische Jagdflugzeug des Zweiten Weltkriegs. Die Mk.IX Version war eine der meistgebauten Varianten und spielte eine entscheidende Rolle in der Luftschlacht um England.',
    pieces: 280,
    year: 2024,
    scale: '1:32',
    length: 29,
    width: 35,
    height: 9,
    dimensionUnit: 'cm',
    msrp: 39.95,
    currency: 'EUR',
    status: 'available',
    categorySlug: 'flugzeuge',
  },
  // Fahrzeuge
  {
    setNumber: '2295',
    name: 'Willys MB & Trailer',
    slug: 'willys-mb-trailer',
    subtitle: 'Amerikanischer Geländewagen',
    description: 'Der Willys MB, allgemein bekannt als "Jeep", war das Standard-Leichtfahrzeug der US-Streitkräfte im Zweiten Weltkrieg. Mit diesem Set kommt auch ein passender Anhänger.',
    pieces: 260,
    year: 2023,
    scale: '1:35',
    length: 14,
    width: 6,
    height: 6,
    dimensionUnit: 'cm',
    msrp: 29.95,
    currency: 'EUR',
    status: 'available',
    categorySlug: 'fahrzeuge',
  },
];

// ============================================
// SEED FUNCTIONS
// ============================================

async function createManufacturer() {
  console.log('📦 Creating manufacturer...');

  // Check if already exists
  const existing = await apiRequest('/manufacturers?filters[slug][$eq]=cobi');
  if (existing.data && existing.data.length > 0) {
    console.log('   ✓ Manufacturer already exists');
    return existing.data[0];
  }

  const result = await apiRequest('/manufacturers', 'POST', manufacturer);
  console.log('   ✓ Created manufacturer:', result.data.name);
  return result.data;
}

async function createCategories() {
  console.log('📂 Creating categories...');
  const createdCategories = {};

  for (const category of categories) {
    // Check if already exists
    const existing = await apiRequest(`/categories?filters[slug][$eq]=${category.slug}`);
    if (existing.data && existing.data.length > 0) {
      console.log(`   ✓ Category "${category.name}" already exists`);
      createdCategories[category.slug] = existing.data[0];
      continue;
    }

    const result = await apiRequest('/categories', 'POST', category);
    console.log(`   ✓ Created category: ${result.data.name}`);
    createdCategories[category.slug] = result.data;
  }

  return createdCategories;
}

async function createSets(manufacturerData, categoriesData) {
  console.log('🧱 Creating sets...');

  for (const set of sets) {
    // Check if already exists
    const existing = await apiRequest(`/sets?filters[setNumber][$eq]=${set.setNumber}`);
    if (existing.data && existing.data.length > 0) {
      console.log(`   ✓ Set "${set.name}" already exists`);
      continue;
    }

    const { categorySlug, ...setData } = set;

    // Sets ohne Relations erstellen - explizit alle Relations ausschließen
    const cleanSetData = {
      setNumber: setData.setNumber,
      name: setData.name,
      slug: setData.slug,
      subtitle: setData.subtitle,
      description: setData.description,
      pieces: setData.pieces,
      year: setData.year,
      scale: setData.scale,
      length: setData.length,
      width: setData.width,
      height: setData.height,
      dimensionUnit: setData.dimensionUnit,
      msrp: setData.msrp,
      currency: setData.currency,
      status: setData.status,
    };

    const result = await apiRequest('/sets', 'POST', cleanSetData);
    console.log(`   ✓ Created set: ${result.data.setNumber} - ${result.data.name}`);
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('\n🚀 Starting Cobipedia seed...\n');
  console.log(`   Strapi URL: ${STRAPI_URL}`);
  console.log('');

  try {
    const manufacturerData = await createManufacturer();
    const categoriesData = await createCategories();
    await createSets(manufacturerData, categoriesData);

    console.log('\n✅ Seed completed successfully!\n');
    console.log('You can now view the data at:');
    console.log(`   Admin: ${STRAPI_URL}/admin/content-manager`);
    console.log(`   API: ${STRAPI_URL}/api/sets?populate=*`);
  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
    process.exit(1);
  }
}

main();
