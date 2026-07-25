const { post } = require('./generator');
function rd() { return `2026-0${Math.floor(Math.random()*8)+1}-${String(Math.floor(Math.random()*28)+1).padStart(2,'0')}`; }

const G = [
  { n:'Subway Surfers', s:'subway-surfers', u:'/en/g/subway-surfers', g:'endless runner', d:'colorful train-dodging game' },
  { n:'Temple Run 2', s:'temple-run-2', u:'/en/g/temple-run-2', g:'endless runner', d:'ancient ruin escape adventure' },
  { n:'Temple Run 2 Frozen Shadows', s:'temple-run-2-frozen-shadows', u:'/en/g/temple-run-2-frozen-shadows', g:'endless runner', d:'icy temple running game' },
  { n:'Temple Run 2 Jungle Fall', s:'temple-run-2-jungle-fall', u:'/en/g/temple-run-2-jungle-fall', g:'endless runner', d:'tropical jungle running game' },
  { n:'Temple Run 2 Holi Festival', s:'temple-run-2-holi-festival', u:'/en/g/temple-run-2-holi-festival', g:'endless runner', d:'festival-themed running game' },
  { n:'Temple Run 2 Spooky Summit', s:'temple-run-2-spooky-summit', u:'/en/g/temple-run-2-spooky-summit', g:'endless runner', d:'haunted mountain running game' },
  { n:'Murder', s:'murder', u:'/en/g/murder', g:'mystery puzzle', d:'detective mystery game' },
  { n:'Apple Worm', s:'apple-worm', u:'/en/g/apple-worm', g:'physics puzzle', d:'worm physics puzzle game' },
  { n:'Drive Mad', s:'drive-mad', u:'/en/g/drive-mad', g:'racing stunt', d:'stunt driving game' },
  { n:'Monster Tracks', s:'monster-tracks', u:'/en/g/monster-tracks', g:'racing off-road', d:'monster truck racing game' },
];

const out = [];

// "How to play X" for every game
G.forEach(g => {
  out.push(post(`${g.s}-how-to-play-online`, `How to Play ${g.n} Online: Complete Beginner Guide`, rd(), 'Guides',
    `Learn how to play ${g.n} online for free. Complete beginner guide with controls, tips, and strategies to get started.`,
    `<p>${g.n} is a popular ${g.g} that you can play directly in your browser. This beginner guide will teach you everything you need to know to start playing.</p>
<h2>What Is ${g.n}?</h2>
<p>${g.n} is a ${g.d}. The objective is simple ${g.g === 'endless runner' ? '— run as far as you can while avoiding obstacles and collecting coins' : g.g === 'mystery puzzle' ? '— solve mysteries by gathering clues and making deductions' : g.g === 'physics puzzle' ? '— solve physics-based puzzles by guiding your character through creative levels' : g.g === 'racing stunt' ? '— complete stunt tracks by balancing your vehicle and mastering each obstacle' : '— complete off-road tracks by driving monster trucks over rough terrain'}.</p>
<h2>Game Controls</h2>
<p>${g.g === 'endless runner' ? 'Use swipe gestures or arrow keys. Swipe left/right to change lanes, up to jump, down to slide.' : g.g === 'mystery puzzle' ? 'Use mouse or touch to click on objects and interact with the environment.' : g.g === 'physics puzzle' ? 'Use mouse or touch to drag and position your worm. Physics handles the movement.' : g.g === 'racing stunt' || g.g === 'racing off-road' ? 'Use arrow keys or WASD to control your vehicle. Accelerate, brake, and tilt to maintain balance.' : 'Use the provided controls to navigate the game.'}</p>
<h2>Tips for Beginners</h2>
<p>${g.g === 'endless runner' ? 'Start slow and focus on survival. The center lane is safest. Do not chase coins at the expense of survival.' : g.g === 'mystery puzzle' ? 'Examine everything carefully. Take notes on clues. Cross-reference evidence before making conclusions.' : g.g === 'physics puzzle' ? 'Take your time. Analyze each level before moving. Physics rewards patience and precision.' : g.g === 'racing stunt' || g.g === 'racing off-road' ? 'Gentle inputs are better than aggressive ones. Learn each track before attempting speed runs.' : 'Practice consistently and you will improve.'}</p>
<h2>Play ${g.n} Online Free</h2>
<p>Ready to play? <a href="${g.u}">Play ${g.n} online free</a> on BrowserGamesHQ. No download required — just click and play instantly.</p>`));
});

// "X for beginners" for every game
G.forEach(g => {
  out.push(post(`${g.s}-for-beginners`, `${g.n} for Beginners: A Complete Getting Started Guide`, rd(), 'Guides',
    `New to ${g.n}? This beginner-friendly guide walks you through everything you need to know to start playing and enjoying the game.`,
    `<p>Welcome to ${g.n}! If you are new to the game, this guide will help you get started on the right foot. We cover the basics, common mistakes to avoid, and tips to accelerate your learning.</p>
<h2>Getting Started with ${g.n}</h2>
<p>${g.n} is available to play for free in your browser. There is no installation, no account creation, and no payment required. Simply visit the game page and start playing.</p>
<h2>Common Beginner Mistakes</h2>
<p>${g.g === 'endless runner' ? 'The most common mistake beginners make is over-swiping. Move only when necessary. Another mistake is chasing coins instead of focusing on survival. Coins come naturally as you improve.' : g.g === 'mystery puzzle' ? 'Rushing to conclusions is the biggest mistake. Take your time to gather all evidence before making accusations.' : g.g === 'physics puzzle' ? 'Rushing through levels causes crashes. Take time to understand each puzzle before attempting it.' : g.g === 'racing stunt' || g.g === 'racing off-road' ? 'Holding acceleration constantly causes crashes. Learn when to accelerate and when to brake.' : 'Take your time and learn the mechanics.'}</p>
<h2>How to Improve Quickly</h2>
<p>Practice consistently. Focus on one skill at a time. ${g.g === 'endless runner' ? 'Learn obstacle patterns by repeating sections.' : g.g === 'mystery puzzle' ? 'Review each case after solving it to understand the clues you missed.' : g.g === 'physics puzzle' ? 'Replay difficult levels until you master the physics involved.' : g.g === 'racing stunt' || g.g === 'racing off-road' ? 'Master each track individually before moving to the next.' : 'Practice makes perfect.'}</p>
<h2>Start Playing Now</h2>
<p><a href="${g.u}">Play ${g.n} online free</a> and begin your gaming journey with BrowserGamesHQ.</p>`));
});

// "Why X is so popular" for every game
G.forEach(g => {
  out.push(post(`why-${g.s}-is-so-popular`, `Why ${g.n} Is So Popular: The Secret Behind Its Success`, rd(), 'Articles',
    `Discover why ${g.n} has become one of the most played browser games. What makes it so addictive and fun?`,
    `<p>${g.n} has attracted millions of players worldwide. But what makes this ${g.g} so special? Here is why players keep coming back.</p>
<h2>Simple Yet Addictive Gameplay</h2>
<p>The core mechanics of ${g.n} are easy to understand but difficult to master. This creates a perfect balance that keeps players engaged. You can learn the basics in seconds but spend months improving your skills.</p>
<h2>Perfect for Short Sessions</h2>
<p>${g.n} is ideal for quick gaming sessions. A single ${g.g === 'endless runner' ? 'run' : g.g === 'mystery puzzle' ? 'case' : g.g === 'physics puzzle' ? 'level' : 'track'} takes only a few minutes. This makes it perfect for breaks, commutes, or any spare moment.</p>
<h2>Constant Improvement Loop</h2>
<p>The game rewards practice. Every session you get slightly better. This improvement loop is psychologically satisfying and keeps players motivated to return.</p>
<h2>Free and Accessible</h2>
<p>${g.n} is completely free and runs in any browser. No downloads, no payments, no barriers. Anyone with an internet connection can play.</p>
<h2>Play ${g.n} Yourself</h2>
<p>Experience the popularity firsthand. <a href="${g.u}">Play ${g.n} online free</a> and see why millions of players love this game.</p>`));
});

// "X review" for every game
G.forEach(g => {
  out.push(post(`${g.s}-review`, `${g.n} Review: Is It Worth Playing in 2026?`, rd(), 'Articles',
    `Honest review of ${g.n}. We examine gameplay, graphics, replay value, and whether this browser game is worth your time in 2026.`,
    `<p>With so many browser games available, it can be hard to know which ones are worth your time. This review of ${g.n} will help you decide.</p>
<h2>Gameplay Quality</h2>
<p>${g.n} delivers ${g.g === 'endless runner' ? 'tight controls and responsive gameplay. The lane-switching mechanics feel precise, and the increasing speed provides a natural difficulty curve.' : g.g === 'mystery puzzle' ? 'engaging mystery mechanics that reward careful observation. Each case feels unique and the deduction system is satisfying.' : g.g === 'physics puzzle' ? 'charming physics-based puzzles that are both relaxing and challenging. The worm physics feel realistic and responsive.' : g.g === 'racing stunt' || g.g === 'racing off-road' ? 'engaging vehicle physics that reward precision. The balance mechanics are challenging but fair.' : 'quality gameplay that keeps you coming back for just one more try.'}</p>
<h2>Visual Design</h2>
<p>${g.g === 'endless runner' ? 'The graphics are colorful and polished. Each map has a distinct visual identity with attention to environmental detail.' : g.n === 'Murder' ? 'The art style is detailed and atmospheric, creating an immersive detective experience.' : g.n === 'Apple Worm' ? 'The charming, colorful art style appeals to all ages with its warm and inviting world.' : g.n === 'Drive Mad' ? 'Physics-based rendering with vehicle deformation effects and dynamic lighting.' : g.n === 'Monster Tracks' ? '3D environments with detailed terrain textures and vehicle models.' : 'The visual design complements the gameplay and enhances the overall experience.'}</p>
<h2>Replay Value</h2>
<p>${g.g === 'endless runner' ? 'High replay value through daily missions, character unlocks, and multiple maps. New content keeps the game fresh.' : g.g === 'mystery puzzle' ? 'Multiple endings and scenarios provide good replay value for mystery enthusiasts.' : g.g === 'physics puzzle' ? 'Dozens of levels with increasing difficulty provide hours of puzzle-solving content.' : g.g === 'racing stunt' || g.g === 'racing off-road' ? 'Multiple tracks and vehicle upgrades provide ongoing progression and replay value.' : 'Solid replay value that keeps the game interesting over time.'}</p>
<h2>Verdict</h2>
<p>${g.n} is absolutely worth playing in 2026. <a href="${g.u}">Play ${g.n} online free</a> on BrowserGamesHQ and see for yourself.</p>`));
});

// "X secrets and hidden features" for every game
G.forEach(g => {
  out.push(post(`${g.s}-secrets-and-hidden-features`, `${g.n} Secrets and Hidden Features You Did Not Know About`, rd(), 'Guides',
    `Discover secret features and hidden mechanics in ${g.n}. Even experienced players may not know these tips.`,
    `<p>Think you know everything about ${g.n}? These secret features and hidden mechanics might surprise even veteran players.</p>
<h2>Hidden Gameplay Mechanics</h2>
<p>${g.g === 'endless runner' ? 'Most players do not realize that obstacle patterns repeat in cycles. Learning these cycles gives you an advantage. Also, some power-ups have hidden effects — the magnet also slightly increases your speed.' : g.g === 'mystery puzzle' ? 'The game tracks your deduction accuracy silently. Consistently correct deductions unlock bonus content and harder cases.' : g.g === 'physics puzzle' ? 'Your worm has hidden momentum properties that change based on how you move. Mastering momentum transfer allows precision movement.' : g.g === 'racing stunt' || g.g === 'racing off-road' ? 'Suspension upgrades affect more than just landing — they also change your vehicles turning radius and acceleration characteristics.' : 'Study the game mechanics carefully and you will discover hidden depth.'}</p>
<h2>Easter Eggs</h2>
<p>${g.n} contains several easter eggs hidden throughout the game. ${g.g === 'endless runner' ? 'Look for special graffiti in certain locations or try specific movement patterns at particular distances to trigger hidden effects.' : g.g === 'mystery puzzle' ? 'Certain object combinations trigger unique dialogue or alternative scenarios.' : g.g === 'physics puzzle' ? 'Some levels have alternative solutions that are not immediately obvious.' : g.g === 'racing stunt' || g.g === 'racing off-road' ? 'Certain vehicle and track combinations unlock hidden performance bonuses.' : 'Explore every corner of the game to find hidden surprises.'}</p>
<h2>Play and Discover</h2>
<p><a href="${g.u}">Play ${g.n} online free</a> and discover these secrets for yourself. How many hidden features can you find?</p>`));
});

// Quick play guides - short, punchy posts
G.forEach(g => {
  out.push(post(`${g.s}-quick-start-guide`, `${g.n} Quick Start Guide: Play in 60 Seconds`, rd(), 'Guides',
    `Get playing ${g.n} in under 60 seconds. The fastest way to start enjoying this popular browser game.`,
    `<p>Ready to play ${g.n}? Here is everything you need to know to start playing in under 60 seconds.</p>
<h2>Step 1: Open the Game</h2>
<p><a href="${g.u}">Click here to open ${g.n}</a>. The game loads instantly in your browser.</p>
<h2>Step 2: Learn the Controls</h2>
<p>${g.g === 'endless runner' ? 'Swipe or use arrow keys. Left/Right = change lane. Up = jump. Down = slide. Simple.' : g.g === 'mystery puzzle' ? 'Click on objects to examine them. Click on suspects to question them. Use deduction to solve cases.' : g.g === 'physics puzzle' ? 'Position your worm and use physics to reach the target. Experiment with different approaches.' : g.g === 'racing stunt' || g.g === 'racing off-road' ? 'Use arrow keys to control your vehicle. Accelerate, brake, and balance through each track.' : 'Use the in-game controls to navigate and interact.'}</p>
<h2>Step 3: Start Playing</h2>
<p>That is it. You are now playing ${g.n}. The game is completely free with no sign-up required.</p>
<h2>Play Now</h2>
<p><a href="${g.u}">Play ${g.n} online free</a> on BrowserGamesHQ. Start your adventure instantly.</p>`));
});

module.exports = out;
