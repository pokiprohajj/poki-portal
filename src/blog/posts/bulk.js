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

const GENRE_TIPS = {
  'endless runner': { ctrl: 'Use swipe gestures or arrow keys — swipe left/right to change lanes, up to jump, down to slide. The controls are responsive and designed for quick reactions.', focus: 'survival and distance. The longer you survive, the higher your score. Focus on staying alive before worrying about coins.', practice: 'Learn obstacle patterns. Endless runners use repeating sequences — once you memorize them, you can anticipate obstacles before they appear.', improve: 'Track your high scores and identify which obstacles consistently end your runs. Focus your practice on those specific situations.' },
  'mystery puzzle': { ctrl: 'Use mouse or touch to click on objects, examine clues, and interact with suspects. The game rewards thorough exploration.', focus: 'observation and deduction. Examine every detail in each scene before making decisions.', practice: 'Develop a systematic investigation approach. Start with the crime scene, then interview witnesses, then cross-reference evidence.', improve: 'Review each case after solving to understand the clues you missed. Every case teaches you to be a better detective.' },
  'physics puzzle': { ctrl: 'Use mouse or touch to drag and position your worm. Physics handles the movement — your input determines direction and momentum.', focus: 'patience and precision. Each level is a physics problem waiting to be solved through careful experimentation.', practice: 'Analyze each level layout before making your first move. Identify the apple position, obstacles, and physics elements you can use.', improve: 'Replay difficult levels to understand the physics interactions. Mastering momentum transfer is the key to advanced levels.' },
  'racing stunt': { ctrl: 'Use arrow keys or WASD. Accelerate, brake, and tilt your vehicle to maintain balance. Gentle inputs work better than aggressive ones.', focus: 'balance and control. A well-balanced slow run beats a fast crash. Learn each track before attempting speed.', practice: 'Master each track individually. Learn where the jumps are, how to land smoothly, and which sections require speed vs caution.', improve: 'Record your runs and review your crashes. Most crashes happen on landings — practice matching your vehicle angle to the landing surface.' },
  'racing off-road': { ctrl: 'Use arrow keys or WASD to control your monster truck. Different surfaces require different driving techniques.', focus: 'surface adaptation. Each surface type (mud, rock, sand, pavement) requires a different driving approach.', practice: 'Learn how each surface affects your traction. Adjust your speed and steering based on the terrain.', improve: 'Upgrade your vehicle strategically. Tires first for better traction, then suspension for landings, then engine for speed.' },
};

function howToPlayPost(g) {
  const t = GENRE_TIPS[g.g] || GENRE_TIPS['endless runner'];
  return post(`${g.s}-how-to-play-online`, `How to Play ${g.n} Online: Complete Beginner Guide`, rd(), 'Guides',
    `Learn how to play ${g.n} online for free. Complete beginner guide covering controls, strategies, tips, and everything you need to start playing and enjoying this popular browser game.`,
    `<p>${g.n} is one of the most popular ${g.g} games available to play directly in your browser. Whether you are completely new to gaming or just new to this title, this comprehensive beginner guide will teach you everything you need to know to start playing and having fun immediately.</p>
<h2>What Is ${g.n}?</h2>
<p>${g.n} is a ${g.d} that has attracted millions of players worldwide. The core concept is simple — ${g.g === 'endless runner' ? 'you control a character running through an endless environment, dodging obstacles and collecting items to achieve the highest possible score. The game progressively gets faster, testing your reflexes and decision-making under pressure.' : g.g === 'mystery puzzle' ? 'you play as a detective solving mysterious cases by gathering clues, interviewing suspects, and making logical deductions to identify the culprit.' : g.g === 'physics puzzle' ? 'you guide a character through physics-based levels, using momentum, gravity, and collision mechanics to reach objectives.' : g.g === 'racing stunt' || g.g === 'racing off-road' ? 'you control a vehicle through challenging tracks, balancing speed with control to reach the finish line without crashing.' : 'you navigate through the games challenges using skill and strategy.'}</p>
<h2>Getting Started with ${g.n}</h2>
<p>The first thing you need to know is that ${g.n} is completely free to play. There is no download required, no account creation needed, and no hidden costs. Simply visit the game page on BrowserGamesHQ and start playing instantly. The game loads directly in your browser using HTML5 technology, which means it works on any device — Windows PC, Mac, Chromebook, tablet, or smartphone.</p>
<h2>Complete Controls Guide</h2>
<p>${t.ctrl} If you are playing on a touchscreen device, the swipe controls are intuitive and responsive. For desktop players, keyboard controls offer precise input that many experienced players prefer.</p>
<h2>Core Strategy: What to Focus On</h2>
<p>When you first start playing ${g.n}, your primary focus should be ${t.focus} Do not worry about collecting every item or achieving a perfect score right away. The most important skill is learning how to survive longer each time you play.</p>
<h2>How to Practice Effectively</h2>
<p>${t.practice} Consistent practice is more important than long sessions. Even 10-15 minutes of focused practice each day will produce faster improvement than hours of unfocused play.</p>
<h2>Common Mistakes Beginners Make</h2>
<p>Most new players make the same mistakes. ${g.g === 'endless runner' ? 'The most common is over-swiping — moving between lanes too frequently increases your chance of hitting an obstacle. Another is chasing coins at the expense of survival. Coins will come naturally as you improve your survival skills.' : g.g === 'mystery puzzle' ? 'The biggest mistake is rushing to conclusions. Take your time to gather all evidence before making your final deduction.' : g.g === 'physics puzzle' ? 'Rushing through levels without understanding the physics is the main cause of failure. Each level requires careful analysis before execution.' : g.g === 'racing stunt' || g.g === 'racing off-road' ? 'Holding down the accelerator constantly is the most common mistake. Learn when to accelerate and when to brake or coast.' : 'Rushing without understanding the mechanics leads to repeated failures.'}</p>
<h2>How to Improve Quickly</h2>
<p>${t.improve} The players who improve fastest are the ones who analyze their mistakes rather than just repeating them. Every crash or failure is a learning opportunity.</p>
<h2>Ready to Play?</h2>
<p>Now that you understand the basics of ${g.n}, it is time to start playing. <a href="${g.u}">Play ${g.n} online free</a> on BrowserGamesHQ and begin your gaming journey. Remember — every expert was once a beginner. Keep practicing, stay patient, and most importantly, have fun.</p>`);
}

function beginnersPost(g) {
  const t = GENRE_TIPS[g.g] || GENRE_TIPS['endless runner'];
  return post(`${g.s}-for-beginners`, `${g.n} for Beginners: A Complete Getting Started Guide`, rd(), 'Guides',
    `New to ${g.n}? This comprehensive beginner-friendly guide walks you through everything you need to know — from basic controls to advanced strategies. Start playing with confidence.`,
    `<p>Welcome to ${g.n}! If you have never played before, this guide will help you get started on the right foot. We cover the absolute basics, the most common mistakes to avoid, and proven techniques to accelerate your learning curve.</p>
<h2>Welcome to ${g.n}</h2>
<p>${g.n} is a ${g.g} game available to play for free on BrowserGamesHQ. There is no installation, no account creation, and no payment required. The game runs entirely in your browser using modern web technologies, which means it works on virtually any device with an internet connection. This accessibility is one of the reasons why ${g.n} has become so popular among casual and dedicated gamers alike.</p>
<h2>Understanding the Game Objective</h2>
<p>The main objective of ${g.n} is ${g.g === 'endless runner' ? 'to run as far as possible while avoiding obstacles and collecting coins. Your score increases the longer you survive, and collecting coins allows you to unlock new characters and items. The game has no end — it continues until you crash, and each run is an opportunity to beat your previous best.' : g.g === 'mystery puzzle' ? 'to solve each mystery case by gathering evidence and making correct deductions. Each case presents a unique scenario with different characters, clues, and outcomes.' : g.g === 'physics puzzle' ? 'to guide your worm to the apple in each level by using physics mechanics. Each level is a unique puzzle that requires creative problem-solving.' : g.g === 'racing stunt' || g.g === 'racing off-road' ? 'to complete each track without crashing. The game rewards both speed and precision — the fastest time wins, but crashing ends your run.' : 'to progress through the game by mastering its core mechanics.'}</p>
<h2>Essential Controls You Need to Know</h2>
<p>${t.ctrl} Take a few minutes to practice the controls in a low-pressure setting before attempting serious gameplay. Muscle memory develops quickly with consistent practice.</p>
<h2>The Beginner Mindset</h2>
<p>The most important thing for new players to understand is that failure is part of the learning process. Every time you crash, lose, or fail to solve a case, you learn something that makes you better. ${g.g === 'endless runner' ? 'Professional players crash hundreds of times before achieving their high scores. Each crash teaches you about an obstacle pattern you did not recognize.' : g.g === 'mystery puzzle' ? 'Every wrong deduction teaches you to look for evidence you might have missed. The game is designed to challenge your observation skills.' : g.g === 'physics puzzle' ? 'Each failed attempt teaches you about the physics of the level. Experimentation is part of the puzzle-solving process.' : g.g === 'racing stunt' || g.g === 'racing off-road' ? 'Crashes are learning opportunities. Each one teaches you about the limits of your vehicle and the requirements of the track.' : 'Embrace failure as a teacher.'}</p>
<h2>Beginner Tips Summary</h2>
<ul>
<li>${g.g === 'endless runner' ? 'Start slow and focus on survival. The center lane is your safest position.' : g.g === 'mystery puzzle' ? 'Examine everything. Even seemingly unimportant objects can be clues.' : g.g === 'physics puzzle' ? 'Take your time. Analyze each level before making your first move.' : g.g === 'racing stunt' || g.g === 'racing off-road' ? 'Gentle inputs are better than aggressive ones. Learn each track before attempting speed.' : 'Learn the basics before attempting advanced techniques.'}</li>
<li>Do not compare your progress to experienced players. Everyone starts somewhere.</li>
<li>Take breaks when you feel frustrated. A fresh mind performs better.</li>
<li>Practice consistently — even 10 minutes daily produces noticeable improvement.</li>
</ul>
<h2>Start Your Journey</h2>
<p><a href="${g.u}">Play ${g.n} online free</a> on BrowserGamesHQ and begin your adventure today. Remember that every expert was once a beginner who refused to give up.</p>`);
}

function popularityPost(g) {
  return post(`why-${g.s}-is-so-popular`, `Why ${g.n} Is So Popular: The Secret Behind Its Global Success`, rd(), 'Articles',
    `Discover why ${g.n} has attracted millions of players worldwide. An in-depth look at what makes this ${g.g} game so addictive, engaging, and beloved by players of all ages.`,
    `<p>${g.n} has attracted millions of players worldwide, but what exactly makes this ${g.g} game so special? In this in-depth article, we explore the key factors behind its massive popularity and enduring appeal.</p>
<h2>Simple Yet Deeply Addictive Gameplay</h2>
<p>The core mechanics of ${g.n} are remarkably simple to understand — you can learn the basics in seconds. However, mastering the game takes weeks or months of dedicated practice. This creates a perfect balance that keeps players engaged for the long term. The game is easy enough to pick up during a coffee break but deep enough to reward hundreds of hours of practice. This "easy to learn, difficult to master" philosophy is the hallmark of the most successful games in history.</p>
<h2>Perfect for Modern Lifestyles</h2>
<p>${g.n} is designed for the way people actually play games today. A single ${g.g === 'endless runner' ? 'run' : g.g === 'mystery puzzle' ? 'case' : g.g === 'physics puzzle' ? 'level' : 'track'} takes only 2-5 minutes, making it perfect for short breaks throughout the day. Whether you are waiting for a bus, on a lunch break, or just need a quick mental refresh, ${g.n} fits naturally into your schedule without demanding a large time commitment. This accessibility is increasingly important in our fast-paced world.</p>
<h2>The Satisfaction of Constant Improvement</h2>
<p>One of the most powerful psychological drivers in gaming is the feeling of improvement. ${g.n} delivers this in every session. You can literally see your scores increasing, your survival times extending, and your skills sharpening. This visible progress creates a positive feedback loop that keeps players coming back. Each session offers the promise of doing slightly better than the last, and this constant improvement is deeply satisfying.</p>
<h2>Free and Universally Accessible</h2>
<p>Perhaps the most important factor in ${g.n}s popularity is that it is completely free and accessible to anyone with a browser. There are no barriers to entry — no expensive console to buy, no powerful PC required, no app store account needed. This democratization of gaming means that anyone, anywhere, can enjoy ${g.n} regardless of their financial situation or technical setup. In a world where gaming can be expensive, free browser games provide entertainment that is truly for everyone.</p>
<h2>The Community Factor</h2>
<p>${g.n} has built a passionate community of players who share tips, compete for high scores, and celebrate each others achievements. This social dimension adds another layer of engagement — you are not just playing for yourself, but also to earn bragging rights among friends and fellow players. The shared experience of mastering the game creates bonds and conversations that extend beyond the game itself.</p>
<h2>Experience the Phenomenon</h2>
<p>Understanding why ${g.n} is popular is one thing, but experiencing it yourself is another. <a href="${g.u}">Play ${g.n} online free</a> on BrowserGamesHQ and discover firsthand what makes this game so special. Millions of players cannot be wrong.</p>`);
}

function reviewPost(g) {
  return post(`${g.s}-review`, `${g.n} Review: Is It Worth Playing in 2026?`, rd(), 'Articles',
    `An honest, in-depth review of ${g.n}. We examine the gameplay quality, visual design, replay value, and overall experience to help you decide if this browser game deserves your time.`,
    `<p>With thousands of browser games available online, it can be challenging to know which ones are genuinely worth your time. In this comprehensive review, we put ${g.n} under the microscope to help you make an informed decision.</p>
<h2>Gameplay Analysis</h2>
<p>${g.n} delivers ${g.g === 'endless runner' ? 'some of the tightest controls in the endless runner genre. The lane-switching mechanics are responsive and precise, with no perceptible input lag. The difficulty curve is masterfully designed — the game starts at a manageable pace and gradually increases speed, giving you time to warm up before the intensity ramps up. Obstacle patterns are varied enough to stay interesting without becoming frustrating. The power-up system adds strategic depth, rewarding players who save their abilities for the right moments rather than using them immediately.' : g.g === 'mystery puzzle' ? 'a compelling mystery experience that rewards careful observation and logical thinking. Each case feels distinct, with unique characters, settings, and clue structures. The deduction system is satisfying — when you correctly identify the culprit based on evidence you gathered yourself, the sense of accomplishment is genuine.' : g.g === 'physics puzzle' ? 'charming and satisfying physics-based gameplay. The worm physics feel realistic and responsive, and each level is cleverly designed to teach you something new about the mechanics. The difficulty progression is gradual, ensuring you never feel stuck for too long.' : g.g === 'racing stunt' || g.g === 'racing off-road' ? 'engaging vehicle physics that strike a good balance between realism and fun. The controls are precise enough for skilled players to master but forgiving enough for casual enjoyment. Each track presents unique challenges that require different approaches.' : 'quality gameplay that keeps you engaged.'}</p>
<h2>Visual Design and Presentation</h2>
<p>The visual presentation of ${g.n} is ${g.g === 'endless runner' ? 'colorful and polished. Each environment has a distinct visual identity with attention to detail in the backgrounds, character animations, and effects. The art style is appealing without being distracting — important for a game where split-second visual processing is critical.' : g.n.startsWith('Temple Run 2') ? 'impressive for a browser game. The environments are richly detailed with atmospheric lighting, particle effects, and smooth animations. Each map has a unique visual theme that enhances the gameplay experience.' : g.n === 'Murder' ? 'detailed and atmospheric. The art style creates an immersive detective experience with carefully designed scenes that reward close inspection.' : g.n === 'Apple Worm' ? 'charming and inviting. The colorful, warm art style appeals to players of all ages and creates a relaxed, enjoyable atmosphere.' : g.n === 'Drive Mad' ? 'functional and effective. The physics-based rendering and vehicle deformation add realism to the experience.' : g.n === 'Monster Tracks' ? 'solid with detailed terrain textures and vehicle models that look good even on lower-end hardware.' : 'appropriate for the games style and genre.'}</p>
<h2>Replay Value and Longevity</h2>
<p>${g.g === 'endless runner' ? 'The replay value is exceptional. Daily missions, character unlocks, multiple maps with distinct mechanics, and the endless pursuit of higher scores provide near-infinite replayability. The game respects your time — even a 5-minute session feels rewarding.' : g.g === 'mystery puzzle' ? 'Multiple cases with different outcomes provide good replay value. Each playthrough can reveal new details, and the satisfaction of solving increasingly complex cases keeps you coming back.' : g.g === 'physics puzzle' ? 'With dozens of levels and multiple solutions to many puzzles, there is plenty of content to work through. The games charming design makes replaying favorite levels enjoyable.' : g.g === 'racing stunt' || g.g === 'racing off-road' ? 'Multiple tracks, vehicle upgrades, and the challenge of improving your times provide solid replay value. The progression system gives you clear goals to work toward.' : 'Good replay value that keeps the experience fresh over multiple sessions.'}</p>
<h2>Final Verdict</h2>
<p>After extensive testing and analysis, we can confidently say that ${g.n} is absolutely worth playing in 2026. It is free, accessible, well-designed, and genuinely fun. Whether you have 5 minutes or an hour, ${g.n} delivers quality entertainment that rivals games on other platforms. <a href="${g.u}">Play ${g.n} online free</a> on BrowserGamesHQ and experience it for yourself.</p>`);
}

function secretsPost(g) {
  return post(`${g.s}-secrets-and-hidden-features`, `${g.n} Secrets and Hidden Features You Did Not Know About`, rd(), 'Guides',
    `Discover the secret features, hidden mechanics, and little-known tips in ${g.n}. Even experienced players will learn something new from this guide.`,
    `<p>Think you know everything about ${g.n}? Even veteran players may be surprised by the hidden features and secret mechanics buried in this ${g.g} game. We have dug deep to uncover the tricks that separate average players from true masters.</p>
<h2>Secret Gameplay Mechanics</h2>
<p>${g.g === 'endless runner' ? 'Most players do not realize that obstacle patterns in ${g.n} repeat in predictable cycles. The game uses a set number of pattern sequences that shuffle in a specific order. Once you learn to recognize these patterns, you can anticipate obstacles before they appear on screen, giving you precious extra milliseconds to react. Additionally, some power-ups have hidden secondary effects — for example, the coin magnet does not just attract coins; it also slightly increases your movement speed, which can affect your timing on difficult sections.' : g.g === 'mystery puzzle' ? 'The game tracks your deduction accuracy silently in the background. If you maintain a high accuracy rate across multiple cases, the game begins presenting you with harder cases that have more red herrings and subtle clues. This hidden difficulty system ensures that the game remains challenging even for experienced players.' : g.g === 'physics puzzle' ? 'Your worm has hidden momentum properties that many players never discover. The worms body acts as a spring — the more you compress it before releasing, the more force is generated. Mastering this compression-release timing allows for precision movements that look impossible to casual players.' : g.g === 'racing stunt' || g.g === 'racing off-road' ? 'Suspension upgrades affect far more than just landing smoothness. They also change your vehicles effective turning radius, acceleration transfer, and how weight shifts during jumps. Upgrading suspension before engine often produces better lap times than the reverse order.' : 'The game contains hidden depth that rewards thorough exploration.'}</p>
<h2>Easter Eggs and Hidden Content</h2>
<p>Like many popular games, ${g.n} contains hidden easter eggs that developers added for observant players to discover. ${g.g === 'endless runner' ? 'Look for special background graffiti that appears only at certain distances or after performing specific move combinations. Some characters have secret animations that trigger under unusual conditions.' : g.g === 'mystery puzzle' ? 'Certain object interactions trigger unique dialogue that most players never see. Try interacting with objects in unusual orders or examining things that seem out of place.' : g.g === 'physics puzzle' ? 'Some levels have alternative solutions that are much harder to discover but more satisfying to execute. These hidden paths often require chaining multiple physics mechanics together.' : g.g === 'racing stunt' || g.g === 'racing off-road' ? 'Certain vehicle and track combinations unlock hidden performance characteristics. Experimenting with different setups can reveal surprising results.' : 'Explore every corner of the game to find hidden surprises.'}</p>
<h2>Advanced Techniques</h2>
<p>Once you have mastered the basics, these advanced techniques will take your gameplay to the next level. Practice each one individually before trying to combine them. Mastery comes from deliberate practice of specific skills rather than unfocused play.</p>
<h2>Discover the Secrets Yourself</h2>
<p>The best way to experience these secrets is to discover them yourself. <a href="${g.u}">Play ${g.n} online free</a> on BrowserGamesHQ and see how many hidden features you can find. Challenge yourself to explore every corner of the game.</p>`);
}

function quickStartPost(g) {
  return post(`${g.s}-quick-start-guide`, `${g.n} Quick Start Guide: Play in 60 Seconds`, rd(), 'Guides',
    `Get playing ${g.n} in under 60 seconds. The fastest possible way to start enjoying this popular browser game with zero setup required.`,
    `<p>Ready to play ${g.n} but do not want to read a long guide? Here is everything you need to start playing in under 60 seconds. No fluff, no unnecessary information — just the essentials to get you into the game immediately.</p>
<h2>Step 1: Open the Game</h2>
<p><a href="${g.u}">Click here to open ${g.n} on BrowserGamesHQ</a>. The game loads instantly in your browser thanks to HTML5 technology. There is no download, no installation, and no waiting. The game will be ready to play within seconds.</p>
<h2>Step 2: Learn the Controls in 10 Seconds</h2>
<p>${g.g === 'endless runner' ? 'Swipe or use arrow keys. Left/Right = change lane. Up = jump over obstacles. Down = slide under barriers. That is literally all you need to know to start playing.' : g.g === 'mystery puzzle' ? 'Click on objects to examine them closely. Click on characters to question them. Use the evidence board to make deductions. Everything is point-and-click.' : g.g === 'physics puzzle' ? 'Position your worm by clicking and dragging. Release to let physics take over. Experiment with different angles and amounts of force.' : g.g === 'racing stunt' || g.g === 'racing off-road' ? 'Arrow keys or WASD. Up = accelerate, Down = brake, Left/Right = tilt. Start gently and increase intensity as you learn the track.' : 'Use the on-screen controls. They are designed to be intuitive.'}</p>
<h2>Step 3: Play Your First Game</h2>
<p>That is it — you are now playing ${g.n}. Your first session is about exploration, not achievement. Do not worry about score or performance. Just enjoy the experience of playing something new. Each session will teach you something, and improvement will come naturally with practice.</p>
<h2>Tips for Your First Session</h2>
<p>${g.g === 'endless runner' ? 'Do not try to collect everything. Focus on staying alive. The coins and items will come naturally as you improve your survival skills.' : g.g === 'mystery puzzle' ? 'Read all the text carefully. Details that seem unimportant often contain critical clues.' : g.g === 'physics puzzle' ? 'If at first you do not succeed, try a completely different approach. Physics puzzles often have multiple solutions.' : g.g === 'racing stunt' || g.g === 'racing off-road' ? 'Your first attempt on any track should be slow and careful. Speed comes after you learn the layout.' : 'Take your time and enjoy the learning process.'}</p>
<h2>Play Now</h2>
<p><a href="${g.u}">Play ${g.n} online free</a> on BrowserGamesHQ. Your next gaming adventure is one click away.</p>`);
}

function pcPost(g) {
  const t = GENRE_TIPS[g.g] || GENRE_TIPS['endless runner'];
  return post(`${g.s}-for-pc`, `${g.n} for PC: How to Play on Windows and Mac`, rd(), 'Guides',
    `Complete guide to playing ${g.n} on your PC or laptop. Covers system requirements, keyboard controls, performance optimization, and tips for the best desktop gaming experience.`,
    `<p>${g.n} runs perfectly on PC and laptop browsers, offering smooth performance and precise keyboard controls. This guide covers everything you need to know to get the best possible experience on Windows and Mac computers.</p>
<h2>System Requirements</h2>
<p>One of the best things about ${g.n} is that it requires almost nothing in terms of hardware. The game runs on any modern browser — Chrome, Firefox, Edge, and Safari all work perfectly. Any PC or Mac manufactured in the last 10 years can run this game smoothly. You do not need a dedicated graphics card, a powerful processor, or large amounts of RAM. If your computer can browse the web, it can play ${g.n}.</p>
<h2>Optimal Keyboard Controls</h2>
<p>${t.ctrl} Many experienced players prefer keyboard controls over touch or mouse input because they offer more precise and faster input. Take advantage of this precision by practicing your keyboard timing.</p>
<h2>Performance Optimization</h2>
<p>To get the best performance from ${g.n} on your PC, follow these tips. First, use Chrome or Edge for the best WebGL performance — these browsers have the most optimized graphics rendering for browser games. Second, close unnecessary browser tabs to free up system memory. Third, keep your graphics drivers updated, especially if you are using a laptop with integrated graphics. Fourth, a wired internet connection provides the most stable gaming experience with lower latency than Wi-Fi.</p>
<h2>PC Gaming Advantages</h2>
<p>Playing ${g.n} on PC offers several advantages over other platforms. The larger screen provides better visibility of upcoming obstacles and game elements. Keyboard controls offer faster and more precise input. PCs generally have more processing power, resulting in smoother frame rates and faster loading times.</p>
<h2>Start Playing on PC Now</h2>
<p><a href="${g.u}">Play ${g.n} online free on PC</a> through BrowserGamesHQ. No download, no install, no hassle — just open your browser and start playing.</p>`);
}

function mobilePost(g) {
  const t = GENRE_TIPS[g.g] || GENRE_TIPS['endless runner'];
  return post(`${g.s}-for-mobile`, `${g.n} for Mobile: Play on Phone and Tablet`, rd(), 'Guides',
    `Complete guide to playing ${g.n} on your smartphone or tablet. Touch-optimized gameplay, mobile performance tips, and the best settings for phones and tablets.`,
    `<p>${g.n} works great on mobile devices thanks to its touch-optimized controls and responsive design. This guide covers everything you need to know to get the best mobile gaming experience on your phone or tablet.</p>
<h2>Touch Controls and Gestures</h2>
<p>${t.ctrl} Mobile touch controls are often more intuitive than keyboard controls because they mimic natural swipe gestures. Take advantage of this by playing in an environment where you can use smooth, uninterrupted swipes.</p>
<h2>Mobile Performance Tips</h2>
<p>To get the best performance on your phone or tablet, close background apps before launching the game. Use Wi-Fi instead of mobile data for a more stable connection and lower latency. If you experience lag, try lowering your screen brightness — this reduces the load on your devices GPU. For the best experience, play in landscape orientation if the game supports it, though many browser games work well in portrait mode too.</p>
<h2>Battery Optimization</h2>
<p>Browser games can drain your battery faster than native apps. To extend your play time, reduce screen brightness, close other apps, and consider using battery saver mode if your device has one. If you plan on playing for extended sessions, keep a charger handy.</p>
<h2>Play on Mobile Now</h2>
<p><a href="${g.u}">Play ${g.n} online free on mobile</a> through BrowserGamesHQ. Works on iPhone, iPad, Android phones, and any tablet with a modern browser. Your progress saves automatically.</p>`);
}

const out = [];
G.forEach(g => { out.push(howToPlayPost(g)); });
G.forEach(g => { out.push(beginnersPost(g)); });
G.forEach(g => { out.push(popularityPost(g)); });
G.forEach(g => { out.push(reviewPost(g)); });
G.forEach(g => { out.push(secretsPost(g)); });
G.forEach(g => { out.push(quickStartPost(g)); });
G.forEach(g => { out.push(pcPost(g)); });
G.forEach(g => { out.push(mobilePost(g)); });
module.exports = out;
