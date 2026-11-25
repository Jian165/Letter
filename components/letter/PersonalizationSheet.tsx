"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, MouseEvent } from "react";
import {
  clampText,
  createLetter,
  LETTER_LIMITS,
  resolveLetter,
} from "@/lib/letter-state";
import { getMusicTrack, MUSIC_TRACKS } from "@/lib/music-tracks";
import type {
  LetterState,
  MusicSettings,
  MusicTrackId,
} from "@/types";

type CommitAction = "preview" | "copy";

type Props = {
  open: boolean;
  sharedMode: boolean;
  letter: LetterState;
  currentLocalPreview: string;
  musicSettings: MusicSettings;
  onClose: () => void;
  onPreviewTrack: (trackId: MusicTrackId) => void;
  onToast: (message: string) => void;
  onCommit: (
    nextLetter: LetterState,
    nextLocalPreview: string,
    nextMusic: MusicSettings,
    action: CommitAction,
  ) => Promise<void> | void;
};

export function PersonalizationSheet({
  open,
  sharedMode,
  letter,
  currentLocalPreview,
  musicSettings,
  onClose,
  onPreviewTrack,
  onToast,
  onCommit,
}: Props) {
  const [draft, setDraft] = useState<LetterState>(() => createLetter());
  const [localPreview, setLocalPreview] = useState("");
  const [settings, setSettings] = useState<MusicSettings>(musicSettings);
  const selectedTrack = getMusicTrack(settings.trackId);
  const photoFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = window.setTimeout(() => {
      setDraft(createLetter(sharedMode ? {} : letter));
      setLocalPreview(sharedMode ? "" : currentLocalPreview);
      setSettings({ ...musicSettings });
      if (photoFileRef.current) {
        photoFileRef.current.value = "";
      }
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [currentLocalPreview, letter, musicSettings, open, sharedMode]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  function updateField(field: keyof LetterState, value: string): void {
    setDraft((current) => ({
      ...current,
      [field]: clampText(value, LETTER_LIMITS[field]),
    }));
  }

  function handlePhotoFile(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (typeof FileReader === "undefined") {
      onToast("Photo preview is unavailable in this browser");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        onToast("Could not attach that photo");
        return;
      }
      setLocalPreview(reader.result);
      setDraft((current) => ({ ...current, photoUrl: "" }));
      if (photoFileRef.current) {
        photoFileRef.current.value = "";
      }
      onToast("Local photo attached for preview");
    };
    reader.onerror = () => {
      console.warn("[PersonalizationSheet] photo read failed", reader.error);
      onToast("Could not attach that photo");
    };
    reader.readAsDataURL(file);
  }

  function clearPhoto(): void {
    setLocalPreview("");
    setDraft((current) => ({ ...current, photoUrl: "" }));
    if (photoFileRef.current) {
      photoFileRef.current.value = "";
    }
    onToast("Photo removed");
  }

  function selectTrack(trackId: MusicTrackId): void {
    setSettings((current) => ({ ...current, trackId }));
    onPreviewTrack(trackId);
  }

  function handleVolume(event: ChangeEvent<HTMLInputElement>): void {
    const parsed = Number(event.target.value);
    const volume = Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 0;
    setSettings((current) => ({ ...current, volume }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void onCommit(resolveLetter(draft), localPreview, settings, "preview");
  }

  function handleCopy(): void {
    void onCommit(resolveLetter(draft), localPreview, settings, "copy");
  }

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>): void {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className={`editor-backdrop ${open ? "active" : ""}`.trim()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-heading"
      aria-hidden={!open}
      onClick={handleBackdropClick}
    >
      <div className="editor-sheet">
        <div className="flex items-center justify-between border-b border-ink-hairline pb-3">
          <div>
            <h3
              id="editor-heading"
              className="font-handwriting text-3xl font-semibold text-ink-sepia"
            >
              Write a Sunrise Note
            </h3>
            <p className="text-xs text-ink-quiet">
              Creates a private link containing your letter.
            </p>
          </div>
          <button
            type="button"
            className="editor-close"
            aria-label="Close"
            onClick={onClose}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="input-recipient"
              className="mb-1 block text-xs italic text-ink-soft"
            >
              To (Recipient)
            </label>
            <input
              id="input-recipient"
              className="form-control"
              type="text"
              maxLength={LETTER_LIMITS.recipient}
              placeholder="e.g., Maya, Mom, Sam"
              value={draft.recipient}
              onChange={(event) => updateField("recipient", event.target.value)}
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label
                htmlFor="input-message"
                className="block text-xs italic text-ink-soft"
              >
                Your Message
              </label>
              <span className="text-xs text-ink-faint">
                {draft.message.length} / {LETTER_LIMITS.message}
              </span>
            </div>
            <textarea
              id="input-message"
              className="form-control resize-none leading-relaxed"
              rows={8}
              maxLength={LETTER_LIMITS.message}
              placeholder="Write something warm and personal..."
              value={draft.message}
              onChange={(event) => updateField("message", event.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="input-sender"
              className="mb-1 block text-xs italic text-ink-soft"
            >
              From (Your Signature)
            </label>
            <input
              id="input-sender"
              className="form-control"
              type="text"
              maxLength={LETTER_LIMITS.sender}
              placeholder="e.g., With love, Leo"
              value={draft.sender}
              onChange={(event) => updateField("sender", event.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="input-photo-url"
              className="mb-1 block text-xs italic text-ink-soft"
            >
              Optional Keepsake Photo URL
            </label>
            <div className="flex gap-2">
              <input
                id="input-photo-url"
                className="form-control form-control-compact min-w-0 flex-1"
                type="text"
                maxLength={LETTER_LIMITS.photoUrl}
                placeholder="Image URL or local file name"
                value={draft.photoUrl}
                onChange={(event) => {
                  updateField("photoUrl", event.target.value);
                  setLocalPreview("");
                }}
              />
              <label className="flex shrink-0 cursor-pointer items-center rounded-xl border border-ink-edge bg-paper-white/75 px-3 py-2 text-xs text-ink-sepia transition hover:bg-paper-white">
                <span>Upload</span>
                <input
                  ref={photoFileRef}
                  id="input-photo-file"
                  className="hidden"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoFile}
                />
              </label>
              <button
                type="button"
                className="shrink-0 rounded-xl border border-ink-edge bg-paper-white/75 px-2.5 py-2 text-xs text-ink-soft transition hover:bg-paper-white"
                title="Remove photo"
                onClick={clearPhoto}
              >
                Clear
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="input-caption"
              className="mb-1 block text-xs italic text-ink-soft"
            >
              Polaroid Caption
            </label>
            <input
              id="input-caption"
              className="form-control"
              type="text"
              maxLength={LETTER_LIMITS.caption}
              placeholder="e.g., my favorite morning view ☀️"
              value={draft.caption}
              onChange={(event) => updateField("caption", event.target.value)}
            />
          </div>

          <div className="border-t border-ink-hairline pt-4">
            <p className="mb-2 block text-xs italic text-ink-soft">
              Background music
            </p>
            <div className="flex flex-wrap gap-2">
              {MUSIC_TRACKS.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  className={`music-option ${
                    settings.trackId === track.id ? "selected" : ""
                  }`.trim()}
                  aria-pressed={settings.trackId === track.id}
                  onClick={() => selectTrack(track.id)}
                >
                  {track.label}
                </button>
              ))}
            </div>
            {selectedTrack.credit ? (
              <p className="mt-2 text-xs leading-relaxed text-ink-faint">
                Music:{" "}
                <a
                  className="underline decoration-ink-edge underline-offset-2 hover:text-terracotta"
                  href={selectedTrack.credit.sourceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {selectedTrack.credit.title}
                </a>{" "}
                by {selectedTrack.credit.artist} ·{" "}
                <a
                  className="underline decoration-ink-edge underline-offset-2 hover:text-terracotta"
                  href={selectedTrack.credit.licenseUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  CC BY 4.0
                </a>
              </p>
            ) : null}
            <div className="mt-3 space-y-2">
              <label
                htmlFor="music-volume"
                className="block text-xs italic text-ink-soft"
              >
                Volume
              </label>
              <input
                id="music-volume"
                className="volume-control"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={settings.volume}
                onChange={handleVolume}
              />
              <label className="flex items-center gap-2 text-xs text-ink-soft">
                <input
                  type="checkbox"
                  checked={settings.muted}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      muted: event.target.checked,
                    }))
                  }
                />
                Mute background music
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 pt-2 sm:flex-row">
            <button
              type="submit"
              className="form-button form-button-primary flex-1"
            >
              Seal &amp; Preview
            </button>
            <button
              type="button"
              className="form-button form-button-copy flex items-center justify-center gap-1.5"
              onClick={handleCopy}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              <span>Copy Share Link</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
