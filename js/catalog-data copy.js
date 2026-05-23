const POOLS = [
  {
    id: 'survivor',
    sport: 'football',
    title: 'Survivor',
    desc: 'Classic survivor format for regular season.',
    href: 'pools/survivor.html',
    rulesHtml: `<p><strong>⚡️ QUICK RULES — FAST &amp; OFFICIAL ⚡️</strong></p>
<ol style="margin:0 0 0 18px; padding:0">
  <li><strong>Entry:</strong> Activate your spot with 10 PNT.</li>
  <li><strong>Email:</strong> Your signup email is your PNT hub for all transfers and updates.</li>
  <li><strong>Running PNT Total:</strong> Every entry adds 10 PNT to the collective tracker. More teams = bigger total = bigger hype.</li>
  <li><strong>PNT Use:</strong> All PNT movement is strictly for pool scoring, standings, and internal rewards.</li>
  <li><strong>Vibes:</strong> Bring the energy. Bring the chirps. Bring the heat.</li>
</ol>`
  },
  {
    id: 'pick6',
    sport: 'football',
    title: 'Pick 6',
    desc: 'Choose 6 games weekly and compete on total record.',
    href: 'pools/pick6.html',
    rulesHtml: `<p><strong>⚡️ QUICK RULES — FAST &amp; OFFICIAL ⚡️</strong></p>
<ol style="margin:0 0 0 18px; padding:0">
  <li><strong>Entry:</strong> Activate your spot with 10 PNT.</li>
  <li><strong>Email:</strong> Your signup email is your PNT hub for all transfers and updates.</li>
  <li><strong>Running PNT Total:</strong> Every entry adds 10 PNT to the collective tracker. More teams = bigger total = bigger hype.</li>
  <li><strong>PNT Use:</strong> All PNT movement is strictly for pool scoring, standings, and internal rewards.</li>
  <li><strong>Vibes:</strong> Bring the energy. Bring the chirps. Bring the heat.</li>
</ol>`
  },
  {
    id: 'one-and-done',
    sport: 'football',
    title: 'One & Done Survivor (Playoff)',
    desc: 'Pick one team per round—no reuse.',
    href: 'pools/one-and-done.html',
   rulesHtml: `
<h3>⚡️ QUICK RULES — FAST & OFFICIAL ⚡️</h3>

<p><strong>Entry:</strong> Activate your spot with <strong>110 PNTS</strong>.</p>

<p><strong>Email:</strong> Your signup email is your PNTS hub for all transfers and updates.</p>

<p><strong>Running PNT Total:</strong> Every entry adds <strong>100 PNT</strong> to the collective tracker. More teams = bigger total = bigger hype.</p>

<p><strong>PNT Use:</strong> All PNT movement is strictly for pool scoring, standings, and internal rewards.</p>

<p><strong>Vibes:</strong> Bring the energy. Bring the chirps. Bring the heat.</p>

<br>

<h3>🏈 FANTASY ONE-AND-DONE SURVIVOR FORMAT</h3>
<p>In this playoff-style fantasy pool, your goal is to build the highest-scoring lineup across the NFL postseason — but with a twist: once you use a player, you can’t use them again.</p>

<h4>🔧 Weekly Lineup Structure</h4>
<ul>
  <li>1 QB</li>
  <li>2 RBs</li>
  <li>2 WRs</li>
  <li>1 TE</li>
  <li>1 FLEX (RB/WR/TE)</li>
  <li>1 Kicker</li>
  <li>1 Defense/Special Teams</li>
</ul>

<p>Scoring is typically standard PPR or half‑PPR, depending on league settings.</p>

<h4>🚫 One‑and‑Done Rule</h4>
<p>Each NFL player can only be used once during the entire playoffs.</p>
<p><em>Example:</em> If you use Travis Kelce in the Wild Card round, he’s locked out for the rest of the pool.</p>

<h4>🧠 Strategy Tips</h4>
<ul>
  <li><strong>Plan ahead:</strong> Predict which teams will go deep so you don’t burn elite players too early.</li>
  <li><strong>Balance risk:</strong> Avoid stacking players from one team in case they’re eliminated.</li>
  <li><strong>Maximize matchups:</strong> Target favorable playoff matchups each week.</li>
  <li><strong>Track usage:</strong> Keep a record of who you’ve used to avoid lineup errors.</li>
</ul>
`
  },
  {
    id: 'super-bowl',
    sport: 'football',
    title: 'Super Bowl Bracket',
    desc: 'Predict the path to the Super Bowl.',
    href: 'pools/super-bowl.html',
    rulesHtml: `<p><strong>⚡️ QUICK RULES — FAST &amp; OFFICIAL ⚡️</strong></p>
<ol style="margin:0 0 0 18px; padding:0">
  <li><strong>Entry:</strong> Activate your spot with 10 PNT.</li>
  <li><strong>Email:</strong> Your signup email is your PNT hub for all transfers and updates.</li>
  <li><strong>Running PNT Total:</strong> Every entry adds 10 PNT to the collective tracker. More teams = bigger total = bigger hype.</li>
  <li><strong>PNT Use:</strong> All PNT movement is strictly for pool scoring, standings, and internal rewards.</li>
  <li><strong>Vibes:</strong> Bring the energy. Bring the chirps. Bring the heat.</li>
</ol>`
  },
  {
    id: 'playoff-squares',
    sport: 'football',
    title: 'Playoff Squares',
    desc: 'Squares game for playoff matchups.',
    href: 'pools/playoff-squares.html',
    rulesHtml: `<p><strong>⚡️ QUICK RULES — FAST &amp; OFFICIAL ⚡️</strong></p>
<ol style="margin:0 0 0 18px; padding:0">
  <li><strong>Entry:</strong> Activate your spot with 10 PNT.</li>
  <li><strong>Email:</strong> Your signup email is your PNT hub for all transfers and updates.</li>
  <li><strong>Running PNT Total:</strong> Every entry adds 10 PNT to the collective tracker. More teams = bigger total = bigger hype.</li>
  <li><strong>PNT Use:</strong> All PNT movement is strictly for pool scoring, standings, and internal rewards.</li>
  <li><strong>Vibes:</strong> Bring the energy. Bring the chirps. Bring the heat.</li>
</ol>`
  },
  {
    id: 'weekly-pickem',
    sport: 'football',
    title: 'Weekly Pick\'em (All Games)',
    desc: 'Pick every game each week—highest correct wins.',
    href: 'pools/weekly-pickem.html',
    rulesHtml: `<p><strong>⚡️ QUICK RULES — FAST &amp; OFFICIAL ⚡️</strong></p>
<ol style="margin:0 0 0 18px; padding:0">
  <li><strong>Entry:</strong> Activate your spot with 10 PNT.</li>
  <li><strong>Email:</strong> Your signup email is your PNT hub for all transfers and updates.</li>
  <li><strong>Running PNT Total:</strong> Every entry adds 10 PNT to the collective tracker. More teams = bigger total = bigger hype.</li>
  <li><strong>PNT Use:</strong> All PNT movement is strictly for pool scoring, standings, and internal rewards.</li>
  <li><strong>Vibes:</strong> Bring the energy. Bring the chirps. Bring the heat.</li>
</ol>`
  },
  {
    id: 'stanley-cup',
    sport: 'hockey',
    title: 'Stanley Cup Bracket',
    desc: 'NHL playoff bracket challenge.',
    href: 'pools/stanley-cup.html',
    rulesHtml: `<p><strong>⚡️ QUICK RdasfsadfasdULES — FAST &amp; OFFICIAL ⚡️</strong></p>
<ol style="margin:0 0 0 18px; padding:0">
  <li><strong>Entry:</strong> Activate your spot with 10 PNT.</li>
  <li><strong>Email:</strong> Your signup email is your PNT hub for all transfers and updates.</li>
  <li><strong>Running PNT Total:</strong> Every entry adds 10 PNT to the collective tracker. More teams = bigger total = bigger hype.</li>
  <li><strong>PNT Use:</strong> All PNT movement is strictly for pool scoring, standings, and internal rewards.</li>
  <li><strong>Vibes:</strong> Bring the energy. Bring the chirps. Bring the heat.</li>
</ol>`
  },
  {
    id: 'cfp-bracket',
    sport: 'college',
    title: 'College Football Playoff Bracket',
    desc: 'Predict the CFP bracket.',
    href: 'pools/cfp-bracket.html',
    rulesHtml: `<p><strong>🔥 OFFICIAL FANTASY POOL LAUNCH ANNOUNCEMENT — HYPED EDITION 🔥</strong></p>
<p>Welcome to the ultimate fantasy showdown — where bragging rights are earned, legends are made, and the competition stays electric from Day 1 to the final buzzer.</p>

<h4>ENTRY ACTIVATION 🚀</h4>
<p>Secure your spot with 10 PNT to unlock full access to this season’s action. Once your entry is activated, you’re officially in the arena.</p>

<h4>YOUR EMAIL = YOUR PNT COMMAND CENTER 📩</h4>
<p>The email you register with becomes your official PNT destination. Any end‑of‑season PNT boosts, transfers, adjustments, or ranking rewards will be delivered straight to that inbox. Make sure it’s one you check — that’s where your PNT flow goes.</p>

<h4>RUNNING PNT TOTAL ⚡️</h4>
<p>Every activated entry adds 10 PNT to the collective tracker. As teams join, the Running PNT Total climbs — 10 teams = 100 PNT, 12 teams = 120 PNT, and so on. The more entries, the bigger the total, the higher the stakes, and the hotter the competition gets.</p>

<h4>PNT HANDLING 🔥</h4>
<p>All PNT activity is strictly for pool scoring, standings, and internal game rewards. No cash talk, no payouts — just pure PNT energy fueling the season.</p>

<h4>FINAL WORD 🏆</h4>
<p>Strap in. Lock your spot. Watch the Running PNT Total rise. This season is about to get loud.</p>
<p><strong>Game on.</strong></p>`
  },
  {
    id: 'march-madness',
    sport: 'college',
    title: 'March Madness',
    desc: 'NCAA tournament bracket challenge.',
    href: 'pools/march-madness.html',
    rulesHtml: `<p><strong>⚡️ QUICK RULES — FAST &amp; OFFICIAL ⚡️</strong></p>
<ol style="margin:0 0 0 18px; padding:0">
  <li><strong>Entry:</strong> Activate your spot with 10 PNT.</li>
  <li><strong>Email:</strong> Your signup email is your PNT hub for all transfers and updates.</li>
  <li><strong>Running PNT Total:</strong> Every entry adds 10 PNT to the collective tracker. More teams = bigger total = bigger hype.</li>
  <li><strong>PNT Use:</strong> All PNT movement is strictly for pool scoring, standings, and internal rewards.</li>
  <li><strong>Vibes:</strong> Bring the energy. Bring the chirps. Bring the heat.</li>
</ol>`
  },
];
export default POOLS;
