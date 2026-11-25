import { MusicPill } from "@/components/letter/MusicPill";
import type { MusicTrackId } from "@/types";

type Props = {
  visible: boolean;
  sealed: boolean;
  sharedMode: boolean;
  musicTrackId: MusicTrackId;
  musicPlaying: boolean;
  onFoldBack: () => void;
  onPersonalize: () => void;
  onToggleMusic: () => void;
};

export function LetterActions({
  visible,
  sealed,
  sharedMode,
  musicTrackId,
  musicPlaying,
  onFoldBack,
  onPersonalize,
  onToggleMusic,
}: Props) {
  return (
    <nav
      className={`subtle-footer-actions ${visible ? "visible" : ""}`.trim()}
      aria-label="Letter actions"
      aria-hidden={!visible}
    >
      <button
        type="button"
        className="ghost-link"
        disabled={!visible}
        onClick={onFoldBack}
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <span>Fold back</span>
      </button>

      {!sealed ? (
        <>
          <span className="text-xs text-ink-hairline" aria-hidden="true">
            &bull;
          </span>

          <button
            type="button"
            className="ghost-link"
            disabled={!visible}
            onClick={onPersonalize}
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            <span>{sharedMode ? "Reply / Write one" : "Personalize"}</span>
          </button>
        </>
      ) : null}

      {musicTrackId !== "none" ? (
        <>
          <span className="text-xs text-ink-hairline" aria-hidden="true">
            &bull;
          </span>
          <MusicPill
            playing={musicPlaying}
            disabled={!visible}
            onToggle={onToggleMusic}
          />
        </>
      ) : null}
    </nav>
  );
}
