/**
 * Creates Brickcoast affiliate shop and links in Strapi.
 *
 * Usage:
 *   STRAPI_TOKEN=xxx node scripts/create-brickcoast-links.js
 *   STRAPI_TOKEN=xxx node scripts/create-brickcoast-links.js --dry-run
 */

const STRAPI_URL = 'https://creative-candy-431b8ede18.strapiapp.com';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;
const REF_ID = 'd5ajhgdgc06a';
const DRY_RUN = process.argv.includes('--dry-run');

if (!STRAPI_TOKEN) {
  console.error('STRAPI_TOKEN env var required');
  process.exit(1);
}

// All Brickcoast COBI products scraped from https://brickcoast.de/Cobi_2
const BRICKCOAST_PRODUCTS = [
  // Page 1
  { setNumber: '4858', url: 'https://brickcoast.de/COBI-4858-U-Boot-VIIB-U-47', price: 17.95 },
  { setNumber: '5916', url: 'https://brickcoast.de/COBI-5916-Northrop-B-2-Spirit', price: 74.95 },
  { setNumber: '4855', url: 'https://brickcoast.de/COBI-4855-ORP-Orzel', price: 17.95 },
  { setNumber: '4856', url: 'https://brickcoast.de/COBI-4856-ORP-Sep', price: 17.95 },
  { setNumber: '4857', url: 'https://brickcoast.de/COBI-4857-U-Boot-VIIC-U-96', price: 17.95 },
  { setNumber: '24637', url: 'https://brickcoast.de/COBI-24637-Volkswagen-T3-Polizei', price: 20.95 },
  { setNumber: '24638', url: 'https://brickcoast.de/COBI-24638-Volkswagen-T3-Camper-Van', price: 23.95 },
  { setNumber: '1687', url: 'https://brickcoast.de/COBI-1687-RMS-Olympic-1700', price: 37.95 },
  { setNumber: '24634', url: 'https://brickcoast.de/COBI-24634-Volkswagen-T3', price: 20.95 },
  { setNumber: '24635', url: 'https://brickcoast.de/COBI-24635-Volkswagen-T3-Feuerwehr', price: 23.95 },
  { setNumber: '24636', url: 'https://brickcoast.de/COBI-24636-Volkswagen-T3-Krankenwagen', price: 20.95 },
  { setNumber: '4853', url: 'https://brickcoast.de/COBI-4853-Battleship-Tirpitz-1700', price: 41.95 },
  { setNumber: '4854', url: 'https://brickcoast.de/COBI-4854-Battleship-Bismarck-1700', price: 41.95 },
  { setNumber: '2632', url: 'https://brickcoast.de/COBI-2632-M1A2-Abrams', price: 49.95 },
  { setNumber: '2665', url: 'https://brickcoast.de/COBI-2665-SdKfz-138-1-Grille-Ausf-M', price: 39.95 },
  { setNumber: '2666', url: 'https://brickcoast.de/COBI-2666-Panzer-38t-CKD-LT-vz38', price: 39.95 },
  { setNumber: '2427', url: 'https://brickcoast.de/COBI-2427-F-4C-Phantom-II', price: 49.95 },
  { setNumber: '5908', url: 'https://brickcoast.de/COBI-5908-F-4M-Phantom-II-FGR2', price: 49.95 },
  { setNumber: '4852', url: 'https://brickcoast.de/COBI-4852-U-Boot-U-52-Type-VIIB', price: 36.75 },
  { setNumber: '2663', url: 'https://brickcoast.de/COBI-2663-Panzerhaubitze-Hummel-SdKfz165', price: 77.95 },
  // Page 2
  { setNumber: '20096', url: 'https://brickcoast.de/COBI-20096-HMS-Victory', price: 130.30 },
  { setNumber: '24639', url: 'https://brickcoast.de/COBI-24639-Volkswagen-T3-Winter-Adventure', price: 24.95 },
  { setNumber: '2660', url: 'https://brickcoast.de/COBI-2660-Panzer-I-AusfB', price: 35.75 },
  { setNumber: '5921', url: 'https://brickcoast.de/COBI-5921-TOP-GUN-Enemy-Strike-Jet', price: 62.95 },
  { setNumber: '24626', url: 'https://brickcoast.de/COBI-24626-Citroen-Type-H-Holidays', price: 26.80 },
  { setNumber: '24630', url: 'https://brickcoast.de/COBI-24630-Citroen-Type-H-Police', price: 19.95 },
  { setNumber: '5907', url: 'https://brickcoast.de/COBI-5907-Lockheed-F-104-Starfighter', price: 37.15 },
  { setNumber: '5909', url: 'https://brickcoast.de/COBI-5909-Su-57-Felon', price: 62.95 },
  { setNumber: '5912', url: 'https://brickcoast.de/COBI-5912-F-35B-Lightning-II', price: 44.75 },
  { setNumber: '24632', url: 'https://brickcoast.de/COBI-24632-Citroen-Type-H-Service', price: 19.95 },
  { setNumber: '2426', url: 'https://brickcoast.de/COBI-2426-Lockheed-F-104-Starfighter', price: 36.17 },
  { setNumber: '5904', url: 'https://brickcoast.de/COBI-5904-F-35A-Lightning-II-Husarz', price: 43.45 },
  { setNumber: '1686', url: 'https://brickcoast.de/COBI-1686-RMS-Titanic-1300', price: 197.55 },
  { setNumber: '24516', url: 'https://brickcoast.de/COBI-24516-Trabant-601-Deluxe', price: 12.95 },
  { setNumber: '5766', url: 'https://brickcoast.de/COBI-5766-Messerschmitt-Me-163B-Komet', price: 38.75 },
  { setNumber: '5764', url: 'https://brickcoast.de/COBI-5764-Supermarine-Spitfire-MkIXe', price: 28.75 },
  { setNumber: '5871', url: 'https://brickcoast.de/COBI-5871-Focke-Wulf-Fw-190-F-8', price: 18.80 },
  { setNumber: '5920', url: 'https://brickcoast.de/COBI-5920-Grumman-F-14-Tomcat', price: 54.18 },
  { setNumber: '2734', url: 'https://brickcoast.de/COBI-2734-Panzer-VI-Tiger-I-no-131', price: 27.98 },
  { setNumber: '2735', url: 'https://brickcoast.de/COBI-2735-PzKpfw-VI-Tiger-AusfE', price: 26.11 },
  // Page 3
  { setNumber: '6292', url: 'https://brickcoast.de/COBI-6292-Flying-Scotsman-British-Steam-Locomotive', price: 152.73 },
  { setNumber: '24362', url: 'https://brickcoast.de/COBI-24362-Volkswagen-T2b-Bus', price: 114.95 },
  { setNumber: '5903', url: 'https://brickcoast.de/COBI-5903-Lockheed-F-117-Nighthawk', price: 46.67 },
  { setNumber: '3138', url: 'https://brickcoast.de/COBI-3138-Historical-Collection-Panzer-VIII-Maus', price: 74.95 },
  { setNumber: '24361', url: 'https://brickcoast.de/COBI-24361-Volkswagen-T2a-Camper-Van-Executive-Edition', price: 144.95 },
  { setNumber: '24616', url: 'https://brickcoast.de/COBI-24616-Volkswagen-T2a-Camper', price: 27.84 },
  { setNumber: '24617', url: 'https://brickcoast.de/COBI-24617-Volkswagen-T2a-Kombi', price: 28.32 },
  { setNumber: '24622', url: 'https://brickcoast.de/COBI-24622-Volkswagen-T2b-Feuerwehr', price: 17.57 },
  { setNumber: '5900', url: 'https://brickcoast.de/COBI-5900-Boeing-F-15-EX-Eagle-II', price: 46.70 },
  { setNumber: '2059', url: 'https://brickcoast.de/COBI-2059-Iwo-Jima-1945', price: 13.45 },
  { setNumber: '24633', url: 'https://brickcoast.de/COBI-24633-Citroen-Type-H-La-Petite-Boulangerie', price: 39.95 },
  { setNumber: '2732', url: 'https://brickcoast.de/COBI-2732-PzKpfw-VI-B-Tiger-II-Koenigstiger', price: 26.12 },
  { setNumber: '2733', url: 'https://brickcoast.de/COBI-2733-Panzerjaeger-Tiger-AusfB-Jagdtiger', price: 27.84 },
  { setNumber: '1384', url: 'https://brickcoast.de/COBI-1384-Dornier-Do-J-Wal-Amundsen-N-25', price: 43.95 },
  { setNumber: '1684', url: 'https://brickcoast.de/COBI-1684-BWT-Alpine-F1-Team-Car', price: 18.75 },
  { setNumber: '24619', url: 'https://brickcoast.de/COBI-24619-Volkswagen-T2b-Krankenwagen', price: 17.35 },
  { setNumber: '24621', url: 'https://brickcoast.de/COBI-24621-Volkswagen-T2b-Bus', price: 18.24 },
  { setNumber: '24360', url: 'https://brickcoast.de/COBI-24360-Volkswagen-Golf-Cabriolet', price: 98.30 },
  { setNumber: '24618', url: 'https://brickcoast.de/COBI-24618-Volkswagen-T2a-Pritschenwagen', price: 17.57 },
  { setNumber: '2654', url: 'https://brickcoast.de/COBI-2654-PzKpfw-V-Panther-Ausf-A', price: 79.80 },
  // Page 4
  { setNumber: '5869', url: 'https://brickcoast.de/COBI-5869-Mustang-P-51B', price: 17.55 },
  { setNumber: '5870', url: 'https://brickcoast.de/COBI-5870-Messerschmitt-Bf-109-G', price: 15.94 },
  { setNumber: '24358', url: 'https://brickcoast.de/COBI-24358-Volkswagen-Golf-GTI-1976-1983-Executive-Edition-112', price: 97.95 },
  { setNumber: '26630', url: 'https://brickcoast.de/COBI-26630-Bell-429-Police', price: 19.75 },
  { setNumber: '5906', url: 'https://brickcoast.de/COBI-5906-Sikorsky-UH-60-Black-Hawk', price: 61.07 },
  { setNumber: '24359', url: 'https://brickcoast.de/COBI-24359-Volkswagen-Golf-1974-1983-112', price: 84.95 },
  { setNumber: '24613', url: 'https://brickcoast.de/COBI-24613-Volkswagen-Golf-1974-1983', price: 12.80 },
  { setNumber: '24614', url: 'https://brickcoast.de/COBI-24614-Volkswagen-Golf-GTI-1976-1983', price: 11.84 },
  { setNumber: '24615', url: 'https://brickcoast.de/COBI-24615-Volkswagen-Golf-GTI-1976-1983-blau', price: 11.84 },
  { setNumber: '2655', url: 'https://brickcoast.de/COBI-2655-Panzer-V-Panther-Ausf-G-Pudel', price: 69.95 },
  { setNumber: '20015', url: 'https://brickcoast.de/COBI-20015-Osterhase', price: 7.79 },
  { setNumber: '20016', url: 'https://brickcoast.de/COBI-20016-Osterkueken', price: 7.79 },
  { setNumber: '24607', url: 'https://brickcoast.de/COBI-24607-RAM-1500', price: 18.75 },
  { setNumber: '24608', url: 'https://brickcoast.de/COBI-24608-RAM-1500-Police', price: 17.34 },
  { setNumber: '24609', url: 'https://brickcoast.de/COBI-24609-RAM-3500-Ambulance', price: 26.34 },
  { setNumber: '24611', url: 'https://brickcoast.de/COBI-24611-RAM-3500-Wrecker-Tow-Truck', price: 26.80 },
  { setNumber: '24612', url: 'https://brickcoast.de/COBI-24612-RAM-3500-Fire-Truck', price: 26.80 },
  { setNumber: '5897', url: 'https://brickcoast.de/COBI-5897-F-4-Phantom-II-USS-Midway', price: 43.66 },
  { setNumber: '5898', url: 'https://brickcoast.de/COBI-5898-F-4F-Phantom-II-Luftwaffe', price: 41.91 },
  { setNumber: '5899', url: 'https://brickcoast.de/COBI-5899-F-4S-Phantom-II', price: 43.15 },
  // Page 5
  { setNumber: '1680', url: 'https://brickcoast.de/COBI-1680-RMS-Titanic-1700-2025', price: 34.83 },
  { setNumber: '1681', url: 'https://brickcoast.de/COBI-1681-HMHS-Britannic', price: 34.95 },
  { setNumber: '3127', url: 'https://brickcoast.de/COBI-3127-Panzerkampfwagen-IV-AusfG', price: 34.84 },
  { setNumber: '5895', url: 'https://brickcoast.de/COBI-5895-F-35B-STOVL-Lightning-II', price: 41.20 },
  { setNumber: '3123', url: 'https://brickcoast.de/COBI-3123-Panzer-VI-Tiger-I-no-131', price: 48.14 },
  { setNumber: '3124', url: 'https://brickcoast.de/COBI-3124-PzKpfw-VI-Tiger-Ausf-E', price: 50.84 },
  { setNumber: '2598', url: 'https://brickcoast.de/COBI-2598-SdKfz124-Wespe-Executive-Edition', price: 69.95 },
  { setNumber: '5894', url: 'https://brickcoast.de/COBI-5894-Panavia-Tornado-IDS', price: 34.64 },
  { setNumber: '2597', url: 'https://brickcoast.de/COBI-2597-Panzerkampfwagen-II-Ausf-F', price: 57.46 },
  { setNumber: '6291', url: 'https://brickcoast.de/COBI-6291-Compiegne-Wagon-11-November-1918', price: 142.80 },
  { setNumber: '20071', url: 'https://brickcoast.de/COBI-20071-Imperium-Romanum-Roemisches-Kriegsschiff', price: 72.13 },
  { setNumber: '20009', url: 'https://brickcoast.de/COBI-20009-Feiertagsornamente-Christbaumschmuck', price: 7.79 },
  { setNumber: '20011', url: 'https://brickcoast.de/COBI-20011-Weihnachtsmann-Christbaumschmuck', price: 7.95 },
  { setNumber: '20012', url: 'https://brickcoast.de/COBI-20012-Schneemann-Christbaumschmuck', price: 7.79 },
  { setNumber: '20013', url: 'https://brickcoast.de/COBI-20013-Lebkuchenmann-Christbaumschmuck', price: 8.95 },
  { setNumber: '3120', url: 'https://brickcoast.de/COBI-3120-V2-Rocket-on-Meiller-Vehicle-Executive-Edition', price: 59.95 },
  { setNumber: '3121', url: 'https://brickcoast.de/COBI-3121-V2-Rocket', price: 33.84 },
  { setNumber: '5890', url: 'https://brickcoast.de/COBI-5890-Lockheed-SR-71-Blackbird-Executive-Edition', price: 94.38 },
  { setNumber: '2628', url: 'https://brickcoast.de/Cobi-2628-Panzerhaubitze-2000', price: 44.39 },
  { setNumber: '2595', url: 'https://brickcoast.de/Cobi-2595-T-34-76-mod-1941-42', price: 69.75 },
  // Page 6
  { setNumber: '5758', url: 'https://brickcoast.de/COBI-5758-Avro-Lancaster-B-III-Dambuster-Executive-Edition', price: 108.81 },
  { setNumber: '24515', url: 'https://brickcoast.de/Cobi-24515-Lancia-Delta-HF-Integrale-EVO-1991', price: 11.25 },
  { setNumber: '5883', url: 'https://brickcoast.de/COBI-5883-Grumman-F6F-Hellcat', price: 19.47 },
  { setNumber: '2627', url: 'https://brickcoast.de/COBI-2627-Challenger-2', price: 43.84 },
  { setNumber: '5882', url: 'https://brickcoast.de/COBI-5882-Lockheed-P-38-Lightning', price: 27.74 },
  { setNumber: '5896', url: 'https://brickcoast.de/COBI-5896-F-16AM-Fighting-Falcon', price: 39.99 },
  { setNumber: '2593', url: 'https://brickcoast.de/COBI-2593-Flakpanzer-IV-Wirbelwind-Executive-Edition', price: 77.95 },
  { setNumber: '3113', url: 'https://brickcoast.de/COBI-3113-Panzer-VI-Ausf-B-Koenigstiger', price: 53.95 },
  { setNumber: '2587', url: 'https://brickcoast.de/COBI-2587-Panzerkampfwagen-VI-Tiger-I-Ausf-E-Executive-Edition', price: 86.80 },
  { setNumber: '4851', url: 'https://brickcoast.de/COBI-4851-IJN-Akagi-Aircraft-Carrier', price: 187.85 },
  { setNumber: '24356', url: 'https://brickcoast.de/COBI-24356-Lancia-Delta-HF-Integrale-EVO-Executive-Edition', price: 104.95 },
  { setNumber: '24357', url: 'https://brickcoast.de/COBI-24357-Lancia-Delta-HF-Integrale', price: 94.50 },
  { setNumber: '2590', url: 'https://brickcoast.de/COBI-2590-IS-3-Soviet-Heavy-Tank', price: 74.95 },
  { setNumber: '24601', url: 'https://brickcoast.de/COBI-24601-Abarth-595-Competizione', price: 12.95 },
  { setNumber: '5866', url: 'https://brickcoast.de/COBI-5866-Hawker-Hurricane-Mk1', price: 15.93 },
  { setNumber: '2299', url: 'https://brickcoast.de/COBI-2299-Sainte-Mere-Eglise-Kirche', price: 116.80 },
  { setNumber: '24331', url: 'https://brickcoast.de/COBI-24331-Trabant-601', price: 66.66 },
  { setNumber: '24333', url: 'https://brickcoast.de/COBI-24333-Opel-Rekord-C-Schwarze-Witwe', price: 84.99 },
  { setNumber: '24335', url: 'https://brickcoast.de/COBI-24335-Maserati-MC20', price: 89.95 },
  { setNumber: '24351', url: 'https://brickcoast.de/COBI-24351-Maserati-MC20-Cielo-Executive-Edition', price: 101.14 },
  // Page 7
  { setNumber: '2588', url: 'https://brickcoast.de/COBI-2588-Panzer-VI-Tiger-no131', price: 63.46 },
  { setNumber: '24508', url: 'https://brickcoast.de/COBI-24508-Lancia-Delta-HF', price: 10.13 },
  { setNumber: '24509', url: 'https://brickcoast.de/COBI-24509-Lancia-Delta-HF-Integrale', price: 10.97 },
  { setNumber: '24349', url: 'https://brickcoast.de/COBI-24349-Opel-Manta-A-GT-E-1974', price: 94.76 },
  { setNumber: '2585', url: 'https://brickcoast.de/COBI-2585-38-cm-Sturmmoerser-Sturmtiger-Historical-Collection-WW2', price: 59.63 },
  { setNumber: '26609', url: 'https://brickcoast.de/COBI-26609-Boeing-747-First-Flight-1969-Flugzeug-Bausatz', price: 48.59 },
  { setNumber: '4835', url: 'https://brickcoast.de/COBI-4835-Battleship-Gneisenau-Defekter-Karton', price: 93.41 },
  { setNumber: '5855', url: 'https://brickcoast.de/COBI-5855-Lockheed-F-22-Raptor', price: 48.88 },
  { setNumber: '6284', url: 'https://brickcoast.de/COBI-6284-Schwerer-Plattformwagen-Type-SSYS', price: 26.92 },
  { setNumber: '24354', url: 'https://brickcoast.de/COBI-24354-Fiat-500-Abarth-595-Weiss', price: 49.94 },
  { setNumber: '24339', url: 'https://brickcoast.de/COBI-24339-Opel-Manta-A-1970', price: 94.76 },
  { setNumber: '24353', url: 'https://brickcoast.de/COBI-24353-Fiat-500-Abarth-595-Executive-Edition', price: 64.21 },
  { setNumber: '5848', url: 'https://brickcoast.de/COBI-5848-Eurofighter-Typhoon-G', price: 40.14 },
  { setNumber: '26608', url: 'https://brickcoast.de/COBI-26608-Boeing-737-8-Flugzeug', price: 27.99 },
  { setNumber: '5749', url: 'https://brickcoast.de/COBI-5749-Boeing-B-17F-Flying-Fortress-Memphis-Belle-Executive-Edition', price: 74.50 },
  { setNumber: '5811', url: 'https://brickcoast.de/COBI-5811A-F-14A-Tomcat', price: 44.16 },
  { setNumber: '1930', url: 'https://brickcoast.de/COBI-1930-Space-Shuttle-Atlantis', price: 37.34 },
  { setNumber: '1929', url: 'https://brickcoast.de/COBI-1929-Titanic', price: 32.57 },
  { setNumber: '5805', url: 'https://brickcoast.de/COBI-5805A-F-A-18E-Super-Hornet', price: 42.37 },
  { setNumber: '5801', url: 'https://brickcoast.de/Cobi-Armed-Forces-5801-Mirage-2000-5', price: 27.99 },
  // Page 8 (unique only)
  { setNumber: '1917', url: 'https://brickcoast.de/COBI-1917-Concorde-G-BBDG', price: 31.40 },
];

// Deduplicate by setNumber (keep first occurrence = lower price or first seen)
const seen = new Set();
const products = BRICKCOAST_PRODUCTS.filter(p => {
  if (seen.has(p.setNumber)) return false;
  seen.add(p.setNumber);
  return true;
});

async function strapiRequest(method, endpoint, body) {
  const url = `${STRAPI_URL}/api${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${STRAPI_TOKEN}`,
    },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${endpoint} → ${res.status}: ${text}`);
  }
  return JSON.parse(text);
}

async function findOrCreateShop() {
  // Check if Brickcoast shop already exists
  const existing = await strapiRequest('GET', '/shops?filters[slug][$eq]=brickcoast');
  if (existing.data && existing.data.length > 0) {
    console.log(`✓ Shop "Brickcoast" already exists (documentId: ${existing.data[0].documentId})`);
    return existing.data[0].documentId;
  }

  if (DRY_RUN) {
    console.log('[DRY RUN] Would create shop: Brickcoast');
    return 'dry-run-shop-id';
  }

  // Create the shop
  const result = await strapiRequest('POST', '/shops', {
    data: {
      name: 'Brickcoast',
      slug: 'brickcoast',
      website: 'https://brickcoast.de',
      isPrimary: false,
      trackingParameter: `ref=${REF_ID}`,
      locales: ['de'],
    },
  });
  console.log(`✓ Created shop "Brickcoast" (documentId: ${result.data.documentId})`);
  return result.data.documentId;
}

async function getSetDocumentId(setNumber) {
  const result = await strapiRequest(
    'GET',
    `/sets?filters[setNumber][$eq]=${setNumber}&fields[0]=setNumber&fields[1]=documentId&pagination[pageSize]=1&locale=de`
  );
  if (result.data && result.data.length > 0) {
    return result.data[0].documentId;
  }
  return null;
}

async function getExistingAffiliateLinks(setDocumentId) {
  const result = await strapiRequest(
    'GET',
    `/sets/${setDocumentId}?populate[affiliateLinks][populate][shop][fields][0]=slug&locale=de`
  );
  return result.data?.affiliateLinks || [];
}

async function main() {
  console.log(`\n=== Brickcoast Affiliate Link Creator ===`);
  console.log(`Products to process: ${products.length}`);
  console.log(`Ref-ID: ${REF_ID}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);

  // Step 1: Create or find shop
  const shopDocumentId = await findOrCreateShop();

  // Step 2: Process each product
  let created = 0;
  let skipped = 0;
  let notFound = 0;
  let errors = 0;

  for (const product of products) {
    try {
      // Find the set in Strapi
      const setDocumentId = await getSetDocumentId(product.setNumber);
      if (!setDocumentId) {
        console.log(`  ✗ Set #${product.setNumber} not found in Strapi`);
        notFound++;
        continue;
      }

      // Check if this set already has a Brickcoast affiliate link
      const existingLinks = await getExistingAffiliateLinks(setDocumentId);
      const hasBrickcoast = existingLinks.some(link => link.shop?.slug === 'brickcoast');
      if (hasBrickcoast) {
        console.log(`  → Set #${product.setNumber} already has Brickcoast link, skipping`);
        skipped++;
        continue;
      }

      const affiliateUrl = `${product.url}?ref=${REF_ID}`;

      if (DRY_RUN) {
        console.log(`  [DRY RUN] Would create link for #${product.setNumber}: ${affiliateUrl} (${product.price}€)`);
        created++;
        continue;
      }

      // Create the affiliate link
      const linkResult = await strapiRequest('POST', '/affiliate-links', {
        data: {
          url: affiliateUrl,
          price: product.price,
          currency: 'EUR',
          inStock: true,
          shop: shopDocumentId,
        },
      });

      // Connect the link to the set
      const linkDocumentId = linkResult.data.documentId;

      // Get current affiliate links for the set and add the new one
      const currentLinks = existingLinks.map(l => ({ documentId: l.documentId }));
      currentLinks.push({ documentId: linkDocumentId });

      await strapiRequest('PUT', `/sets/${setDocumentId}?locale=de`, {
        data: {
          affiliateLinks: { connect: [{ documentId: linkDocumentId }] },
          setNumber: (await strapiRequest('GET', `/sets/${setDocumentId}?fields[0]=setNumber&locale=de`)).data.setNumber,
        },
      });

      console.log(`  ✓ #${product.setNumber}: ${affiliateUrl} (${product.price}€)`);
      created++;

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.error(`  ✗ Error for #${product.setNumber}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Created: ${created}`);
  console.log(`Skipped (already exists): ${skipped}`);
  console.log(`Not found in Strapi: ${notFound}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total processed: ${products.length}`);
}

main().catch(console.error);
