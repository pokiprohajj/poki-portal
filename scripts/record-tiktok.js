const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

function findFfmpeg() {
  try {
    const r = execSync('where ffmpeg 2>nul', { shell: 'cmd.exe', encoding: 'utf8' }).trim().split('\n')[0];
    if (r) return r.trim();
  } catch {}
  const candidates = [
    path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe', 'ffmpeg-8.1.2-full_build', 'bin', 'ffmpeg.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Links', 'ffmpeg.exe'),
    'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return 'ffmpeg';
}

const SITE = 'https://browsergameshq.com';

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach((arg, i, arr) => {
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const val = arr[i + 1];
      if (val && !val.startsWith('--')) {
        args[key] = val;
      } else {
        args[key] = true;
      }
    }
  });
  return args;
}

function slugify(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function findGameUrl(name) {
  const slug = slugify(name);
  console.log(`Searching for game: ${name} (slug: ${slug})...`);

  // Try direct slug first
  const directUrl = `${SITE}/en/g/${slug}`;
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    const resp = await page.goto(directUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
    if (resp && resp.status() !== 404) {
      await browser.close();
      return directUrl;
    }
    // Scrape category pages for game links
    const cats = ['new-games', 'top-rated', 'action-games', 'puzzle-games', 'racing-games'];
    for (const cat of cats) {
      await page.goto(`${SITE}/en/${cat}`, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 2000));
      const links = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a[href*="/en/g/"]'))
          .map(a => a.href.split('?')[0].split('#')[0])
          .filter((v, i, a) => a.indexOf(v) === i)
      );
      const match = links.find(u => u.toLowerCase().includes(slug.slice(0, 6)));
      if (match) { await browser.close(); return match; }
      if (links.length > 0) { await browser.close(); return links[Math.floor(Math.random() * links.length)]; }
    }
    await browser.close();
  } catch {}
  return directUrl;
}

async function findCategoryUrls(category, count) {
  console.log(`Fetching games from category: ${category}...`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  const catPath = category.replace(/\s+/g, '-').toLowerCase();
  await page.goto(`${SITE}/en/${catPath}`, { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 3000));

  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href*="/en/g/"]'))
      .map(a => a.href.split('?')[0])
      .filter((v, i, a) => a.indexOf(v) === i)
  );
  await browser.close();

  if (links.length === 0) {
    console.warn('No games found in category, using defaults.');
    return ['subway-surfers', 'temple-run-2', 'drive-mad', 'murder', 'monster-tracks']
      .slice(0, count || 1)
      .map(s => `${SITE}/en/g/${s}`);
  }
  const shuffled = links.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count || 1);
}

async function recordGame(url, duration, outputPath, quality) {
  const is4k = quality === '4k';
  const outputW = is4k ? 2160 : 1080;
  const outputH = is4k ? 3840 : 1920;
  // Capture at lower res for speed, upscale with ffmpeg
  const captureW = is4k ? 1080 : 540;
  const captureH = is4k ? 1920 : 960;
  const targetFps = 30;

  console.log(`Recording: ${url}`);
  console.log(`Duration: ${duration}s, Quality: ${quality} (${outputW}x${outputH})`);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--use-gl=swiftshader',
      `--window-size=${outputW},${outputH}`,
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: outputW, height: outputH });

  console.log('Navigating to game page...');
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 3000));

  // Try to click the game container/iframe to activate it
  try {
    const iframe = await page.$('iframe');
    if (iframe) await iframe.focus();
  } catch {}

  console.log('Starting recording...');
  const cdp = await page.target().createCDPSession();
  await cdp.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 80,
    maxWidth: captureW,
    maxHeight: captureH,
    everyNthFrame: 1,
  });

  const outputFile = path.join(outputPath, `tiktok_${Date.now()}.mp4`);
  const ffmpegPath = findFfmpeg();
  const ffmpeg = spawn(ffmpegPath, [
    '-y',
    '-f', 'image2pipe',
    '-framerate', String(targetFps),
    '-i', '-',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '18',
    '-vf', `scale=${outputW}:${outputH}:flags=lanczos`,
    '-r', '30',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    outputFile,
  ]);

  let frameCount = 0;
  const startTime = Date.now();

  cdp.on('Page.screencastFrame', async (frame) => {
    if (!ffmpeg || ffmpeg.killed) return;
    const buffer = Buffer.from(frame.data, 'base64');
    ffmpeg.stdin.write(buffer);
    frameCount++;
    await cdp.send('Page.screencastFrameAck', { sessionId: frame.sessionId });
  });

  ffmpeg.stderr.on('data', () => {});

  await new Promise(resolve => setTimeout(resolve, duration * 1000));

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Recorded ${frameCount} frames in ${elapsed}s (${(frameCount / elapsed).toFixed(1)} fps)`);

  await cdp.send('Page.stopScreencast');
  ffmpeg.stdin.end();

  await new Promise(resolve => {
    ffmpeg.on('close', (code) => {
      console.log(code === 0 ? `Saved: ${outputFile}` : `ffmpeg exited with code ${code}`);
      resolve();
    });
    ffmpeg.on('error', (err) => { console.error('ffmpeg error:', err.message); resolve(); });
    setTimeout(resolve, 5000);
  });

  await browser.close();
  return outputFile;
}

async function main() {
  const args = parseArgs();
  const duration = parseInt(args.duration) || 15;
  const quality = args.quality || 'hd';
  const outputBase = args.output || path.join(os.homedir(), 'Videos', 'tiktok');

  if (!fs.existsSync(outputBase)) {
    fs.mkdirSync(outputBase, { recursive: true });
  }

  let urls = [];
  if (args.category) {
    const count = parseInt(args.count) || 1;
    urls = await findCategoryUrls(args.category, count);
  } else if (args.url) {
    urls = [args.url];
  } else if (args.name) {
    const url = await findGameUrl(args.name);
    urls = [url];
  } else {
    urls = [await findGameUrl('')];
  }

  console.log(`Will record ${urls.length} game(s), ${duration}s each`);
  const results = [];
  for (const url of urls) {
    const file = await recordGame(url, duration, outputBase, quality);
    results.push({ url, file });
  }

  console.log('\nDone! Recorded:');
  results.forEach(r => console.log(`  ${r.url}\n    -> ${r.file}`));
}

if (require.main === module) {
  const args = parseArgs();
  if (Object.keys(args).length === 0 || args.help) {
    console.log(`
TikTok Game Recorder - Records gameplay from browsergameshq.com

Usage:
  node scripts/record-tiktok.js --name "Subway Surfers" --duration 15 --quality hd
  node scripts/record-tiktok.js --url https://browsergameshq.com/en/g/temple-run-2 --duration 30
  node scripts/record-tiktok.js --category racing --count 5 --duration 20
  node scripts/record-tiktok.js --name "Subway Surfers" --quality 4k

Options:
  --name <name>      Game name to search for
  --url <url>        Direct game URL
  --category <cat>   Record games from a category (action, racing, puzzle, etc.)
  --duration <sec>   Recording length per game (default: 15)
  --count <n>        Number of games to record from category (default: 1)
  --quality <mode>   Video quality: hd (1080x1920) or 4k (2160x3840) (default: hd)
  --output <dir>     Output directory (default: ~/Videos/tiktok)
  --help             Show this help
`);
    process.exit(0);
  }
  main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}

module.exports = { recordGame, findGameUrl, findCategoryUrls };
