const { post } = require('./generator');
function rd() { return `2026-0${Math.floor(Math.random()*8)+1}-${String(Math.floor(Math.random()*28)+1).padStart(2,'0')}`; }

const G = [
  { n:'Subway Surfers', s:'subway-surfers', u:'/en/g/subway-surfers', g:'endless runner' },
  { n:'Temple Run 2', s:'temple-run-2', u:'/en/g/temple-run-2', g:'endless runner' },
  { n:'Temple Run 2 Frozen Shadows', s:'temple-run-2-frozen-shadows', u:'/en/g/temple-run-2-frozen-shadows', g:'endless runner' },
  { n:'Temple Run 2 Jungle Fall', s:'temple-run-2-jungle-fall', u:'/en/g/temple-run-2-jungle-fall', g:'endless runner' },
  { n:'Temple Run 2 Holi Festival', s:'temple-run-2-holi-festival', u:'/en/g/temple-run-2-holi-festival', g:'endless runner' },
  { n:'Temple Run 2 Spooky Summit', s:'temple-run-2-spooky-summit', u:'/en/g/temple-run-2-spooky-summit', g:'endless runner' },
  { n:'Murder', s:'murder', u:'/en/g/murder', g:'mystery puzzle' },
  { n:'Apple Worm', s:'apple-worm', u:'/en/g/apple-worm', g:'physics puzzle' },
  { n:'Drive Mad', s:'drive-mad', u:'/en/g/drive-mad', g:'racing stunt' },
  { n:'Monster Tracks', s:'monster-tracks', u:'/en/g/monster-tracks', g:'racing off-road' },
];

const out = [];

// "X for PC" posts
G.forEach(g => {
  out.push(post(`${g.s}-for-pc`, `${g.n} for PC: How to Play on Windows and Mac`, rd(), 'Guides',
    `Play ${g.n} on your PC or laptop. Complete guide for Windows and Mac users with keyboard controls and performance tips.`,
    `<p>${g.n} runs perfectly on PC and laptop browsers. Here is how to get the best experience on Windows and Mac.</p>
<h2>System Requirements</h2>
<p>${g.n} requires only a modern browser. Chrome, Firefox, Edge, and Safari all work. Any PC or Mac from the last 10 years can run this game smoothly.</p>
<h2>Keyboard Controls</h2>
<p>${g.g === 'endless runner' ? 'Use arrow keys. Left/Right to change lanes, Up to jump, Down to slide. You can also use WASD if preferred.' : g.g === 'mystery puzzle' ? 'Use mouse to click and interact. The game is designed for point-and-click play.' : g.g === 'physics puzzle' ? 'Use mouse to drag and position your character. Keyboard shortcuts may also be available.' : g.g === 'racing stunt' || g.g === 'racing off-road' ? 'Arrow keys or WASD for acceleration, braking, and balance control. Keyboard offers precise inputs.' : 'Use keyboard and mouse as supported by the game.'}</p>
<h2>Performance Tips for PC</h2>
<p>Close unnecessary browser tabs. Use Chrome for best WebGL performance. Update your graphics drivers. A wired internet connection reduces latency.</p>
<h2>Play on PC Now</h2>
<p><a href="${g.u}">Play ${g.n} online free on PC</a> — no download, no install, just instant browser gaming.</p>`));
});

// "X for mobile" posts
G.forEach(g => {
  out.push(post(`${g.s}-for-mobile`, `${g.n} for Mobile: Play on Phone and Tablet`, rd(), 'Guides',
    `Play ${g.n} on your phone or tablet. Touch-optimized gameplay with responsive controls for mobile devices.`,
    `<p>${g.n} works great on mobile devices. Here is how to get the best experience on your phone or tablet.</p>
<h2>Touch Controls</h2>
<p>${g.g === 'endless runner' ? 'Swipe left/right to change lanes. Swipe up to jump. Swipe down to slide. Touch controls are responsive and intuitive.' : g.g === 'mystery puzzle' ? 'Tap to interact with objects. The touch interface works naturally for point-and-click gameplay.' : g.g === 'physics puzzle' ? 'Touch and drag to control your character. Physics respond to touch input smoothly.' : g.g === 'racing stunt' || g.g === 'racing off-road' ? 'Touch controls include on-screen buttons or tilt controls depending on the version.' : 'Use touch controls as provided by the game.'}</p>
<h2>Mobile Performance Tips</h2>
<p>Close background apps for better performance. Use Wi-Fi for stable connection. Rotate to landscape for some games. Adjust screen brightness for comfortable play.</p>
<h2>Play on Mobile Now</h2>
<p><a href="${g.u}">Play ${g.n} online free on mobile</a> — works on iPhone, Android, iPad, and any tablet browser.</p>`));
});

// "X best characters/skins/vehicles" posts
const themed = [
  { n:'Subway Surfers', s:'subway-surfers', items: 'characters and hoverboards', topic: 'best characters', extra: 'Each character has unique style and some offer subtle gameplay advantages.' },
  { n:'Temple Run 2', s:'temple-run-2', items: 'characters and power-ups', topic: 'best items', extra: 'Character selection can affect your gameplay experience.' },
  { n:'Drive Mad', s:'drive-mad', items: 'vehicles and upgrades', topic: 'best vehicles', extra: 'Different vehicles handle differently on various track types.' },
  { n:'Monster Tracks', s:'monster-tracks', items: 'monster trucks', topic: 'best trucks', extra: 'Each monster truck has unique stats for different track conditions.' },
];
themed.forEach(t => {
  out.push(post(`${t.s}-${t.topic.toLowerCase().replace(/\s+/g, '-')}`, `${t.n}: ${t.topic.replace(/\b\w/g, c=>c.toUpperCase())} Ranked`, rd(), 'Lists',
    `The ${t.items} in ${t.n} ranked from best to worst. Find the optimal choice for your play style.`,
    `<p>Choosing the right ${t.items} in ${t.n} can make a big difference in your gameplay experience. Here are our top recommendations.</p>
<h2>How to Choose</h2>
<p>${t.extra} Consider your play style when making selections. Aggressive players may prefer different options than defensive players.</p>
<h2>Unlocking Options</h2>
<p>Most ${t.items} in ${t.n} are unlocked through gameplay progression. Complete missions, earn coins, and participate in events to unlock new options. Focus on unlocking items that complement your natural play style.</p>
<h2>Community Favorites</h2>
<p>The ${t.n} community has strong opinions about the best ${t.items}. Join discussions, watch gameplay videos, and experiment with different combinations. What works for others may not work for you.</p>
<h2>Play ${t.n} and Unlock Everything</h2>
<p><a href="${t.u}">Play ${t.n} online free</a> and start building your collection of ${t.items}.</p>`));
});

// Competitive/tournament posts
out.push(post('browser-games-speedrun-guide', 'Browser Game Speedrunning: Complete Beginner Guide', rd(), 'Guides',
  'Learn how to speedrun browser games. Techniques, tools, and communities for competitive browser game speedrunning.',
  `<p>Speedrunning browser games is a growing hobby. Here is how to get started with browser game speedrunning.</p>
<h2>What Is Speedrunning?</h2>
<p>Speedrunning is completing a game or achieving a specific goal in the fastest time possible. Browser games are excellent for speedrunning because they are consistent — no hardware variables to account for.</p>
<h2>Getting Started</h2>
<p>Choose a game you enjoy. Learn the optimal strategies. Practice specific sections repeatedly. Record your attempts and analyze where you lose time.</p>
<h2>Best Games for Speedrunning</h2>
<p><a href="/en/g/subway-surfers">Subway Surfers</a> — Speedrun for score milestones. <a href="/en/g/drive-mad">Drive Mad</a> — Speedrun individual tracks. <a href="/en/g/monster-tracks">Monster Tracks</a> — Speedrun for best completion times.</p>
<h2>Join the Community</h2>
<p>Share your times, compete with others, and improve together. Browser game speedrunning has a welcoming community of players at all skill levels.</p>`));

out.push(post('how-to-get-unlimited-coins-legit', 'How to Get Unlimited Coins in Browser Games: Legitimate Methods', rd(), 'Guides',
  'Earn unlimited coins and currency in browser games without cheating. Legitimate farming methods that work in any game.',
  `<p>Everyone wants more coins in their favorite games. Here are legitimate, non-cheating methods to maximize your coin earnings in any browser game.</p>
<h2>Daily Login Bonuses</h2>
<p>Most games reward daily logins with bonus coins. Log in every day, even if you only play for one run. Weekly login streaks often multiply your rewards.</p>
<h2>Complete All Missions</h2>
<p>Missions and challenges are the fastest way to earn coins. Prioritize missions that offer the highest coin rewards per time invested. Check your mission list before every play session.</p>
<h2>Efficient Coin Collection</h2>
<p>In <a href="/en/g/subway-surfers">Subway Surfers</a> and <a href="/en/g/temple-run-2">Temple Run 2</a>, use coin magnets during high-density sections. Focus on paths with the most coins. Survival is secondary to coin collection when farming.</p>
<h2>Play Consistently</h2>
<p>The most reliable way to accumulate coins is consistent play. Small earnings from each session add up over time. Set a daily play goal and stick to it.</p>`));

out.push(post('browser-games-for-beginners-over-40', 'Browser Games for Adults Over 40: Easy and Fun Online Games', rd(), 'Lists',
  'Browser games perfect for adults over 40. Simple controls, relaxed pace, and no competitive pressure.',
  `<p>Browser games are perfect for adults over 40 who want to enjoy gaming without the pressure of competitive multiplayer or complex controls.</p>
<h2>1. Apple Worm</h2>
<p>Gentle physics puzzles with no time pressure. Play at your own pace. <a href="/en/g/apple-worm">Play Apple Worm</a> for relaxing puzzle fun.</p>
<h2>2. Murder</h2>
<p>Point-and-click mystery that rewards life experience and observation skills. No fast reflexes needed. <a href="/en/g/murder">Play Murder</a> for brain exercise.</p>
<h2>3. Subway Surfers</h2>
<p>Simple swipe controls that anyone can learn. Bright colors and satisfying gameplay. <a href="/en/g/subway-surfers">Play Subway Surfers online</a> at your own speed.</p>
<h2>4. Temple Run 2</h2>
<p>Adventure running with straightforward controls. <a href="/en/g/temple-run-2">Play Temple Run 2 free</a> for exploration and fun.</p>
<h2>Benefits of Gaming for Adults</h2>
<p>Gaming improves cognitive function, hand-eye coordination, and provides stress relief. Browser games are especially accessible because they require no special equipment or technical knowledge.</p>`));

out.push(post('browser-games-for-students', 'Best Browser Games for Students: Study Breaks and Focus', rd(), 'Lists',
  'Browser games that help students take effective study breaks. Quick, refreshing games that reset your focus.',
  `<p>Students need effective study breaks to maintain focus. These browser games provide the perfect mental reset between study sessions.</p>
<h2>1. Subway Surfers</h2>
<p>A 3-minute run resets your focus without consuming your attention. <a href="/en/g/subway-surfers">Play Subway Surfers</a> during study breaks.</p>
<h2>2. Apple Worm</h2>
<p>One puzzle between study sessions. <a href="/en/g/apple-worm">Play Apple Worm</a> for a gentle mental shift.</p>
<h2>3. Temple Run 2</h2>
<p>Quick adventure runs that refresh your mind. <a href="/en/g/temple-run-2">Play Temple Run 2</a> during longer breaks.</p>
<h2>Pomodoro Technique for Students</h2>
<p>Study for 25 minutes, play for 5 minutes. This technique maximizes productivity while ensuring regular breaks. Set a timer for both study and play sessions.</p>
<h2>Bookmark BrowserGamesHQ</h2>
<p><a href="/">Save BrowserGamesHQ</a> as your go-to study break destination. Quick access to games when you need a mental reset.</p>`));

out.push(post('browser-games-for-anxiety-relief', 'Browser Games for Anxiety and Stress Relief: Calm Gaming', rd(), 'Articles',
  'How browser games can help reduce anxiety and stress. Calming games and mindful gaming techniques for relaxation.',
  `<p>Browser games can be an effective tool for managing anxiety and stress when used mindfully. Here are games and techniques that promote calm.</p>
<h2>Best Games for Relaxation</h2>
<p><a href="/en/g/apple-worm">Apple Worm</a> — Gentle physics puzzles with no time pressure. The repetitive, focused gameplay has a meditative quality.</p>
<p><a href="/en/g/subway-surfers">Subway Surfers</a> — The rhythmic running and obstacle dodging can be surprisingly calming. The bright colors and predictable patterns reduce stress.</p>
<h2>Mindful Gaming Techniques</h2>
<p>Focus on your breathing while playing. Notice the sensations of your fingers on the keyboard or screen. Observe your reactions without judgment. Stop if you feel frustrated rather than relaxed.</p>
<h2>When Gaming Helps Anxiety</h2>
<p>Short gaming sessions (<10 minutes) can reduce cortisol levels and provide a mental break from anxious thoughts. The key is mindful engagement rather than compulsive play.</p>`));

out.push(post('browser-games-accessibility-guide', 'Browser Games Accessibility Guide: Gaming for Everyone', rd(), 'Guides',
  'Guide to accessible browser gaming. Features, tips, and games that are playable by people with disabilities.',
  `<p>Browser games can be accessible to players with various disabilities. Here is a guide to accessible browser gaming.</p>
<h2>Visual Accessibility</h2>
<p>Many browser games work with screen readers. <a href="/en/g/murder">Murder</a> has text-based clues that are screen-reader friendly. Increase browser zoom for larger game elements.</p>
<h2>Motor Accessibility</h2>
<p><a href="/en/g/apple-worm">Apple Worm</a> has no time pressure, making it suitable for players with motor challenges. <a href="/en/g/subway-surfers">Subway Surfers</a> can be played with one hand on touchscreens.</p>
<h2>Audio Accessibility</h2>
<p>Most browser games have visual cues that complement audio. Turn on closed captions when available. Increase volume for games that use audio cues.</p>
<h2>Cognitive Accessibility</h2>
<p>Start with games that have gentle learning curves. <a href="/en/g/apple-worm">Apple Worm</a> and <a href="/en/g/temple-run-2">Temple Run 2</a> allow players to learn at their own pace.</p>
<p><a href="/">Browse accessible games on BrowserGamesHQ</a> — gaming should be for everyone.</p>`));

out.push(post('best-f2p-browser-games', 'Best Free-to-Play Browser Games with No Pay-to-Win', rd(), 'Lists',
  'Truly free browser games with no pay-to-win mechanics. Fair gaming where skill determines success.',
  `<p>Not all free games are truly fair. Some reward players who spend money. These browser games have no pay-to-win mechanics — skill is the only path to success.</p>
<h2>1. Subway Surfers</h2>
<p>Every player has the same gameplay. Cosmetics do not affect performance. <a href="/en/g/subway-surfers">Play Subway Surfers</a> for fair competition.</p>
<h2>2. Temple Run 2</h2>
<p>No purchases give gameplay advantages. High scores are determined by skill alone. <a href="/en/g/temple-run-2">Play Temple Run 2 free</a> for fair running.</p>
<h2>3. Drive Mad</h2>
<p>Skill-based physics with no pay-to-win mechanics. <a href="/en/g/drive-mad">Play Drive Mad</a> on a level playing field.</p>
<h2>4. Monster Tracks</h2>
<p>Upgrades are earned through gameplay, not purchases. <a href="/en/g/monster-tracks">Play Monster Tracks</a> for fair progression.</p>
<h2>5. Apple Worm</h2>
<p>Pure puzzle solving with no monetization. <a href="/en/g/apple-worm">Play Apple Worm</a> for pure gameplay.</p>
<p>BrowserGamesHQ only hosts games that are truly free. No hidden costs, no pay-to-win. <a href="/">Browse our entire collection</a> of fair free games.</p>`));

out.push(post('browser-games-for-family-night', 'Browser Games for Family Game Night: Fun for All Ages', rd(), 'Lists',
  'Perfect browser games for family game night. Everyone can play together with no special equipment needed.',
  `<p>Family game night does not require board games or consoles. These browser games work perfectly for family fun.</p>
<h2>1. Subway Surfers Tournament</h2>
<p>Each family member takes a turn on <a href="/en/g/subway-surfers">Subway Surfers</a>. Highest score wins. Simple, fun, competitive.</p>
<h2>2. Temple Run 2 Challenge</h2>
<p>See who can run the farthest in <a href="/en/g/temple-run-2">Temple Run 2</a>. Take turns and cheer each other on.</p>
<h2>3. Murder Mystery Night</h2>
<p>Everyone plays <a href="/en/g/murder">Murder online</a> independently. First to solve the case wins. Discuss your deductions together afterward.</p>
<h2>4. Apple Worm Puzzle Race</h2>
<p>Race to solve <a href="/en/g/apple-worm">Apple Worm</a> levels. First to finish each level gets a point.</p>
<h2>5. Drive Mad Challenge</h2>
<p><a href="/en/g/drive-mad">Play Drive Mad</a> and compare completion times. Best time on each track gets bragging rights.</p>
<p>Browser game night is free, requires no setup, and works on any device with a browser.</p>`));

module.exports = out;
