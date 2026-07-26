const puppeteer = require('puppeteer');
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

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

const SITE = 'https://poki.com';

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

async function dismissCookies(page) {
  // Try Sourcepoint CMP (used by Poki)
  try {
    const frames = page.frames();
    for (const f of frames) {
      if (f.url().includes('sp_message')) {
        const btn = await f.$('button');
        if (btn) { await btn.click(); await new Promise(r => setTimeout(r, 2000)); }
      }
    }
  } catch {}

  const selectors = [
    'button:has-text("Accept All")',
    'button:has-text("Accept")',
    'button:has-text("Agree")',
    'button[name="accept"]',
    '.sp_choice_type_11',
    '.css-ysh6r4',
    '.fc-cta-consume',
    '#consent-accept',
    '.cookie-accept',
  ];
  for (const sel of selectors) {
    try {
      const btn = await page.$(sel);
      if (btn) {
        await btn.click();
        await new Promise(r => setTimeout(r, 1000));
        return;
      }
    } catch {}
  }
}

async function findGameUrl(name) {
  const slug = slugify(name);
  console.log(`Searching for game: ${name} (slug: ${slug})...`);
  const directUrl = `${SITE}/en/g/${slug}`;
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    const resp = await page.goto(directUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
    if (resp && resp.status() !== 404) {
      await browser.close();
      return directUrl;
    }
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

async function recordGame(url, duration, outputPath, quality, isMobile) {
  const is4k = quality === '4k';
  const outputW = is4k ? 2160 : 1080;
  const outputH = is4k ? 3840 : 1920;

  console.log(`Recording: ${url}`);
  console.log(`Duration: ${duration}s, Quality: ${quality} (${outputW}x${outputH})${isMobile ? ', Mobile mode' : ''}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--use-angle=d3d11',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      isMobile ? `--window-size=390,844` : `--window-size=${outputW},${outputH}`,
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: isMobile ? 390 : outputW,
    height: isMobile ? 844 : outputH,
    isMobile: !!isMobile,
    hasTouch: !!isMobile,
  });

  // Bypass bot detection
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });
  if (isMobile) {
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
  } else {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  }

  console.log('Loading game page...');
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 5000));

  await dismissCookies(page);
  await new Promise(r => setTimeout(r, 2000));

  // Mobile: click "Play now" button
  if (isMobile) {
    try {
      const playBtn = await page.$('#play-game-tile');
      if (playBtn) {
        await playBtn.click();
        console.log('Clicked Play now button');
        await new Promise(r => setTimeout(r, 3000));
      }
    } catch {}
  }

  // Wait for game wrapper iframe
  let gameIframe = null;
  try {
    gameIframe = await page.waitForSelector('#game-element', { timeout: 15000 });
  } catch {
    gameIframe = await page.$('iframe');
  }

  let cropOpts = null;
  try {
    if (gameIframe) {
      const box = await gameIframe.boundingBox();
      if (box && box.width > 100 && box.height > 100) {
        console.log(`Found game iframe: x=${Math.round(box.x)} y=${Math.round(box.y)} ${Math.round(box.width)}x${Math.round(box.height)}`);
        if (!isMobile) {
          await page.evaluate((y) => window.scrollTo(0, Math.max(0, y - 10)), box.y);
          await new Promise(r => setTimeout(r, 500));
        }
        const updatedBox = await gameIframe.boundingBox();
        if (updatedBox) {
          cropOpts = {
            x: Math.round(updatedBox.x),
            y: Math.round(updatedBox.y),
            w: Math.round(updatedBox.width),
            h: Math.round(updatedBox.height),
          };
          cropOpts.x = Math.max(0, Math.min(cropOpts.x, outputW - 10));
          cropOpts.y = Math.max(0, Math.min(cropOpts.y, outputH - 10));
          cropOpts.w = Math.min(cropOpts.w, outputW - cropOpts.x);
          cropOpts.h = Math.min(cropOpts.h, outputH - cropOpts.y);
          console.log(`Crop region: ${cropOpts.w}x${cropOpts.h} at ${cropOpts.x},${cropOpts.y}`);
        }
      }
    }
  } catch (e) {
    console.warn('Could not find game iframe:', e.message);
  }

  // Click the wrapper iframe to focus it for keyboard input
  try {
    if (gameIframe) {
      await gameIframe.click();
      console.log('Clicked game iframe to activate');
      await new Promise(r => setTimeout(r, 1000));
    }
  } catch {}

  // Wait for game to load (detect inner game frame with canvas)
  console.log('Waiting for game to load...');
  let gameFrame = null;
  const gameLoaded = await new Promise(resolve => {
    const check = Date.now();
    const id = setInterval(async () => {
      if (Date.now() - check > 30000) { clearInterval(id); resolve(false); return; }
      const frames = page.frames();
      // First try known Poki game domains
      for (const f of frames) {
        if (f.url().includes('gdn.poki.com') || f.url().includes('games.poki.com')) {
          try {
            const hasCanvas = await f.evaluate(() => !!document.querySelector('canvas'));
            if (hasCanvas) { gameFrame = f; clearInterval(id); resolve(true); return; }
          } catch {}
        }
      }
      // Fallback: any frame with a canvas (mobile uses different domains)
      for (const f of frames) {
        try {
          const hasCanvas = await f.evaluate(() => !!document.querySelector('canvas'));
          if (hasCanvas) {
            const url = f.url() || '';
            if (!url.includes('sourcepoint') && !url.includes('cmp.') && !url.includes('doubleclick')) {
              gameFrame = f; clearInterval(id); resolve(true); return;
            }
          }
        } catch {}
      }
    }, 1000);
  });
  if (gameLoaded) {
    console.log('Game loaded successfully');
  } else {
    console.log('Game load check timed out, proceeding anyway');
    // Last resort: use #game-element iframe directly (mobile sometimes renders differently)
    if (!gameFrame) {
      try {
        const wrappers = page.frames().filter(f => {
          try { return f.url() && !f.url().startsWith('about:') && !f.url().includes('sourcepoint') && !f.url().includes('cmp.'); } catch { return false; }
        });
        for (const f of wrappers) {
          try {
            const hasCanvas = await f.evaluate(() => !!document.querySelector('canvas'));
            if (hasCanvas) { gameFrame = f; console.log('Found game frame via fallback'); break; }
          } catch {}
        }
        // If still not found, use the wrapper iframe (#game-element) as gameFrame
        if (!gameFrame && gameIframe) {
          const f = await gameIframe.contentFrame();
          if (f) { gameFrame = f; console.log('Using wrapper iframe content frame as game frame'); }
        }
      } catch {}
    }
  }

  // Give game time to start rendering
  await new Promise(r => setTimeout(r, 2000));

  // Read a grid by sampling the full canvas
  async function readGrid(cols, rows) {
    return await gameFrame.evaluate(async (c, r) => {
      await new Promise(res => requestAnimationFrame(res));
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return null;
      const w = canvas.width, h = canvas.height;
      const buf = new Uint8Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
      const g = [];
      for (let row = 0; row < r; row++) {
        const rowData = [];
        const srcY = Math.floor((r - 1 - row) * h / r);
        for (let col = 0; col < c; col++) {
          const srcX = Math.floor(col * w / c);
          const idx = (srcY * w + srcX) * 4;
          rowData.push([buf[idx], buf[idx+1], buf[idx+2]]);
        }
        g.push(rowData);
      }
      return { grid: g, cols: c, rows: r };
    }, cols, rows);
  }

  async function getCenterBrightness(g, cols, rows) {
    const cx = Math.floor(cols / 2), cy = Math.floor(rows / 2);
    const halfW = Math.floor(cols * 0.15), halfH = Math.floor(rows * 0.08);
    let bright = 0, total = 0;
    for (let r = cy - halfH; r <= cy + halfH; r++) {
      for (let col = cx - halfW; col <= cx + halfW; col++) {
        if (r >= 0 && r < rows && col >= 0 && col < cols) {
          const p = g[r][col];
          const luma = p[0] * 0.299 + p[1] * 0.587 + p[2] * 0.114;
          if (luma > 150) bright++;
          total++;
        }
      }
    }
    return total > 0 ? bright / total : 0;
  }

  function getPixelStats(g) {
    const flat = g.flat();
    const luma = flat.map(p => p[0] * 0.299 + p[1] * 0.587 + p[2] * 0.114);
    const mean = luma.reduce((a, b) => a + b, 0) / luma.length;
    const variance = luma.reduce((a, b) => a + (b - mean) ** 2, 0) / luma.length;
    const dark = flat.filter(p => p[0] < 12 && p[1] < 12 && p[2] < 12).length / flat.length;
    const white = flat.filter(p => p[0] > 200 && p[1] > 200 && p[2] > 200).length / flat.length;
    return { mean, variance, dark, white };
  }

  function isBlankLoading(g) {
    const s = getPixelStats(g);
    return s.mean < 4 && s.variance < 20 && s.dark > 0.85;
  }

  function hasSky(g, cols, rows) {
    const sky = g[0].filter(p => p[1] > p[0] && p[1] > p[2] && p[1] > 100);
    return sky.length > cols * 0.3;
  }

  function getLaneScores(g, cols, rows) {
    const laneW = cols / 3;
    const zoneTop = Math.floor(rows * 0.15);
    const zoneMid = Math.floor(rows * 0.45);
    const zoneBot = Math.floor(rows * 0.7);
    const scores = [];
    for (let lane = 0; lane < 3; lane++) {
      const sc = Math.floor(lane * laneW);
      const ec = Math.floor((lane + 1) * laneW);
      let farObs = 0, nearObs = 0, farTot = 0, nearTot = 0;
      for (let r = zoneTop; r < zoneMid; r++) {
        for (let col = sc; col < ec; col++) {
          const p = g[r][col];
          if (p[0] < 90 || p[1] < 90 || p[2] < 90) farObs++;
          farTot++;
        }
      }
      for (let r = zoneMid; r < zoneBot; r++) {
        for (let col = sc; col < ec; col++) {
          const p = g[r][col];
          if (p[0] * 0.299 + p[1] * 0.587 + p[2] * 0.114 < 100) nearObs++;
          nearTot++;
        }
      }
      scores.push({
        far: farTot > 0 ? farObs / farTot : 0,
        near: nearTot > 0 ? nearObs / nearTot : 0,
      });
    }
    return scores;
  }

  // Smart game AI with state machine
  async function smartPlay() {
    if (!gameFrame) { console.log('  No game frame for AI'); return randomPlay(); }
    const end = Date.now() + duration * 1000;
    let currentLane = 1;
    let lastAction = 0;
    let lastGrid = null;
    let stuckCounter = 0;
    let state = 'start';
    let stateTimer = 0;
    let stateCheckInterval = 0;
    let consecutiveSameState = 0;
    let lastHg = null;

    while (Date.now() < end) {
      const now = Date.now();

      // Every ~1s, read high-res grid for state detection
      if (now - stateTimer > 1000) {
        stateTimer = now;
        const hq = await readGrid(40, 30);
        if (hq) {
          const { grid: hg, cols: hc, rows: hr } = hq;
          const sky = hasSky(hg, hc, hr);
          const centerBright = await getCenterBrightness(hg, hc, hr);
          const stats = getPixelStats(hg);

          const prevHg = lastHg;
          lastHg = hg;

          // Track pixel change vs previous high-res read
          let changeRatio = 0;
          let centerChange = 0;
          if (prevHg) {
            const cx = Math.floor(hc / 2), cy = Math.floor(hr / 2);
            const hw = Math.floor(hc * 0.2), hh = Math.floor(hr * 0.2);
            let changed = 0, centerChanged = 0, total = 0, centerTotal = 0;
            for (let r = 0; r < hg.length; r++) {
              for (let c = 0; c < hg[r].length; c++) {
                const p1 = hg[r][c], p2 = prevHg[r][c];
                const diff = Math.abs(p1[0]-p2[0]) + Math.abs(p1[1]-p2[1]) + Math.abs(p1[2]-p2[2]);
                if (diff > 40) changed++;
                total++;
              }
            }
            for (let r = cy - hh; r <= cy + hh; r++) {
              for (let c = cx - hw; c <= cx + hw; c++) {
                if (r >= 0 && r < hr && c >= 0 && c < hc) {
                  const p1 = hg[r][c], p2 = prevHg[r][c];
                  if (Math.abs(p1[0]-p2[0]) + Math.abs(p1[1]-p2[1]) + Math.abs(p1[2]-p2[2]) > 40) centerChanged++;
                  centerTotal++;
                }
              }
            }
            changeRatio = total > 0 ? changed / total : 0;
            centerChange = centerTotal > 0 ? centerChanged / centerTotal : 0;
          }

          let newState = state;
          if (isBlankLoading(hg)) {
            newState = 'black';
          } else if (sky) {
            newState = 'playing';
          } else if (centerBright > 0.3 && centerChange < 0.05 && changeRatio < 0.08) {
            // Bright center but very little change → menu/start screen
            newState = 'menu';
          } else if (stats.variance > 80 && changeRatio > 0.02) {
            // High complexity and motion → playing
            newState = 'playing';
          } else if (centerBright > 0.3 && changeRatio > 0.05) {
            // Bright center but changing → gameplay (character in center)
            newState = 'playing';
          } else if (stats.mean > 10 && changeRatio > 0.03) {
            // Some content with motion → likely playing
            newState = 'playing';
          } else if (stats.white > 0.3) {
            newState = 'menu_white';
          } else if (stats.mean > 10) {
            // Content but not much motion → could be menu or paused
            newState = 'unknown';
          } else {
            newState = 'unknown';
          }

          // If stuck in black for >3s but there's content, force playing
          if (newState === 'black') {
            if (consecutiveSameState > 3 && (stats.mean > 3 || stats.variance > 5)) {
              newState = 'unknown';
            }
          }

          if (newState === state) {
            consecutiveSameState = Math.min(consecutiveSameState + 1, 10);
          } else {
            consecutiveSameState--;
            if (consecutiveSameState <= -2) {
              consecutiveSameState = 0;
              state = newState;
              if (state === 'playing') console.log('  AI state: playing');
              else if (state === 'menu' || state === 'menu_white') console.log('  AI state: menu/start');
              else if (state === 'black') console.log('  AI state: black/loading');
              else console.log(`  AI state: ${state}`);
            }
          }
        }
      }

      // State-specific actions
      if (state === 'black' || state === 'menu' || state === 'menu_white') {
        if (now - lastAction > 800) {
          // Sequential startup: first clicks, then keys
          if (consecutiveSameState < 3) {
            // First few tries: click center + press common keys
            if (gameIframe) {
              try {
                const box = await gameIframe.boundingBox();
                if (box) {
                  await page.mouse.click(box.x + box.width/2, box.y + box.height/2);
                }
              } catch {}
            }
            await page.keyboard.press('Space');
          } else if (consecutiveSameState < 6) {
            // Still stuck: try specific common start keys
            for (const k of ['Space', 'Enter']) {
              await page.keyboard.press(k);
              await new Promise(r => setTimeout(r, 200));
            }
            if (gameIframe) {
              try {
                const box = await gameIframe.boundingBox();
                if (box) {
                  await page.mouse.click(box.x + box.width/2, box.y + box.height * 0.6);
                }
              } catch {}
            }
          } else {
            // Stuck for too long: force playing mode
            state = 'playing';
            consecutiveSameState = 0;
            console.log('  Forcing playing state');
            continue;
          }
          lastAction = now;
        }
        await new Promise(r => setTimeout(r, 300));
        continue;
      }

      // Playing state: read fast grid for obstacle avoidance
      const grid = await readGrid(20, 15);
      if (!grid) { await new Promise(r => setTimeout(r, 200)); continue; }

      const { grid: g, cols, rows } = grid;

      // Death check
      const flat = g.flat();
      if (flat.filter(p => p[0] < 10 && p[1] < 10 && p[2] < 10).length > flat.length * 0.5) {
        stuckCounter++;
        if (stuckCounter > 2) {
          await page.keyboard.press('Enter');
          await new Promise(r => setTimeout(r, 600));
          await page.keyboard.press('Space');
          await new Promise(r => setTimeout(r, 600));
          currentLane = 1;
          stuckCounter = 0;
          state = 'start';
        }
        await new Promise(r => setTimeout(r, 500));
        continue;
      }
      stuckCounter = 0;

      // Stuck check
      if (lastGrid) {
        let same = 0, total = 0;
        for (let i = 0; i < g.length; i++) {
          for (let j = 0; j < g[i].length; j++) {
            if (Math.abs(g[i][j][0] - lastGrid[i][j][0]) < 5) same++;
            total++;
          }
        }
        if (same > total * 0.93) {
          stuckCounter++;
          if (stuckCounter > 2) {
            await page.keyboard.press('ArrowUp');
            await page.keyboard.press('ArrowRight');
            stuckCounter = 0;
            state = 'start';
          }
          await new Promise(r => setTimeout(r, 300));
          continue;
        }
      }
      stuckCounter = 0;
      lastGrid = g;

      const laneScores = getLaneScores(g, cols, rows);
      const sky = hasSky(g, cols, rows);

      // Emergency: obstacle very close in current lane
      if (laneScores[currentLane].near > 0.25 && now - lastAction > 150) {
        let bestLane = currentLane;
        let bestScore = laneScores[currentLane].near;
        for (let i = 0; i < 3; i++) {
          if (laneScores[i].near < bestScore) { bestLane = i; bestScore = laneScores[i].near; }
        }
        if (bestLane !== currentLane) {
          await page.keyboard.press(bestLane < currentLane ? 'ArrowLeft' : 'ArrowRight');
          currentLane = bestLane;
          lastAction = now;
        } else {
          await page.keyboard.press('ArrowUp');
          lastAction = now;
        }
        await new Promise(r => setTimeout(r, 80));
        continue;
      }

      // Proactive: obstacle far in current lane
      if (laneScores[currentLane].far > 0.2 && now - lastAction > 350) {
        let bestLane = currentLane;
        let bestScore = laneScores[currentLane].far;
        for (let i = 0; i < 3; i++) {
          if (laneScores[i].far < bestScore - 0.05) { bestLane = i; bestScore = laneScores[i].far; }
        }
        if (bestLane !== currentLane) {
          await page.keyboard.press(bestLane < currentLane ? 'ArrowLeft' : 'ArrowRight');
          currentLane = bestLane;
          lastAction = now;
        }
      }

      // Periodic actions
      if (now - lastAction > 1200 && Math.random() < 0.3) {
        if (Math.random() < 0.6) {
          await page.keyboard.press('ArrowUp');
        } else {
          const dir = Math.random() < 0.5 ? 'ArrowLeft' : 'ArrowRight';
          await page.keyboard.press(dir);
          currentLane = Math.max(0, Math.min(2, currentLane + (dir === 'ArrowLeft' ? -1 : 1)));
        }
        lastAction = now;
      }

      await new Promise(r => setTimeout(r, 200));
    }
  }

  async function randomPlay() {
    const end = Date.now() + duration * 1000;
    while (Date.now() < end) {
      await page.keyboard.press(['ArrowLeft', 'ArrowRight', 'ArrowUp'][Math.floor(Math.random() * 3)]);
      await new Promise(r => setTimeout(r, 500 + Math.random() * 800));
    }
  }

  console.log('Starting recording...');

  const outputFile = path.join(outputPath, `tiktok_${Date.now()}.mp4`);
  const ffmpegPath = findFfmpeg();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tiktok-'));

  let frameCount = 0;
  const startTime = Date.now();
  const endTime = startTime + duration * 1000;

  const aiPromise = smartPlay();

  while (Date.now() < endTime) {
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    fs.writeFileSync(path.join(tmpDir, `f${String(frameCount).padStart(6, '0')}.jpg`), buf);
    frameCount++;
  }

  await aiPromise.catch(() => {});

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const actualFps = frameCount / parseFloat(elapsed);
  console.log(`Recorded ${frameCount} frames in ${elapsed}s (${actualFps.toFixed(1)} fps)`);

  // For TikTok portrait: crop game, scale to fit, pad to portrait
  let vf = `scale=${outputW}:${outputH}:force_original_aspect_ratio=decrease,pad=${outputW}:${outputH}:(ow-iw)/2:(oh-ih)/2,format=yuv420p`;
  if (cropOpts) {
    vf = `crop=${cropOpts.w}:${cropOpts.h}:${cropOpts.x}:${cropOpts.y},${vf}`;
  }

  console.log('Encoding video...');
  const encodeResult = spawn(ffmpegPath, [
    '-y',
    '-framerate', String(Math.round(actualFps)),
    '-i', path.join(tmpDir, 'f%06d.jpg'),
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '16',
    '-vf', vf,
    '-r', String(Math.round(actualFps)),
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    outputFile,
  ]);

  encodeResult.stderr.on('data', () => {});

  await new Promise(resolve => {
    encodeResult.on('close', (code) => {
      if (code === 0) {
        console.log(`Saved: ${outputFile}`);
      } else {
        console.log(`ffmpeg exited with code ${code}`);
      }
      // Cleanup temp frames
      try {
        const files = fs.readdirSync(tmpDir);
        files.forEach(f => fs.unlinkSync(path.join(tmpDir, f)));
        fs.rmdirSync(tmpDir);
      } catch {}
      resolve();
    });
    encodeResult.on('error', (err) => { console.error('ffmpeg error:', err.message); resolve(); });
    setTimeout(resolve, 30000);
  });

  await browser.close();
  return outputFile;
}

async function main() {
  const args = parseArgs();
  const duration = parseInt(args.duration) || 15;
  const quality = args.quality || 'hd';
  const isMobile = args.mobile || args.m;
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
    const file = await recordGame(url, duration, outputBase, quality, isMobile);
    results.push({ url, file });
  }

  console.log('\nDone! Recorded:');
  results.forEach(r => console.log(`  ${r.url}\n    -> ${r.file}`));
}

if (require.main === module) {
  const args = parseArgs();
  if (Object.keys(args).length === 0 || args.help) {
    console.log(`
TikTok Game Recorder - Records gameplay from poki.com

Usage:
  node scripts/record-tiktok.js --name "Subway Surfers" --duration 15 --quality hd
  node scripts/record-tiktok.js --url https://poki.com/en/g/temple-run-2 --duration 30
  node scripts/record-tiktok.js --category racing --count 5 --duration 20
  node scripts/record-tiktok.js --name "Subway Surfers" --quality 4k

Options:
  --name <name>      Game name to search for
  --url <url>        Direct game URL
  --category <cat>   Record games from a category (action, racing, puzzle, etc.)
  --duration <sec>   Recording length per game (default: 15)
  --count <n>        Number of games to record from category (default: 1)
  --quality <mode>   Video quality: hd (1080x1920) or 4k (2160x3840) (default: hd)
  --mobile           Record in mobile viewport (iPhone) with touch controls
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
