const config = require('../../config');
const cheerio = require('cheerio');
const blogPosts = require('../../blog/posts');

// Map game slug -> related blog guide slugs (complete-guide, pro-tips-and-tricks,
// review, best-games-like, unblocked, for-beginners, why-is-so-popular, on-mobile, how-to-play-online, tips-and-strategies, advanced-guide). Used for the on-page related-guides strip.
const RELATED_GUIDES = {};
for (const p of blogPosts) {
  const m = p.slug.match(/^(.+)-(complete-guide|pro-tips-and-tricks|review|best-games-like|unblocked|for-beginners|why-is-so-popular|on-mobile|how-to-play-online|tips-and-strategies|advanced-guide)$/);
  if (m) {
    (RELATED_GUIDES[m[1]] = RELATED_GUIDES[m[1]] || []).push(p.slug);
  }
}

// Map game slug -> video URL (Poki mp4) for VideoObject schema (video rich results)
const gamesData = require('../../frontend/games-data');
const GAME_VIDEOS = {};
for (const g of gamesData) {
  if (g.slug && g.video) GAME_VIDEOS[g.slug] = g.video;
}

// Map of game slugs to their mirror replacement URLs
const MIRRORS = {
  'subway-surfers': 'https://g.igroutka.ru/games/164/OUNWHVSFldaeghn4/1/subway_surfers_hong_kong/?mp_assets=https%3A%2F%2Fs2.minijuegosgratis.com%2F&mp_embed=0&mp_game_id=223783&mp_game_uid=subway-surfers&mp_game_url=https%3A%2F%2Fwww.miniplay.com%2Fgame%2Fsubway-surfers&mp_int=1&mp_locale=en_US&mp_player_type=IFRAME&mp_site_https_url=https%3A%2F%2Fwww.miniplay.com%2F&mp_site_name=miniplay.com&mp_site_url=https%3A%2F%2Fwww.miniplay.com%2F&mp_timezone=Africa%2FCasablanca&mp_view_type=',
  'temple-run-2': 'https://html5.gamemonetize.co/pkyyuilfrqkcdnmrxsg60j22ypk0peje/',
  'temple-run-2-frozen-shadows': 'https://html5.gamemonetize.co/z8ud3po55n6uhr9d86moe2ur7rzlffs0/',
  'temple-run-2-jungle-fall': 'https://html5.gamemonetize.co/pkrsuit51ypgzm64h6ohkjnqvwv1zabz/',
  'temple-run-2-holi-festival': 'https://sda.4399.com/4399swf//upload_swf/ftp36/liuxinyu/20210628/jjjj1/index.html',
  'temple-run-2-spooky-summit': 'https://f.igry.pro/games/164/VJYtd6ApThscCS5u/2/temple_run_2_spooky_summit/',
  'murder': 'https://html5.gamedistribution.com/rvvASMiM/5e7acf55e50b4723afef834449b82bce/index.html',
  'apple-worm': 'https://apple-worm.com/appleworm/index.html',
  'drive-mad': 'https://play.fancade.com/5F084A0BCE06B710?max_w=999999&max_h=9999999&istart=1',
  'drift-boss': 'https://html5.gamedistribution.com/rvvASMiM/0a8b51e5eaee42e7b4db83ca00afc92e/index.html',
  'monster-tracks': 'https://games.playtropolis.com/monster-tracks/',
};

function rewriteHtml(html, sourcePath) {
  const $ = cheerio.load(html, {
    decodeEntities: false,
    xmlMode: false,
    lowerCaseTags: false,
    lowerCaseAttributeNames: false,
  });

  const sourceDomain = config.sourceDomain;
  const targetDomain = config.domain;
  const sourceOrigin = config.sourceOrigin;

  // Pass 1: Remove only ad-related scripts by src URL pattern (scripts aren't tracked by React hydration)
  // NOTE: Skip DOM element stripping — Poki's React SPA requires the full server HTML for hydration.
  // The React-safe ad manager in the portal-iframe-rw script claims Poki's ad containers
  // AFTER React mounts and defends them against re-renders (see Pass 9d).

  // Remove ad scripts by URL pattern
  $('script').each(function () {
    const src = $(this).attr('src') || '';
    if (src.includes('pagead') || src.includes('adsbygoogle') || src.includes('googletag') ||
        src.includes('doubleclick') || src.includes('prebid') || src.includes('taboola') ||
        src.includes('outbrain') || src.includes('criteo') || src.includes('amazon-adsystem')) {
      $(this).remove();
    }
  });

  // Pass 2: Rewrite navigation links only
  $('a').each(function () {
    let href = $(this).attr('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) return;

    if (href.startsWith('//')) {
      href = 'https:' + href;
    }

    // Only rewrite poki.com/poki.io navigation links (not CDN asset links)
    const isNavLink = href.startsWith(sourceOrigin) ||
      href.match(new RegExp('^https?://' + sourceDomain.replace('.', '\\.') + '/'));
    if (isNavLink) {
      let cleanHref = href;
      if (href.startsWith(sourceOrigin)) {
        cleanHref = href.substring(sourceOrigin.length);
      } else {
        try {
          const parsed = new URL(href);
          cleanHref = parsed.pathname + parsed.search + parsed.hash;
        } catch {
          cleanHref = href.replace(/https?:\/\/[^/]+/, '');
        }
      }
      if (!cleanHref) cleanHref = '/';
      $(this).attr('href', cleanHref);
    }
  });

  // Pass 3: Images — keep ALL as absolute URLs, remove loading="lazy"
  $('img').each(function () {
    normalizeToAbsolute($, this, 'src');
    normalizeToAbsolute($, this, 'data-src');
    normalizeToAbsolute($, this, 'data-lazy-src');
    $(this).removeAttr('loading');

    // srcset kept as-is — Poki URLs are already absolute CDN URLs.
    // Do NOT split on comma: CDN image URLs contain commas in query strings
    // (e.g. image/q=78, scq=50, width=94), which naive split(',') would break.
  });

  // Pass 4: Keep ALL link tags (CSS, preconnect, etc.) as absolute
  // a.poki-cdn.com CSS/JS loads directly in browser — no proxy needed
  $('link').each(function () {
    normalizeToAbsolute($, this, 'href');
  });

  // Pass 5: Source elements — keep absolute (srcset kept as-is, see note above)
  $('source').each(function () {
    const srcset = $(this).attr('srcset') || '';
    if (srcset && srcset.startsWith('//')) {
      $(this).attr('srcset', 'https:' + srcset);
    }
  });

  // Pass 6: Data attributes with URLs — keep absolute
  const urlAttrs = [
    'poster', 'data-poster', 'data-bg', 'data-background',
    'data-image', 'data-lazy-src', 'data-original', 'data-full',
    'data-thumb', 'data-video-url',
  ];
  urlAttrs.forEach(attr => {
    $(`[${attr}]`).each(function () {
      normalizeToAbsolute($, this, attr);
    });
  });

  // Pass 7: Rewrite title
  $('title').each(function () {
    const text = $(this).text() || '';
    if (text.includes('Poki') || text.includes('poki')) {
      $(this).text(text.replace(/Poki/gi, 'BrowserGamesHQ').replace(/poki/gi, 'BrowserGamesHQ'));
    }
  });

  // Pass 8: Rewrite meta tags
  rewriteMetaTags($, sourceDomain, targetDomain);
  rewriteOpenGraph($, sourceDomain, targetDomain);
  rewriteTwitterCards($, sourceDomain, targetDomain);

  // Pass 8b: Server-side canonical injection — exactly ONE self-referencing canonical
  // Only for indexable HTML pages (not 404, error, or non-HTML responses).
  // Removes ALL existing canonical tags (link + meta) and replaces with the correct one.
  if (sourcePath && !sourcePath.startsWith('/t') && !sourcePath.startsWith('/admin')) {
    $('link[rel="canonical"]').remove();
    $('meta[name="canonical"]').remove();
    const canonicalUrl = 'https://' + targetDomain + sourcePath.split('?')[0];
    $('head').append('<link data-react-helmet="true" rel="canonical" href="' + canonicalUrl + '">');
  }

  // Pass 8a: For homepage (root path), generate unique SEO metadata instead of Poki-derivative text
  var isHomepage = !sourcePath || sourcePath === '/' || sourcePath === '';
  if (isHomepage) {
    var homeTitle = 'Free Online Games - Play 1500+ Browser Games Instantly | BrowserGamesHQ';
    var homeDesc = 'Play thousands of free online browser games instantly at BrowserGamesHQ. No downloads, no sign-ups. Action, puzzle, racing, sports & more. Updated daily.';
    $('title').text(homeTitle);
    $('meta[name="description"]').attr('content', homeDesc);
    $('meta[property="og:title"]').attr('content', 'Free Online Games | BrowserGamesHQ');
    $('meta[property="og:description"]').attr('content', homeDesc);
    $('meta[name="twitter:title"]').attr('content', 'Free Online Games | BrowserGamesHQ');
    $('meta[name="twitter:description"]').attr('content', homeDesc);
    if (!$('meta[property="og:image"]').length) {
      $('head').append('<meta property="og:image" content="https://browsergameshq.com/static/img/og-image.png">');
    }
    if (!$('meta[name="twitter:card"]').length) {
      $('head').append('<meta name="twitter:card" content="summary_large_image">');
    }
    if (!$('meta[name="twitter:site"]').length) {
      $('head').append('<meta name="twitter:site" content="@BrowserGamesHQ">');
    }
  }

  // Pass 8a2: Ensure game pages have correct title and robots in raw HTML (before JS)
  // Core pilot games: 10 enriched — index,follow. Non-pilot 137: noindex,follow until enriched.
  const PILOT_GAMES = ['subway-surfers','temple-run-2','drift-boss','rainbow-obby','murder','gobattle2','hide-and-paint','tag','minefun-io','retro-bowl'];
  if (sourcePath && sourcePath.includes('/en/g/')) {
    var gameSlug = (sourcePath.match(/\/g\/([^/]+)/) || [])[1] || '';
    // Fix title if empty or not BrowserGamesHQ — create if missing
    var $title = $('title');
    var titleText = $title.text() || '';
    if (!titleText || titleText.trim() === '' || titleText.indexOf('BrowserGamesHQ') === -1) {
      var h1Text = $('h1').first().text() || gameSlug.replace(/-/g, ' ').replace(/\b\w/g, function(c){return c.toUpperCase();});
      var newTitle = (h1Text ? h1Text + ' - Play Online for Free!' : gameSlug.replace(/-/g, ' ')) + ' | BrowserGamesHQ';
      if ($title.length) $title.text(newTitle);
      else $('head').append('<title>' + newTitle + '</title>');
    } else if (titleText.indexOf(' | Poki') !== -1) {
      $title.text(titleText.replace(' | Poki', ' | BrowserGamesHQ'));
    }
    // Robots: pilot = index,follow, non-pilot = noindex,follow
    var isPilot = PILOT_GAMES.indexOf(gameSlug) !== -1;
    var desiredRobots = isPilot ? 'index, follow' : 'noindex, follow';
    var $robots = $('meta[name="robots"]');
    if ($robots.length) {
      $robots.attr('content', desiredRobots);
    } else {
      $('head').append('<meta name="robots" content="' + desiredRobots + '">');
    }
    // Also set X-Robots-Tag via meta http-equiv for consistency (will be overridden by header but keep for SSR)
    if (isPilot) {
      // Ensure no noindex remains
    }
  }

  // Pass 8c: Category intros for 8 canonical categories (100-200 words, server-rendered) with 2-3 contextual links
  const CATEGORY_INTROS = {
    '/en/popular': {
      title: 'Popular Games - Most Played Browser Games | BrowserGamesHQ',
      desc: 'Discover the most played browser games on BrowserGamesHQ. Trending titles, community favorites and editors picks — all free to play instantly.',
      h1: 'Popular Games',
      intro: '<p>Popular Games brings together the titles people play most right now on BrowserGamesHQ. You will find fast session games you can finish in a few minutes, longer progression games you can return to daily, and new hits that have just entered the charts. The selection is updated from real play data, not from a fixed editorial list, so the order reflects what players actually keep coming back to. Use this page when you want a reliable shortlist without scrolling through hundreds of thumbnails. Every game here runs in the browser, loads quickly on desktop and mobile, and can be started without an account.</p><p>Browse the grid, open a few candidates in new tabs, and keep the ones that match your taste. If you like competition, try <a href="/en/g/gobattle2">GoBattle 2</a> or <a href="/en/g/retro-bowl">Retro Bowl</a>. For quick solo focus, <a href="/en/g/drift-boss">Drift Boss</a> is a good entry point.</p>'
    },
    '/en/action': {
      title: 'Action Games - Fast-Paced Free Online Action | BrowserGamesHQ',
      desc: 'Play free action games online. Reflex, timing and quick decisions — browser action you can start instantly.',
      h1: 'Action Games',
      intro: '<p>Action Games on BrowserGamesHQ are built for players who like movement, timing and short feedback loops. You will find run-and-gun shooters, close-combat brawlers, stealth and survival challenges, and physics-based action where one mistake resets the run. The controls are deliberately simple — arrows, WASD or mouse — so you can learn the first level in under a minute and then push for a cleaner execution.</p><p>Pick a game by the feel you want: precise platforming, chaotic brawls, or tactical shooters. Try <a href="/en/g/subway-surfers">Subway Surfers</a> for endless running, <a href="/en/g/murder">Murder</a> for stealth, or <a href="/en/g/stickman-hook">Stickman Hook</a> for physics action.</p>'
    },
    '/en/puzzle': {
      title: 'Puzzle Games - Logic and Brain Teasers | BrowserGamesHQ',
      desc: 'Free puzzle games to test logic, memory and planning. Play in your browser, no download required.',
      h1: 'Puzzle Games',
      intro: '<p>Puzzle Games are for players who enjoy a clear problem and a satisfying solution. This selection covers logic grids, sorting and stacking puzzles, path-finding, physics puzzles and word and number challenges. Most puzzles can be played at your own pace, so you can pause, think and try a different approach without a timer forcing you.</p><p>Start with the difficulty you are comfortable with — many titles scale from easy tutorials to hard later levels. Try <a href="/en/g/blocky-blast-puzzle">Blocky Blast Puzzle</a> for sorting, <a href="/en/g/level-devil">Level Devil</a> for tricky platform puzzles, or <a href="/en/g/bubble-shooter">Bubble Shooter</a> for a classic.</p>'
    },
    '/en/racing': {
      title: 'Racing Games - Drive, Drift and Win | BrowserGamesHQ',
      desc: 'Free racing games online. Cars, bikes and karts — drift, overtake and reach the finish line.',
      h1: 'Racing Games',
      intro: '<p>Racing Games bring speed, control and quick restarts to the browser. You will find circuit racers, drift and parking challenges, bike and kart games, and stunt tracks that reward clean lines more than raw speed. The handling varies from arcade to more grounded, so you can choose the feel you like without learning a new control scheme each time.</p><p>Use the first lap to learn braking points, then push for a better time. Try <a href="/en/g/drift-boss">Drift Boss</a> for one-button drifting, <a href="/en/g/madalin-stunt-cars-2">Madalin Stunt Cars</a> for open-world stunts, or <a href="/en/g/slope">Slope</a> for 3D speed.</p>'
    },
    '/en/sports': {
      title: 'Sports Games - Free Online Sports | BrowserGamesHQ',
      desc: 'Play free sports games in your browser. Football, basketball, golf and more — no download.',
      h1: 'Sports Games',
      intro: '<p>Sports Games collect quick, readable sports action for the browser. Expect football shootouts, basketball free throws, golf puzzles, bowling, table tennis and other one-button or two-button sports that are easy to learn and hard to master. The rules are simplified compared to real sports, so you can focus on timing and placement rather than complex tactics.</p><p>Choose a sport you already follow or try a new one. Try <a href="/en/g/retro-bowl">Retro Bowl</a> for football management, <a href="/en/g/basketball-stars">Basketball Stars</a> for 1v1, or <a href="/en/g/soccer-random">Soccer Random</a> for chaotic fun.</p>'
    },
    '/en/multiplayer': {
      title: 'Multiplayer Games - Play With Friends Online | BrowserGamesHQ',
      desc: 'Free multiplayer browser games. Play with friends or strangers — no download, just share and play.',
      h1: 'Multiplayer Games',
      intro: '<p>Multiplayer Games are about playing with or against other people without installing anything. You will find .io arenas, co-op puzzles, team shooters, party games and asynchronous turn-based games you can join from a link. The lobbies are browser-based, so you can invite a friend by sharing the page and be in the same match in seconds.</p><p>Check the player count and whether the game supports private rooms. Try <a href="/en/g/gobattle2">GoBattle 2</a> for arena combat, <a href="/en/g/paper-io-2">Paper.io 2</a> for territory control, or <a href="/en/g/shell-shockers">Shell Shockers</a> for FPS.</p>'
    },
    '/en/dress-up': {
      title: 'Dress Up Games - Fashion and Creativity | BrowserGamesHQ',
      desc: 'Free dress up games online. Style, fashion and creative dress-up play for everyone.',
      h1: 'Dress Up Games',
      intro: '<p>Dress Up Games focus on style, color and creative choices rather than competition. You will find character creators, fashion contests, salon and makeup games, and decor games that use the same mix-and-match mechanics. The interfaces are drag-and-drop, so you can try many combinations quickly and save the look you like.</p><p>Browse by the style you prefer — casual, formal, fantasy or streetwear — and use the wardrobe filters to narrow the options. Try <a href="/en/g/vortellas-dress-up">Vortella\'s Dress Up</a> or <a href="/en/g/fashion-legends">Fashion Legends</a> to start.</p>'
    },
    '/en/car': {
      title: 'Car Games - Driving and Parking | BrowserGamesHQ',
      desc: 'Free car games online. Drive, park and stunt — browser car games for every driver.',
      h1: 'Car Games',
      intro: '<p>Car Games gather driving, parking and stunt games that work well in short browser sessions. You will find realistic parking challenges, drift and stunt tracks, traffic and highway games, and car customization games where tuning changes how the car feels. The controls are usually arrows or WASD with automatic acceleration, so you can focus on steering and timing.</p><p>Start with a parking or trial game to learn the handling, then move to faster tracks. Try <a href="/en/g/drift-boss">Drift Boss</a>, <a href="/en/g/madalin-stunt-cars-2">Madalin Stunt Cars 2</a>, or <a href="/en/g/city-car-driving">City Car Driving</a>.</p>'
    }
  };
  if (CATEGORY_INTROS[sourcePath]) {
    const cat = CATEGORY_INTROS[sourcePath];
    $('title').text(cat.title);
    $('meta[name="description"]').attr('content', cat.desc);
    $('meta[property="og:title"]').attr('content', cat.h1 + ' | BrowserGamesHQ');
    $('meta[property="og:description"]').attr('content', cat.desc);
    // Inject intro after H1 if present, otherwise prepend to main
    const h1 = $('h1').first();
    const introHtml = `<section class="category-intro" style="max-width:800px;margin:24px auto;padding:0 16px;line-height:1.6;color:#e8e8f0"><p>${cat.intro.replace(/<p>/g,'').replace(/<\/p>/g,'</p><p>').replace(/<p><\/p>/g,'')}</p></section>`;
    // Use raw intro (already contains <p> tags)
    const rawIntro = `<section class="category-intro" style="max-width:800px;margin:24px auto;padding:0 16px;line-height:1.6;color:#e8e8f0">${cat.intro}</section>`;
    if (h1.length) h1.after(rawIntro);
    else if ($('main').length) $('main').prepend(rawIntro);
    else $('body').prepend(rawIntro);
  }

  // Pass 8d: Game pilot intros for 10 high-value games (SSR, before iframe, 300-600w)
  const GAME_INTROS = {
    'subway-surfers': {
      intro: '<p>Subway Surfers is an endless runner where you dash along subway tracks, dodge trains, and collect coins while being chased by a security guard. The goal is simple to understand but hard to master: stay alive as long as possible, use quick lane changes, jumps, and rolls to avoid obstacles, and chain power-ups to extend your run. Each run rewards you with coins and keys that unlock new characters, hoverboards, and upgrades.</p>',
      howToPlay: '<h2>How to Play</h2><p>Move left or right to switch lanes, swipe up to jump over barriers, and swipe down to roll under low obstacles. Time your moves to the rhythm of the track — trains and barriers appear in repeating patterns that you can learn to anticipate. Collect coins continuously and grab power-ups like jetpacks, super sneakers, and coin magnets when they appear. Use hoverboards to survive a crash without ending the run.</p>',
      controls: '<h2>Controls</h2><p><strong>Desktop:</strong> Left/Right arrows or A/D to change lanes, Up/W to jump, Down/S to roll. <strong>Mobile:</strong> Swipe left/right to change lanes, swipe up to jump, swipe down to roll, double-tap to activate hoverboard. The controls are the same across devices, so skills transfer directly.</p>',
      features: '<h2>Features</h2><ul><li>Endless track with increasing speed and obstacle density</li><li>Power-ups: jetpack, super sneakers, coin magnet, 2x multiplier</li><li>Hoverboards that absorb one crash</li><li>Daily challenges and world tour cities with unique themes</li></ul>',
      tips: '<h2>Tips</h2><ul><li>Stay centered when possible — it gives you more time to react to either side.</li><li>Save hoverboards for high-speed sections where a single mistake ends the run.</li><li>Upgrade coin magnet and jetpack first; they pay for themselves quickly.</li><li>Practice rolling under barriers early — it is faster than jumping over low obstacles.</li></ul>'
    },
    'temple-run-2': {
      intro: '<p>Temple Run 2 is a 3D endless runner set in ancient temples where you sprint through cliffs, zip lines, and mine tracks while avoiding obstacles. You control an explorer stealing an idol, and the temple itself tries to stop you. The game tests reflexes, lane awareness, and timing as the speed steadily increases.</p>',
      howToPlay: '<h2>How to Play</h2><p>Swipe to turn at forks, swipe up to jump over gaps and swipe down to slide under low ceilings. Tilt or swipe to collect coins and gems while staying on the path. React quickly to sudden drops, waterfalls, and mine cart sections that change the camera and movement.</p>',
      controls: '<h2>Controls</h2><p><strong>Desktop:</strong> Arrow keys to move, Space to jump, tilt with mouse or keys where supported. <strong>Mobile:</strong> Swipe and tilt. The game is designed for touch first, so swipes feel most natural.</p>',
      features: '<h2>Features</h2><ul><li>Multiple environments: cliffs, zip lines, mines, forests</li><li>Collectible coins and gems for upgrades</li><li>Power-ups and character abilities</li><li>Daily and weekly challenges</li></ul>',
      tips: '<h2>Tips</h2><ul><li>Look two turns ahead, not at your character.</li><li>Upgrade coin magnet and boost distance early.</li><li>Use tilt sparingly — small corrections are more reliable than large swings.</li><li>Save gems for the most impactful upgrades.</li></ul>'
    },
    'drift-boss': {
      intro: '<p>Drift Boss is a one-button driving game about holding a drift on a narrow, winding track that never ends. The challenge is not speed, but control — keep the car on the platform by tapping to steer right and releasing to steer left, maintaining a smooth arc through each corner.</p>',
      howToPlay: '<h2>How to Play</h2><p>Hold to drift right, release to drift left. The car moves forward automatically. Time your holds so the car stays centered on the track. Each successful drift builds a combo and increases your score. Fall off and the run ends.</p>',
      controls: '<h2>Controls</h2><p><strong>Desktop:</strong> Hold Space or mouse button to drift right, release to go left. <strong>Mobile:</strong> Tap and hold to drift right, release to go left. Only one input is needed.</p>',
      features: '<h2>Features</h2><ul><li>Procedurally generated track that gets longer and tighter</li><li>Multiple cars with different handling</li><li>Coin collection and car unlocks</li><li>Score multiplier for long drifts</li></ul>',
      tips: '<h2>Tips</h2><ul><li>Use short taps, not long holds, for precise control.</li><li>Look ahead to the next corner, not the current one.</li><li>Stay in the middle of the platform to give yourself margin.</li><li>Practice rhythm — most corners have a consistent timing.</li></ul>'
    },
    'rainbow-obby': {
      intro: '<p>Rainbow Obby is a colorful obstacle course game where you jump, climb, and time your movements through bright rainbow-themed stages. Each level introduces new mechanics, from moving platforms to disappearing floors, that test timing and precision.</p>',
      howToPlay: '<h2>How to Play</h2><p>Use movement keys to run and jump, and time your jumps to land on moving platforms. Avoid falling and touching hazards. Each stage ends with a checkpoint, so you can retry difficult sections without restarting the whole course.</p>',
      controls: '<h2>Controls</h2><p><strong>Desktop:</strong> WASD or arrows to move, Space to jump. <strong>Mobile:</strong> On-screen joystick and jump button.</p>',
      features: '<h2>Features</h2><ul><li>Multiple rainbow-themed worlds</li><li>Moving and disappearing platforms</li><li>Checkpoints in each stage</li><li>Collectible stars</li></ul>',
      tips: '<h2>Tips</h2><ul><li>Wait for moving platforms to reach you, don’t chase them.</li><li>Use small jumps for precision, large jumps for distance.</li><li>Observe disappearing patterns before moving.</li><li>Take your time — rushing causes most falls.</li></ul>'
    },
    'murder': {
      intro: '<p>Murder is a stealth game where you must assassinate a target without being seen. You play as a silent killer who must time movements, hide in shadows, and strike when no one is watching. Each level adds more guards and cameras.</p>',
      howToPlay: '<h2>How to Play</h2><p>Move quietly, stay out of sight cones, and wait for the right moment to strike. Use distractions and hide bodies to avoid detection. If you are seen, the level restarts.</p>',
      controls: '<h2>Controls</h2><p><strong>Desktop:</strong> Arrow keys to move, Space to interact/attack. <strong>Mobile:</strong> Swipe to move, tap to interact.</p>',
      features: '<h2>Features</h2><ul><li>Stealth-based levels with patrol patterns</li><li>Multiple ways to approach each target</li><li>Environmental hiding spots</li><li>Increasing difficulty with more guards</li></ul>',
      tips: '<h2>Tips</h2><ul><li>Watch guard patterns for 10 seconds before moving.</li><li>Strike when guards are looking away, not just when far.</li><li>Hide bodies immediately after a kill.</li><li>Use sound distractions to lure guards from posts.</li></ul>'
    },
    'gobattle2': {
      intro: '<p>GoBattle 2 is a multiplayer battle game where you fight other players in arena-style combat. Choose a character, learn its abilities, and outplay opponents in fast matches that reward timing and positioning.</p>',
      howToPlay: '<h2>How to Play</h2><p>Move with keys, attack with clicks, and use abilities on cooldown. Dodge enemy attacks and control key areas of the map. Wins come from consistent hits, not risky all-ins.</p>',
      controls: '<h2>Controls</h2><p><strong>Desktop:</strong> WASD to move, mouse to aim, Left click to attack, Q/E for abilities. <strong>Mobile:</strong> Virtual joystick and buttons.</p>',
      features: '<h2>Features</h2><ul><li>Multiple characters with unique kits</li><li>Arena maps with hazards</li><li>Quick matchmaking</li><li>Progression and unlocks</li></ul>',
      tips: '<h2>Tips</h2><ul><li>Learn one character well before switching.</li><li>Use abilities to escape, not just to engage.</li><li>Control the center of the map.</li><li>Watch cooldowns — attack when enemies have none.</li></ul>'
    },
    'hide-and-paint': {
      intro: '<p>Hide and Paint is a hide-and-seek game where one team hides as objects and the other team seeks. Hiders must blend into the environment by choosing spots that match their object size and color.</p>',
      howToPlay: '<h2>How to Play</h2><p>As hider, find a spot that matches your object and stay still. As seeker, look for objects that look out of place and shoot them to reveal hiders. Use the timer wisely.</p>',
      controls: '<h2>Controls</h2><p><strong>Desktop:</strong> WASD to move, mouse to look, Left click to shoot/interact. <strong>Mobile:</strong> Joystick and tap.</p>',
      features: '<h2>Features</h2><ul><li>Team-based hide and seek</li><li>Multiple maps with many hiding spots</li><li>Different objects to hide as</li><li>Seeker weapons</li></ul>',
      tips: '<h2>Tips</h2><ul><li>As hider, choose spots at eye level — seekers look high and low.</li><li>Stay still — movement gives you away.</li><li>As seeker, shoot suspicious objects, not random ones.</li><li>Listen for sounds — hiders make faint noises.</li></ul>'
    },
    'tag': {
      intro: '<p>Tag is a fast multiplayer chasing game where one player is “it” and must tag others. The tagged player becomes it, and the chase continues. Rounds are short and frantic.</p>',
      howToPlay: '<h2>How to Play</h2><p>Run away if you are not it, chase if you are. Use the map’s obstacles to block line of sight and cut corners to escape. Tag by touching.</p>',
      controls: '<h2>Controls</h2><p><strong>Desktop:</strong> WASD/arrows to move. <strong>Mobile:</strong> Joystick.</p>',
      features: '<h2>Features</h2><ul><li>Quick tag matches</li><li>Multiple maps with obstacles</li><li>Power-ups</li><li>Score based on time not it</li></ul>',
      tips: '<h2>Tips</h2><ul><li>Stay near obstacles to break chase.</li><li>Change direction suddenly when chased.</li><li>As it, cut off escape routes, don’t chase directly.</li><li>Use speed boosts at the right moment.</li></ul>'
    },
    'minefun-io': {
      intro: '<p>MineFun.io is a 2D multiplayer survival game where you gather resources, craft tools, and build while competing with other players. The world is block-based and fully destructible.</p>',
      howToPlay: '<h2>How to Play</h2><p>Collect wood, stone, and food, craft better tools, and build shelter. Avoid or fight other players. Hunger and health matter, so keep them up.</p>',
      controls: '<h2>Controls</h2><p><strong>Desktop:</strong> WASD to move, mouse to break/place, E for inventory, Left click to attack. <strong>Mobile:</strong> Joystick and buttons.</p>',
      features: '<h2>Features</h2><ul><li>Gathering and crafting</li><li>Building and base defense</li><li>Hunger/health systems</li><li>PvP and PvE</li></ul>',
      tips: '<h2>Tips</h2><ul><li>Gather wood first, then stone.</li><li>Build shelter before night.</li><li>Keep food above half.</li><li>Avoid fights until you have better gear.</li></ul>'
    },
    'retro-bowl': {
      intro: '<p>Retro Bowl is a retro-style football management game where you control a team as player and coach. Call plays, throw passes, and manage your roster through a season.</p>',
      howToPlay: '<h2>How to Play</h2><p>On offense, choose a play, then control the quarterback to pass or run. Swipe or drag to aim passes. On defense, the game simulates, but your roster choices matter. Manage morale, upgrades, and contracts between games.</p>',
      controls: '<h2>Controls</h2><p><strong>Desktop:</strong> Mouse to select plays and aim, click to throw, arrow keys for runner. <strong>Mobile:</strong> Swipe to aim and throw, tap to select.</p>',
      features: '<h2>Features</h2><ul><li>Season and playoff mode</li><li>Roster management and morale</li><li>Playbook customization</li><li>Retro pixel art</li></ul>',
      tips: '<h2>Tips</h2><ul><li>Short passes are more reliable than long bombs.</li><li>Upgrade offensive line early — it helps both run and pass.</li><li>Keep morale high with wins and contract extensions.</li><li>On defense, invest in secondary to stop big plays.</li></ul>'
    }
  };
  if (sourcePath && GAME_INTROS[sourcePath.split('/').pop().split('?')[0]]) {
    const g = GAME_INTROS[sourcePath.split('/').pop().split('?')[0]];
    const gameIntroHtml = `<section class="game-intro" style="max-width:800px;margin:24px auto;padding:0 16px;line-height:1.7;color:#e8e8f0">${g.intro}${g.howToPlay}${g.controls}${g.features}${g.tips}</section>`;
    // Inject after header (outside React root) so it survives hydration
    const header = $('header').first();
    if (header.length) header.after(gameIntroHtml);
    else if ($('main').length) $('main').prepend(gameIntroHtml);
    else $('body').prepend(gameIntroHtml);
  }

  // Pass 9: Replace Poki logo with custom logo (responsive for all devices)

  // Pass 9b: Rewrite games.poki.com URLs in INITIAL_STATE server-side — only for game pages (skip for homepage etc)
  if (sourcePath && (sourcePath.includes('/g/') || sourcePath.includes('/game/'))) {
    rewriteGameInitState($, sourcePath);
  }
  // Pass 9b2: Rewrite window.context SEO identity for game pages (surgical, no gameplay URLs)
  if (sourcePath && (sourcePath.includes('/g/') || sourcePath.includes('/game/'))) {
    rewriteContext($);
  }
  // Pass 9b3: Client-side Helmet override fix — ensures exactly 1 canonical, correct og:url/title after hydration
  if (sourcePath && (sourcePath.includes('/g/') || sourcePath.includes('/game/'))) {
    const seoFix = '<script>(function(){var TD="browsergameshq.com";function fix(){'
      + 'if(document.title&&document.title.indexOf(" | Poki")!==-1) document.title=document.title.replace(" | Poki"," | BrowserGamesHQ");'
      + 'var cans=document.querySelectorAll(\'link[rel="canonical"]\');'
      + 'if(cans.length>1){for(var i=1;i<cans.length;i++) cans[i].parentNode.removeChild(cans[i]);}'
      + 'var c=document.querySelector(\'link[rel="canonical"]\');'
      + 'if(c){var canonical="https://"+TD+location.pathname; if(c.href!==canonical) c.href=canonical; if(!c.getAttribute("data-react-helmet")) c.setAttribute("data-react-helmet","true");}'
      + 'var og=document.querySelector(\'meta[property="og:url"]\'); if(og&&og.content&&og.content.indexOf("poki.com")!==-1) og.content=og.content.replace(/https?:\\/\\/[^\\/]+/,"https://"+TD);'
      + 'if(og&&og.content&&og.content!==("https://"+TD+location.pathname)) og.content="https://"+TD+location.pathname;'
      + 'var hrs=document.querySelectorAll(\'link[rel="alternate"][hreflang]\'); for(var i=0;i<hrs.length;i++){var h=hrs[i].getAttribute("hreflang"); if(h!=="en"&&h!=="x-default") hrs[i].parentNode.removeChild(hrs[i]); else if(hrs[i].href.indexOf("poki.com")!==-1) hrs[i].href=hrs[i].href.replace(/https?:\\/\\/[^\\/]+/,"https://"+TD);}'
      + '}'
      + 'var mo=new MutationObserver(fix); try{mo.observe(document.head,{childList:true,subtree:true,attributes:true,attributeFilter:["href","content"]});}catch(e){}'
      + 'document.addEventListener("DOMContentLoaded",fix); setTimeout(fix,1000); setInterval(fix,2000); fix();'
      + '})();</script>';
    $('head').append(seoFix);
  }

  // Pass 9c: On ALL pages, inject TikTok pixel
  if ($('head').length) {
    $('head').append('<script>' +
      '!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};ttq.load("D9H295BC77UA1IJTIG30");ttq.page()}(window,document,"ttq");' +
    '</script>');
  }

  // Pass 9d-double: Ensure Twitter card meta tags exist on all pages
  if (!$('meta[name="twitter:card"]').length) {
    $('head').append('<meta name="twitter:card" content="summary_large_image">');
  }
  if (!$('meta[name="twitter:site"]').length) {
    $('head').append('<meta name="twitter:site" content="@BrowserGamesHQ">');
  }

  // Pass 9e: Inject GSC verification + title suffix + JSON-LD schema
  if ($('head').length) {
    // Google Search Console + Bing verification
    $('head').append('<meta name="google-site-verification" content="JdrC1oUAbTyddJDIO7HfqQuEtVcl_pxdiYpCmIU29Ws">');
    $('head').append('<meta name="msvalidate.01" content="9D9ADF6BB82D31433C1A9AC6236F7F66">');
    // Meta robots tag for defense-in-depth indexing directive — only if not already set (e.g., game pilot vs non-pilot)
    if (!$('meta[name="robots"]').length) {
      $('head').append('<meta name="robots" content="index, follow">');
    }
    // Resource hints for Core Web Vitals optimization
    $('head').append('<link rel="dns-prefetch" href="//pagead2.googlesyndication.com">');
    $('head').append('<link rel="dns-prefetch" href="//www.googletagmanager.com">');
    // Add | BrowserGamesHQ suffix to title
    var $title = $('title');
    if ($title.length && $title.text().indexOf('BrowserGamesHQ') === -1) {
      $title.text($title.text() + ' | BrowserGamesHQ');
    }
    // Inject JSON-LD schemas
    var siteUrl = 'https://' + config.domain;
    // WebSite schema (enables Sitelinks Search Box in SERPs) — on ALL pages
    var websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'BrowserGamesHQ',
      'url': siteUrl,
      'potentialAction': {
        '@type': 'SearchAction',
        'target': { '@type': 'EntryPoint', 'urlTemplate': siteUrl + '/search?q={search_term_string}' },
        'query-input': 'required name=search_term_string',
      },
    };
    $('head').append('<script type="application/ld+json">' + JSON.stringify(websiteSchema) + '</script>');
    // Organization schema (brand knowledge panel) — on ALL pages
    var orgSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'BrowserGamesHQ',
      'url': siteUrl,
      'logo': 'https://i.imgur.com/YRRj3Hw.png',
      'sameAs': [
        'https://twitter.com/BrowserGamesHQ',
      ],
    };
    $('head').append('<script type="application/ld+json">' + JSON.stringify(orgSchema) + '</script>');
    // VideoGame schema — only on game pages
    var isGame = typeof sourcePath === 'string' && (sourcePath.indexOf('/g/') !== -1);
    if (isGame) {
      var gameTitle = $title.length ? $title.text().replace(' | BrowserGamesHQ', '') : '';
      var gameDesc = $('meta[name="description"]').attr('content') || '';
      var ogImage = $('meta[property="og:image"]').attr('content') || '';
      var gameUrl = siteUrl + sourcePath;
      var gameSchema = {
        '@context': 'https://schema.org',
        '@type': 'VideoGame',
        'name': gameTitle,
        'description': gameDesc,
        'url': gameUrl,
        'image': ogImage,
        'applicationCategory': 'Game',
        'operatingSystem': 'Any',
        'author': { '@type': 'Organization', 'name': 'BrowserGamesHQ' },
        'publisher': { '@type': 'Organization', 'name': 'BrowserGamesHQ' },
        'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD', 'availability': 'https://schema.org/InStock' },
        'gamePlatform': ['Web Browser'],
        'playMode': 'SinglePlayer',
      };
      $('head').append('<script type="application/ld+json">' + JSON.stringify(gameSchema) + '</script>');

      var gameSlug = (sourcePath.match(/\/g\/([^/]+)/) || [])[1] || '';

      // VideoObject schema — enables video rich results using the game's Poki mp4
      var gameVideo = GAME_VIDEOS[gameSlug] || '';
      if (gameVideo) {
        var videoSchema = {
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          'name': gameTitle,
          'description': gameDesc,
          'thumbnailUrl': ogImage || gameVideo,
          'contentUrl': gameVideo,
          'embedUrl': gameUrl,
          'duration': 'PT30S',
          'publisher': { '@type': 'Organization', 'name': 'BrowserGamesHQ' },
        };
        $('head').append('<script type="application/ld+json">' + JSON.stringify(videoSchema) + '</script>');
      }

      // Related guides strip — internal links from game page to its blog guides.
      // Pass 6a: Server-rendered HTML links (crawlable by Googlebot without JS)
      // Pass 6b: JS widget for UI (fixed-position floating panel)
      var guides = RELATED_GUIDES[gameSlug] || [];
      if (guides.length) {
        // Server-rendered related guides — raw <a> tags in HTML, crawlable without JS
        var guideLinksHtml = '<nav class="portal-related-guides" aria-label="Related guides" style="max-width:700px;margin:24px auto;padding:0 16px"><h2 style="font-size:1.1rem;color:#e8e8f0;margin-bottom:10px">Related Guides</h2><ul style="list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:8px">' +
          guides.map(function (s) {
            var label = s.split('/').pop().replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
            return '<li><a href="/blog/' + s + '" style="display:inline-block;padding:6px 14px;background:#1a1a3e;color:#6ee7ff;border-radius:6px;text-decoration:none;font-size:.9rem;font-weight:500;border:1px solid #2a2a5a">' + label + '</a></li>';
          }).join('') +
          '</ul></nav>';
        // Inject before </body> as a server-rendered HTML block
        $('body').append(guideLinksHtml);

        // JS widget (existing — kept for UI floating panel)
        var links = guides.map(function (s) {
          return 'https://browsergameshq.com/blog/' + s;
        });
        $('head').append('<script id="portal-related-guides">' +
          '(function(){var links=' + JSON.stringify(links) + ';' +
          'function mount(){var wrap=document.createElement("div");' +
          'wrap.id="portal-guides";wrap.setAttribute("style","position:fixed;right:12px;bottom:12px;z-index:2147483647;background:#111;color:#fff;border-radius:10px;padding:12px 14px;font:13px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;max-width:230px;box-shadow:0 4px 20px rgba(0,0,0,.45);display:none");' +
          'var t=document.createElement("div");t.setAttribute("style","font-weight:700;margin-bottom:6px;font-size:13px");t.textContent="Guides & Tips";' +
          'var ul=document.createElement("ul");ul.setAttribute("style","list-style:none;margin:0;padding:0");' +
          'for(var i=0;i<links.length;i++){var li=document.createElement("li");li.setAttribute("style","margin:4px 0");' +
          'var a=document.createElement("a");a.href=links[i];a.setAttribute("style","color:#6ee7ff;text-decoration:none;font-weight:500");' +
          'a.textContent=links[i].split("/").pop().replace(/-/g," ").replace(/\\b\\w/g,function(c){return c.toUpperCase()});' +
          'li.appendChild(a);ul.appendChild(li);}' +
          'wrap.appendChild(t);wrap.appendChild(ul);' +
          'var btn=document.createElement("button");btn.textContent="Guides";btn.setAttribute("style","position:fixed;right:12px;bottom:12px;z-index:2147483647;background:#6ee7ff;color:#111;border:none;border-radius:20px;padding:9px 16px;font:600 13px -apple-system,Segoe UI,Roboto,sans-serif;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.3)");' +
          'btn.onclick=function(){var s=wrap.style.display;s==="none"?(wrap.style.display="block",btn.style.display="none"):(wrap.style.display="none",btn.style.display="block")};' +
          '(document.body||document.documentElement).appendChild(btn);(document.body||document.documentElement).appendChild(wrap);}' +
          'if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",mount)}else{mount()}' +
          '})();</script>');
      }
    }
  }

  // Pass 9d-prime: Fix React Router SPA navigation — Poki sometimes calls pushState
  // directly without triggering React Router navigation. This relays pushState
  // to a popstate event so React Router's history listener picks up the change.
  // Only fires for non-React-Router pushes (detected by state.idx convention).
  if ($('head').length) {
    $('head').append('<script>' +
      '(function(){' +
      'var ops=window.history.pushState;' +
      'window.history.pushState=function(s,t,u){' +
      'ops.call(this,s,t,u);' +
      'if(!s||typeof s.idx!=="number"){' +
      'window.dispatchEvent(new PopStateEvent("popstate",{state:s}))' +
      '}};' +
      '})();' +
      '</script>');
  }

  // Pass 9d: On ALL pages, inject iframe src interceptor (persists across SPA navigations)
  if ($('head').length) {
    $('head').append('<script id="portal-iframe-rw">' +
      '(function(){' +
      'var gp="games.poki.com";var pp="/game-proxy";' +
      'var sdp=["api.poki.com","devs-api.poki.com","a.poki.com","poki-auth.poki.com","ay.delivery","user-vault.poki.com","ads.poki.com","gdn.poki.com","poki-gdn.com","game-cdn.poki.com","ads.poki-cdn.com"];' +
      'var ssp="/game-proxy/gdn-proxy/";' +
      'var sm=' + JSON.stringify(MIRRORS) + ';' +
      'function mirrorUrl(v){' +
      'if(typeof v!=="string")return null;' +
      'var m=window.location.pathname.match(/\\/([a-z]{2}\\/g\\/)?([^/]+?)(?:\\/\\d+)?$/);' +
      'if(!m||!sm[m[2]])return null;' +
      'if(v.indexOf("gdn.poki.com")!==-1||v.indexOf("poki-gdn.com")!==-1||v.indexOf(ssp)!==-1||v.indexOf(gp)!==-1||v.indexOf(pp)!==-1){return sm[m[2]]}' +
      'return null}' +
      // Rewrite existing iframes on the page (server-rendered ones before React takes over)
      'try{var ifs=document.querySelectorAll("iframe");' +
      'for(var i=0;i<ifs.length;i++){' +
      'var s=ifs[i].getAttribute("src");var mr=mirrorUrl(s);' +
      'if(mr){ifs[i].setAttribute("src",mr)}}}catch(e){}' +
      // Watch for any new iframes added to the DOM
      'var mo=new MutationObserver(function(ms){' +
      'for(var i=0;i<ms.length;i++){var ns=ms[i].addedNodes;' +
      'for(var j=0;j<ns.length;j++){var n=ns[j];' +
      'if(n.tagName==="IFRAME"){var s=n.getAttribute("src");var mr=mirrorUrl(s);if(mr)n.setAttribute("src",mr)}' +
      'if(n.nodeType===1){var a=n.querySelectorAll&&n.querySelectorAll("iframe");' +
      'if(a){for(var k=0;k<a.length;k++){var s2=a[k].getAttribute("src");var mr2=mirrorUrl(s2);if(mr2)a[k].setAttribute("src",mr2)}}}}}});' +
      'try{mo.observe(document.documentElement||document.body,{childList:true,subtree:true})}catch(e){}' +
      'function rw(v){if(typeof v!=="string")return v;' +
      'var mr=mirrorUrl(v);if(mr)return mr;' +
      'if(v.indexOf(gp)!==-1){return pp+v.replace(/https?:\\/\\/games\\.poki\\.com/,"")}' +
      'for(var i=0;i<sdp.length;i++){if(v.indexOf(sdp[i])!==-1){return ssp+v.replace(/https?:\\/\\//,"").replace(/^\\/\\//,"")}}' +
      // If Phase 3 missed restoring games.BrowserGamesHQ.com back to games.poki.com, fix it client-side
      'if(v.indexOf("games.browsergameshq.com")!==-1||v.indexOf("games.BrowserGamesHQ.com")!==-1){return pp+v.replace(/^https?:\\/\\/games\\.(?:BrowserGamesHQ|browsergameshq)\\.com/,"")}' +
      // Catch-all for other browsergameshq subdomains not restored by Phase 3
      'if(v.match(/https?:\\/\\/[^\\/]+\\.browsergameshq\\.com/i)){return v.replace(/https?:\\/\\/[^\\/]+\\.browsergameshq\\.com/i,window.location.origin)}' +
      'if(v.indexOf("poki.com")!==-1||v.indexOf("poki.io")!==-1||v.indexOf("poki-cdn.com")!==-1){return v.replace(/https?:\\/\\/(?:[^\\/]+\\.)*poki\\.(com|io|cdn\\.com)/,window.location.origin)}' +
      'return v}' +
      'var d=Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype,"src");' +
      'if(d&&d.set){Object.defineProperty(HTMLIFrameElement.prototype,"src",{' +
      'get:d.get,set:function(v){return d.set.call(this,rw(v))},configurable:true})}' +
      'var ad=Object.getOwnPropertyDescriptor(HTMLAnchorElement.prototype,"href");' +
      'if(ad&&ad.set){Object.defineProperty(HTMLAnchorElement.prototype,"href",{' +
      'get:ad.get,set:function(v){return ad.set.call(this,rw(v))},configurable:true})}' +
      'var osa=Element.prototype.setAttribute;' +
      'Element.prototype.setAttribute=function(n,v){' +
      'if(n==="src"&&this.tagName==="IFRAME"){v=rw(v)}' +
      'if(n==="href"&&this.tagName==="A"){v=rw(v)}' +
      'return osa.call(this,n,v)};' +
      'var _og=window.open;window.open=function(u){' +
      'if(u&&typeof u==="string"){var r=rw(u);if(r!==u)return _og.call(window,r)}' +
      'return _og.apply(window,arguments)};' +
      'var _la=Object.getOwnPropertyDescriptor(Location.prototype,"href");' +
      'if(_la&&_la.set){Object.defineProperty(Location.prototype,"href",{' +
      'get:_la.get,set:function(v){if(typeof v==="string"){var r=rw(v);if(r!==v)return _la.set.call(this,r)}' +
      'return _la.set.call(this,v)},configurable:true})}' +
      'var _lA=Location.prototype.assign;' +
      'Location.prototype.assign=function(u){if(typeof u==="string"){var r=rw(u);if(r!==u)return _lA.call(this,r)}return _lA.apply(this,arguments)};' +
      'var _lR=Location.prototype.replace;' +
      'Location.prototype.replace=function(u){if(typeof u==="string"){var r=rw(u);if(r!==u)return _lR.call(this,r)}return _lR.apply(this,arguments)};' +
      'var of=window.fetch;window.fetch=function(u,o){' +
      'var _u=typeof u==="string"?u:(u&&u.url);' +
      'if(_u&&_u.indexOf("ads.poki-cdn.com")!==-1)return Promise.resolve(new Response("",{status:200}));' +
      'return of(rw(_u)||u,o)};' +
      'var ox=XMLHttpRequest.prototype.open;' +
      'XMLHttpRequest.prototype.open=function(m,u,a){' +
      'arguments[1]=rw(u)||u;return ox.apply(this,arguments)};' +
      'var clientId=' + JSON.stringify(config.ads.adsenseClientId || '') + ';' +
      'var slots={"728x90":' + JSON.stringify(config.ads.slotLeaderboard || '') + ',"300x250":' + JSON.stringify(config.ads.slotRectangle || '') + ',"160x600":' + JSON.stringify(config.ads.slotSkyscraper || '') + '};' +
      // React-safe AdSense manager (v2). Poki's React app hydrates the game page and,
      // during hydration adoption, WIPES any server-rendered children out of the gp_*
      // ad containers (one-time, observed in production ~1-3s after load, before the
      // game iframe appears). Re-attaching a wiped <ins> makes AdSense fire a NEW fill,
      // so we never restore. Instead we CLAIM containers only AFTER the app has hydrated
      // (game iframe present, or 12s fallback) so React never sees the <ins> to remove
      // it; each container is claimed once (WeakMap) and survives re-renders + SPA route
      // changes. If a claimed <ins> is still removed, we re-claim after a 5s quiet window.
      // Pushes are gated on the AdSense loader having loaded: pushing into the queue
      // while the async loader is still loading can leave stale pushes that fire "all
      // ins already have ads" after React wipes the original <ins> before the loader
      // processes them. flush() pushes only for ins we created, still connected, and
      // not yet pushed.
      `if(clientId){
        var claimed=new WeakMap();
        var claimedList=[];
        var loaderAdded=false;
        var loaderLoaded=false;
        var bootTime=(new Date()).getTime();
        function loadAdLoader(){
        if(loaderAdded)return;
        loaderAdded=true;
        if(document.querySelector("script[src*=adsbygoogle]")){loaderLoaded=true;return;}
        if(window.adsbygoogle&&window.adsbygoogle.loaded){loaderLoaded=true;return;}
        var s=document.createElement("script");
        s.async=true;
        s.src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client="+encodeURIComponent(clientId);
        s.onload=s.onerror=function(){loaderLoaded=true;flush();};
        (document.head||document.documentElement).appendChild(s);}
        function pushFor(el){
        var ins=claimed.get(el);
        if(!ins||!ins.isConnected||ins.__bghPushed)return;
        ins.__bghPushed=true;
        try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){}}
        function flush(){
        for(var i=0;i<claimedList.length;i++){var el=claimedList[i];
        if(!claimed.has(el))continue;
        pushFor(el);}}
        function slotSize(el){
        var s=el.getAttribute&&el.getAttribute("data-poki-ad-size")||"";
        if(s)return s;
        var id=el.id||"";
        if(id==="gp_728x90")return "728x90";
        if(id==="gp_300x250")return "300x250";
        if(id==="gp_160x600")return "160x600";
        if(el.style&&el.style.width&&el.style.height){var w=parseInt(el.style.width),h=parseInt(el.style.height);
        if(w&&h)return w+"x"+h;}
        var st=el.getAttribute&&el.getAttribute("style")||"";
        var mw=st.match(/width:\\s*(\\d+)/),mh=st.match(/height:\\s*(\\d+)/);
        if(mw&&mh)return mw[1]+"x"+mh[1];
        return "";}
        function buildIns(size,slot){
        var p=size.split("x");
        var ins=document.createElement("ins");
        ins.className="adsbygoogle";
        ins.style.display="inline-block";
        ins.style.width=p[0]+"px";
        ins.style.height=p[1]+"px";
        ins.setAttribute("data-ad-client",clientId);
        ins.setAttribute("data-ad-slot",slot);
        return ins;}
        function appHydrated(){
        if(Date.now()-bootTime>12000)return true;
        var ifs=document.querySelectorAll("iframe");
        for(var i=0;i<ifs.length;i++){
        var u=ifs[i].getAttribute("src")||"";
        if(u&&u!=="about:blank"&&u.indexOf("javascript:")!==0)return true;}
        return false;}
        function claim(el){
        if(!el||!el.isConnected||claimed.has(el)||el.children.length>0)return;
        if(!appHydrated())return;
        if(el.__wipeAt&&Date.now()-el.__wipeAt<5000)return;
        var size=slotSize(el),slot=slots[size];
        if(!slot)return;
        var ins=buildIns(size,slot);
        ins.__bghContainer=el;
        el.appendChild(ins);
        claimed.set(el,ins);
        claimedList.push(el);
        loadAdLoader();
        if(loaderLoaded)pushFor(el);}
        function nukeHouseAds(){
        var els=document.querySelectorAll(".poki-ad-slot,[data-poki-ad-size]");
        for(var i=0;i<els.length;i++){var el=els[i];
        if(!claimed.has(el)&&el.parentNode)el.parentNode.removeChild(el);}}
        function ensureAds(){
        nukeHouseAds();
        var els=document.querySelectorAll("#gp_728x90,#gp_300x250,#gp_160x600,.poki-ad-slot,[data-poki-ad-size]");
        for(var i=0;i<els.length;i++)claim(els[i]);}
        var adObs=new MutationObserver(function(muts){
        for(var i=0;i<muts.length;i++){
        var rem=muts[i].removedNodes;
        for(var j=0;j<rem.length;j++){
        var rn=rem[j];
        if(!rn||rn.nodeType!==1)continue;
        if(rn.__bghContainer){
        var el=rn.__bghContainer;
        claimed.delete(el);
        var ix=claimedList.indexOf(el);if(ix>-1)claimedList.splice(ix,1);
        if(el&&el.isConnected)el.__wipeAt=Date.now();}
        else if(rn.querySelectorAll){
        var own=rn.querySelectorAll("ins.adsbygoogle");
        for(var k=0;k<own.length;k++){
        var ins=own[k];
        var c=ins.__bghContainer;
        if(c){claimed.delete(c);
        var ix2=claimedList.indexOf(c);if(ix2>-1)claimedList.splice(ix2,1);
        if(c&&c.isConnected)c.__wipeAt=Date.now();}}}}
        var add=muts[i].addedNodes;
        for(var j=0;j<add.length;j++){
        var n=add[j];
        if(!n||n.nodeType!==1)continue;
        if(n.id==="gp_728x90"||n.id==="gp_300x250"||n.id==="gp_160x600"||(n.classList&&(n.classList.contains("poki-ad-slot")||n.hasAttribute("data-poki-ad-size")))){claim(n);}
        else if(n.querySelectorAll){
        var q=n.querySelectorAll("#gp_728x90,#gp_300x250,#gp_160x600,.poki-ad-slot,[data-poki-ad-size]");
        for(var l=0;l<q.length;l++)claim(q[l]);}}}});
        try{adObs.observe(document.documentElement||document.body,{childList:true,subtree:true})}catch(e){}
        setTimeout(ensureAds,300);
        setInterval(ensureAds,2000);}` +
      '})();</script>');
  }

  return $.html();
}

function normalizeToAbsolute($, el, attr) {
  let val = $(el).attr(attr) || '';
  if (!val) return;
  if (val.startsWith('//')) {
    val = 'https:' + val;
  }
  $(el).attr(attr, val);
}

function rewriteMetaTags($, sourceDomain, targetDomain) {
  const escapedSource = sourceDomain.replace('.', '\\.');
  $('meta[property="og:url"]').each(function () {
    const content = $(this).attr('content') || '';
    $(this).attr('content', content.replace(new RegExp(escapedSource, 'g'), targetDomain));
  });
  $('meta[name="canonical"]').each(function () {
    const content = $(this).attr('content') || '';
    $(this).attr('content', content.replace(new RegExp(escapedSource, 'g'), targetDomain));
  });
  $('link[rel="canonical"]').each(function () {
    const href = $(this).attr('href') || '';
    $(this).attr('href', href.replace(new RegExp(escapedSource, 'g'), targetDomain));
  });
  // Rewrite hreflang alternates from poki.com to our domain
  $('link[rel="alternate"]').each(function () {
    const href = $(this).attr('href') || '';
    if (href.indexOf(sourceDomain) !== -1) {
      $(this).attr('href', href.replace(new RegExp(escapedSource, 'g'), targetDomain));
    }
  });
  $('meta[name="description"]').each(function () {
    const content = $(this).attr('content') || '';
    if (content.includes('Poki') || content.includes('poki')) {
      $(this).attr('content', content.replace(/Poki/gi, 'BrowserGamesHQ').replace(/poki/gi, 'BrowserGamesHQ'));
    }
  });
}

function rewriteOpenGraph($, sourceDomain, targetDomain) {
  const escapedSource = sourceDomain.replace('.', '\\.');
  $('meta[property^="og:"]').each(function () {
    const content = $(this).attr('content') || '';
    if (content.includes(sourceDomain)) {
      $(this).attr('content', content.replace(new RegExp(escapedSource, 'g'), targetDomain));
    }
    if ((content.includes('Poki') || content.includes('poki')) && !content.includes('poki-cdn')) {
      $(this).attr('content', content.replace(/Poki/gi, 'BrowserGamesHQ'));
    }
  });
  if (!$('meta[property="og:image"]').length) {
    $('head').append('<meta property="og:image" content="https://' + targetDomain + '/static/img/og-image.png">');
  }
}

function rewriteTwitterCards($, sourceDomain, targetDomain) {
  const escapedSource = sourceDomain.replace('.', '\\.');
  $('meta[name^="twitter:"], meta[property^="twitter:"]').each(function () {
    const content = $(this).attr('content') || '';
    if (content.includes(sourceDomain)) {
      $(this).attr('content', content.replace(new RegExp(escapedSource, 'g'), targetDomain));
    }
    if ((content.includes('Poki') || content.includes('poki')) && !content.includes('poki-cdn')) {
      $(this).attr('content', content.replace(/Poki/gi, 'BrowserGamesHQ'));
    }
  });
}

function replacePokiLogo($) {
  var logoUrl = '/static/img/logo.svg';
  // 1. Set customLogo in INITIAL_STATE so the Logo React component uses our image
  $('script').each(function () {
    var text = $(this).html() || '';
    if (text.indexOf('INITIAL_STATE') === -1) return;
    text = text.replace('"customLogo":null', '"customLogo":{"url":"' + logoUrl + '"}');
    text = text.replace('"customFavicon":null', '"customFavicon":{"url":"' + logoUrl + '"}');
    $(this).html(text);
  });
  // 2. Update visible branding on parent elements
  $('span[role="img"]').each(function () {
    var style = $(this).attr('style') || '';
    if (style.indexOf('poki.svg') === -1 && style.indexOf('BrowserGamesHQ.svg') === -1) return;
    var parentLink = $(this).closest('a');
    if (parentLink.length) {
      parentLink.attr('aria-label', 'BrowserGamesHQ');
      parentLink.attr('title', 'BrowserGamesHQ');
    }
    var parentButton = $(this).closest('button');
    if (parentButton.length) {
      parentButton.attr('aria-label', 'BrowserGamesHQ');
    }
  });
  // 3. Fix alt text on the logo img
  $('img[src*="/static/img/logo.svg"]').each(function () {
    if ($(this).attr('alt') && $(this).attr('alt').indexOf('Poki') !== -1) {
      $(this).attr('alt', 'BrowserGamesHQ');
    }
  });
  // 4. Add responsive CSS for the custom logo
  if ($('head').length && !$('#portal-logo-style').length) {
    $('head').append('<style id="portal-logo-style">' +
      'img[src*="/static/img/logo.svg"],img[src*="/static/img/logo.png"]{height:32px;width:auto;object-fit:contain;vertical-align:middle;display:inline-block}' +
      '@media(max-width:1024px){img[src*="/static/img/logo.svg"],img[src*="/static/img/logo.png"]{height:28px}}' +
      '@media(max-width:640px){img[src*="/static/img/logo.svg"],img[src*="/static/img/logo.png"]{height:24px}}' +
      '</style>');
  }
  // 5. Force the logo click to hard-navigate to "/" (our custom homepage).
  // The Poki SPA intercepts the logo <a> click via React Router and renders the
  // ORIGINAL Poki home route client-side, which hides the custom homepage.
  // Intercept in capture phase, stop React Router, and do a full page load so
  // the server serves our homepage at "/".
  if ($('head').length && !$('#portal-logo-home').length) {
    $('head').append('<script id="portal-logo-home">' +
      '(function(){' +
      'function isLogoLink(a){' +
      'if(!a||a.tagName!=="A")return false;' +
      'var title=a.getAttribute("title")||"";' +
      'var label=a.getAttribute("aria-label")||"";' +
      'if(title==="BrowserGamesHQ"||label==="BrowserGamesHQ")return true;' +
      'if(a.getAttribute("href")!=="/")return false;' +
      'return !!a.querySelector("img[src*=\'/static/img/logo\']")' +
      '}' +
      'function onClick(e){' +
      'var t=e.target;' +
      'var a=t&&t.closest?t.closest("a"):null;' +
      'if(!isLogoLink(a))return;' +
      'if(window.location.pathname==="/")return;' +
      'e.preventDefault();' +
      'e.stopPropagation();' +
      'window.location.href="/"' +
      '}' +
      'document.addEventListener("click",onClick,true);' +
      '})();' +
      '</script>');
  }
}

function rewriteGameInitState($, sourcePath) {
  var slug = null;
  var slugMatch = sourcePath ? sourcePath.match(/\/([^/]+?)(?:\/\d+)?$/) : null;
  if (slugMatch) slug = slugMatch[1];
  $('script').each(function () {
    var text = $(this).html() || '';
    var idx = text.indexOf('window.INITIAL_STATE=');
    if (idx === -1) idx = text.indexOf('window.INITIAL_STATE =');
    if (idx === -1) return;
    var start = text.indexOf('{', idx);
    if (start === -1) return;
    // Parse the JSON object by counting braces
    var depth = 0;
    var inStr = false;
    var esc = false;
    var end = -1;
    for (var i = start; i < text.length; i++) {
      var c = text[i];
      if (esc) { esc = false; continue; }
      if (c === '\\' && inStr) { esc = true; continue; }
      if (c === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
    }
    if (end === -1) return;
    try {
      var jsonStr = text.substring(start, end);
      // Replace \u002F with / for proper parsing
      var cleanJson = jsonStr.replace(/\\u002F/g, '/');
      // Replace gdn embed URLs with mirror URL for mapped games (server-side)
      if (MIRRORS[slug]) {
        var mirrorUrl = MIRRORS[slug];
        cleanJson = cleanJson.replace(/https?:\/\/[^"'\s]*gdn\.poki\.com[^"'\s]*/g, mirrorUrl);
        cleanJson = cleanJson.replace(/https?:\/\/[^"'\s]*poki-gdn\.com[^"'\s]*/g, mirrorUrl);
        cleanJson = cleanJson.replace(/\/\/[^"'\s]*gdn\.poki\.com[^"'\s]*/g, mirrorUrl);
      }
      var data = JSON.parse(cleanJson);
      var modified = rewriteGameUrls(data);
      // For mapped games, also replace any /game-proxy/ URLs with the mirror
      if (MIRRORS[slug]) {
        var mirrorUrl = MIRRORS[slug];
        function mirrorWalk(obj, visited) {
          if (!obj || typeof obj !== 'object') return false;
          if (!visited) visited = new WeakSet();
          if (visited.has(obj)) return false;
          visited.add(obj);
          var changed = false;
          for (var k in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, k)) {
              var v = obj[k];
              if (typeof v === 'string' && (v.indexOf('/game-proxy/') !== -1 || v.indexOf('games.poki.com') !== -1)) {
                obj[k] = mirrorUrl;
                changed = true;
              } else if (typeof v === 'object' && v !== null) {
                if (mirrorWalk(v, visited)) changed = true;
              }
            }
          }
          return changed;
        }
        if (mirrorWalk(data)) modified = true;
      }
      // V2 surgical SEO identity — only Helmet-consumed fields (no global poki.com replace)
      // Fixes Helmet canonical/og:title/hreflang without touching gameplay URLs
      (function patchSeoIdentity(){
        const TD = "browsergameshq.com";
        let seoChanged = false;
        if(data.site && data.site.site){
          if(data.site.site.domain === "poki.com"){ data.site.site.domain = TD; seoChanged = true; }
          if(data.site.site.domain_title === "Poki.com"){ data.site.site.domain_title = "BrowserGamesHQ.com"; seoChanged = true; }
          if(data.site.site.title === "Poki"){ data.site.site.title = "BrowserGamesHQ"; seoChanged = true; }
        }
        if(data.site && data.site.sites && data.site.sites["3"]){
          if(data.site.sites["3"].domain === "poki.com"){ data.site.sites["3"].domain = TD; seoChanged = true; }
          if(data.site.sites["3"].domain_title === "Poki.com"){ data.site.sites["3"].domain_title = "BrowserGamesHQ.com"; seoChanged = true; }
          if(data.site.sites["3"].title === "Poki"){ data.site.sites["3"].title = "BrowserGamesHQ"; seoChanged = true; }
        }
        // Remove hreflang locales that would 404 on BrowserGamesHQ (keep only en)
        if(data.site && data.site.sites){
          for(const k in data.site.sites){ if(k !== "3"){ delete data.site.sites[k]; seoChanged = true; } }
        }
        // Fix game meta title for current slug only
        if(data.api && data.api.queries){
          for(const qk in data.api.queries){
            const q = data.api.queries[qk];
            if(q && q.originalArgs && q.originalArgs.slug === slug){
              if(q.data && q.data.meta && typeof q.data.meta.title === "string" && q.data.meta.title.endsWith(" | Poki")){
                q.data.meta.title = q.data.meta.title.replace(" | Poki", " | BrowserGamesHQ"); seoChanged = true;
              }
              if(q.originalArgs.site){
                if(q.originalArgs.site.domain === "poki.com"){ q.originalArgs.site.domain = TD; seoChanged = true; }
                if(q.originalArgs.site.domain_title === "Poki.com"){ q.originalArgs.site.domain_title = "BrowserGamesHQ.com"; seoChanged = true; }
                if(q.originalArgs.site.title === "Poki"){ q.originalArgs.site.title = "BrowserGamesHQ"; seoChanged = true; }
              }
            }
          }
        }
        if(seoChanged) modified = true;
      })();
      if (!modified) return;
      var newJson = JSON.stringify(data).replace(/\//g, '\\u002F');
      var newText = text.substring(0, start) + newJson + text.substring(end);
      $(this).html(newText);
    } catch (e) {
      // Silent fail - don't break page rendering
    }
  });
}

function rewriteContext($) {
  $('script').each(function () {
    var text = $(this).html() || '';
    if (text.indexOf('window.context') === -1) return;
    var start = text.indexOf('{', text.indexOf('window.context'));
    if (start === -1) return;
    var depth = 0, inStr = false, esc = false, end = -1;
    for (var i = start; i < text.length; i++) {
      var c = text[i];
      if (esc) { esc = false; continue; }
      if (c === '\\' && inStr) { esc = true; continue; }
      if (c === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
    }
    if (end === -1) return;
    try {
      var jsonStr = text.substring(start, end);
      var cleanJson = jsonStr.replace(/\\u002F/g, '/');
      var data = JSON.parse(cleanJson);
      var changed = false;
      if (data.site) {
        if (data.site.domain === "poki.com") { data.site.domain = "browsergameshq.com"; changed = true; }
        if (data.site.domain_title === "Poki.com") { data.site.domain_title = "BrowserGamesHQ.com"; changed = true; }
        if (data.site.title === "Poki") { data.site.title = "BrowserGamesHQ"; changed = true; }
      }
      if (!changed) return;
      var newJson = JSON.stringify(data).replace(/\//g, '\\u002F');
      var newText = text.substring(0, start) + newJson + text.substring(end);
      $(this).html(newText);
    } catch (e) {}
  });
}

function rewriteGameUrls(obj, visited) {
  if (!obj || typeof obj !== 'object') return false;
  if (!visited) visited = new WeakSet();
  if (visited.has(obj)) return false;
  visited.add(obj);
  var changed = false;
  for (var k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      var v = obj[k];
      if (typeof v === 'string' && v.indexOf('games.poki.com') !== -1) {
        obj[k] = v.replace(/(?:https?:)?\/\/games\.poki\.com/g, '/game-proxy');
        changed = true;
      } else if (typeof v === 'object' && v !== null) {
        if (rewriteGameUrls(v, visited)) changed = true;
      }
    }
  }
  return changed;
}

module.exports = { rewriteHtml };
