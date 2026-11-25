type Props = {
  playing: boolean;
  disabled: boolean;
  onToggle: () => void;
};

export function MusicPill({ playing, disabled, onToggle }: Props) {
  return (
    <button
      type="button"
      className="ghost-link disabled:opacity-50"
      aria-pressed={playing}
      aria-label={playing ? "Pause music" : "Play music"}
      disabled={disabled}
      onClick={onToggle}
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11 5L6 9H3v6h3l5 4V5z"
        />
        {playing ? (
          <path
            strokeLinecap="round"
            d="M15.5 8.5a5 5 0 010 7m2.5-9.5a8.5 8.5 0 010 12"
          />
        ) : (
          <path strokeLinecap="round" d="M15 9a4 4 0 010 6" />
        )}
      </svg>
      <span>{playing ? "Pause music" : "Play music"}</span>
    </button>
  );
}
