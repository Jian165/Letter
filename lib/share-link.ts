import {
  createLetter,
  DEFAULT_LETTER,
  LETTER_LIMITS,
  resolveLetter,
} from "@/lib/letter-state";
import { isMusicTrackId } from "@/lib/music-tracks";
import type { LetterState, MusicTrackId } from "@/types";

type DecodedShare = {
  letter: LetterState;
  musicTrackId: MusicTrackId;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function readString(value: unknown, max: number): string | null {
  return typeof value === "string" ? value.slice(0, max) : null;
}

function encodeBase64(text: string): string {
  if (typeof TextEncoder === "undefined" || typeof btoa !== "function") {
    return "";
  }

  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function decodeBase64(encoded: string): string {
  if (typeof atob !== "function" || typeof TextDecoder === "undefined") {
    return "";
  }

  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new TextDecoder().decode(bytes);
}

function legacyCopy(text: string): boolean {
  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "fixed";
  helper.style.opacity = "0";
  document.body.appendChild(helper);

  try {
    if (typeof document.execCommand !== "function") {
      return false;
    }
    helper.select();
    helper.setSelectionRange(0, helper.value.length);
    return document.execCommand("copy");
  } catch (error) {
    console.warn("[share-link] legacy clipboard copy failed", error);
    return false;
  } finally {
    helper.remove();
  }
}

export function encodeStateToHash(
  state: LetterState,
  musicTrackId: MusicTrackId,
): string {
  try {
    const clean = resolveLetter(state);
    const trackId = isMusicTrackId(musicTrackId) ? musicTrackId : "none";
    const payload = {
      r: clean.recipient,
      m: clean.message,
      s: clean.sender,
      p: clean.photoUrl,
      ...(clean.caption ? { c: clean.caption } : {}),
      ...(trackId !== "none" ? { t: trackId } : {}),
    };
    const encoded = encodeBase64(JSON.stringify(payload));
    return encoded ? `#card=${encoded}` : "";
  } catch (error) {
    console.warn("[share-link] could not encode state", error);
    return "";
  }
}

export function decodeStateFromHash(hash: string): DecodedShare | null {
  try {
    if (!hash.startsWith("#card=")) {
      return null;
    }

    const encoded = hash.slice("#card=".length);
    if (!encoded) {
      return null;
    }

    const decoded = decodeBase64(encoded);
    if (!decoded) {
      return null;
    }

    const parsed: unknown = JSON.parse(decoded);
    if (!isRecord(parsed)) {
      return null;
    }

    let musicTrackId: MusicTrackId = "none";
    if (typeof parsed.t === "string") {
      if (isMusicTrackId(parsed.t)) {
        musicTrackId = parsed.t;
      } else {
        console.warn("[share-link] unknown music track id", parsed.t);
      }
    }

    const photoUrl = hasOwn(parsed, "p")
      ? readString(parsed.p, LETTER_LIMITS.photoUrl) ?? ""
      : DEFAULT_LETTER.photoUrl;
    const caption = hasOwn(parsed, "c")
      ? readString(parsed.c, LETTER_LIMITS.caption) ?? ""
      : DEFAULT_LETTER.caption;

    return {
      letter: createLetter({
        recipient:
          readString(parsed.r, LETTER_LIMITS.recipient) ?? DEFAULT_LETTER.recipient,
        message:
          readString(parsed.m, LETTER_LIMITS.message) ?? DEFAULT_LETTER.message,
        sender: readString(parsed.s, LETTER_LIMITS.sender) ?? DEFAULT_LETTER.sender,
        photoUrl,
        caption,
      }),
      musicTrackId,
    };
  } catch (error) {
    console.warn("[share-link] invalid share hash", error);
    return null;
  }
}

export function writeHash(hash: string): void {
  try {
    if (typeof window === "undefined" || !window.history?.replaceState) {
      return;
    }
    window.history.replaceState(null, "", hash);
  } catch (error) {
    console.warn("[share-link] could not update address bar", error);
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    console.warn("[share-link] clipboard API failed", error);
  }

  if (typeof document === "undefined") {
    return false;
  }
  return legacyCopy(text);
}
