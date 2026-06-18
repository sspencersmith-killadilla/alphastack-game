import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useGame } from "@/game/store";
import {
  getLeaderboard,
  qualifiesForLeaderboard,
  submitScore,
} from "@/lib/leaderboard.functions";
import {
  getDailyLeaderboard,
  submitDailyScore,
} from "@/lib/daily-leaderboard.functions";
import { LeaderboardList } from "./LeaderboardList";
import { track } from "@/lib/analytics-client";
import { sfx } from "@/lib/audio";

const INITIALS_KEY = "alphastack:initials";

export function GameOverModal() {
  const phase = useGame((s) => s.phase);
  const score = useGame((s) => s.score);
  const best = useGame((s) => s.best);
  const lines = useGame((s) => s.lines);
  const level = useGame((s) => s.level);
  const wordsSolved = useGame((s) => s.wordsSolved);
  const restart = useGame((s) => s.startGame);
  const dismiss = useGame((s) => s.dismissGameOver);
  const mode = useGame((s) => s.mode);
  const dailyDate = useGame((s) => s.dailyDate);
  const clientToken = useGame((s) => s.clientToken);
  const startedAt = useGame((s) => s.startedAt);
  const isNewBest = useGame((s) => s.isNewBest);

  const qc = useQueryClient();
  const fetchLeaderboard = useServerFn(getLeaderboard);
  const checkQualifies = useServerFn(qualifiesForLeaderboard);
  const saveScore = useServerFn(submitScore);
  const saveDailyScore = useServerFn(submitDailyScore);
  const fetchDailyLeaderboard = useServerFn(getDailyLeaderboard);
  const [initials, setInitials] = useState("");
  const [submitted, setSubmitted] = useState<{ rank: number | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const playedNewBest = useRef(false);

  // Load last-used initials
  useEffect(() => {
    if (typeof window === "undefined") return;
    const last = window.localStorage.getItem(INITIALS_KEY);
    if (last) setInitials(last);
  }, []);

  // Reset when a new game starts
  useEffect(() => {
    if (phase === "gameover") return;
    setSubmitted(null);
    setError(null);
    playedNewBest.current = false;
  }, [phase]);

  useEffect(() => {
    if (phase === "gameover" && isNewBest && !playedNewBest.current) {
      sfx.newBest();
      playedNewBest.current = true;
    }
  }, [phase, isNewBest]);

  const { data: qualify } = useQuery({
    queryKey: ["qualifies", score, clientToken],
    queryFn: () => checkQualifies({ data: { score } }),
    enabled: phase === "gameover" && mode === "free" && score > 0,
  });

  const { data: freeTop10 = [] } = useQuery({
    queryKey: ["leaderboard", "all", 10],
    queryFn: () => fetchLeaderboard({ data: { scope: "all", limit: 10 } }),
    enabled: phase === "gameover" && mode === "free",
  });

  const { data: dailyTop10 = [] } = useQuery({
    queryKey: ["daily-leaderboard", dailyDate ?? "", 10],
    queryFn: () => fetchDailyLeaderboard({ data: { limit: 10 } }),
    enabled: phase === "gameover" && mode === "daily",
  });

  const submitMut = useMutation({
    mutationFn: async () => {
      const duration = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      const payload = {
        initials: initials.toUpperCase(),
        score,
        lines,
        level,
        wordsSolved,
        durationSeconds: duration,
        clientToken,
      };
      return mode === "daily"
        ? saveDailyScore({ data: payload })
        : saveScore({ data: payload });
    },
    onSuccess: (res) => {
      if (!res.ok) {
        setError(res.reason);
        return;
      }
      setSubmitted({ rank: res.rank });
      if (typeof window !== "undefined") {
        window.localStorage.setItem(INITIALS_KEY, initials.toUpperCase());
        if (mode === "daily" && dailyDate) {
          window.localStorage.setItem(`alphastack:daily:${dailyDate}`, "done");
        }
      }
      track("score_submitted", { score, rank: res.rank, mode });
      void qc.invalidateQueries({ queryKey: mode === "daily" ? ["daily-leaderboard"] : ["leaderboard"] });
    },
  });

  if (phase !== "gameover") return null;

  const canSubmit = /^[A-Z]{3}$/.test(initials.toUpperCase());
  // Daily: always show the form so every player can post their attempt.
  // Free play: only when they crack the top 100.
  const showInitialsForm =
    !submitted && score > 0 && (mode === "daily" ? true : !!qualify?.qualifies);
  const top10 = mode === "daily" ? dailyTop10 : freeTop10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 text-center shadow-2xl">
        <h2 className="text-3xl font-extrabold text-white">Game Over</h2>
        {mode === "daily" && dailyDate && (
          <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
            Daily Puzzle · {dailyDate}
          </div>
        )}
        {isNewBest && (
          <div className="mt-2 animate-pulse text-sm font-bold uppercase tracking-widest text-amber-300">
            ★ New Personal Best ★
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-3 text-left">
          <Stat label="Score" value={score.toLocaleString()} />
          <Stat label="Best" value={best.toLocaleString()} />
          <Stat label="Lines" value={lines} />
          <Stat label="Words" value={wordsSolved} />
        </div>

        {showInitialsForm && (
          <div className="mt-6 rounded-xl border border-amber-400/40 bg-amber-500/10 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-amber-300">
              {mode === "daily" ? "🗓️ Post your daily score" : "🏆 You made the top 100!"}
            </div>
            <div className="mt-1 text-xs text-slate-300">Enter your initials</div>
            <input
              autoFocus
              maxLength={3}
              inputMode="text"
              value={initials}
              onChange={(e) => setInitials(e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 3))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSubmit && !submitMut.isPending) {
                  e.preventDefault();
                  submitMut.mutate();
                }
              }}
              className="mt-2 w-32 rounded-lg border border-amber-400/40 bg-slate-950/60 px-3 py-2 text-center font-mono text-3xl font-extrabold tracking-[0.5em] text-amber-200 outline-none focus:border-amber-400"
              placeholder="AAA"
              aria-label="Enter 3-letter initials"
            />
            {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
            <button
              disabled={!canSubmit || submitMut.isPending}
              onClick={() => submitMut.mutate()}
              className="mt-3 w-full rounded-lg bg-amber-400 px-4 py-2 font-bold text-slate-900 hover:bg-amber-300 disabled:opacity-50"
            >
              {submitMut.isPending ? "Submitting…" : "Submit Score"}
            </button>
          </div>
        )}

        {submitted && (
          <div className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            {submitted.rank
              ? mode === "daily"
                ? <>Submitted! You're <span className="font-extrabold">#{submitted.rank}</span> today.</>
                : <>Submitted! You're <span className="font-extrabold">#{submitted.rank}</span> all-time.</>
              : <>Score already submitted.</>}
          </div>
        )}

        {mode === "free" && qualify && !qualify.qualifies && score > 0 && (
          <p className="mt-4 text-xs text-slate-400">
            Beat <span className="font-bold text-slate-200">{qualify.cutoff.toLocaleString()}</span> to reach the leaderboard.
          </p>
        )}

        {top10.length > 0 && (
          <div className="mt-5 text-left">
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              {mode === "daily" ? "Today's Top 10" : "Top 10"}
            </div>
            <LeaderboardList rows={top10.slice(0, 10)} compact />
          </div>
        )}

        <div className="mt-6 flex gap-2">
          {mode === "daily" ? (
            <Link
              to="/"
              className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 font-bold text-slate-900 hover:bg-emerald-400"
              onClick={dismiss}
            >
              Back to Home
            </Link>
          ) : (
            <button
              className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 font-bold text-slate-900 hover:bg-emerald-400"
              onClick={() => restart({ mode: "free" })}
            >
              Play Again
            </button>
          )}
          <Link
            to="/leaderboard"
            className="rounded-lg border border-white/10 bg-slate-800 px-4 py-2 font-bold text-white hover:bg-slate-700"
            onClick={dismiss}
          >
            Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-800/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-slate-400">{label}</div>
      <div className="text-xl font-bold text-white">{value}</div>
    </div>
  );
}