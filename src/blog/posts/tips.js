const { post } = require('./generator');

const GAMES = [
  { name: 'Subway Surfers', slug: 'subway-surfers', url: '/en/g/subway-surfers', genre: 'endless runner', poster: '🎨' },
  { name: 'Temple Run 2', slug: 'temple-run-2', url: '/en/g/temple-run-2', genre: 'endless runner', poster: '🗿' },
  { name: 'Temple Run 2 Frozen Shadows', slug: 'temple-run-2-frozen-shadows', url: '/en/g/temple-run-2-frozen-shadows', genre: 'endless runner', poster: '❄️' },
  { name: 'Temple Run 2 Jungle Fall', slug: 'temple-run-2-jungle-fall', url: '/en/g/temple-run-2-jungle-fall', genre: 'endless runner', poster: '🌴' },
  { name: 'Temple Run 2 Holi Festival', slug: 'temple-run-2-holi-festival', url: '/en/g/temple-run-2-holi-festival', genre: 'endless runner', poster: '🎉' },
  { name: 'Temple Run 2 Spooky Summit', slug: 'temple-run-2-spooky-summit', url: '/en/g/temple-run-2-spooky-summit', genre: 'endless runner', poster: '👻' },
  { name: 'Murder', slug: 'murder', url: '/en/g/murder', genre: 'mystery puzzle', poster: '🔍' },
  { name: 'Apple Worm', slug: 'apple-worm', url: '/en/g/apple-worm', genre: 'physics puzzle', poster: '🐛' },
  { name: 'Drive Mad', slug: 'drive-mad', url: '/en/g/drive-mad', genre: 'racing stunt', poster: '🏎️' },
  { name: 'Monster Tracks', slug: 'monster-tracks', url: '/en/g/monster-tracks', genre: 'racing off-road', poster: '🏔️' },
];

function tipsPost(g, n, tips) {
  const items = tips.map((t, i) => `<h2>${i+1}. ${t.title}</h2><p>${t.body}</p>`).join('\n');
  const slug = `${g.slug}-${n || 'pro-tips-and-tricks'}`;
  return post(slug, `${g.name} Tips and Tricks: ${tips[0].title}`, randomDate(), 'Guides',
    `Master ${g.name} with these pro tips. Learn how to improve your gameplay and beat your high scores.`,
    `<p>${g.name} is one of the most popular ${g.genre} games available online. Whether you are a beginner or an experienced player, these tips will help you level up your game.</p>\n${items}\n<h2>Play ${g.name} Online Free</h2>\n<p>Ready to put these tips into practice? <a href="${g.url}">Play ${g.name} free online</a> on BrowserGamesHQ. No downloads required — just click and play instantly in your browser.</p>\n<p>With regular practice and these strategies, you will see noticeable improvement in your gameplay. Remember that consistency matters more than raw talent when it comes to mastering any game.</p>`);
}

function randomDate() { return `2026-0${Math.floor(Math.random()*8)+1}-${String(Math.floor(Math.random()*28)+1).padStart(2,'0')}`; }

module.exports = [
  // === SUBWAY SURFERS ===
  tipsPost(GAMES[0], 'pro-tips-and-tricks', [
    { title: 'Master the Art of Minimal Movement', body: 'The most common mistake new Subway Surfers players make is over-swiping. Every unnecessary lane change increases your chances of crashing into an obstacle. Train yourself to plan two moves ahead. Stay in the center lane as your default position — it gives you equal reaction time for obstacles coming from either side. Watch the path ahead, not your character, and move only when necessary.' },
    { title: 'Coin Magnet Timing Is Critical', body: 'The coin magnet power-up is most valuable when used during sections with dense coin clusters. Save your magnets for the long straight sections where coins form a continuous line. Activating a magnet during these sections can easily triple your coin intake for that run. Never waste a magnet when there are only scattered coins ahead.' },
    { title: 'How to Use the Super Sneaker Effectively', body: 'The super sneaker gives you a double jump, but many players waste it on single obstacles. Save the super sneaker for sections with back-to-back barriers or trains where a single jump is not enough. When you see two obstacles close together and you have the sneaker, you can clear both in one leap rather than jumping and then sliding.' },
    { title: 'Daily Challenges Are Free Rewards', body: 'Do not skip your daily and weekly challenges. Missions reward keys, coins, and exclusive items that you cannot get through regular gameplay. Before starting a serious run, check your active missions and tailor your play style to complete them. Three completed missions in a single run can reward you with multiple keys.' },
    { title: 'Master the Hoverboard', body: 'Hoverboards act as a shield that absorbs one crash. Activate your hoverboard when you enter a difficult section or when you are approaching your personal best distance. Smart players keep one hoverboard slot filled at all times and activate it proactively before crashes, not during them.' },
  ]),

  tipsPost(GAMES[0], 'advanced-strategies', [
    { title: 'Reading Obstacle Patterns', body: 'Subway Surfers uses repeating obstacle patterns, not random generation. Once you learn a pattern, you can anticipate obstacles before they appear. Pay attention to the background and environment changes — they often signal upcoming difficulty increases. The game operates in speed tiers; hitting a new speed tier means obstacles come faster, but the pattern sequences remain the same.' },
    { title: 'Maximizing Your Score Multiplier', body: 'Your score multiplier grows with every completed mission and collected multiplier token. Focus on completing missions that reward multiplier upgrades first. The 2x multiplier power-up doubles all points earned during its duration. Activate it at the start of your run when your speed is manageable, allowing you to earn maximum points during the easier opening sections.' },
    { title: 'Character and Board Selection', body: 'Different characters and hoverboards offer subtle gameplay advantages. Some characters have smaller hitboxes, making it easier to squeeze through tight gaps. Experiment with different combinations to find what works for your play style. The stats displayed for each character and board actually matter — prioritize speed stats over style.' },
    { title: 'Handling High-Speed Sections', body: 'Once the game reaches its maximum speed tier, reaction time is everything. At this stage, focus on the center two lanes rather than all four. Narrow your visual focus and use your peripheral vision for immediate obstacles. Do not try to collect every coin — survival is the priority at top speed.' },
    { title: 'Practice Mode Strategy', body: 'Use the first few runs of each session as warm-ups. Your reaction times are slower when you first start playing. Use these warm-up runs to practice specific techniques like late dodges or precision coin collection. After 3-4 warm-up runs, your muscle memory will be fully engaged for serious score attempts.' },
  ]),

  // === TEMPLE RUN 2 ===
  tipsPost(GAMES[1], 'tips-and-tricks', [
    { title: 'Master the Turn Timing', body: 'Temple Run 2 turns can be tricky because the path narrows before each turn. Start your swipe slightly earlier than you think you need to. The game registers swipes with a small delay, so swiping early ensures your character turns at the right moment. Late swipes are the number one cause of crashes in Temple Run 2.' },
    { title: 'Priority Order for Obstacles', body: 'When you see multiple obstacles approaching, prioritize jumps over slides. Jumping clears both ground-level and mid-level obstacles, while sliding only clears overhanging ones. If you have to choose, always jump first and slide second. This priority system will save you from many otherwise unavoidable crashes.' },
    { title: 'Coin Collection Routes', body: 'Not all coins are worth collecting. Temple Run 2 places coins in patterns that often lead you into obstacles. Learn to recognize trap coin patterns — these are coin trails that swerve toward barriers. Only deviate from your path for high-value coin clusters of 10 or more coins in a straight line.' },
    { title: 'Power-Up Strategy Guide', body: 'The shield power-up is the most valuable in Temple Run 2 because it protects you from one crash. Always prioritize shields over magnets or boosts. Use the shield when you enter unfamiliar sections or when your concentration starts to dip after a long run. One well-timed shield can extend your run by thousands of meters.' },
    { title: 'Using the Mine Carts', body: 'Mine cart sections in Temple Run 2 require different timing than foot sections. In mine carts, the path is predetermined and obstacles come faster. Stay in the center lane and prepare for quick left-right sequences. Mine cart sections are excellent opportunities to use power-ups since the obstacle density is highest here.' },
  ]),

  tipsPost(GAMES[1], 'high-score-strategies', [
    { title: 'Build Your Score Streak', body: 'The key to massive scores in Temple Run 2 is maintaining your coin multiplier streak. Every 100 coins collected without crashing increases your multiplier. Focus on high-density coin sections early in your run to build the multiplier quickly. Once established, the multiplier applies to all subsequent coins, dramatically boosting your final score.' },
    { title: 'Optimal Path Selection', body: 'When the path splits, always choose the route that matches your current momentum. Switching paths mid-stride wastes valuable milliseconds. Learn which paths tend to have more coins and which have fewer obstacles. The left path generally has more coins but tighter obstacle sequences, while the right path is safer with fewer rewards.' },
    { title: 'Idle Animation Exploit', body: 'Temple Run 2 has a brief idle animation that plays when you stop moving. Use this to your advantage — when you know a difficult section is coming, briefly pause by swiping up. This resets your position to the center of the lane and gives you a moment to assess the upcoming obstacle pattern before committing.' },
    { title: 'Rescue Missions Strategy', body: 'Rescue missions in Temple Run 2 reward you with keys and special items. Prioritize rescue missions that offer keys as rewards, since keys are the premium currency. Use saved keys strategically — only spend them on permanent upgrades and special characters that offer gameplay advantages, not cosmetic items.' },
    { title: 'Endless Mode vs Adventure Mode', body: 'Endless mode is best for practicing obstacle patterns without pressure. Adventure mode has set distances with predictable challenges. Use Adventure mode to learn specific obstacle sequences, then apply that knowledge in Endless mode for high score attempts. Patterns learned in Adventure mode transfer directly to Endless mode runs.' },
  ]),

  // === TEMPLE RUN 2 FROZEN SHADOWS ===
  tipsPost(GAMES[2], 'tips-and-strategies', [
    { title: 'Adjusting to Ice Physics', body: 'Frozen Shadows introduces ice physics that change how your character handles. On ice surfaces, your character slides slightly after each swipe. Compensate by swiping 20% earlier than you would on normal surfaces. The slide distance is predictable once you practice — take a few warm-up runs just to learn the ice feel.' },
    { title: 'Frozen Arches Require Slides', body: 'Frozen arches are lower than standard obstacles because of hanging icicles. Many players instinctively jump under arches, but in Frozen Shadows, jumping means hitting the icicles. Always slide under frozen arches. The visual cue is the icicles hanging from the arch top — if you see icicles, you must slide, not jump.' },
    { title: 'Narrow Ice Bridges', body: 'Frozen Shadows features narrow ice bridges that require precision movement. On these sections, take the center lane and hold it. Do not attempt to collect coins on the edges of ice bridges unless you are certain of the bridge width. Falling off an ice bridge ends your run instantly, regardless of power-ups.' },
    { title: 'Visibility in Snowstorms', body: 'The Frozen Shadows map includes snowstorm sections that reduce visibility. During snowstorms, rely on audio cues rather than visual ones. The games sound design warns you about approaching obstacles with specific audio patterns. Turn up your volume during snowstorm sections and listen for the warning sounds.' },
    { title: 'Warm-Up Runs Are Essential', body: 'The Frozen Shadows map requires different muscle memory than standard Temple Run 2. Always do at least three warm-up runs before attempting serious high scores. Use these runs to recalibrate your timing for the ice physics. Your first few runs will feel awkward — that is normal and expected.' },
  ]),

  // === JUNGLE FALL ===
  tipsPost(GAMES[3], 'beginner-guide', [
    { title: 'Understanding Jungle Obstacles', body: 'The Jungle Fall map introduces vine-covered obstacles that behave differently than stone ones. Vines can be pushed through if you time your movement correctly. Unlike solid obstacles, vines have a small give that allows late dodges. Use this knowledge to squeeze through gaps that look too small.' },
    { title: 'Water Hazards and Crossings', body: 'Jungle Fall features water sections where the path becomes slippery rocks and logs. On these sections, your swipes need to be more precise. The landing zones on slippery rocks are smaller, so aim for the center of each rock. Jump earlier for wider gaps to ensure you clear the water.' },
    { title: 'Using the Environment', body: 'The jungle environment has interactive elements like swinging vines and collapsing bridges. Swinging vines can carry you over large gaps if timed right. Watch the vine swing pattern before jumping — jumping too early or too late will send you into the water below.' },
    { title: 'Coin Placement Patterns', body: 'Jungle Fall coins are often placed along vine-swinging paths. These are designed to reward players who master the vine mechanics. Do not chase jungle coins until you are comfortable with the vine timing. Focus on survival first, then add coin collection as your confidence grows.' },
    { title: 'Audio Cues in the Jungle', body: 'The Jungle Fall map has distinctive audio cues for different obstacles. Falling rocks are preceded by a rumbling sound. Approaching water sections have a splashing audio cue. Learn to associate sounds with obstacles and you will react faster than players who rely on visuals alone.' },
  ]),

  // === HOLI FESTIVAL ===
  tipsPost(GAMES[4], 'complete-guide', [
    { title: 'Navigating the Festival Chaos', body: 'The Holi Festival map is deliberately chaotic with bright colors and confetti everywhere. The visual noise can be distracting. Focus on the shapes of obstacles rather than their colors. Train yourself to recognize the silhouette of each obstacle type regardless of what color it is painted.' },
    { title: 'Festival Obstacle Patterns', body: 'Holi Festival has unique obstacle patterns that incorporate festival elements like color pots and decorative arches. Color pots explode when you get close, briefly obscuring your vision. Learn the pattern sequences so you can navigate through the visual effects without relying on sight during those moments.' },
    { title: 'High Score in Color Mode', body: 'The color bomb sections reward aggressive play. When you see a line of color bombs, run through the center of them rather than avoiding them. Each bomb hit gives points and contributes to your score multiplier. The festival map is designed to reward bold, confident running.' },
    { title: 'Managing Visual Overload', body: 'If the festival visuals are overwhelming, try playing with reduced screen brightness. Lower brightness reduces the intensity of the color explosions. You can also try playing in a well-lit room where the screen colors have less contrast against your surroundings.' },
    { title: 'Festival Power-Up Locations', body: 'Power-ups in Holi Festival appear in predictable locations, usually just after major obstacle sequences. Memorize these locations so you can plan your power-up usage. The shield power-up is especially valuable in this map because the visual chaos makes it easier to miss obstacles.' },
  ]),

  // === SPOOKY SUMMIT ===
  tipsPost(GAMES[5], 'survival-guide', [
    { title: 'Seeing in the Dark', body: 'Spooky Summit is the darkest Temple Run 2 map, with most of the action happening at night or in dimly lit caves. Increase your screen brightness for this map specifically. The reduced visibility means you must rely more on pattern recognition than real-time reaction. Learn the obstacle sequences through repetition.' },
    { title: 'Ghost Obstacle Mechanics', body: 'Spooky Summit introduces ghost obstacles that phase in and out of visibility. Ghost barriers appear and disappear on a fixed timer. Watch the transparency level — when a ghost starts becoming visible, it is about to materialize. You have roughly one second from first visibility to dodge.' },
    { title: 'Crumbling Tombstones', body: 'Tombstones in Spooky Summit crumble when you get close, creating ground-level hazards. Unlike standard obstacles, tombstones require you to jump earlier than normal because the crumbling animation adds delay. Jump as soon as you see the tombstone start to shake.' },
    { title: 'Atmospheric Fear Management', body: 'Spooky Summit uses jump scares and atmospheric tension that can make players flinch and swipe incorrectly. Stay calm by focusing on your breathing. Take a deep breath before entering a difficult section. Panic swipes are the biggest run-ender on this map — composure is your greatest weapon.' },
    { title: 'Audio Reliance in Dark Sections', body: 'In the darkest sections of Spooky Summit, audio cues are your primary navigational tool. The game plays specific sounds for each obstacle type: a whisper for ghosts, a crack for tombstones, a howl for wind obstacles. Memorize these audio cues to navigate dark sections with confidence.' },
  ]),

  // === MURDER ===
  tipsPost(GAMES[6], 'tips-and-walkthrough', [
    { title: 'Observation Is Your Primary Skill', body: 'Murder is a mystery game that rewards careful observation. Examine every room for details before making decisions. Clues are often hidden in plain sight — objects slightly out of place, unusual shadows, or environmental details that do not match the setting. Take your time exploring.' },
    { title: 'Gathering Evidence Efficiently', body: 'Not all objects in Murder are interactive. Learn to identify clickable objects by subtle visual cues like slight glows or cursor changes. Prioritize gathering evidence in a systematic order: start with the crime scene, then move outward to surrounding areas. Document what you find mentally.' },
    { title: 'Deduction Logic', body: 'Murder uses a deduction system where evidence points toward suspects. Some evidence is misleading (red herrings). Cross-reference every piece of evidence with at least two other clues before drawing conclusions. If evidence contradicts itself, look for a third clue that resolves the contradiction.' },
    { title: 'Time Management', body: 'Many Murder scenarios have time pressure mechanics. When under time pressure, focus on the most visible clues first. Obvious clues are usually the most reliable. Save detailed examination for when the game is not actively counting down.' },
    { title: 'Multiple Endings', body: 'Murder features multiple endings based on your deductions. Making an incorrect accusation leads to a different outcome than solving the case correctly. The game rewards thorough investigation — if you feel something is off, spend more time exploring before making your final accusation.' },
  ]),

  // === APPLE WORM ===
  tipsPost(GAMES[7], 'levels-and-strategies', [
    { title: 'Understanding Worm Physics', body: 'Apple Worm uses realistic physics that make your worm stretch, bounce, and swing. Your worms momentum carries over between movements. Start your movement early to account for the physics delay. Abrupt stops will cause your worm to overshoot targets.' },
    { title: 'Solving Puzzle Layouts', body: 'Each Apple Worm level is a physics puzzle with a solution. Look at the entire level layout before making your first move. Identify the apple position, your starting point, and any movable objects. The solution usually involves using physics to your advantage — swinging, bouncing, or sliding to reach the apple.' },
    { title: 'Using Momentum', body: 'Momentum is your best friend in Apple Worm. Build up swing momentum by moving back and forth before releasing toward your target. The longer you build momentum, the farther your worm will travel. For hard-to-reach apples, you need maximum momentum.' },
    { title: 'Obstacle Navigation', body: 'Apple Worm obstacles include spikes, gaps, and moving platforms. Spikes require precise timing to navigate around. Gaps need momentum to cross. Moving platforms require you to match their speed for a safe landing. Practice each obstacle type separately before attempting full level runs.' },
    { title: 'Patience and Precision', body: 'Unlike fast-paced action games, Apple Worm rewards patience. Rushing causes mistakes that cost you progress. Take your time setting up each move. A slow, precisely executed plan is better than a fast, sloppy attempt. The game is about problem-solving, not speed.' },
  ]),

  // === DRIVE MAD ===
  tipsPost(GAMES[8], 'tips-and-tricks', [
    { title: 'Balance Control Fundamentals', body: 'Drive Mad is all about maintaining balance. Your vehicle has a center of gravity that shifts as you accelerate, brake, and tilt. Gentle inputs are better than aggressive ones. Tap rather than hold the acceleration button — short taps give you more control over your speed and balance.' },
    { title: 'Landing After Jumps', body: 'The most common crash in Drive Mad happens on landing. Before you jump, assess the landing surface angle. Tilt your vehicle in mid-air to match the landing slope. Rear wheels should touch first on uphill landings; front wheels first on downhill landings. Perfect landings maintain your momentum.' },
    { title: 'Vehicle Selection Guide', body: 'Different vehicles in Drive Mad have different handling characteristics. Lighter vehicles are easier to balance but have less power for steep climbs. Heavier vehicles have more traction but are harder to control in the air. Start with medium-weight vehicles to learn the balance mechanics.' },
    { title: 'Reading the Terrain', body: 'Each track in Drive Mad has terrain patterns that repeat. Learn the rhythm of each track: where the steep climbs are, where the jumps are, and where flat sections allow speed recovery. Memorizing track layouts is essential for consistent performance.' },
    { title: 'Upgrade Priority', body: 'When you earn coins in Drive Mad, prioritize suspension upgrades first. Better suspension makes landings more forgiving, which is the most common cause of crashes. Engine upgrades are secondary — a well-balanced slow vehicle outperforms an unbalanced fast one.' },
  ]),

  // === MONSTER TRACKS ===
  tipsPost(GAMES[9], 'how-to-play-guide', [
    { title: 'Monster Truck Basics', body: 'Monster Tracks puts you behind the wheel of massive monster trucks. Unlike regular racing games, monster trucks can drive over many obstacles that would stop normal vehicles. Use this to your advantage — take direct lines over small obstacles rather than going around them.' },
    { title: 'Terrain Reading', body: 'Monster Tracks features varied terrain including mud, rock, sand, and pavement. Each surface type affects your traction differently. Mud slows you down but gives stability. Rocks provide grip but risk tipping. Sand is unpredictable. Adjust your driving style based on the surface you are on.' },
    { title: 'Jump and Stunt Mechanics', body: 'Monster trucks can perform jumps and stunts that earn bonus points. Small jumps over ramps are safe and consistent. Large jumps over gaps require precise speed management. Too slow and you fall short; too fast and you overshoot the landing. Learn the speed sweet spot for each jump.' },
    { title: 'Upgrade Path Optimization', body: 'Monster Tracks has a progression system with vehicle upgrades. Focus on tire upgrades first — better tires improve traction on all surfaces. Engine upgrades come second for better acceleration. Weight upgrades are situational — heavier for stability, lighter for jumps.' },
    { title: 'Time Trial Strategies', body: 'Time trials in Monster Tracks require balancing speed with control. The fastest path is not always the most direct one. Sometimes taking a slightly longer route with better traction results in a faster overall time. Experiment with different paths to find the optimal line for each track.' },
  ]),
];
