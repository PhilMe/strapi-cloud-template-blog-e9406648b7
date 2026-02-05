#!/usr/bin/env python3
"""
Download COBI product images from cobibricks.com

This script scrapes product images from cobibricks.com and saves them locally.
Then it uploads them to Strapi.

Usage:
    pip install requests beautifulsoup4 --break-system-packages
    STRAPI_TOKEN=xxx python scripts/download-cobi-images.py
"""

import os
import re
import sys
import json
import requests
from bs4 import BeautifulSoup
from pathlib import Path
from urllib.parse import urljoin

# Configuration
STRAPI_URL = os.environ.get('STRAPI_URL', 'http://localhost:1337')
STRAPI_TOKEN = os.environ.get('STRAPI_TOKEN')
IMAGES_DIR = Path(__file__).parent / 'images'

# Product mappings: set_number -> cobibricks.com product URL
PRODUCTS = {
    '4833': 'https://cobibricks.com/product/uss-enterprise-cv-6,3322',
    '4836': 'https://cobibricks.com/product/battleship-bismarck,13624',  # Actually 4841
    '4837': 'https://cobibricks.com/product/battleship-missouri-bb-63,9694',
    '2559': 'https://cobibricks.com/product/panzerkampfwagen-vi-tiger-ausf-e,3315',
    '2587': 'https://cobibricks.com/product/panzerkampfwagen-vi-tiger-i-ausf-e,14040',
    '2572': 'https://cobibricks.com/product/t-3485,3313',
    '5749': 'https://cobibricks.com/product/b-17g-flying-fortress,14022',
    '5741': 'https://cobibricks.com/product/messerschmitt-bf-109-f-2,3318',
    '5728': 'https://cobibricks.com/product/supermarine-spitfire-mk-ix,3319',
    '2295': 'https://cobibricks.com/product/willys-mb-trailer,3324',
}

# Headers to mimic a browser
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,de;q=0.8',
}


def ensure_images_dir():
    """Create images directory if it doesn't exist."""
    IMAGES_DIR.mkdir(exist_ok=True)
    return IMAGES_DIR


def get_product_images(url: str) -> list:
    """Fetch product page and extract image URLs."""
    print(f"   Fetching: {url}")

    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"   Error fetching page: {e}")
        return []

    soup = BeautifulSoup(response.text, 'html.parser')

    # Find all product images
    # cobibricks.com uses data-src for lazy loading
    images = []

    # Look for gallery images
    for img in soup.select('img[data-src]'):
        src = img.get('data-src')
        if src and 'gallery' in src.lower():
            images.append(urljoin(url, src))

    # Also check regular src
    for img in soup.select('img[src]'):
        src = img.get('src')
        if src and 'gallery' in src.lower() and src not in images:
            images.append(urljoin(url, src))

    # Look for srcset
    for img in soup.select('img[srcset]'):
        srcset = img.get('srcset')
        if srcset:
            # Parse srcset and get highest resolution
            parts = srcset.split(',')
            for part in parts:
                url_part = part.strip().split(' ')[0]
                if 'gallery' in url_part.lower() and url_part not in images:
                    images.append(urljoin(url, url_part))

    # Deduplicate and filter
    unique_images = []
    seen = set()
    for img_url in images:
        # Normalize URL
        normalized = img_url.split('?')[0]  # Remove query params
        if normalized not in seen:
            seen.add(normalized)
            unique_images.append(img_url)

    return unique_images[:1]  # Return only the first (main) image


def download_image(url: str, filename: str) -> Path | None:
    """Download an image and save it locally."""
    filepath = IMAGES_DIR / filename

    if filepath.exists():
        print(f"   Image already exists: {filename}")
        return filepath

    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()

        with open(filepath, 'wb') as f:
            f.write(response.content)

        print(f"   Downloaded: {filename}")
        return filepath
    except requests.RequestException as e:
        print(f"   Error downloading image: {e}")
        return None


def upload_to_strapi(filepath: Path) -> dict | None:
    """Upload an image to Strapi."""
    if not STRAPI_TOKEN:
        print("   STRAPI_TOKEN not set, skipping upload")
        return None

    try:
        with open(filepath, 'rb') as f:
            files = {'files': (filepath.name, f, 'image/jpeg')}
            headers = {'Authorization': f'Bearer {STRAPI_TOKEN}'}

            response = requests.post(
                f"{STRAPI_URL}/api/upload",
                files=files,
                headers=headers,
                timeout=60
            )
            response.raise_for_status()

            result = response.json()
            if result and len(result) > 0:
                print(f"   Uploaded to Strapi: {result[0].get('name')}")
                return result[0]
    except requests.RequestException as e:
        print(f"   Error uploading to Strapi: {e}")

    return None


def get_set_document_id(set_number: str) -> str | None:
    """Get the Strapi document ID for a set."""
    if not STRAPI_TOKEN:
        return None

    try:
        headers = {'Authorization': f'Bearer {STRAPI_TOKEN}'}
        response = requests.get(
            f"{STRAPI_URL}/api/sets?filters[setNumber][$eq]={set_number}",
            headers=headers,
            timeout=30
        )
        response.raise_for_status()

        result = response.json()
        if result.get('data') and len(result['data']) > 0:
            return result['data'][0].get('documentId')
    except requests.RequestException as e:
        print(f"   Error getting set: {e}")

    return None


def update_set_image(set_document_id: str, image_id: int) -> bool:
    """Update a set with an image."""
    if not STRAPI_TOKEN:
        return False

    try:
        headers = {
            'Authorization': f'Bearer {STRAPI_TOKEN}',
            'Content-Type': 'application/json'
        }

        data = {'data': {'images': [image_id]}}

        response = requests.put(
            f"{STRAPI_URL}/api/sets/{set_document_id}",
            json=data,
            headers=headers,
            timeout=30
        )
        response.raise_for_status()
        print(f"   Updated set with image")
        return True
    except requests.RequestException as e:
        print(f"   Error updating set: {e}")

    return False


def main():
    print("\n🖼️  COBI Image Downloader\n")

    if not STRAPI_TOKEN:
        print("⚠️  STRAPI_TOKEN not set - images will be downloaded but not uploaded\n")

    ensure_images_dir()

    for set_number, product_url in PRODUCTS.items():
        print(f"\n📦 Processing set {set_number}...")

        # Get images from product page
        image_urls = get_product_images(product_url)

        if not image_urls:
            print(f"   ⚠️ No images found for set {set_number}")
            continue

        # Download the main image
        image_url = image_urls[0]
        filename = f"{set_number}.jpg"
        filepath = download_image(image_url, filename)

        if not filepath:
            print(f"   ⚠️ Failed to download image for set {set_number}")
            continue

        # Upload to Strapi
        if STRAPI_TOKEN:
            uploaded = upload_to_strapi(filepath)

            if uploaded:
                # Update the set with the image
                set_doc_id = get_set_document_id(set_number)
                if set_doc_id:
                    update_set_image(set_doc_id, uploaded['id'])
                else:
                    print(f"   ⚠️ Set {set_number} not found in Strapi")

    print("\n✅ Done!\n")
    print(f"Images saved to: {IMAGES_DIR}")


if __name__ == '__main__':
    main()
