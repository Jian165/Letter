"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { BackgroundMusic } from "@/components/letter/BackgroundMusic";
import { LetterActions } from "@/components/letter/LetterActions";
import { OrigamiEnvelope } from "@/components/letter/OrigamiEnvelope";
import { SunriseScene } from "@/components/letter/SunriseScene";
import { ToastPill } from "@/components/letter/ToastPill";
import { playPaperAndDawnSound } from "@/lib/letter-sound";
import { DEFAULT_LETTER } from "@/lib/letter-state";
import { getMusicTrack } from "@/lib/music-tracks";
import { isSealedBuild } from "@/lib/runtime-config";
import { SEALED_LETTER, SEALED_MUSIC } from "@/lib/sealed-content";
import {
  copyToClipboard,
  decodeStateFromHash,
  encodeStateToHash,
  writeHash,
} from "@/lib/share-link";
import type {
  LetterPhase,
  LetterState,
  MotesHandle,
  MusicHandle,
  MusicSettings,
  MusicTrackId,
} from "@/types";

const DEFAULT_VOLUME = 0.7;

const PersonalizationSheet = dynamic(
  () =>
    import("@/components/letter/PersonalizationSheet").then(
      (module) => module.PersonalizationSheet,
    ),
  { ssr: false },
);

function isCoarsePointer(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches
  );
}

type MusicSnapshot = MusicSettings & {
  playing: boolean;
};

export function LetterExperience() {
  const sealed = isSealedBuild();
  const [letter, setLetter] = useState<LetterState>(() =>
    sealed ? SEALED_LETTER : DEFAULT_LETTER,
  );
  const [localPreview, setLocalPreview] = useState("");
  const [phase, setPhase] = useState<LetterPhase>("closed");
  const [sharedMode, setSharedMode] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [toastMessage, setToastMessage] = useState("Link copied to clipboard");
  const [toastVisible, setToastVisible] = useState(false);
  const [musicSettings, setMusicSettings] = useState<MusicSettings>(() =>
    sealed
      ? SEALED_MUSIC
      : {
          trackId: "none",
          volume: DEFAULT_VOLUME,
          muted: false,
        },
  );
  const [musicPlaying, setMusicPlaying] = useState(false);

  const motesRef = useRef<MotesHandle>(null);
  const musicRef = useRef<MusicHandle>(null);
  const transitionTimersRef = useRef<number[]>([]);
  const toastTimerRef = useRef<number | null>(null);
  const musicSnapshotRef = useRef<MusicSnapshot | null>(null);

  const clearTransitionTimers = useCallback((): void => {
    transitionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    transitionTimersRef.current = [];
  }, []);

  const scheduleTransition = useCallback(
    (callback: () => void, delay: number): void => {
      transitionTimersRef.current.push(window.setTimeout(callback, delay));
    },
    [],
  );

  const showToast = useCallback((message: string): void => {
    setToastMessage(message);
    setToastVisible(true);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastVisible(false);
      toastTimerRef.current = null;
    }, 2800);
  }, []);

  useEffect(() => {
    if (sealed) {
      writeHash(`${window.location.pathname}${window.location.search}`);
      return;
    }

    const decoded = decodeStateFromHash(window.location.hash);
    if (!decoded) {
      return;
    }

    const timer = window.setTimeout(() => {
      setLetter(decoded.letter);
      setSharedMode(true);
      setMusicSettings((current) => ({
        ...current,
        trackId: decoded.musicTrackId,
      }));
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [sealed]);

  useEffect(() => {
    const unfolded = phase === "opening" || phase === "open";
    document.body.classList.toggle("letter-unfolded", unfolded);
  }, [phase]);

  useEffect(() => {
    return () => {
      clearTransitionTimers();
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      document.body.classList.remove("letter-unfolded");
    };
  }, [clearTransitionTimers]);

  const handleUnfold = useCallback((): void => {
    if (phase !== "closed") {
      return;
    }

    clearTransitionTimers();
    setPhase("opening");
    playPaperAndDawnSound(true);

    if (isCoarsePointer()) {
      scheduleTransition(() => motesRef.current?.burst(), 500);
    } else {
      motesRef.current?.burst();
      musicRef.current?.start(musicSettings.trackId);
    }

    scheduleTransition(() => setPhase("open"), 480);
  }, [
    clearTransitionTimers,
    musicSettings.trackId,
    phase,
    scheduleTransition,
  ]);

  const handleFoldBack = useCallback((): void => {
    if (phase !== "open") {
      return;
    }

    clearTransitionTimers();
    setPhase("closing");
    playPaperAndDawnSound(false);
    musicRef.current?.stop();
    scheduleTransition(() => setPhase("closed"), 960);
  }, [clearTransitionTimers, phase, scheduleTransition]);

  const handleToggleMusic = useCallback((): void => {
    if (musicSettings.trackId === "none") {
      return;
    }

    if (musicPlaying) {
      musicRef.current?.stop();
      return;
    }

    musicRef.current?.start(musicSettings.trackId);
  }, [musicPlaying, musicSettings.trackId]);

  const handlePreviewTrack = useCallback((trackId: MusicTrackId): void => {
    musicRef.current?.preview(trackId);
  }, []);

  const handleOpenEditor = useCallback((): void => {
    if (sealed) {
      return;
    }

    musicSnapshotRef.current = { ...musicSettings, playing: musicPlaying };
    setEditorLoaded(true);
    setEditorOpen(true);
  }, [musicPlaying, musicSettings, sealed]);

  const handleCloseEditor = useCallback((): void => {
    setEditorOpen(false);
    const snapshot = musicSnapshotRef.current;
    if (!snapshot) {
      return;
    }

    setMusicSettings({
      trackId: snapshot.trackId,
      volume: snapshot.volume,
      muted: snapshot.muted,
    });
    if (snapshot.playing && snapshot.trackId !== "none") {
      musicRef.current?.start(snapshot.trackId);
    } else {
      musicRef.current?.stop();
    }
    musicSnapshotRef.current = null;
  }, []);

  const commitChanges = useCallback(
    async (
      nextLetter: LetterState,
      nextLocalPreview: string,
      nextMusic: MusicSettings,
      action: "preview" | "copy",
    ): Promise<void> => {
      if (sealed) {
        return;
      }

      try {
        setLetter(nextLetter);
        setLocalPreview(nextLocalPreview);
        setMusicSettings(nextMusic);
        setSharedMode(false);
        setEditorOpen(false);
        musicSnapshotRef.current = null;

        const hash = encodeStateToHash(nextLetter, nextMusic.trackId);
        writeHash(hash);

        if (action === "preview") {
          if (phase === "open") {
            handleFoldBack();
          }
          showToast("Letter folded & ready — tap to unfold");
          return;
        }

        const copied = await copyToClipboard(window.location.href);
        if (nextLocalPreview && !nextLetter.photoUrl) {
          showToast("Link copied! Use an image URL to include the photo.");
          return;
        }
        showToast(
          copied ? "Shareable letter link copied!" : "Link ready in address bar!",
        );
      } catch (error) {
        console.warn("[LetterExperience] commit failed", error);
        showToast("Could not update the letter link");
      }
    },
    [handleFoldBack, phase, sealed, showToast],
  );

  const handleMusicError = useCallback((): void => {
    showToast("Music unavailable — playing without sound");
  }, [showToast]);

  const handleSealedVolumeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const nextVolume = Number(event.target.value);
      if (!Number.isFinite(nextVolume)) {
        return;
      }
      setMusicSettings((current) => ({
        ...current,
        volume: Math.min(1, Math.max(0, nextVolume)),
        muted: false,
      }));
    },
    [],
  );

  const sealedMusicCredit = sealed
    ? getMusicTrack(musicSettings.trackId).credit
    : null;

  return (
    <>
      <SunriseScene motesRef={motesRef} motesPaused={editorOpen} />
      <BackgroundMusic
        musicRef={musicRef}
        volume={musicSettings.volume}
        muted={musicSettings.muted}
        onPlayStateChange={setMusicPlaying}
        onError={handleMusicError}
      />

      <main className="stage">
        <OrigamiEnvelope
          phase={phase}
          letter={letter}
          localPreview={localPreview}
          onUnfold={handleUnfold}
        />

        <p className="tap-hint" style={{ opacity: phase === "closed" ? 1 : 0 }}>
          Tap the seal to unfold
        </p>

        <LetterActions
          visible={phase === "open"}
          sealed={sealed}
          sharedMode={sharedMode}
          musicTrackId={musicSettings.trackId}
          musicPlaying={musicPlaying}
          onFoldBack={handleFoldBack}
          onPersonalize={handleOpenEditor}
          onToggleMusic={handleToggleMusic}
        />

        {sealed && phase === "open" && musicSettings.trackId !== "none" ? (
          <div className="sealed-volume-control">
            <label className="sealed-volume-label" htmlFor="sealed-music-volume">
              Volume
            </label>
            <input
              aria-label="Music volume"
              className="sealed-volume-slider"
              id="sealed-music-volume"
              max={1}
              min={0}
              onChange={handleSealedVolumeChange}
              step={0.01}
              type="range"
              value={musicSettings.volume}
            />
          </div>
        ) : null}

        {sealed && phase === "open" && sealedMusicCredit ? (
          <p className="sealed-music-credit">
            Music:{" "}
            <a
              href={sealedMusicCredit.sourceUrl}
              rel="noreferrer"
              target="_blank"
            >
              {sealedMusicCredit.title}
            </a>{" "}
            by {sealedMusicCredit.artist} ·{" "}
            <a
              href={sealedMusicCredit.licenseUrl}
              rel="noreferrer"
              target="_blank"
            >
              CC BY 4.0
            </a>
          </p>
        ) : null}
      </main>

      {sealed || !editorLoaded ? null : (
        <PersonalizationSheet
          open={editorOpen}
          sharedMode={sharedMode}
          letter={letter}
          currentLocalPreview={localPreview}
          musicSettings={musicSettings}
          onClose={handleCloseEditor}
          onPreviewTrack={handlePreviewTrack}
          onToast={showToast}
          onCommit={commitChanges}
        />
      )}

      <ToastPill message={toastMessage} visible={toastVisible} />
    </>
  );
}
