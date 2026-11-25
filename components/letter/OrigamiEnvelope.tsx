import type { KeyboardEvent } from "react";
import { LetterPaper } from "@/components/letter/LetterPaper";
import { resolveLetter } from "@/lib/letter-state";
import type { LetterPhase, LetterState } from "@/types";

type Props = {
  phase: LetterPhase;
  letter: LetterState;
  localPreview: string;
  onUnfold: () => void;
};

function getPhaseClass(phase: LetterPhase): string {
  if (phase === "opening") {
    return "is-opening";
  }
  if (phase === "open") {
    return "is-open";
  }
  if (phase === "closing") {
    return "is-closing";
  }
  return "";
}

export function OrigamiEnvelope({
  phase,
  letter,
  localPreview,
  onUnfold,
}: Props) {
  const clean = resolveLetter(letter);
  const buttonPhase = phase === "opening" || phase === "open" ? false : true;

  function handleUnfold(): void {
    if (phase === "closed") {
      onUnfold();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>): void {
    if (phase === "closed" && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onUnfold();
    }
  }

  return (
    <article
      id="origami-letter"
      className={`origami-letter ${getPhaseClass(phase)}`.trim()}
      role={buttonPhase ? "button" : undefined}
      tabIndex={buttonPhase ? 0 : undefined}
      aria-label={buttonPhase ? "Tap to unfold letter" : undefined}
      aria-expanded={!buttonPhase}
      onClick={handleUnfold}
      onKeyDown={handleKeyDown}
    >
      <div className="paper-grain-overlay" aria-hidden="true" />

      <div className="paper-creases" aria-hidden="true">
        <div className="crease-h-top" />
        <div className="crease-h-bottom" />
      </div>

      <LetterPaper letter={clean} localPreview={localPreview} />

      <div className="origami-flaps-layer" aria-hidden="true">
        <div className="fold-left" />
        <div className="fold-right" />
        <div className="fold-bottom" />
        <div className="fold-top" />
      </div>

      <div className="closed-cover-label">
        <p className="mb-0.5 text-[11px] tracking-widest italic text-ink-quiet sm:text-xs">
          for
        </p>
        <h1 className="truncate font-handwriting font-semibold text-ink-sepia">
          {clean.recipient}
        </h1>
      </div>

      <div className="seal-glow" aria-hidden="true" />
      <div className="wax-seal" aria-hidden="true">
        <span className="wax-seal-mark">JM</span>
      </div>
    </article>
  );
}
