"use client";

import { useCallback, useEffect, useImperativeHandle, useRef } from "react";
import type { Ref } from "react";
import type { MotesHandle } from "@/types";

type Props = {
  motesRef?: Ref<MotesHandle>;
  paused?: boolean;
};

type Mote = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  life: number;
  color: string;
};

function getMoteColors(): string[] {
  const computed = window.getComputedStyle(document.documentElement);
  return ["--color-star", "--color-sunrise-mid", "--color-terracotta"]
    .map((name) => computed.getPropertyValue(name).trim())
    .filter((color) => color.length > 0);
}

function createMote(
  width: number,
  height: number,
  colors: string[],
  burst: boolean,
): Mote {
  const colorIndex = Math.floor(Math.random() * colors.length);
  return {
    x: burst
      ? width / 2 + (Math.random() - 0.5) * 140
      : Math.random() * width,
    y: burst
      ? height / 2 + (Math.random() - 0.5) * 100
      : Math.random() * height,
    vx: burst
      ? (Math.random() - 0.5) * 1.6
      : (Math.random() - 0.5) * 0.22,
    vy: burst
      ? -Math.random() * 1.5 - 0.3
      : -Math.random() * 0.28 - 0.08,
    r: Math.random() * 2.6 + 1.1,
    alpha: Math.random() * 0.6 + 0.3,
    life: burst ? 140 : Number.POSITIVE_INFINITY,
    color: colors[colorIndex] ?? "",
  };
}

function drawMotes(
  context: CanvasRenderingContext2D,
  motes: Mote[],
  advance: boolean,
): void {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  for (let index = motes.length - 1; index >= 0; index -= 1) {
    const mote = motes[index];
    if (advance) {
      mote.x += mote.vx;
      mote.y += mote.vy;

      if (mote.life !== Number.POSITIVE_INFINITY) {
        mote.life -= 1;
        if (mote.life <= 0) {
          motes.splice(index, 1);
          continue;
        }
      } else {
        if (mote.y < -10) {
          mote.y = context.canvas.height + 10;
        }
        if (mote.x < -10) {
          mote.x = context.canvas.width + 10;
        }
        if (mote.x > context.canvas.width + 10) {
          mote.x = -10;
        }
      }
    }

    context.beginPath();
    context.globalAlpha = mote.alpha;
    context.fillStyle = mote.color;
    context.arc(mote.x, mote.y, mote.r, 0, Math.PI * 2);
    context.fill();
  }

  context.globalAlpha = 1;
}

export function MotesCanvas({ motesRef, paused = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const motesInternalRef = useRef<Mote[]>([]);
  const colorsRef = useRef<string[]>([]);
  const frameRef = useRef<number>(0);
  const reducedMotionRef = useRef(false);

  const spawnBurst = useCallback((): void => {
    const canvas = canvasRef.current;
    if (!canvas || reducedMotionRef.current) {
      return;
    }

    for (let index = 0; index < 16; index += 1) {
      motesInternalRef.current.push(
        createMote(canvas.width, canvas.height, colorsRef.current, true),
      );
    }
  }, []);

  useImperativeHandle(motesRef, () => ({ burst: spawnBurst }), [spawnBurst]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      console.warn("[MotesCanvas] 2D context unavailable");
      return;
    }

    contextRef.current = context;
    colorsRef.current = getMoteColors();
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = motionQuery.matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const frameInterval = coarsePointer ? 33 : 16;
    const moteLimit = coarsePointer ? 12 : 24;
    const moteDivisor = coarsePointer ? 40 : 24;
    let resizeFrame = 0;
    let lastFrameTime = 0;

    const resize = (): void => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (canvas.width === width && canvas.height === height) {
        return;
      }
      canvas.width = width;
      canvas.height = height;
    };

    const scheduleResize = (): void => {
      if (resizeFrame !== 0) {
        return;
      }
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        resize();
      });
    };

    const stop = (): void => {
      if (frameRef.current !== 0) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
    };

    const animate = (now: number): void => {
      frameRef.current = 0;
      if (document.hidden || paused) {
        return;
      }

      if (now - lastFrameTime >= frameInterval) {
        lastFrameTime = now;
        drawMotes(context, motesInternalRef.current, true);
      }

      frameRef.current = window.requestAnimationFrame(animate);
    };

    const start = (): void => {
      if (reducedMotionRef.current || document.hidden || paused || frameRef.current !== 0) {
        return;
      }
      lastFrameTime = 0;
      frameRef.current = window.requestAnimationFrame(animate);
    };

    const handleVisibility = (): void => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    };

    resize();
    if (motesInternalRef.current.length === 0) {
      const total = Math.min(moteLimit, Math.floor(window.innerWidth / moteDivisor));
      motesInternalRef.current = Array.from({ length: total }, () =>
        createMote(canvas.width, canvas.height, colorsRef.current, false),
      );
    }

    if (reducedMotionRef.current) {
      drawMotes(context, motesInternalRef.current, false);
    } else {
      start();
    }

    window.addEventListener("resize", scheduleResize);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("resize", scheduleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (resizeFrame !== 0) {
        window.cancelAnimationFrame(resizeFrame);
      }
      stop();
      contextRef.current = null;
    };
  }, [paused]);

  useEffect(() => {
    return () => {
      motesInternalRef.current = [];
    };
  }, []);

  return <canvas id="motes-canvas" ref={canvasRef} aria-hidden="true" />;
}
