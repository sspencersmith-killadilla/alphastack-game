import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { Board } from "@/components/game/Board";
import { Controls } from "@/components/game/Controls";
import { GuessPanel } from "@/components/game/GuessPanel";
import { Keyboard } from "@/components/game/Keyboard";
import { WordToast } from "@/components/game/WordToast";
import { useGame } from "@/game/store";
import { ALPHASTACK_LOGO_URL } from "@/lib/assets";
import { supabase } from "@/integrations/supabase/client";
import {
  finishRoom,
  getRoom,
  joinRoom,
  rematchRoom,
  setReady,
  startRoom,
  updateScore,
  type RoomState,
} from "@/lib/rooms.functions";

const TOKEN_KEY = "alphastack:client-token";
const INITIALS_KEY = "alphastack:initials";

function getToken(): string {
  if (typeof window === "undefined") return "00000000-0000-0000-0000-000000000000";
  let t = window.localStorage.getItem(TOKEN_KEY);
  if (!t) {
    t = crypto.randomUUID();
    window.localStorage.setItem(TOKEN_KEY, t);
  }
  return t;
}
function getInitials(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(INITIALS_KEY) ?? "";
}

export const Route = createFileRoute("/rooms/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `Room ${params.code} — AlphaStack Multiplayer` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RoomPage,
});

function RoomPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const joinFn = useServerFn(joinRoom);
  const getFn = useServerFn(getRoom);
  const readyFn = useServerFn(setReady);
  const startFn = useServerFn(startRoom);
  const finishFn = useServerFn(finishRoom);
  const rematchFn = useServerFn(rematchRoom);
  const scoreFn = useServerFn(updateScore);

  const [room, setRoom] = useState<RoomState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [token] = useState(() => getToken());
  const [initials] = useState(() => getInitials());
  const [now, setNow] = useState(() => Date.now());

  const startGame = useGame((s) => s.startGame);
  const phase = useGame((s) => s.phase);
  const mode = useGame((s) => s.mode);
  const score = useGame((s) => s.score);
  const lines = useGame((s) => s.lines);
  const wordsSolved = useGame((s) => s.wordsSolved);
  const level = useGame((s) => s.level);

  // ----- Join on mount -----
  useEffect(() => {
    let cancelled = false;
    async function go() {
      if (!/^[A-Z]{3}$/.test(initials)) {
        navigate({ to: "/rooms" });
        return;
      }
      const res = await joinFn({ data: { code, initials, clientToken: token } });
      if (cancelled) return;
      if (!res.ok) {
        setError(res.reason);
        return;
      }
      setRoom(res.room);
    }
    go();
    return () => {
      cancelled = true;
    };
  }, [code, initials, token, joinFn, navigate]);

  // ----- Realtime subscription -----
  useEffect(() => {
    if (!room) return;
    const roomId = room.id;
    async function refresh() {
      const res = await getFn({ data: { code } });
      if (res.ok) setRoom(res.room);
    }
    const channel = supabase
      .channel(`room:${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_scores", filter: `room_id=eq.${roomId}` }, refresh)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [room?.id, code, getFn]);

  // ----- Start the local game when the room transitions to "playing" -----
  const seedRef = useRef<string | null>(null);
  useEffect(() => {
    if (room?.status !== "playing" || !room.seed) return;
    if (seedRef.current === room.seed) return;
    seedRef.current = room.seed;
    startGame({ mode: "match", seed: room.seed });
  }, [room?.status, room?.seed, startGame]);

  // ----- Throttled score upload -----
  const lastSentRef = useRef<{ at: number; key: string }>({ at: 0, key: "" });
  useEffect(() => {
    if (room?.status !== "playing" || mode !== "match") return;
    const toppedOut = phase === "gameover";
    const key = `${score}|${lines}|${wordsSolved}|${level}|${toppedOut}`;
    const t = setTimeout(() => {
      if (lastSentRef.current.key === key) return;
      lastSentRef.current = { at: Date.now(), key };
      scoreFn({
        data: {
          code,
          clientToken: token,
          initials,
          score,
          lines,
          wordsSolved,
          level,
          toppedOut,
        },
      }).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [room?.status, mode, phase, score, lines, wordsSolved, level, code, token, initials, scoreFn]);

  // ----- Round timer -----
  useEffect(() => {
    if (room?.status !== "playing") return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [room?.status]);

  const isHost = room?.hostToken === token;
  const startedAtMs = room?.startedAt ? new Date(room.startedAt).getTime() : 0;
  const endsAtMs = startedAtMs + (room?.roundSeconds ?? 0) * 1000;
  const remainingMs = Math.max(0, endsAtMs - now);

  // Host auto-finishes when the timer expires.
  useEffect(() => {
    if (!isHost || room?.status !== "playing") return;
    if (remainingMs > 0) return;
    finishFn({ data: { code, clientToken: token } }).catch(() => {});
  }, [isHost, room?.status, remainingMs, code, token, finishFn]);

  if (error) {
    return (
      <CenteredMessage title="Can't join room" body={error}>
        <Link to="/rooms" className="rounded-lg bg-emerald-500 px-5 py-2 font-bold text-slate-950 hover:bg-emerald-400">Back to rooms</Link>
      </CenteredMessage>
    );
  }
  if (!room) {
    return <CenteredMessage title="Joining room…" body={`Code ${code}`} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1024] via-[#0b1330] to-[#0a1024] text-slate-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={ALPHASTACK_LOGO_URL} alt="AlphaStack logo" className="h-9 w-9 rounded-md" />
          <span className="text-xl font-extrabold tracking-tight">
            Alpha<span className="text-emerald-400">Stack</span>
          </span>
        </Link>
        <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-slate-400">
          <span>Room</span>
          <span className="rounded-md bg-slate-800 px-2 py-1 font-mono text-base text-white">{room.code}</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-12">
        {room.status === "lobby" && (
          <Lobby
            room={room}
            token={token}
            onToggleReady={(ready) => readyFn({ data: { code, clientToken: token, ready } })}
            onStart={async () => {
              const res = await startFn({ data: { code, clientToken: token } });
              if (!res.ok) setError(res.reason);
            }}
          />
        )}
        {room.status === "playing" && (
          <Match room={room} remainingMs={remainingMs} token={token} />
        )}
        {room.status === "finished" && (
          <Results
            room={room}
            isHost={isHost}
            onRematch={() => rematchFn({ data: { code, clientToken: token } })}
          />
        )}
      </main>
      <WordToast />
    </div>
  );
}

// ----- Lobby -----
function Lobby({
  room,
  token,
  onToggleReady,
  onStart,
}: {
  room: RoomState;
  token: string;
  onToggleReady: (ready: boolean) => void;
  onStart: () => void;
}) {
  const me = room.players.find((p) => p.clientToken === token);
  const isHost = room.hostToken === token;
  const allReady = room.players.length >= 2 && room.players.every((p) => p.isReady);
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/rooms/${room.code}` : "";
  const [copied, setCopied] = useState(false);

  return (
    <div className="mx-auto mt-6 max-w-xl space-y-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-center">
        <div className="text-xs uppercase tracking-widest text-slate-400">Share this code</div>
        <div className="mt-2 font-mono text-5xl font-extrabold tracking-[0.3em] text-emerald-300">{room.code}</div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="mt-4 rounded-md border border-white/10 bg-slate-800 px-4 py-1.5 text-xs uppercase tracking-widest text-slate-200 hover:bg-slate-700"
        >
          {copied ? "Link copied!" : "Copy invite link"}
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Players ({room.players.length}/6)</h2>
          <span className="text-xs text-slate-500">Round: {room.roundSeconds}s</span>
        </div>
        <ul className="mt-3 space-y-2">
          {room.players.map((p) => (
            <li
              key={p.clientToken}
              className="flex items-center justify-between rounded-md border border-white/10 bg-slate-950/60 px-3 py-2"
            >
              <span className="font-mono font-bold tracking-widest">
                {p.initials}
                {p.clientToken === room.hostToken && <span className="ml-2 text-[10px] uppercase text-amber-300">Host</span>}
                {p.clientToken === token && <span className="ml-2 text-[10px] uppercase text-emerald-300">You</span>}
              </span>
              <span className={`text-xs uppercase tracking-widest ${p.isReady ? "text-emerald-300" : "text-slate-500"}`}>
                {p.isReady ? "Ready" : "Waiting…"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-3">
        {me && !isHost && (
          <button
            onClick={() => onToggleReady(!me.isReady)}
            className={`flex-1 rounded-lg px-5 py-3 font-bold transition-colors ${
              me.isReady
                ? "border border-white/10 bg-slate-800 text-white hover:bg-slate-700"
                : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
            }`}
          >
            {me.isReady ? "Not ready" : "I'm ready"}
          </button>
        )}
        {isHost && (
          <button
            onClick={onStart}
            disabled={!allReady}
            className="flex-1 rounded-lg bg-fuchsia-500 px-5 py-3 font-bold text-slate-950 transition-colors hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {allReady ? "Start match" : "Waiting for players…"}
          </button>
        )}
      </div>
    </div>
  );
}

// ----- Match -----
function Match({ room, remainingMs, token }: { room: RoomState; remainingMs: number; token: string }) {
  const submit = useGame((s) => s.submitGuess);
  const type = useGame((s) => s.typeLetter);
  const back = useGame((s) => s.backspace);
  const move = useGame((s) => s.move);
  const rotate = useGame((s) => s.rotate);
  const soft = useGame((s) => s.softDrop);
  const hard = useGame((s) => s.hardDrop);
  const tick = useGame((s) => s.tick);
  const phase = useGame((s) => s.phase);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === "guessing") {
        if (e.key === "Enter") { e.preventDefault(); submit(); }
        else if (e.key === "Backspace") { e.preventDefault(); back(); }
        else if (/^[a-zA-Z]$/.test(e.key)) type(e.key);
      } else if (phase === "placing") {
        if (e.key === "ArrowLeft") move(-1);
        else if (e.key === "ArrowRight") move(1);
        else if (e.key === "ArrowUp") rotate();
        else if (e.key === "ArrowDown") soft();
        else if (e.key === "Shift" || e.key === "Enter") { e.preventDefault(); hard(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, submit, back, type, move, rotate, soft, hard]);

  useEffect(() => {
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [tick]);

  const sorted = useMemo(
    () => [...room.scores].sort((a, b) => b.score - a.score),
    [room.scores],
  );

  return (
    <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/60 px-4 py-2">
          <span className="text-xs uppercase tracking-widest text-slate-400">Time left</span>
          <span className="font-mono text-2xl font-bold text-emerald-300">{formatMs(remainingMs)}</span>
        </div>
        <div className="flex justify-center"><Board /></div>
        {phase === "guessing" || phase === "paused" ? (
          <>
            <GuessPanel />
            <Keyboard />
          </>
        ) : (
          <Controls />
        )}
      </div>
      <aside className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Live standings</h2>
        <ul className="space-y-2">
          {sorted.map((s, i) => (
            <li
              key={s.clientToken}
              className={`flex items-center justify-between rounded-md border px-3 py-2 ${
                s.clientToken === token
                  ? "border-emerald-400/40 bg-emerald-500/10"
                  : "border-white/10 bg-slate-950/60"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 text-right font-mono text-xs text-slate-500">{i + 1}</span>
                <span className="font-mono font-bold tracking-widest">{s.initials}</span>
                {s.toppedOut && <span className="text-[10px] uppercase text-red-400">Out</span>}
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-bold text-white">{s.score.toLocaleString()}</div>
                <div className="text-[10px] uppercase text-slate-500">{s.lines}L · {s.wordsSolved}W</div>
              </div>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

// ----- Results -----
function Results({
  room,
  isHost,
  onRematch,
}: {
  room: RoomState;
  isHost: boolean;
  onRematch: () => void;
}) {
  const sorted = [...room.scores].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  return (
    <div className="mx-auto mt-8 max-w-xl space-y-6 text-center">
      <div className="text-xs uppercase tracking-widest text-slate-400">Match over</div>
      {winner && (
        <div>
          <div className="text-sm text-slate-400">Winner</div>
          <div className="mt-1 font-mono text-5xl font-extrabold tracking-[0.3em] text-amber-300">{winner.initials}</div>
          <div className="mt-1 font-mono text-2xl text-white">{winner.score.toLocaleString()}</div>
        </div>
      )}
      <ul className="space-y-2 text-left">
        {sorted.map((s, i) => (
          <li key={s.clientToken} className="flex items-center justify-between rounded-md border border-white/10 bg-slate-900/60 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="w-6 text-right font-mono text-slate-500">{i + 1}</span>
              <span className="font-mono font-bold tracking-widest">{s.initials}</span>
            </div>
            <div className="text-right">
              <div className="font-mono text-lg font-bold text-white">{s.score.toLocaleString()}</div>
              <div className="text-[10px] uppercase text-slate-500">{s.lines} lines · {s.wordsSolved} words</div>
            </div>
          </li>
        ))}
      </ul>
      {isHost ? (
        <button
          onClick={onRematch}
          className="rounded-lg bg-fuchsia-500 px-6 py-3 font-bold text-slate-950 hover:bg-fuchsia-400"
        >
          Rematch
        </button>
      ) : (
        <p className="text-sm text-slate-400">Waiting for host to start a rematch…</p>
      )}
      <Link to="/rooms" className="block text-xs uppercase tracking-widest text-slate-500 hover:text-slate-300">
        Leave room
      </Link>
    </div>
  );
}

function CenteredMessage({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#0a1024] via-[#0b1330] to-[#0a1024] px-6 text-center text-slate-100">
      <img src={ALPHASTACK_LOGO_URL} alt="AlphaStack logo" className="h-16 w-16 rounded-2xl" />
      <h1 className="text-2xl font-extrabold">{title}</h1>
      <p className="text-sm text-slate-400">{body}</p>
      {children}
    </div>
  );
}

function formatMs(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}