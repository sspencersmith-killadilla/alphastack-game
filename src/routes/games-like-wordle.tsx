import { createFileRoute, Link } from "@tanstack/react-router";
import { ALPHASTACK_LOGO_URL } from "@/lib/assets";

const TITLE = "7 Best Games Like Wordle to Play in 2026";
const DESCRIPTION =
  "Looking for games like Wordle? Our guide ranks the 7 best Wordle alternatives in 2026 — from LoLdle to Gamedle to AlphaStack, a Wordle-meets-Tetris hybrid you can play free.";
const URL = "https://alphastackgame.com/games-like-wordle";

export const Route = createFileRoute("/games-like-wordle")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: URL },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: TITLE,
          description: DESCRIPTION,
          author: { "@type": "Organization", name: "AlphaStack" },
          publisher: { "@type": "Organization", name: "AlphaStack" },
          mainEntityOfPage: URL,
        }),
      },
    ],
  }),
  component: GamesLikeWordlePage,
});

type Entry = {
  rank: number;
  name: string;
  tagline: string;
  body: string;
  best: string;
  link?: { label: string; to: "/play" | "/daily" };
  external?: { label: string; href: string };
};

const ENTRIES: Entry[] = [
  {
    rank: 1,
    name: "AlphaStack",
    tagline: "Wordle meets Tetris — guess words while stacking falling letter blocks.",
    body: "AlphaStack is the only game on this list that fuses Wordle's letter-guessing loop with Tetris's falling-block tension. Tetromino-shaped letter pieces drop into a grid, you steer them into rows, and clearing a row only counts when the letters spell a real Scrabble-dictionary word. Every game is a race between your vocabulary and gravity. Free, no install, plays in any browser, and there's a fresh daily puzzle with a global leaderboard.",
    best: "Players who love Wordle's word-puzzle satisfaction but want real-time pressure and a high-score chase.",
    link: { label: "Play AlphaStack free", to: "/play" },
  },
  {
    rank: 2,
    name: "LoLdle",
    tagline: "Daily League of Legends champion guessing game.",
    body: "LoLdle hands you a mystery League of Legends champion and gives feedback on attributes — region, role, gender, release year — after each guess, in classic Wordle yellow/green style. There are several modes (classic, splash art, ability, quote), so you can play once a day or burn an afternoon on the archive. Best if you already know the LoL roster; cryptic if you don't.",
    best: "League of Legends players who want a daily 30-second ritual.",
    external: { label: "Visit LoLdle", href: "https://loldle.net" },
  },
  {
    rank: 3,
    name: "Gamedle",
    tagline: "Guess the video game from cover art, screenshots, or keywords.",
    body: "Gamedle is Wordle for gaming history. You get six guesses to identify a mystery video game, and the cover-art mode reveals more of the box art with each wrong answer. The keyword mode shows genre, platform, and developer hints. A great daily palate cleanser, especially for players who grew up on PlayStation-era games — the catalog leans heavily on the last 25 years.",
    best: "Lifelong gamers who want to test how well they know the medium's history.",
    external: { label: "Visit Gamedle", href: "https://www.gamedle.wtf" },
  },
  {
    rank: 4,
    name: "Connections",
    tagline: "Group 16 words into four hidden categories of 4.",
    body: "The New York Times' Connections asks you to find the hidden thread linking groups of words. The trick is that the same word can plausibly belong to multiple groups — only one grouping is correct. It's quick (5 minutes), free, and uses the same daily-puzzle rhythm Wordle made famous. Connections is the closest analogue to Wordle's everyone-played-the-same-thing-today water-cooler effect.",
    best: "Wordle fans who want a slightly harder, lateral-thinking daily.",
    external: {
      label: "Visit Connections",
      href: "https://www.nytimes.com/games/connections",
    },
  },
  {
    rank: 5,
    name: "Quordle",
    tagline: "Solve four Wordles at once with nine shared guesses.",
    body: "Quordle is Wordle scaled up. You play four boards simultaneously, and every guess applies to all four. You have nine attempts total. The strategy shifts from 'find the answer' to 'gather information' — early guesses are about probing letters, not winning a board. Free daily puzzle and a practice mode for unlimited rounds.",
    best: "Wordle masters who breeze through the regular puzzle and want the difficulty cranked up.",
    external: { label: "Visit Quordle", href: "https://www.merriam-webster.com/games/quordle" },
  },
  {
    rank: 6,
    name: "Spelling Bee",
    tagline: "Build as many words as you can from seven letters.",
    body: "Another NYT puzzle: you get seven letters arranged in a honeycomb with one center letter, and you build as many four-plus-letter words as possible. Every word must include the center letter, and finding a pangram (uses all seven) is the daily prize. Spelling Bee is less of a 60-second daily and more of a slow-burn coffee companion. Free tier limits you to a handful of words; unlimited needs a subscription.",
    best: "Word lovers who'd rather noodle for 20 minutes than race a timer.",
    external: { label: "Visit Spelling Bee", href: "https://www.nytimes.com/puzzles/spelling-bee" },
  },
  {
    rank: 7,
    name: "Heardle",
    tagline: "Guess the song from a one-second clip.",
    body: "Heardle is the audio remix of Wordle. You hear a one-second sample of a song's intro and have six guesses — each wrong answer or skip unlocks another second. Pop-music heavy, fast, and weirdly addictive. The original site shut down but Spotify and several clones keep the format alive.",
    best: "Music nerds and anyone who can name a song from its first note.",
    external: { label: "Visit Heardle (Spotify)", href: "https://www.spotify.com/heardle" },
  },
];

function GamesLikeWordlePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1024] via-[#0b1330] to-[#0a1024] text-slate-100">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={ALPHASTACK_LOGO_URL} alt="AlphaStack" className="h-9 w-9 rounded-md" />
          <span className="text-xl font-extrabold tracking-tight">
            Alpha<span className="text-emerald-400">Stack</span>
          </span>
        </Link>
        <Link
          to="/play"
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-emerald-400"
        >
          Play
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-20">
        <article>
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-emerald-300">
            Word puzzles · Guide
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            {TITLE}
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            Wordle hooked the world on one short daily puzzle. If you've cleared today's grid and
            you're looking for the next thing to play, here are the seven best games like Wordle in
            2026 — ranked, with what each one does differently, and who they're for.
          </p>

          <section className="mt-8 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5">
            <h2 className="text-lg font-bold text-emerald-200">The short answer</h2>
            <p className="mt-2 text-sm text-slate-200">
              If you want the closest spiritual successor to Wordle, play{" "}
              <strong>Connections</strong> or <strong>Quordle</strong>. If you want something that
              keeps Wordle's vocabulary loop but adds real-time arcade pressure, play{" "}
              <Link to="/play" className="font-bold text-emerald-300 underline">
                AlphaStack
              </Link>{" "}
              — it's the only Wordle-meets-Tetris game on this list and it's free in your browser.
            </p>
          </section>

          <ol className="mt-10 space-y-10">
            {ENTRIES.map((entry) => (
              <li key={entry.name} className="border-t border-white/10 pt-8">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-3xl font-extrabold text-emerald-400">
                    {entry.rank}.
                  </span>
                  <h2 className="text-2xl font-extrabold text-white">{entry.name}</h2>
                </div>
                <p className="mt-2 text-base font-semibold text-amber-300">{entry.tagline}</p>
                <p className="mt-3 text-slate-300">{entry.body}</p>
                <p className="mt-3 text-sm text-slate-400">
                  <span className="font-bold text-slate-200">Best for:</span> {entry.best}
                </p>
                {entry.link && (
                  <Link
                    to={entry.link.to}
                    className="mt-4 inline-block rounded-lg bg-emerald-500 px-4 py-2 font-bold text-slate-900 hover:bg-emerald-400"
                  >
                    {entry.link.label} →
                  </Link>
                )}
                {entry.external && (
                  <a
                    href={entry.external.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block rounded-lg border border-white/15 bg-slate-800 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
                  >
                    {entry.external.label} ↗
                  </a>
                )}
              </li>
            ))}
          </ol>

          <section className="mt-14 rounded-2xl border border-white/10 bg-slate-900/50 p-6">
            <h2 className="text-2xl font-extrabold text-white">
              Why AlphaStack belongs on this list
            </h2>
            <p className="mt-3 text-slate-300">
              Most games like Wordle keep the same shape: one puzzle, six guesses, you're done in
              two minutes. That's great — but it's also why people finish the daily and immediately
              look for what to play next. AlphaStack solves the "what now" problem by mashing
              Wordle's word-puzzle satisfaction together with Tetris's falling-block tension.
            </p>
            <ul className="mt-4 space-y-2 text-slate-300">
              <li>
                <strong className="text-emerald-300">Real words only.</strong> Pieces are letters;
                rows only clear when they spell a Scrabble-dictionary word.
              </li>
              <li>
                <strong className="text-emerald-300">Rarity scoring.</strong> Harder letters score
                more — <em>kabuki</em> pays more than <em>beauty</em>.
              </li>
              <li>
                <strong className="text-emerald-300">Daily puzzle.</strong> One shared seed per day,
                global leaderboard, just like Wordle.
              </li>
              <li>
                <strong className="text-emerald-300">Free, browser-based.</strong> No install, no
                signup, no ads gating gameplay.
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/play"
                className="rounded-lg bg-emerald-500 px-5 py-3 font-bold text-slate-900 hover:bg-emerald-400"
              >
                Play AlphaStack free →
              </Link>
              <Link
                to="/daily"
                className="rounded-lg border border-white/15 bg-slate-800 px-5 py-3 font-bold text-white hover:bg-slate-700"
              >
                Try today's daily puzzle
              </Link>
            </div>
          </section>

          <section className="mt-14">
            <h2 className="text-2xl font-extrabold text-white">Frequently asked questions</h2>
            <div className="mt-4 space-y-5">
              <div>
                <h3 className="font-bold text-emerald-300">What is the best game like Wordle?</h3>
                <p className="mt-1 text-slate-300">
                  For people who want the same daily-puzzle rhythm, NYT Connections is the closest
                  analogue. For people who want Wordle's vocabulary loop with more action,
                  AlphaStack is the strongest pick because it adds real-time stacking gameplay.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-emerald-300">Are there free games like Wordle?</h3>
                <p className="mt-1 text-slate-300">
                  Yes — Wordle itself is free, and so are AlphaStack, LoLdle, Gamedle, Quordle, and
                  Heardle. NYT's Connections and Spelling Bee have free daily puzzles with optional
                  subscriptions for the archive.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-emerald-300">
                  What game combines Wordle and Tetris?
                </h3>
                <p className="mt-1 text-slate-300">
                  AlphaStack. Letter-shaped tetrominoes drop into a grid, and you only clear rows by
                  spelling valid dictionary words. It's free to play in any browser.
                </p>
              </div>
            </div>
          </section>
        </article>
      </main>
    </div>
  );
}