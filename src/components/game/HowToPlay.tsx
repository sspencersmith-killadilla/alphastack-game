export function HowToPlay() {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/60 p-3 text-xs leading-relaxed text-slate-300">
      <div className="mb-1.5 text-sm font-bold text-white">How to Play</div>
      <ul className="space-y-1">
        <li>🟩 Guess the hidden word</li>
        <li>↓ Wrong guess = piece falls 1 row</li>
        <li>✓ Correct = unlock movement</li>
        <li>← → rotate &amp; place piece</li>
        <li>Space = hard drop</li>
        <li>🏆 Clear rows for points!</li>
        <li className="text-slate-500">Only solved-word tiles score.</li>
      </ul>
    </div>
  );
}