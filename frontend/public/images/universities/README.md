# University Images Management Guide

## Overview
This guide explains how to add and manage university images in the ILM-ORA application.

## Directory Structure
```
frontend/
├── public/
│   └── images/
│       └── universities/
│           ├── default-university.svg (fallback image)
│           ├── air-university.jpg
│           ├── nust.jpg
│           └── ... (more university images)
└── src/
    └── shared/
        └── utils/
            └── universityImages.js (image mapping utility)

backend/
├── scripts/
│   ├── add-university-images.js (script to add image URLs to data)
│   └── download-university-wikipedia-images.mjs (fetch thumbnails from Wikipedia)
└── shared/
    └── data/
        └── universities data/
            └── universities intro details/
                └── universities_with_ratio.json (data with image URLs)
```

## How to Add University Images

### Method 1: Local Images (Recommended)

1. **Download or create university images:**
   - Image format: JPG, PNG, or WebP
   - Recommended size: 800x600px or 1200x800px
   - Aspect ratio: 4:3 or 16:9

2. **Name images using normalized university names:**
   ```
   Air University, Islamabad → air-university-islamabad.jpg
   NUST → nust.jpg
   COMSATS University Islamabad → comsats-university-islamabad.jpg
   ```

3. **Place images in the public folder:**
   ```
   frontend/public/images/universities/your-image.jpg
   ```

4. **Update the image mapping:**
   Edit `frontend/src/shared/utils/universityImages.js`:
   ```javascript
   export const universityImages = {
     'air-university-islamabad': '/images/universities/air-university-islamabad.jpg',
     'nust': '/images/universities/nust.jpg',
     // Add your new entries here
   };
   ```

5. **Run the backend script to update JSON data:**
   ```powershell
   cd backend
   node scripts/add-university-images.js
   ```

### Method 1b: Automated download (English Wikipedia)

Thumbnails come from English Wikipedia (`pageimages` and embedded article files), then **Wikimedia Commons** search, then **Clearbit** (`logo.clearbit.com/<domain>`) when `clearbitDomain` is set, then **Google favicons** (`google.com/s2/favicons`) for the same domain if Clearbit is unavailable. Requires internet access and working DNS (including `commons.wikimedia.org` when Commons is used).

From the **repository root**:

```powershell
node backend/scripts/download-university-wikipedia-images.mjs
```

Optional dry run (no files written):

```powershell
node backend/scripts/download-university-wikipedia-images.mjs --dry-run
```

Files are written to `frontend/public/images/universities/` using the same filenames as `universityImages.js`. If every source fails, that row prints `FAIL` in the console. Set `VITE_UNIVERSITY_LOCAL_IMAGES=false` in the frontend env to use generated avatars only.

### Method 2: External URLs (CDN/Cloud Storage)

1. **Upload images to a CDN or cloud storage:**
   - AWS S3
   - Cloudinary
   - ImgBB
   - Your own server

2. **Update the university data directly:**
   Edit `backend/shared/data/universities data/universities intro details/universities_with_ratio.json`:
   ```json
   {
     "University": "Air University, Islamabad",
     "image": "https://your-cdn.com/universities/air-university.jpg",
     ...
   }
   ```

3. **Or use environment variables:**
   ```javascript
   // In universityImages.js
   const CDN_BASE_URL = process.env.VITE_CDN_URL || '/images/universities';
   ```

### Method 3: Dynamic Image Loading (API-based)

Use services that provide university logos/images:

1. **Clearbit Logo API:**
   ```javascript
   const logoUrl = `https://logo.clearbit.com/${universityDomain}`;
   ```

2. **Wikipedia/Wikidata:**
   ```javascript
   // Use Wikipedia API to fetch university infobox images
   ```

3. **Google Custom Search API:**
   ```javascript
   // Search for university images programmatically
   ```

## Image Sources

### Where to Find University Images:

1. **Official University Websites:**
   - Usually have high-quality images in "About" or "Gallery" sections
   - Check: `https://[university-domain]/about` or `/gallery`

2. **Wikipedia:**
   - Many Pakistani universities have Wikipedia pages with images
   - Images are usually Creative Commons licensed

3. **HEC Pakistan Website:**
   - Higher Education Commission has university listings

4. **Social Media:**
   - Official university Facebook, Instagram, or Twitter pages
   - Always check licensing before using

5. **Free Stock Photo Sites:**
   - Unsplash: https://unsplash.com/s/photos/university-campus
   - Pexels: https://www.pexels.com/search/university/
   - Pixabay: https://pixabay.com/images/search/university/

## Bulk Image Download Script

Create a script to download images from a CSV:

```javascript
// download-university-images.js
import fs from 'fs';
import https from 'https';
import path from 'path';

const universities = [
  { name: 'Air University', url: 'https://example.com/air-uni.jpg' },
  { name: 'NUST', url: 'https://example.com/nust.jpg' },
  // ... more
];

universities.forEach(uni => {
  const filename = normalizeUniversityName(uni.name) + '.jpg';
  const filepath = path.join('frontend/public/images/universities', filename);
  
  const file = fs.createWriteStream(filepath);
  https.get(uni.url, response => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded: ${filename}`);
    });
  });
});
```

## Image Optimization

Before adding images, optimize them:

1. **Use online tools:**
   - TinyPNG: https://tinypng.com/
   - Squoosh: https://squoosh.app/
   - ImageOptim (Mac): https://imageoptim.com/

2. **Using command line:**
   ```bash
   # Install imagemagick
   convert input.jpg -resize 800x600 -quality 85 output.jpg
   ```

3. **Using npm packages:**
   ```bash
   npm install -g sharp-cli
   sharp -i input.jpg -o output.jpg resize 800 600
   ```

## Testing Images

After adding images, test them:

1. **Start the frontend:**
   ```powershell
   cd frontend
   npm run dev
   ```

2. **Navigate to Universities page**

3. **Check browser console for:**
   - Missing image errors (404s)
   - Slow loading images
   - Image fallbacks working correctly

4. **Test fallback:**
   - Temporarily rename an image file to verify fallback shows

## Current Image Status

Check which universities need images:

```javascript
// Run in browser console on Universities page
const universities = document.querySelectorAll('[data-university-id]');
universities.forEach(uni => {
  const img = uni.querySelector('img');
  if (img && img.src.includes('default-university')) {
    console.log('Missing image:', uni.getAttribute('data-university-name'));
  }
});
```

## Maintenance

Regularly check for:
- Broken image links
- Outdated images
- Universities without images
- Image load performance

## License Considerations

When adding images:
- ✅ Use images with Creative Commons license
- ✅ Credit original photographers/sources
- ✅ Use official university-provided images
- ❌ Don't use copyrighted images without permission
- ❌ Avoid images with watermarks

## Next Steps

1. ✅ Create `/frontend/public/images/universities/` folder
2. ✅ Add default placeholder image
3. ✅ Download/create images for top 10 universities
4. ✅ Run `add-university-images.js` script
5. ✅ Test in browser
6. ✅ Gradually add more images

## Support

For questions about image management:
1. Check browser console for errors
2. Verify image paths are correct
3. Check file permissions
4. Ensure images are web-optimized (< 500KB each)
