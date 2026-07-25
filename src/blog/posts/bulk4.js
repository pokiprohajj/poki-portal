const { post } = require('./generator');
function rd() { return `2026-0${Math.floor(Math.random()*8)+1}-${String(Math.floor(Math.random()*28)+1).padStart(2,'0')}`; }

const out = [];

out.push(post('subway-surfers-timing-guide', 'Subway Surfers Timing Guide: When to Swipe for Perfect Runs', rd(), 'Guides',
  'Master the timing of Subway Surfers. Know exactly when to swipe, jump, and slide for perfect obstacle navigation.',
  `<p>Timing is everything in Subway Surfers. This guide breaks down the exact timing for every obstacle type.</p>
<h2>Train Timing</h2>
<p>Trains move horizontally across your path. The key is anticipating their arrival. Start watching the tracks ahead as soon as you see a train. Swipe one lane over approximately 0.5 seconds before the train reaches your lane.</p>
<h2>Barrier Timing</h2>
<p>Barriers appear suddenly. Jump or slide exactly when you reach the white line on the ground before the barrier. Jumping too early means you land on the barrier; too late means you crash into it.</p>
<h2>Coin Trail Timing</h2>
<p>Coin trails are designed to lead you into obstacles. When you see coins forming a trail, check for obstacles at the end of the trail before chasing them. Many coin trails are traps.</p>
<h2>Play Subway Surfers</h2>
<p><a href="/en/g/subway-surfers">Play Subway Surfers online</a> and practice your timing. Perfect timing comes from repetition.</p>`));

out.push(post('drive-mad-vehicle-guide', 'Drive Mad Vehicle Guide: Stats, Handling, and Best Choices', rd(), 'Guides',
  'Every Drive Mad vehicle explained. Learn which vehicle handles best for each track type and your play style.',
  `<p>Drive Mad features multiple vehicles with different handling characteristics. This guide helps you choose the right vehicle for each track.</p>
<h2>Light Vehicles</h2>
<p>Light vehicles accelerate quickly and are easier to jump but harder to balance. Best for tracks with lots of jumps and air time. Require precise throttle control.</p>
<h2>Medium Vehicles</h2>
<p>The best balance of speed, stability, and control. Recommended for beginners and intermediate players. Medium vehicles handle most tracks well without extreme characteristics.</p>
<h2>Heavy Vehicles</h2>
<p>Slow to accelerate but very stable. Best for tracks with steep climbs and rough terrain. Heavy vehicles forgive landing mistakes better than light ones.</p>
<h2>Track-Specific Recommendations</h2>
<p>Flat tracks with jumps: Light vehicles. Hilly tracks: Medium vehicles. Rocky/rough tracks: Heavy vehicles. Master one vehicle type before experimenting with others.</p>
<h2>Play Drive Mad</h2>
<p><a href="/en/g/drive-mad">Play Drive Mad</a> and test different vehicles on your favorite tracks.</p>`));

out.push(post('monster-tracks-track-guide', 'Monster Tracks Track Guide: Every Track Type Explained', rd(), 'Guides',
  'Complete guide to every track type in Monster Tracks. Learn the best strategies for mud, rock, sand, and pavement tracks.',
  `<p>Monster Tracks features several track surface types, each with unique driving characteristics. Here is how to conquer them all.</p>
<h2>Mud Tracks</h2>
<p>Mud reduces speed but provides stability. Take wider lines through mud sections to maintain momentum. Avoid sudden steering inputs that could cause sliding.</p>
<h2>Rock Tracks</h2>
<p>Rock surfaces provide excellent grip but risk tipping. Keep your vehicle centered on rocky sections. Small steering adjustments prevent rollovers.</p>
<h2>Sand Tracks</h2>
<p>Sand is unpredictable — sometimes grippy, sometimes loose. Reduce speed in sand sections until you understand the surface. Sand traps can stop you completely.</p>
<h2>Pavement Tracks</h2>
<p>Pavement offers the most speed but least grip. Brake earlier on pavement sections. High-speed pavement corners are where most crashes happen.</p>
<h2>Play Monster Tracks</h2>
<p><a href="/en/g/monster-tracks">Play Monster Tracks</a> and apply surface-specific strategies for better times.</p>`));

out.push(post('temple-run-2-power-ups-guide', 'Temple Run 2 Power-Ups: Complete Guide and Best Usage Strategies', rd(), 'Guides',
  'Every Temple Run 2 power-up explained. Learn when to use each power-up for maximum effectiveness.',
  `<p>Power-ups can make or break your Temple Run 2 run. Here is the complete guide to every power-up and the best strategies for using them.</p>
<h2>Shield</h2>
<p>The most valuable power-up. The shield protects you from one crash. Activate it proactively before difficult sections. Do not wait until you see an obstacle — activate it when you enter a high-density obstacle zone.</p>
<h2>Coin Magnet</h2>
<p>Attracts nearby coins. Use coin magnets during sections with visible coin clusters. The magnet has limited duration, so time it for maximum coin density. Combine with the 2x multiplier for maximum earnings.</p>
<h2>Boost</h2>
<p>Temporarily increases speed. Use boosts on straight sections where obstacles are sparse. Never use boosts in dense obstacle zones — the extra speed reduces your reaction time.</p>
<h2>Mega Coin</h2>
<p>Collects all visible coins on screen. Best used when you see a massive coin cluster filling multiple lanes. Activate and then focus entirely on survival — the mega coin handles collection automatically.</p>
<h2>Power-Up Priority</h2>
<p>Shield > Magnet > Mega Coin > Boost. Prioritize defensive power-ups over offensive ones. Survival always comes first.</p>
<h2>Play Temple Run 2</h2>
<p><a href="/en/g/temple-run-2">Play Temple Run 2 free</a> and practice your power-up timing.</p>`));

out.push(post('apple-worm-physics-guide', 'Apple Worm Physics Guide: Understanding Momentum and Trajectory', rd(), 'Guides',
  'Master Apple Worm physics. Learn how momentum, gravity, and collision mechanics work to solve puzzles more efficiently.',
  `<p>Apple Worm physics can be complex, but understanding the underlying mechanics makes solving puzzles much easier.</p>
<h2>Momentum Basics</h2>
<p>Your worm has mass and velocity that carry over between movements. The longer you build momentum in one direction, the more energy you have for the next movement. Think of your worm as a pendulum — swing back to launch forward.</p>
<h2>Gravity and Arc</h2>
<p>When your worm leaves a surface, gravity pulls it down in a parabolic arc. The higher and faster you launch, the farther you travel. Jump from elevated positions for maximum distance.</p>
<h2>Collision Physics</h2>
<p>When your worm hits a surface, some energy is lost. Soft landings preserve momentum for continued movement. Hard impacts may stop your worm completely. Aim for gentle, angled landings.</p>
<h2>Advanced Techniques</h2>
<p>Chain multiple momentum transfers for complex movements. Use wall bounces to redirect trajectory. Time your releases to match moving platform cycles.</p>
<h2>Play Apple Worm</h2>
<p><a href="/en/g/apple-worm">Play Apple Worm</a> and apply these physics principles to solve puzzles more efficiently.</p>`));

out.push(post('murder-evidence-guide', 'Murder Evidence Guide: How to Analyze Clues Like a Detective', rd(), 'Guides',
  'Master the art of evidence analysis in Murder. Learn professional detective techniques for solving cases.',
  `<p>Solving cases in Murder requires careful evidence analysis. This guide teaches professional detective techniques you can apply in the game.</p>
<h2>The Four Types of Evidence</h2>
<p>Physical evidence: Objects found at crime scenes. Testimonial evidence: Statements from witnesses and suspects. Circumstantial evidence: Situational details that suggest connections. Digital evidence: Electronic records and communications.</p>
<h2>Cross-Referencing Technique</h2>
<p>Never rely on a single piece of evidence. Each clue should be corroborated by at least two other pieces of evidence. If evidence contradicts, investigate further to resolve the contradiction.</p>
<h2>Identifying Red Herrings</h2>
<p>Some evidence is designed to mislead. If a clue points to an obvious conclusion too easily, it might be a red herring. The real solution usually requires connecting multiple clues across different evidence types.</p>
<h2>Play Murder</h2>
<p><a href="/en/g/murder">Play Murder online</a> and practice your detective skills on increasingly complex cases.</p>`));

out.push(post('subway-surfers-character-guide', 'Subway Surfers Character Guide: Abilities and Unlock Guide', rd(), 'Guides',
  'Every character in Subway Surfers explained. Learn how to unlock characters and which ones offer gameplay advantages.',
  `<p>Subway Surfers features a roster of characters with unique styles. While all characters play similarly, unlocking them adds variety and achievement progression.</p>
<h2>Starting Characters</h2>
<p>Jake is the default character with balanced attributes. Learn the game with Jake before switching. He represents the baseline for all characters.</p>
<h2>Unlockable Characters</h2>
<p>Characters are unlocked through missions, events, and in-game purchases. Focus on completing character-specific missions first. Some characters are only available during limited-time events.</p>
<h2>Do Characters Affect Gameplay?</h2>
<p>Character selection is primarily cosmetic in Subway Surfers. No character has a gameplay advantage over others. Choose characters based on your personal style preference.</p>
<h2>Play Subway Surfers</h2>
<p><a href="/en/g/subway-surfers">Play Subway Surfers online</a> and start building your character collection.</p>`));

out.push(post('subway-surfers-hoverboard-guide', 'Subway Surfers Hoverboards Guide: Best Boards and Strategies', rd(), 'Guides',
  'Complete guide to Subway Surfers hoverboards. Learn which boards to use and how to maximize their protective benefits.',
  `<p>Hoverboards in Subway Surfers act as shields that protect you from one crash. Here is everything you need to know about them.</p>
<h2>How Hoverboards Work</h2>
<p>Activating a hoverboard makes you invincible for a limited time. If you crash while on a hoverboard, the board absorbs the crash and you continue running. You can refill hoverboards using collected coins.</p>
<h2>When to Activate</h2>
<p>Activate hoverboards before entering difficult sections. Proactive activation is better than reactive. If you wait until you are about to crash, it is too late — the board must be active before impact.</p>
<h2>Board Selection</h2>
<p>Different hoverboards have slightly different durations and styles. Standard boards offer balanced protection. Premium boards may offer longer duration or special effects.</p>
<h2>Play Subway Surfers</h2>
<p><a href="/en/g/subway-surfers">Play Subway Surfers online</a> and master hoverboard usage to extend your runs significantly.</p>`));

out.push(post('temple-run-2-coin-collection-guide', 'Temple Run 2 Coin Collection Guide: Maximize Your Earnings', rd(), 'Guides',
  'Learn the best routes and strategies for collecting coins in Temple Run 2. Maximize your coin income per run.',
  `<p>Coins are the primary currency in Temple Run 2. This guide teaches you how to collect them efficiently.</p>
<h2>High-Density Routes</h2>
<p>Each Temple Run 2 map has routes with higher coin density. Learn which path choices lead to more coins. Generally, the left path in most maps has more coins but tighter obstacles.</p>
<h2>Multiplier Strategy</h2>
<p>Your coin multiplier increases every 100 coins collected without crashing. Build your multiplier early by focusing on coin-dense sections in the first 1000 meters. Once established, the multiplier applies to all subsequent coins.</p>
<h2>Power-Up Combinations</h2>
<p>Combine coin magnets with dense coin sections for maximum collection. Activate the magnet when you see a long trail of coins. The magnet pulls coins from a wider radius than you can collect manually.</p>
<h2>Play Temple Run 2</h2>
<p><a href="/en/g/temple-run-2">Play Temple Run 2 free</a> and apply these strategies to maximize your coin earnings on every run.</p>`));

out.push(post('temple-run-2-mine-cart-guide', 'Temple Run 2 Mine Cart Guide: Surviving Cart Sections', rd(), 'Guides',
  'Master the mine cart sections in Temple Run 2. Learn the timing and patterns for surviving cart tracks.',
  `<p>Mine cart sections are among the most challenging in Temple Run 2. Here is how to survive them consistently.</p>
<h2>How Mine Carts Work</h2>
<p>When you enter a mine cart section, your character automatically rides a cart along a fixed track. You control lane changes while the cart moves forward. Obstacles come faster in cart sections.</p>
<h2>Key Differences from Foot Sections</h2>
<p>Mine carts have a fixed speed that cannot be adjusted. Obstacle density is higher. Turns are automatic — you only control lane position. The cart has a wider hitbox than your character.</p>
<h2>Survival Strategy</h2>
<p>Stay in the center lane as much as possible. Watch for the distinctive cart section warning (tracks appearing on the ground). Prepare for faster obstacle sequences. Use shields before entering cart sections if available.</p>
<h2>Play Temple Run 2</h2>
<p><a href="/en/g/temple-run-2">Play Temple Run 2 free</a> and practice mine cart sections until they become second nature.</p>`));

out.push(post('temple-run-2-zip-line-guide', 'Temple Run 2 Zip Line Guide: Mastering Aerial Sections', rd(), 'Guides',
  'Learn how to navigate zip line sections in Temple Run 2. Timing tips for perfect zip line transfers.',
  `<p>Zip line sections add vertical variety to Temple Run 2. Here is how to master them.</p>
<h2>Zip Line Mechanics</h2>
<p>When you grab a zip line, your character automatically rides it to the next section. You control your speed by swiping up (speed up) or down (slow down). Obstacles on zip lines require speed adjustments.</p>
<h2>Speed Management</h2>
<p>Speed up on straight zip line sections. Slow down when approaching obstacles or landing platforms. The key is matching your arrival speed to the landing surface.</p>
<h2>Landing After Zip Lines</h2>
<p>Landings after zip lines can be tricky. Slow down as you approach the end of the line. Aim for the center of the landing platform. Prepare for immediate obstacle dodging after landing.</p>
<h2>Play Temple Run 2</h2>
<p><a href="/en/g/temple-run-2">Play Temple Run 2 free</a> and master zip line navigation.</p>`));

out.push(post('temple-run-2-avoid-crashing-guide', 'Temple Run 2: How to Avoid Crashing Every Time', rd(), 'Guides',
  'Stop crashing in Temple Run 2. Learn the exact techniques for avoiding every obstacle type consistently.',
  `<p>If you keep crashing in Temple Run 2, this guide will help you identify and fix the specific mistakes ending your runs.</p>
<h2>Most Common Crash Causes</h2>
<p>Late turns at path junctions. Misjudging obstacle height (jumping when you should slide). Chasing coins into obstacles. Panic swiping in dense sections. Most crashes fall into these four categories.</p>
<h2>Fix Your Turn Timing</h2>
<p>Start your turn swipe earlier than you think is necessary. The game has a small input delay. Swiping at the last moment causes late turns that end runs. Practice turning one full second before reaching the junction.</p>
<h2>Obstacle Priority System</h2>
<p>When multiple obstacles approach, prioritize: jump clears ground-level and mid-level obstacles. Slide only clears overhanging obstacles. Jump first, slide second. This priority prevents most crash scenarios.</p>
<h2>Play Temple Run 2</h2>
<p><a href="/en/g/temple-run-2">Play Temple Run 2 free</a> and consciously apply these techniques. Focus on one fix at a time during each run.</p>`));

out.push(post('browser-games-productivity-tips', 'Browser Games That Boost Productivity: Strategic Break Gaming', rd(), 'Articles',
  'How to use browser games strategically to boost your productivity. Science-backed break strategies for better focus.',
  `<p>Used strategically, browser games can actually boost your productivity. Here is the science and strategy.</p>
<h2>The Break Science</h2>
<p>Research shows that taking short breaks during focused work improves overall productivity. The key is break quality. Passive breaks (scrolling social media) are less restorative than active breaks (playing a game).</p>
<h2>Best Games for Productivity Breaks</h2>
<p><a href="/en/g/subway-surfers">Subway Surfers</a> — One run, approximately 3 minutes. Perfect reset. <a href="/en/g/apple-worm">Apple Worm</a> — One puzzle, approximately 2 minutes. Gentle mental shift.</p>
<h2>The Perfect Break Formula</h2>
<p>Work for 25 minutes (Pomodoro). Play one game session (3-5 minutes). Return to work refreshed. Repeat. This cycle maximizes focus while providing regular mental resets.</p>
<h2>When NOT to Game</h2>
<p>Do not game when you are already procrastinating. Do not game when you are in a flow state. Do not game as an avoidance mechanism. Use gaming as a scheduled break, not an escape.</p>`));

out.push(post('browser-games-mental-health', 'Browser Games for Mental Health: Therapeutic Benefits', rd(), 'Articles',
  'How browser games can support mental health. Therapeutic benefits of casual gaming for anxiety, depression, and stress.',
  `<p>Browser games can support mental health when used mindfully. Here is how casual gaming can complement your wellness routine.</p>
<h2>Stress Reduction</h2>
<p>Short gaming sessions reduce cortisol levels and provide a mental break from stressors. The focused concentration required creates a state similar to meditation. Even 5 minutes of gaming can reset your stress response.</p>
<h2>Anxiety Management</h2>
<p>Games provide a controlled environment where challenges are predictable and surmountable. This can help build confidence that transfers to real-world situations. <a href="/en/g/apple-worm">Apple Worm</a> and <a href="/en/g/subway-surfers">Subway Surfers</a> are excellent for anxiety relief.</p>
<h2>Depression Support</h2>
<p>Accomplishing goals in games provides small dopamine releases. Completing a difficult level or beating a high score provides a sense of achievement. Browser games are accessible even when motivation is low.</p>
<h2>Important Note</h2>
<p>Browser games are a supplement to, not a replacement for, professional mental health care. Use them as part of a comprehensive wellness approach.</p>`));

module.exports = out;
