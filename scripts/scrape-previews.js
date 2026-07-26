const puppeteer = require('puppeteer');
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');

const SOURCES = [
  { name: 'homepage', url: 'https://poki.com/', needsScroll: true },
];

const OUTPUT_DIR = path.join(os.homedir(), 'Videos', 'tiktok', 'HighQuality');
const RAW_DIR = path.join(OUTPUT_DIR, '_raw');
const MAX_GAMES_PER_CAT = 30;
const CONCURRENCY = 3;

function findFfmpeg() {
  try {
    const r = execSync('where ffmpeg 2>nul', { shell: 'cmd.exe', encoding: 'utf8' }).trim().split('\n')[0];
    if (r) return r.trim();
  } catch {}
  for (const c of [
    path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe', 'ffmpeg-8.1.2-full_build', 'bin', 'ffmpeg.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Links', 'ffmpeg.exe'),
    'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
  ]) { if (fs.existsSync(c)) return c; }
  return 'ffmpeg';
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Download a file via HTTPS with referrer header
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const u = new URL(url);
    https.get({ hostname: u.hostname, path: u.pathname + u.search, port: 443, protocol: 'https:',
      headers: { Referer: 'https://poki.com/', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    }, (res) => {
      if (res.statusCode >= 400) {
        try { fs.unlinkSync(destPath); } catch {}
        reject(new Error(`HTTP ${res.statusCode} for ${url.slice(0, 60)}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (e) => { try { fs.unlinkSync(destPath); } catch {} reject(e); });
  });
}

// Run ffmpeg with args
function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const ff = spawn(findFfmpeg(), ['-y', ...args], { stdio: 'pipe' });
    let stderr = '';
    ff.stderr.on('data', (d) => { stderr += d.toString(); });
    ff.on('close', (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-200)}`)));
    ff.on('error', reject);
  });
}

// Process a raw video for TikTok format
async function processVideo(rawPath, outPath) {
  if (fs.existsSync(outPath)) return outPath;
  try {
    await runFfmpeg(['-i', rawPath,
      '-vf', 'scale=1080:1920:force_original_aspect_ratio=1,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black',
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '20',
      '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart',
      outPath
    ]);
    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) {
      return outPath;
    }
  } catch (e) { console.log(`  ffmpeg error: ${e.message}`); }
  return null;
}
// Phase 1: Collect video URLs by hovering
async function collectVideoUrls(browser, sources, maxPerSource) {
  const collected = [];
  const seen = new Set();

  for (const src of sources) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    console.log(`\n=== ${src.name} ===`);

    await page.goto(src.url, { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));

    // For homepage, scroll to trigger lazy rendering
    if (src.needsScroll) {
      const height = await page.evaluate(() => document.body.scrollHeight || document.documentElement.scrollHeight);
      for (let y = 0; y < Math.min(height || 5000, 5000); y += 400) {
        await page.evaluate((sy) => window.scrollTo(0, sy), y);
        await new Promise(r => setTimeout(r, 100));
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise(r => setTimeout(r, 1000));
    }

    const cardsInfo = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-video-url]'))
        .filter(c => { const r = c.getBoundingClientRect(); return r.width > 0 && r.height > 0; })
        .map(c => {
          const t = c.querySelector('[class*="title"], [class*="name"], h3, h2, span');
          return {
            index: Array.from(document.querySelectorAll('[data-video-url]')).indexOf(c),
            href: c.getAttribute('href') || '',
            name: t ? (t.textContent || '').trim() : '',
          };
        });
    });
    console.log(`  Visible cards: ${cardsInfo.length}`);

    let srcCount = 0;
    for (const info of cardsInfo) {
      if (srcCount >= maxPerSource) break;
      const slug = info.href.replace('/en/g/', '');
      if (seen.has(slug)) continue;

      try {
        const el = (await page.$$('[data-video-url]'))[info.index];
        if (!el) continue;

        await el.scrollIntoView();
        await new Promise(r => setTimeout(r, 300));
        const box = await el.boundingBox();
        if (!box || box.width === 0) continue;

        await page.mouse.move(box.x + box.width/2, box.y + box.height/2);
        await new Promise(r => setTimeout(r, 1200));

        const videoSrc = await page.evaluate((idx) => {
          const card = document.querySelectorAll('[data-video-url]')[idx];
          if (!card) return null;
          const cr = card.getBoundingClientRect();
          let best = null, bestOverlap = 0;
          for (const v of document.querySelectorAll('video')) {
            const vr = v.getBoundingClientRect();
            const ox = Math.max(0, Math.min(cr.right, vr.right) - Math.max(cr.left, vr.left));
            const oy = Math.max(0, Math.min(cr.bottom, vr.bottom) - Math.max(cr.top, vr.top));
            const o = ox * oy;
            if (o > bestOverlap) { bestOverlap = o; best = v; }
          }
          return best ? (best.currentSrc || best.src || '') : null;
        }, info.index);

        if (videoSrc) {
          seen.add(slug);
          srcCount++;
          const hqUrl = videoSrc.replace(/thumbnail\.\dx\d\./, 'thumbnail.3x3.').replace(/\.(vp9|h265)\.mp4/, '.h264.mp4');
          collected.push({ gameName: info.name || slug, slug, source: src.name, videoUrl: hqUrl });

          const dim = await page.evaluate((idx) => {
            const card = document.querySelectorAll('[data-video-url]')[idx];
            if (!card) return null;
            const cr = card.getBoundingClientRect();
            let best = null, bestOverlap = 0;
            for (const v of document.querySelectorAll('video')) {
              const vr = v.getBoundingClientRect();
              const ox = Math.max(0, Math.min(cr.right, vr.right) - Math.max(cr.left, vr.left));
              const oy = Math.max(0, Math.min(cr.bottom, vr.bottom) - Math.max(cr.top, vr.top));
              const o = ox * oy;
              if (o > bestOverlap) { bestOverlap = o; best = v; }
            }
            return best ? { w: best.videoWidth, h: best.videoHeight, d: best.duration } : null;
          }, info.index);
          console.log(`  [${srcCount}/${maxPerSource}] ${info.name || slug}${dim ? ' ' + dim.w + 'x' + dim.h + ' ' + dim.d.toFixed(1) + 's' : ''}`);
        }

        await page.mouse.move(0, 0);
        await new Promise(r => setTimeout(r, 200));
      } catch (e) { /* skip failed cards */ }
    }
    await page.close();
  }
  return collected;
}

// Phase 2: Download all raw videos in parallel
async function downloadAll(videos) {
  console.log(`\nDownloading ${videos.length} videos...`);
  let dlCount = 0;
  const queue = videos.map((v, i) => ({ ...v, index: i }));

  async function worker() {
    while (queue.length > 0) {
      const v = queue.shift();
      const rawPath = path.join(RAW_DIR, `${v.slug}_raw.mp4`);
      if (fs.existsSync(rawPath) && fs.statSync(rawPath).size > 1000) {
        dlCount++;
        continue;
      }
      try {
        await downloadFile(v.videoUrl, rawPath);
        dlCount++;
        process.stdout.write(`\r  Downloaded ${dlCount}/${videos.length}`);
      } catch (e) {
        console.log(`\n  Failed: ${v.gameName} - ${e.message}`);
      }
    }
  }

  const workers = Array(Math.min(CONCURRENCY, videos.length)).fill().map(() => worker());
  await Promise.all(workers);
  console.log(`\n  Done: ${dlCount}/${videos.length} downloaded`);
}

// Phase 3: Process all videos for TikTok in parallel
async function processAll(videos, processed) {
  console.log(`\nProcessing ${videos.length} videos for TikTok...`);
  let procCount = 0;
  const queue = videos.map((v, i) => ({ ...v, index: i }));

  async function worker() {
    while (queue.length > 0) {
      const v = queue.shift();
      const rawPath = path.join(RAW_DIR, `${v.slug}_raw.mp4`);
      const outPath = path.join(OUTPUT_DIR, `${v.slug}.mp4`);

      if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) {
        procCount++;
        processed.push(v);
        continue;
      }
      if (!fs.existsSync(rawPath)) {
        procCount++;
        continue;
      }

      try {
        const result = await processVideo(rawPath, outPath);
        if (result) {
          processed.push(v);
          const size = fs.statSync(outPath).size;
          console.log(`  [${++procCount}/${videos.length}] ${v.gameName} (${(size/1024/1024).toFixed(1)}MB)`);
        } else {
          console.log(`  [${++procCount}/${videos.length}] ${v.gameName} FAILED`);
        }
      } catch (e) {
        console.log(`  [${++procCount}/${videos.length}] ${v.gameName} ERROR: ${e.message}`);
      }
    }
  }

  const workers = Array(Math.min(CONCURRENCY, videos.length)).fill().map(() => worker());
  await Promise.all(workers);
  console.log(`  Processed: ${processed.length}/${videos.length}`);
}

async function main() {
  console.log('Poki Preview Scraper for TikTok');
  console.log('===============================\n');

  for (const d of [OUTPUT_DIR, RAW_DIR]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }

  const args = {};
  process.argv.slice(2).forEach((arg, i, arr) => {
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      args[key] = (arr[i+1] && !arr[i+1].startsWith('--')) ? arr[i+1] : true;
    }
  });

  const maxPerSource = parseInt(args['max'] || args['limit']) || MAX_GAMES_PER_CAT;
  const filterSource = args['source'] || args['category'];
  const sources = filterSource ? SOURCES.filter(s => s.name === filterSource) : SOURCES;
  console.log(`Sources: ${sources.length} (${sources.map(s => s.name).join(', ')})`);
  console.log(`Max per source: ${maxPerSource}`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  // Phase 1: Collect URLs
  console.log('Phase 1: Collecting video URLs');
  const collected = await collectVideoUrls(browser, sources, maxPerSource);
  await browser.close();
  console.log(`\nCollected ${collected.length} unique game videos`);

  if (collected.length === 0) { console.log('No videos found.'); return; }

  // Phase 2: Download
  await downloadAll(collected);

  // Phase 3: Process
  const processed = [];
  await processAll(collected, processed);

  // Summary
  console.log(`\n==============================`);
  console.log(`Total unique games: ${collected.length}`);
  console.log(`Successfully processed: ${processed.length}`);
  console.log(`Raw: ${RAW_DIR}`);
  console.log(`Output: ${OUTPUT_DIR}`);

  const indexPath = path.join(OUTPUT_DIR, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(processed, null, 2));
  console.log(`Index: ${indexPath}`);
}

main().catch(console.error);
