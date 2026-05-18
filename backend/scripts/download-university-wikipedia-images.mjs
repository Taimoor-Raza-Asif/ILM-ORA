/**
 * Download university images from English Wikipedia (MediaWiki API).
 * 1) pageimages thumbnail when available
 * 2) parse article → pick best File:… → imageinfo URL (covers logos as SVG/JPG)
 *
 * https://meta.wikimedia.org/wiki/User-Agent_policy
 *
 *   node backend/scripts/download-university-wikipedia-images.mjs
 *   node backend/scripts/download-university-wikipedia-images.mjs --dry-run
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.join(REPO_ROOT, 'frontend/public/images/universities');

const USER_AGENT =
  'ILM-ORA/1.0 (educational project; local asset fetch; https://github.com/MuhammadAbdullahGhani/ILM-ORA)';

const DELAY_MS = 600;

/** Wikipedia article titles to try in order (prefer Pakistan-disambiguated names). */
const MANIFEST = [
  {
    file: 'air-university.jpg',
    titles: ['Air University (Pakistan)', 'Pakistan Air Force Academy'],
    commonsQuery: 'Air University Islamabad Pakistan logo',
    clearbitDomain: 'au.edu.pk',
  },
  {
    file: 'al-karam.jpg',
    titles: ['Al-Karam International University', 'Al-Karam University'],
    commonsQuery: 'Al-Karam International University logo',
    clearbitDomain: 'akii.edu.pk',
  },
  { file: 'al-khair.jpg', titles: ['Al-Khair University'], clearbitDomain: 'alkhair.edu.pk' },
  { file: 'allama-iqbal-uni.jpg', titles: ['Allama Iqbal Open University'] },
  { file: 'abasyn.jpg', titles: ['Abasyn University'] },
  { file: 'bahria.jpg', titles: ['Bahria University'] },
  { file: 'bnu.jpg', titles: ['Beaconhouse National University'] },
  { file: 'comsats.jpg', titles: ['COMSATS University Islamabad'] },
  {
    file: 'cust.jpg',
    titles: [
      'Capital University of Science and Technology',
      'Capital University of Science and Technology, Islamabad',
    ],
    commonsQuery: 'CUST Islamabad university logo',
    clearbitDomain: 'cust.edu.pk',
  },
  { file: 'fast.jpg', titles: ['National University of Computer and Emerging Sciences'] },
  { file: 'fjw.jpg', titles: ['Fatima Jinnah Women University'] },
  { file: 'foundation.jpg', titles: ['Foundation University Islamabad'] },
  {
    file: 'fuuast.jpg',
    titles: [
      'Federal Urdu University of Arts, Sciences and Technology',
      'Federal Urdu University',
    ],
  },
  {
    file: 'giki.jpg',
    titles: [
      'Ghulam Ishaq Khan Institute of Engineering Sciences and Technology',
      'GIKI Institute',
    ],
  },
  {
    file: 'iiui.jpg',
    titles: [
      'International Islamic University, Islamabad',
      'International Islamic University Islamabad',
    ],
    commonsQuery: 'International Islamic University Islamabad logo',
    clearbitDomain: 'iiu.edu.pk',
  },
  { file: 'ist.jpg', titles: ['Institute of Space Technology'] },
  { file: 'miu.jpg', titles: ['Mohi-ud-Din Islamic University', 'Mohiuddin Islamic University'], commonsQuery: 'Mohiuddin Islamic University logo', clearbitDomain: 'miu.edu.pk' },
  {
    file: 'ndu.jpg',
    titles: ['National Defence University, Pakistan', 'National Defence University (Pakistan)', 'National Defence University Islamabad'],
    commonsQuery: 'National Defence University Pakistan logo',
  },
  { file: 'northern.jpg', titles: ['Northern University, Nowshera'] },
  { file: 'nsu.jpg', titles: ['National Skills University'] },
  { file: 'numl.jpg', titles: ['National University of Modern Languages'] },
  { file: 'nust.jpg', titles: ['National University of Sciences and Technology (Pakistan)'] },
  {
    file: 'nutech.jpg',
    titles: ['National University of Technology (Pakistan)', 'National University of Technology Islamabad'],
    commonsQuery: 'National University of Technology Islamabad logo',
    clearbitDomain: 'nutech.edu.pk',
  },
  {
    file: 'pide.jpg',
    titles: ['Pakistan Institute of Development Economics'],
    commonsQuery: 'Pakistan Institute of Development Economics logo',
    clearbitDomain: 'pide.org.pk',
  },
  { file: 'pieas.jpg', titles: ['Pakistan Institute of Engineering and Applied Sciences'] },
  { file: 'qau.jpg', titles: ['Quaid-i-Azam University'] },
  { file: 'riphah.jpg', titles: ['Riphah International University'] },
  { file: 'rmu.jpg', titles: ['Rawalpindi Medical University'] },
  {
    file: 'sir-syed-case-uni.jpg',
    titles: ['Sir Syed University of Engineering and Technology', 'Sir Syed CASE Institute of Technology'],
  },
  { file: 'stmu.jpg', titles: ['Shifa Tameer-e-Millat University'] },
  {
    file: 'szabist.jpg',
    titles: [
      'Shaheed Zulfikar Ali Bhutto Institute of Science and Technology',
      'Shaheed Zulfiqar Ali Bhutto Institute of Science and Technology',
      'SZABIST',
    ],
    commonsQuery: 'SZABIST logo',
    clearbitDomain: 'szabist.edu.pk',
  },
  { file: 'szabmu.jpg', titles: ['Shaheed Zulfiqar Ali Bhutto Medical University'] },
  {
    file: 'apcoms.jpg',
    titles: ['Army Public College of Management and Sciences', 'National University of Sciences and Technology (Pakistan)'],
    commonsQuery: 'Army Public College of Management and Sciences logo',
  },
];

const COPIES = [
  { from: 'air-university.jpg', to: 'air-h11.jpg' },
  { from: 'bahria.jpg', to: 'bahria-h11.jpg' },
];

const BAD_FILE = new RegExp(
  [
    'ambox',
    'oojs',
    'wikimedia',
    'commons-logo',
    'symbol_',
    'icon_edit',
    'question_book',
    'flag_of',
    'emblem_of_pakistan',
    'category\\.svg',
    'disambig',
    'red_pog',
    'Ambox',
    'system-search',
    'system_search',
    'wiktionary',
    'wikiquote',
    'wikiversity',
    'wikinews',
    'wikibooks',
    'wikisource',
    'graduation_hat',
    'graduation-hat',
    'OOjs',
    'edit-ltr',
    'Magnifying_glass',
    'Folder_Hexagonal_Icon',
  ].join('|'),
  'i'
);

/** Minimum score to accept an embedded file (avoids generic UI SVGs). */
const MIN_FILE_SCORE = 28;

function scoreImage(name) {
  if (!name || BAD_FILE.test(name)) return -1000;
  let s = 0;
  if (/logo|seal|crest|emblem|shield|vector|wordmark/i.test(name)) s += 70;
  if (/\.(jpe?g|png|webp)$/i.test(name)) s += 45;
  if (/\.svg$/i.test(name)) s += 30;
  if (/university|college|campus|institute/i.test(name)) s += 12;
  return s;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function httpsGetJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } },
        (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 400) {
              reject(new Error(`HTTP ${res.statusCode}`));
              return;
            }
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(e);
            }
          });
        }
      )
      .on('error', reject);
  });
}

function httpsDownloadToFile(imageUrl, destPath) {
  return new Promise((resolve, reject) => {
    const tmp = destPath + '.part';
    const file = fs.createWriteStream(tmp);
    https
      .get(imageUrl, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          const loc = res.headers.location;
          file.close();
          try {
            fs.unlinkSync(tmp);
          } catch {
            /* ignore */
          }
          if (!loc) {
            reject(new Error('Redirect without location'));
            return;
          }
          httpsDownloadToFile(new URL(loc, imageUrl).href, destPath).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode && res.statusCode >= 400) {
          file.close();
          try {
            fs.unlinkSync(tmp);
          } catch {
            /* ignore */
          }
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close(() => {
            fs.rename(tmp, destPath, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        });
      })
      .on('error', (err) => {
        try {
          file.close();
        } catch {
          /* ignore */
        }
        try {
          fs.unlinkSync(tmp);
        } catch {
          /* ignore */
        }
        reject(err);
      });
  });
}

function pickThumbnailFromQueryResponse(json) {
  const pages = json?.query?.pages;
  if (!pages) return null;
  for (const p of Object.values(pages)) {
    if (p && !p.missing && p.thumbnail?.source) return p.thumbnail.source;
  }
  return null;
}

async function wikiThumbnailForTitle(title) {
  const api = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=thumbnail&pithumbsize=900&titles=${encodeURIComponent(title)}&redirects=1`;
  const json = await httpsGetJson(api);
  return pickThumbnailFromQueryResponse(json);
}

async function parsePageImages(pageTitle) {
  const api = `https://en.wikipedia.org/w/api.php?action=parse&format=json&formatversion=2&page=${encodeURIComponent(pageTitle)}&prop=images`;
  try {
    const json = await httpsGetJson(api);
    if (json.error) return [];
    return json.parse?.images || [];
  } catch {
    return [];
  }
}

async function getBestFileUrl(fileName, site = 'en.wikipedia.org') {
  const title = fileName.startsWith('File:') ? fileName : `File:${fileName}`;
  const api = `https://${site}/w/api.php?action=query&format=json&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|mime&iiurlwidth=960`;
  const json = await httpsGetJson(api);
  const pages = json?.query?.pages;
  if (!pages) return null;
  for (const p of Object.values(pages)) {
    const ii = p?.imageinfo?.[0];
    if (ii?.thumburl) return ii.thumburl;
    if (ii?.url) return ii.url;
  }
  return null;
}

function looksLikeImageBuffer(buf) {
  if (!buf || buf.length < 12) return false;
  const b0 = buf[0];
  const b1 = buf[1];
  const b2 = buf[2];
  const b3 = buf[3];
  if (b0 === 0xff && b1 === 0xd8 && b2 === 0xff) return true;
  if (b0 === 0x89 && b1 === 0x50 && b2 === 0x4e && b3 === 0x47) return true;
  if (b0 === 0x47 && b1 === 0x49 && b2 === 0x46 && b3 === 0x38) return true;
  if (b0 === 0x52 && b1 === 0x49 && b2 === 0x46 && b3 === 0x46 && buf.toString('ascii', 8, 12) === 'WEBP') return true;
  return false;
}

/** Clearbit logo API (brand logos when Wikipedia/Commons have none). Uses fetch (redirects, octet-stream). */
async function tryClearbitDomain(domain) {
  const url = `https://logo.clearbit.com/${domain}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow' });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (!looksLikeImageBuffer(buf) || buf.length < 80) return null;
    return { buffer: buf, via: `clearbit:${domain}` };
  } catch {
    return null;
  }
}

/** Google favicon service — works when logo.clearbit.com is blocked or returns non-image types. */
async function tryGoogleFaviconDomain(domain) {
  const url = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=256`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow' });
    const buf = Buffer.from(await res.arrayBuffer());
    // Google sometimes returns HTTP 404 with a valid PNG; trust magic bytes, not status.
    if (!looksLikeImageBuffer(buf) || buf.length < 80) return null;
    return { buffer: buf, via: `google-favicon:${domain}` };
  } catch {
    return null;
  }
}

async function commonsSearchImageUrl(searchQuery) {
  try {
    const api = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srnamespace=6&srlimit=12&srsearch=${encodeURIComponent(searchQuery)}`;
    const json = await httpsGetJson(api);
    const hits = json?.query?.search || [];
    const names = hits.map((h) => h.title.replace(/^File:/, ''));
    const ranked = [...names].sort((a, b) => scoreImage(b) - scoreImage(a));
    for (const raw of ranked) {
      if (scoreImage(raw) < MIN_FILE_SCORE) continue;
      const url = await getBestFileUrl(raw, 'commons.wikimedia.org');
      await sleep(120);
      if (url) return { url, via: `commons:${raw}` };
    }
  } catch {
    /* DNS / offline — skip Commons */
  }
  return null;
}

async function resolveFromParseTitles(titles) {
  for (const t of titles) {
    const images = await parsePageImages(t);
    await sleep(120);
    const ranked = [...images].sort((a, b) => scoreImage(b) - scoreImage(a));
    for (const cand of ranked) {
      if (scoreImage(cand) < MIN_FILE_SCORE) continue;
      const url = await getBestFileUrl(cand);
      await sleep(120);
      if (url) return { url, via: `file:${cand} @ ${t}` };
    }
  }
  return null;
}

async function resolveRow(row) {
  for (const t of row.titles) {
    const u = await wikiThumbnailForTitle(t);
    await sleep(120);
    if (u) return { url: u, via: `pageimage:${t}` };
  }
  const fromParse = await resolveFromParseTitles(row.titles);
  if (fromParse) return fromParse;
  if (row.commonsQuery) {
    const c = await commonsSearchImageUrl(row.commonsQuery);
    if (c) return c;
  }
  if (row.titles[0]) {
    const c = await commonsSearchImageUrl(`${row.titles[0]} logo`);
    if (c) return c;
  }
  if (row.clearbitDomain) {
    const cb = await tryClearbitDomain(row.clearbitDomain);
    await sleep(200);
    if (cb) return cb;
    const gf = await tryGoogleFaviconDomain(row.clearbitDomain);
    await sleep(200);
    if (gf) return gf;
  }
  return null;
}

async function main() {
  const dry = process.argv.includes('--dry-run');
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`Output directory: ${OUT_DIR}`);
  console.log(dry ? 'DRY RUN\n' : 'Downloading…\n');

  const results = { ok: [], fail: [] };

  for (const row of MANIFEST) {
    const dest = path.join(OUT_DIR, row.file);
    let resolved;
    try {
      resolved = await resolveRow(row);
    } catch (e) {
      console.warn(`FAIL  ${row.file} — ${e.message}`);
      results.fail.push(row.file);
      await sleep(DELAY_MS);
      continue;
    }

    if (!resolved) {
      console.warn(`FAIL  ${row.file} — no image (tried: ${row.titles.join(' | ')})`);
      results.fail.push(row.file);
      await sleep(DELAY_MS);
      continue;
    }

    if (dry) {
      console.log(`OK    ${row.file}  (${resolved.via})`);
      if (resolved.url) console.log(`      ${resolved.url}`);
      results.ok.push(row.file);
    } else {
      try {
        if (resolved.buffer) {
          fs.writeFileSync(dest, resolved.buffer);
        } else {
          await httpsDownloadToFile(resolved.url, dest);
        }
        console.log(`OK    ${row.file}  (${resolved.via})`);
        results.ok.push(row.file);
      } catch (e) {
        console.warn(`FAIL  ${row.file} download: ${e.message}`);
        results.fail.push(row.file);
      }
    }
    await sleep(DELAY_MS);
  }

  for (const { from, to } of COPIES) {
    const srcPath = path.join(OUT_DIR, from);
    const dstPath = path.join(OUT_DIR, to);
    if (dry) {
      if (fs.existsSync(srcPath) || results.ok.includes(from)) console.log(`COPY  ${to} <= ${from} (dry)`);
      continue;
    }
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, dstPath);
      console.log(`COPY  ${to} <= ${from}`);
    } else {
      console.warn(`SKIP  copy ${to} — missing ${from}`);
    }
  }

  console.log(`\nDone. OK: ${results.ok.length}, failed: ${results.fail.length}`);
  if (results.fail.length) console.log('Failed:', results.fail.join(', '));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
