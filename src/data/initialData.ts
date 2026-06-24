import { Review, ReviewList } from "../types";

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 1,
    title: "QUAGMIRE BY PERPLEXT GAMES",
    subtitle: "Hop your way to victory!",
    type: "strategy",
    players: "2-4",
    time: "30 min",
    score: 8,
    verdict: "A delightful strategy game that scores a solid 8/10.",
    body: "<p>🐸 QUAGMIRE BY PERPLEXT GAMES 🐸</p><p>The battle for the bog has been a new addition to our table, and we are pleasantly surprised!</p><p>If you remember Chris Handy’s tiny BOG from the Pack O Game series, this is that same design fully realized in a bigger box. It’s light, snappy, and doesn’t take up a ton of space, but it feels like a proper, complete game.</p><p>Here is where it sits on our Spoon Scale (how much mental energy you need to play): Low Spoon 🥄</p><p>This is great for a relaxed weeknight after work, or a quick game to kick off a longer board game night. It’s super easy to teach, but there’s enough strategy there to keep it interesting.</p><p>How it Plays 🐸</p><p>You’re moving frogs across a grid of lily pads, eating flies to refill your hand, and capturing other players’ frogs to score points. The real puzzle comes from trying to complete specific Frog Routes and creating Frog Formations.</p><p>On your turn you’ll do one of three actions;</p><p>- play a frog to your shore</p><p>- move one of your frogs, following the path on the card</p><p>- discard & score a frog based on how many frogs are in the yellow dots</p><p>What we really like about it! 📣</p><p>Finding the perfect path to hop your frogs across the grid is a great little puzzle. The multi-use cards keep it interesting, figuring out if you should play a card now or hold onto it for a big end-game score.</p><p>It has a sweet spot of player interaction! Stealing a spot from someone else is satisfying, but it never feels overly mean.</p><p>The art by Magdalena Markowska is gorgeous, it looks so bright and clean on the table. It plays well with 2, 3, or 4 players and takes about 30 minutes, so we almost always end up playing a second game immediately.</p><p>Thanks to Perplext for sending us a copy to check out - our thoughts and opinions are always our own!</p><p>You’ll be able to pick up a copy for yourself very soon 🐸 https://www.perplext.com/quagmire</p>",
    tags: ["quagmire", "perplextgames"],
    date: "Jun 2026",
    featured: true,
    image: "/src/assets/images/quagmire_review_cover_1782293640871.jpg",
    emoji: "🐸",
    spoons: "low"
  },
  {
    id: 2,
    title: "Dune: Imperium",
    subtitle: "Deck-building meets worker placement in the spice wars",
    type: "strategy",
    players: "1–4",
    time: "60–120 min",
    score: 9,
    verdict: "The best deck-builder of the last five years, and the best Dune game ever made.",
    body: "<p>Combining deck-building with worker placement sounds like it should be a mess. Instead it's a revelation. Every card you play either sends your worker somewhere or adds combat strength — the dual-use mechanic creates agonising decisions.</p><p>The faction system and the Spacing Guild allegiance track mean every game plays differently. You can try to win on points, on military might, or by controlling Arrakis itself.</p><p>Production is excellent. The iconography takes one game to learn and then it clicks. Highly recommended — get the Uprising standalone if you want the best version.</p>",
    tags: ["deck building", "worker placement", "sci-fi"],
    date: "Apr 2025",
    featured: false,
    image: "https://images.unsplash.com/photo-1509316975850-ff9c5edd0cd9?auto=format&fit=crop&q=80&w=1200",
    emoji: "🏜️",
    spoons: "high"
  },
  {
    id: 3,
    title: "Codenames",
    subtitle: "The party game that changed the genre",
    type: "party",
    players: "2–8",
    time: "15–30 min",
    score: 8,
    verdict: "An all-time classic. Still the one to reach for when the group is mixed.",
    body: "<p>Ten years on and Codenames still works. The one-word clue mechanic is simple enough to explain in thirty seconds and deep enough to generate twenty minutes of agony per round.</p><p>Works with families, with game groups, with people who've never touched a board game. That versatility is rare. The Duet cooperative version is also excellent if you're playing two-player.</p>",
    tags: ["word game", "deduction", "quick"],
    date: "Mar 2025",
    featured: false,
    image: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&q=80&w=1200",
    emoji: "🕵️",
    spoons: "low"
  },
  {
    id: 4,
    title: "Spirit Island",
    subtitle: "The cooperative game for people who find cooperative games too easy",
    type: "cooperative",
    players: "1–4",
    time: "90–120 min",
    score: 10,
    verdict: "The pinnacle of cooperative board gaming. Brutally hard, deeply satisfying.",
    body: "<p>Spirit Island flips the colonial theme on its head — you are the island spirits driving away the invaders. The theme isn't just clever, it's central to the mechanics in a way few games manage.</p><p>Each spirit plays completely differently. Vital Strength of the Earth feels slow and unstoppable. Lightning's Swift Strike is chaotic and reactive. Brand of the Slow Doom wins games three turns after everyone thought it was over. The asymmetry is extraordinary.</p><p>The difficulty is real. Don't start on the hardest invader decks. Work your way up. The reward is some of the most intense cooperative play available in tabletop.</p>",
    tags: ["asymmetric", "heavy", "thematic"],
    date: "Feb 2025",
    featured: false,
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200",
    emoji: "🌊",
    spoons: "high"
  },
  {
    id: 5,
    title: "Catan",
    subtitle: "A revisit — does the gateway classic hold up?",
    type: "strategy",
    players: "3–4",
    time: "60–90 min",
    score: 6,
    verdict: "Still a good gateway game, but there are better options at every table now.",
    body: "<p>The game that introduced a generation to modern board gaming. That legacy is real and it deserves respect. But sitting down with it in 2025, the cracks show.</p><p>Runaway leader syndrome, high luck variance, and the notorious longest-road-robber-king frustration haven't aged well. Better negotiation games exist. Better resource games exist. Better gateway games exist.</p><p>Still worth owning if you need to introduce absolute beginners. Just be aware of what you're getting into.</p>",
    tags: ["gateway", "negotiation", "classic"],
    date: "Jan 2025",
    featured: false,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1200",
    emoji: "🌾",
    spoons: "low"
  },
  {
    id: 6,
    title: "Everdell: Emerland",
    subtitle: "The jungle standalone that earns its place next to the Evertree",
    type: "strategy",
    players: "1–4",
    time: "40–80 min",
    score: 9,
    verdict: "Everything that made Everdell special, sharpened and transplanted into a lush jungle with more tactical bite.",
    body: "<p>When Tycoon Games announced Emerland — a standalone sequel taking the critters into a tropical jungle — the question was whether it could justify its place next to the original. Good news: it absolutely does. It keeps that core, cozy DNA, but brings a totally different tactical flavour.</p><h3>How it differs from original Everdell</h3><p>It feels like they took the best elements of the original expansions and smoothed them into one box. The double-sided cards are the biggest shift — you build the basic side, then later use a resource to flip and upgrade for massive endgame combos or a second worker trigger. It adds a whole new layer of planning.</p><p>Playing critters for free is still here, but you use Harps instead, and can only have one Harp per card colour. Rather than just placing a worker, you now have insect Helpers — beetles, dragonflies, ants — that join workers to gain double resources or claim specific solo spots.</p><p>The deck is leaner (around 100 unique cards), so you're not digging through a massive pile. The city limit is tighter too — 12 spaces instead of 15 — so every slot is a genuine decision. And instead of basic events, there's an excavation track where your archaeologist digs up lost artifacts and hunts for a legendary city. It gives the midgame a real focus.</p><h3>Our thoughts</h3><p>It's gorgeous and oozes premium. Where original Everdell can feel like a race to build the biggest engine, Emerland forces you to make every space count. We reached the final season faster, but lingered there much longer to maximise upgrades. This is perfect for players who love the original but want a bit more of a brain-burner with less card bloat.</p><p><em>A copy was kindly provided by Tycoon Games — opinions are entirely our own.</em></p>",
    tags: ["tableau building", "worker placement", "standalone"],
    date: "Jun 2025",
    featured: false,
    image: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&q=80&w=1200", // Using high quality theme illustration placeholder
    emoji: "🌿",
    spoons: "medium"
  },
  {
    id: 7,
    title: "Ticket to Ride: Europe",
    subtitle: "The definitive family strategy game",
    type: "family",
    players: "2–5",
    time: "45–75 min",
    score: 8,
    verdict: "A gentle on-ramp to strategy gaming that holds up even with experienced players.",
    body: "<p>Europe improves on the original in almost every way — tunnels, ferries, and stations add meaningful decisions without complicating the core. Teach it in ten minutes, play it with anyone.</p><p>The blocking is mean enough to be interesting, mild enough not to cause arguments. That's a hard balance and it hits it.</p>",
    tags: ["family", "gateway", "network building"],
    date: "Dec 2024",
    featured: false,
    image: "https://images.unsplash.com/photo-1532103054090-334e6e60b733?auto=format&fit=crop&q=80&w=1200",
    emoji: "🚂",
    spoons: "low"
  },
  {
    id: 8,
    title: "Codenames Duet",
    subtitle: "Two-player cooperative spy missions",
    type: "cooperative",
    players: "2",
    time: "15–30 min",
    score: 8,
    verdict: "One of the absolute best custom two-player co-ops, turning a social party system into a clever grid puzzle.",
    body: "<p>Duet keeps Codenames' word-association core but adjusts the structure for cooperative play. Instead of opposing spymasters, you work together to locate agent cards on a grid. Because your grids are opposite-facing, you can see half the solution for your partner, and they see half for you.</p><p>It fixes the alpha-gamer problem completely since both of you have secret pieces of information and must trade clues dynamically. Highly recommended for any pair!</p>",
    tags: ["cooperative", "word game", "two player"],
    date: "Feb 2025",
    featured: false,
    image: "https://images.unsplash.com/photo-1520038410233-7141be7e6f97?auto=format&fit=crop&q=80&w=1200",
    emoji: "👥",
    spoons: "low"
  }
];

export const INITIAL_LISTS: ReviewList[] = [
  {
    id: "list-1",
    title: "Great for Two",
    desc: "Games that genuinely shine at two players — not just 'supports 2' but actually custom-fit for dual sessions.",
    tag: "Player Count",
    reviewIds: [6, 8, 7],
    customNotes: {
      6: "The tighter city limit makes the two-player game feel perfectly balanced — every card you play matters and there's just enough room for both players to build something beautiful.",
      8: "The cooperative version of Codenames is practically made for two. You're both spymasters, giving clues to each other simultaneously. Tense, quick, and endlessly replayable.",
      7: "At two players the blocking is present but not punishing — you can both build satisfying networks without feeling like you're constantly in each other's way."
    }
  },
  {
    id: "list-2",
    title: "Low Spoon Game Night",
    desc: "For when you want to play something but your brain has already clocked out for the day.",
    tag: "Spoon Friendly",
    reviewIds: [3, 7, 5],
    customNotes: {
      3: "One word, multiple connections. Explain it in sixty seconds and you're playing. The hard thinking happens naturally and doesn't feel like work.",
      7: "Collect cards, build routes. The rules fit on half a page. Perfect for a relaxed evening where the game is background to good conversation.",
      5: "Roll, collect, build. The negotiation keeps everyone engaged even on other players' turns, and there's very little to remember once you've played once."
    }
  },
  {
    id: "list-3",
    title: "Games Worth the Learning Curve",
    desc: "These take an evening to click, but once they do they never leave your rotation.",
    tag: "Heavy Hitters",
    reviewIds: [4, 2, 6],
    customNotes: {
      4: "The rulebook is intimidating but most of the complexity lives on the cards themselves. After one full game everything snaps into place and you realise just how deep it goes.",
      2: "The dual-use card mechanic takes a round or two to fully click — but once it does, every decision feels meaningful. Absolutely worth the initial overhead.",
      6: "If you know Everdell, you'll be up and running fast. For newcomers the double-sided cards add a layer of planning that takes a game to fully grasp, but the payoff is huge."
    }
  },
  {
    id: "list-4",
    title: "Bring This to a Party",
    desc: "Works with a big group, mixed experience levels, and people who might normally say they 'don't do board games'.",
    tag: "Social",
    reviewIds: [3, 5],
    customNotes: {
      3: "Scales beautifully from four to eight players, works in teams, and the drama of a single clue covering five words never gets old no matter who's in the room.",
      5: "The trading element means even people not taking their turn stay involved. A proven crowd-pleaser for a reason, even if it has some rough edges."
    }
  },
  {
    id: "list-5",
    title: "Low Spoon Coop games",
    desc: "Cooperative games where you can work together to win, without needing a spreadsheet or heavy mental load.",
    tag: "Spoon Friendly",
    reviewIds: [8, 3],
    customNotes: {
      8: "Codenames Duet is the ultimate relaxing co-op. You work together, share simple clues, and there is absolutely no pressure or complex bookkeeping.",
      3: "Codenames is normally competitive, but playing it co-op using the official side-rules is a gentle, low-stress team-building experience perfect for a quiet night."
    }
  }
];
