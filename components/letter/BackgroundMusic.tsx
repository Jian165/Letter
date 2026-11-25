"use client";

import { useCallback, useEffect, useImperativeHandle, useRef } from "react";
import type { Ref } from "react";
import { withBasePath } from "@/lib/asset-path";
import { getMusicTrack } from "@/lib/music-tracks";
import type { MusicHandle, MusicTrackId } from "@/types";

type Props = {
  musicRef: Ref<MusicHandle>;
  volume: number;
  muted: boolean;
  onPlayStateChange: (playing: boolean) => void;
  onError: () => void;
};

function getFadeDurationMs(): number {
  const raw = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--duration-music-fade")
    .trim();
  const seconds = Number.parseFloat(raw);
  return Number.isFinite(seconds) ? seconds * 1000 : 0;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function BackgroundMusic({
  musicRef,
  volume,
  muted,
  onPlayStateChange,
  onError,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeFrameRef = useRef<number | null>(null);
  const errorReportedRef = useRef(false);
  const volumeRef = useRef(volume);
  const mutedRef = useRef(muted);
  const callbacksRef = useRef({ onPlayStateChange, onError });

  useEffect(() => {
    callbacksRef.current = { onPlayStateChange, onError };
  }, [onPlayStateChange, onError]);

  useEffect(() => {
    volumeRef.current = volume;
    mutedRef.current = muted;
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.muted = muted;
    if (fadeFrameRef.current === null) {
      audio.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  const cancelFade = useCallback((): void => {
    if (fadeFrameRef.current !== null) {
      window.cancelAnimationFrame(fadeFrameRef.current);
      fadeFrameRef.current = null;
    }
  }, []);

  const desiredVolume = useCallback((): number => {
    if (mutedRef.current) {
      return 0;
    }
    return Math.min(1, Math.max(0, volumeRef.current));
  }, []);

  const fadeVolume = useCallback(
    (target: number, onComplete?: () => void): void => {
      cancelFade();
      const audio = audioRef.current;
      if (!audio) {
        return;
      }

      const durationMs = getFadeDurationMs();
      if (durationMs <= 0 || prefersReducedMotion()) {
        audio.volume = target;
        onComplete?.();
        return;
      }

      const startVolume = audio.volume;
      const startTime = performance.now();

      const step = (now: number): void => {
        const progress = Math.min((now - startTime) / durationMs, 1);
        audio.volume = startVolume + (target - startVolume) * progress;
        if (progress < 1) {
          fadeFrameRef.current = window.requestAnimationFrame(step);
          return;
        }
        fadeFrameRef.current = null;
        onComplete?.();
      };

      fadeFrameRef.current = window.requestAnimationFrame(step);
    },
    [cancelFade],
  );

  const stop = useCallback((): void => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    fadeVolume(0, () => {
      try {
        audio.pause();
      } catch (error) {
        console.warn("[BackgroundMusic] pause failed", error);
      }
      callbacksRef.current.onPlayStateChange(false);
    });
  }, [fadeVolume]);

  const reportPlayFailure = useCallback((error: unknown): void => {
    if (error instanceof Error && error.name === "NotAllowedError") {
      return;
    }
    console.warn("[BackgroundMusic] playback failed", error);
    callbacksRef.current.onPlayStateChange(false);
  }, []);

  const start = useCallback(
    (trackId: MusicTrackId): void => {
      const audio = audioRef.current;
      if (!audio) {
        return;
      }

      const track = getMusicTrack(trackId);
      const src = track.src ? withBasePath(track.src) : null;
      if (!src) {
        stop();
        return;
      }

      try {
        if (audio.getAttribute("src") !== src) {
          errorReportedRef.current = false;
          audio.src = src;
          audio.load();
        }

        audio.muted = mutedRef.current;
        audio.volume = 0;

        if (typeof audio.play !== "function") {
          return;
        }

        const playPromise = audio.play();
        if (playPromise && typeof playPromise.then === "function") {
          void playPromise
            .then(() => {
              callbacksRef.current.onPlayStateChange(true);
            })
            .catch(reportPlayFailure);
        }

        fadeVolume(desiredVolume());
      } catch (error) {
        console.warn("[BackgroundMusic] start failed", error);
        callbacksRef.current.onPlayStateChange(false);
      }
    },
    [desiredVolume, fadeVolume, reportPlayFailure, stop],
  );

  const preview = useCallback(
    (trackId: MusicTrackId): void => {
      if (trackId === "none") {
        stop();
        return;
      }
      start(trackId);
    },
    [start, stop],
  );

  useImperativeHandle(musicRef, () => ({ start, stop, preview }), [
    preview,
    start,
    stop,
  ]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      cancelFade();
      if (audio) {
        try {
          audio.pause();
        } catch (error) {
          console.warn("[BackgroundMusic] pause failed", error);
        }
      }
    };
  }, [cancelFade]);

  return (
    <audio
      ref={audioRef}
      loop
      preload="none"
      aria-hidden="true"
      onError={() => {
        callbacksRef.current.onPlayStateChange(false);
        if (errorReportedRef.current) {
          return;
        }
        errorReportedRef.current = true;
        callbacksRef.current.onError();
      }}
    />
  );
}
