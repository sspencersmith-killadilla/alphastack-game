import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ALPHASTACK_LOGO_URL } from "@/lib/assets";
import { createRoom } from "@/lib/rooms.functions";

const TOKEN_KEY = "alphastack:client-token";
const INITIALS_KEY = "alphastack:initials";

function loadOrCreateToken(): string {
  if (typeof window === "undefined") return "00000000-0000-0000-0000-000000000000";
  let t = window.localStorage.getItem(TOKEN_KEY);
  if (!t) {
    t = crypto.randomUUID();
    window.localStorage.setItem(TOKEN_KEY, t);
  }
  return t;
}

function loadInitials(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(INITIALS_KEY) ?? "";
}

export const Route = createFileRoute("/rooms")({
  head: () => ({
    meta: [
      { title: "AlphaStack Multiplayer Rooms — Play with Friends" },
      { name: "description", content: "Create or join a private room and race up to 6 friends through the same AlphaStack puzzle sequence in real time." },
      { property: "og:title", content: "AlphaStack Multiplayer" },
      { property: "og:description", content: "Live multiplayer AlphaStack — race friends through the same puzzle." },
    ],
  }),
  component: RoomsLanding,
});

function normalizeInitials(v: string): string {
  return v.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
}
function normalizeCode(v: string): string {
  return v.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6);
}

function RoomsLanding() {
  const navigate = useNavigate();
  const create = useServerFn(createRoom);
  const [initials, setInitials] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate from localStorage after mount so SSR doesn't lock us to "".
  useEffect(() => {
    const saved = loadInitials();
    if (saved) setInitials(saved);
  }, []);

  const initialsOk = /^[A-Z]{3}$/.test(initials);

  async function onCreate() {
    if (!initialsOk) return setError("Pick 3 letters for your initials.");
    setBusy(true);
    setError(null);
    window.localStorage.setItem(INITIALS_KEY, initials);
    const token = loadOrCreateToken();
    const res = await create({ data: { initials, clientToken: token, roundSeconds: 180 } });
    setBusy(false);
    if (!res.ok) return setError(res.reason);
    navigate({ to: "/rooms/$code", params: { code: res.code } });
  }

  function onJoin() {
    if (!initialsOk) return setError("Pick 3 letters for your initials.");
    if (code.length !== 6) return setError("Enter a 6-character room code.");
    window.localStorage.setItem(INITIALS_KEY, initials);
    navigate({ to: "/rooms/$code", params: { code } });
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#0a1024] via-[#0b1330] to-[#0a1024] px-6 py-12 text-slate-100">
      <Link to="/" className="flex items-center gap-2">
        <img src={ALPHASTACK_LOGO_URL} alt="AlphaStack logo" className="h-12 w-12 rounded-md" />
        <span className="text-xl font-extrabold tracking-tight">
          Alpha<span className="text-emerald-400">Stack</span>
        </span>
      </Link>
      <h1 className="mt-8 text-center text-4xl font-extrabold tracking-tight">
        Play with <span className="text-fuchsia-400">friends</span>
      </h1>
      <p className="mt-2 max-w-md text-center text-sm text-slate-400">
        Create a room, share the code, and race up to 6 players through the same puzzle sequence in real time.
      </p>

      <div className="mt-8 w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Your initials</span>
          <input
            value={initials}
            onChange={(e) => setInitials(normalizeInitials(e.target.value))}
            placeholder="ABC"
            maxLength={3}
            className="mt-1 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-center text-2xl font-mono font-bold uppercase tracking-[0.4em] text-white outline-none focus:border-emerald-400"
          />
        </label>

        <button
          onClick={onCreate}
          disabled={!initialsOk || busy}
          className="w-full rounded-lg bg-fuchsia-500 px-5 py-3 font-bold text-slate-950 transition-colors hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create a room"}
        </button>

        <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-slate-500">
          <div className="h-px flex-1 bg-white/10" /> or join <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(normalizeCode(e.target.value))}
            placeholder="CODE"
            maxLength={6}
            className="flex-1 rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-center font-mono text-lg font-bold uppercase tracking-[0.3em] text-white outline-none focus:border-fuchsia-400"
          />
          <button
            onClick={onJoin}
            disabled={!initialsOk || code.length !== 6}
            className="rounded-lg border border-white/10 bg-slate-800 px-5 py-2 font-bold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Join
          </button>
        </div>

        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>
        )}
      </div>

      <Link to="/" className="mt-8 text-xs uppercase tracking-widest text-slate-500 hover:text-slate-300">
        ← Back to home
      </Link>
    </div>
  );
}