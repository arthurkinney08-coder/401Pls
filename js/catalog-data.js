const POOLS = [
  {
    id: 'one-and-done',
    sport: 'football',
    title: 'One & Done Survivor (Playoff)',
    desc: 'Pick one player per round—no reuse. Build the highest scoring playoff lineup.',
    href: 'pools/one-and-done.html',
    rulesHtml: `
      <h3>⚡️ QUICK RULES — FAST & OFFICIAL ⚡️</h3>
      <p><strong>Entry:</strong> Activate your spot with <strong>110 PNTS</strong>.</p>
      <p><strong>Email:</strong> Your signup email is your PNTS hub for all transfers and updates.</p>
      <p><strong>Running PNT Total:</strong> Every entry adds 100 PNT to the collective tracker. More teams = bigger total = bigger hype.</p>
      <p><strong>PNT Use:</strong> All PNT movement is strictly for pool scoring, standings, and internal rewards.</p>
      <p><strong>Vibes:</strong> Bring the energy. Bring the chirps. Bring the heat.</p>
      <hr style="border-color:#2a2d33;margin:12px 0"/>
      <h3>🏈 FANTASY ONE-AND-DONE SURVIVOR FORMAT</h3>
      <p>In this playoff-style fantasy pool, your goal is to build the highest-scoring lineup across the NFL postseason — but with a twist: once you use a player, you can't use them again.</p>
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
      <p>Scoring is half-PPR unless league settings say otherwise.</p>
      <h4>🚫 One‑and‑Done Rule</h4>
      <p>Each NFL player can only be used <strong>once</strong> during the entire playoffs.</p>
      <p><em>Example:</em> If you use Travis Kelce in the Wild Card round, he's locked out for the rest of the pool.</p>
      <h4>🧠 Strategy Tips</h4>
      <ul>
        <li><strong>Plan ahead:</strong> Predict which teams will go deep so you don't burn elite players too early.</li>
        <li><strong>Balance risk:</strong> Avoid stacking players from one team in case they're eliminated.</li>
        <li><strong>Maximize matchups:</strong> Target favorable playoff matchups each week.</li>
        <li><strong>Track usage:</strong> Keep a record of who you've used to avoid lineup errors.</li>
      </ul>
    `
  },
  {
    id: 'survivor',
    sport: 'football',
    title: 'Survivor',
    desc: 'Pick one team per week. One loss and you\'re out. Last one standing wins.',
    href: 'pools/survivor.html',
    rulesHtml: `
      <h3>⚡️ QUICK RULES — FAST & OFFICIAL ⚡️</h3>
      <p><strong>Entry:</strong> Activate your spot with <strong>110 PNTS</strong>.</p>
      <p><strong>Email:</strong> Your signup email is your PNTS hub for all transfers and updates.</p>
      <p><strong>Running PNT Total:</strong> Every entry adds 100 PNT to the collective tracker. More entries = bigger total = bigger hype.</p>
      <p><strong>PNT Use:</strong> All PNT movement is strictly for pool scoring, standings, and internal rewards.</p>
      <p><strong>Vibes:</strong> Stay alive. Avoid upsets. Survive every week.</p>
      <hr style="border-color:#2a2d33;margin:12px 0"/>
      <h3>🏈 SURVIVOR FORMAT</h3>
      <ul>
        <li>Pick <strong>one team</strong> each week to win.</li>
        <li>You can only use each team <strong>once</strong> all season.</li>
        <li>Lose once — <strong>you're out.</strong></li>
        <li>Last entry standing <strong>wins.</strong></li>
      </ul>
    `
  },
  {
    id: 'pick6',
    sport: 'football',
    title: 'Pick 6',
    desc: 'Choose 6 games weekly and compete on total record.',
    href: 'pools/pick6.html',
    rulesHtml: `
      <h3>⚡️ QUICK RULES — FAST & OFFICIAL ⚡️</h3>
      <p><strong>Entry:</strong> Activate your spot with <strong>110 PNTS</strong>.</p>
      <p><strong>Email:</strong> Your signup email is your PNTS hub for all transfers and updates.</p>
      <p><strong>Running PNT Total:</strong> Every entry adds 100 PNT to the collective tracker. More entries = bigger total = bigger hype.</p>
      <p><strong>PNT Use:</strong> All PNT movement is strictly for pool scoring and standings.</p>
      <p><strong>Vibes:</strong> Lock your picks. Beat the board. Stack wins.</p>
      <hr style="border-color:#2a2d33;margin:12px 0"/>
      <h3>🏈 PICK 6 FORMAT</h3>
      <ul>
        <li>Each week, select <strong>6 games</strong>.</li>
        <li><strong>Best overall record</strong> wins the week.</li>
        <li>Tiebreakers determined by total points or pick accuracy.</li>
      </ul>
    `
  },
  {
    id: 'super-bowl',
    sport: 'football',
    title: 'Super Bowl Bracket',
    desc: 'Predict the path to the Super Bowl. Every round counts.',
    href: 'pools/super-bowl.html',
    rulesHtml: `
      <h3>⚡️ QUICK RULES — FAST & OFFICIAL ⚡️</h3>
      <p><strong>Entry:</strong> Activate your spot with <strong>110 PNTS</strong>.</p>
      <p><strong>Email:</strong> Your signup email is your PNTS hub for all transfers and updates.</p>
      <p><strong>Running PNT Total:</strong> Every entry adds to the collective hype pool.</p>
      <p><strong>PNT Use:</strong> Used only for scoring and standings.</p>
      <p><strong>Vibes:</strong> One shot. One run. Get everything right when it matters most.</p>
      <hr style="border-color:#2a2d33;margin:12px 0"/>
      <h3>🏈 SUPER BOWL BRACKET FORMAT</h3>
      <ul>
        <li>Pick winners through <strong>each playoff round</strong> leading to the Super Bowl.</li>
        <li>Points <strong>increase each round</strong> — biggest decisions come late.</li>
        <li>Most points at the end wins.</li>
      </ul>
    `
  },
  {
    id: 'playoff-squares',
    sport: 'football',
    title: 'Playoff Squares',
    desc: 'Squares game for playoff matchups. Pure chaos. Every score matters.',
    href: 'pools/playoff-squares.html',
    rulesHtml: `
      <h3>⚡️ QUICK RULES — FAST & OFFICIAL ⚡️</h3>
      <p><strong>Entry:</strong> Activate your spot with <strong>25 PNTS</strong>.</p>
      <p><strong>Email:</strong> Your signup email is your PNTS hub for all transfers and updates.</p>
      <p><strong>Running PNT Total:</strong> Every entry adds to the tracker — more squares, more action.</p>
      <p><strong>PNT Use:</strong> All PNT movement is strictly for pool scoring and standings.</p>
      <p><strong>Vibes:</strong> Pure chance. Pure chaos. Every score matters.</p>
      <hr style="border-color:#2a2d33;margin:12px 0"/>
      <h3>🎯 PLAYOFF SQUARES FORMAT</h3>
      <ul>
        <li>Each participant is <strong>assigned squares</strong> on the grid.</li>
        <li>Scores determined by the <strong>last digits</strong> of each team's score at the end of each quarter.</li>
        <li>Winning squares are paid <strong>per quarter</strong> and/or final score.</li>
      </ul>
    `
  },
  {
    id: 'weekly-pickem',
    sport: 'football',
    title: 'Weekly Pick\'em (All Games)',
    desc: 'Pick every game each week — highest correct wins.',
    href: 'pools/weekly-pickem.html',
    rulesHtml: `
      <h3>⚡️ QUICK RULES — FAST & OFFICIAL ⚡️</h3>
      <p><strong>Entry:</strong> Activate your spot with <strong>110 PNTS</strong>.</p>
      <p><strong>Email:</strong> Your signup email is your PNTS hub for all transfers and updates.</p>
      <p><strong>Running PNT Total:</strong> Every entry builds the total and the competition.</p>
      <p><strong>PNT Use:</strong> Used for scoring and rankings only.</p>
      <p><strong>Vibes:</strong> Every game matters. Consistency wins.</p>
      <hr style="border-color:#2a2d33;margin:12px 0"/>
      <h3>🏈 WEEKLY PICK'EM FORMAT</h3>
      <ul>
        <li>Pick the winner of <strong>every game</strong> each week.</li>
        <li><strong>Most correct picks</strong> wins the week.</li>
        <li>Tiebreakers may use total points or game predictions.</li>
      </ul>
    `
  },
  {
    id: 'stanley-cup',
    sport: 'hockey',
    title: 'Stanley Cup Bracket',
    desc: 'NHL playoff bracket challenge. Ride the hot goalie. Trust the grind.',
    href: 'pools/stanley-cup.html',
    rulesHtml: `
      <h3>⚡️ QUICK RULES — FAST & OFFICIAL ⚡️</h3>
      <p><strong>Entry:</strong> Activate your spot with <strong>110 PNTS</strong>.</p>
      <p><strong>Email:</strong> Your signup email is your PNTS hub for all transfers and updates.</p>
      <p><strong>Running PNT Total:</strong> Every entry boosts the tracker and overall pool energy.</p>
      <p><strong>PNT Use:</strong> Strictly for standings and internal rewards.</p>
      <p><strong>Vibes:</strong> Ride the hot goalie. Trust the grind. Playoff hockey hits different.</p>
      <hr style="border-color:#2a2d33;margin:12px 0"/>
      <h3>🏒 STANLEY CUP FORMAT</h3>
      <ul>
        <li>Fill out your <strong>full playoff bracket</strong> before the postseason begins.</li>
        <li>Points accumulate for each <strong>correct series winner</strong> and round advancement.</li>
        <li>Most points at the end of the playoffs wins.</li>
      </ul>
    `
  },
  {
    id: 'cfp-bracket',
    sport: 'college',
    title: 'College Football Playoff Bracket',
    desc: 'Predict the CFP bracket. Call your shots. Track the chaos.',
    href: 'pools/cfp-bracket.html',
    rulesHtml: `
      <h3>⚡️ QUICK RULES — FAST & OFFICIAL ⚡️</h3>
      <p><strong>Entry:</strong> Activate your spot with <strong>110 PNTS</strong>.</p>
      <p><strong>Email:</strong> Your signup email is your PNTS hub for all transfers and updates.</p>
      <p><strong>Running PNT Total:</strong> Every entry adds 100 PNT to the collective tracker. More entries = bigger total = bigger hype.</p>
      <p><strong>PNT Use:</strong> All PNT movement is strictly for pool scoring, standings, and internal rewards.</p>
      <p><strong>Vibes:</strong> Call your shots. Track the chaos. Ride the bracket.</p>
      <hr style="border-color:#2a2d33;margin:12px 0"/>
      <h3>🏈 CFP BRACKET FORMAT</h3>
      <ul>
        <li>Predict the <strong>full CFP bracket</strong> before the tournament begins.</li>
        <li>Points awarded for each <strong>correct pick</strong> per round.</li>
        <li>Higher rounds = more points. Nail the champion = big payoff.</li>
      </ul>
    `
  },
  {
    id: 'march-madness',
    sport: 'college',
    title: 'March Madness',
    desc: 'NCAA tournament bracket challenge. Upsets happen. Brackets bust.',
    href: 'pools/march-madness.html',
    rulesHtml: `
      <h3>⚡️ QUICK RULES — FAST & OFFICIAL ⚡️</h3>
      <p><strong>Entry:</strong> Activate your spot with <strong>110 PNTS</strong>.</p>
      <p><strong>Email:</strong> Your signup email is your PNTS hub for all transfers and updates.</p>
      <p><strong>Running PNT Total:</strong> Every entry adds 100 PNT to the collective tracker. More entries = bigger total = bigger hype.</p>
      <p><strong>PNT Use:</strong> All PNT movement is strictly for pool scoring, standings, and internal rewards.</p>
      <p><strong>Vibes:</strong> Upsets happen. Brackets bust. Stay alive as long as you can.</p>
      <hr style="border-color:#2a2d33;margin:12px 0"/>
      <h3>🏀 MARCH MADNESS FORMAT</h3>
      <ul>
        <li>Fill out your <strong>full 68-team bracket</strong> before the tournament starts.</li>
        <li>Points awarded for each <strong>correct winner</strong> per round.</li>
        <li>Later rounds worth more — survive the chaos and cash in.</li>
      </ul>
    `
  },
];
export default POOLS;