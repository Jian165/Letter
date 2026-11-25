import type { LetterState } from "@/types";

export const LETTER_LIMITS = {
  recipient: 40,
  message: 2400,
  sender: 40,
  photoUrl: 500,
  caption: 45,
} as const;

export const DEFAULT_LETTER: LetterState = {
  recipient: "KC",
  message:
    "www.ourwedding.love\n\nI hope this message finds you well. As we approach our wedding day, I wanted to take a moment to express my heartfelt gratitude and love for you.\n\nThank you for being my rock, my confidant, and my greatest supporter. Your unwavering love and support have meant the world to me, and I feel incredibly blessed to have you by my side.\n\nI am truly looking forward to spending the rest of my life with you and creating countless beautiful memories together. I love you more than words can express, and I cannot wait to embark on this journey with you.",
  sender: "Jomar",
  photoUrl: "",
  caption: "",
};

export function clampText(value: string, max: number): string {
  return value.slice(0, max);
}

export function createLetter(source: Partial<LetterState> = {}): LetterState {
  return {
    recipient: clampText(source.recipient ?? "", LETTER_LIMITS.recipient),
    message: clampText(source.message ?? "", LETTER_LIMITS.message),
    sender: clampText(source.sender ?? "", LETTER_LIMITS.sender),
    photoUrl: clampText(source.photoUrl ?? "", LETTER_LIMITS.photoUrl),
    caption: clampText(source.caption ?? "", LETTER_LIMITS.caption),
  };
}

export function resolveLetter(state: LetterState): LetterState {
  return {
    recipient: state.recipient.trim() || DEFAULT_LETTER.recipient,
    message: state.message.trim() || DEFAULT_LETTER.message,
    sender: state.sender.trim() || DEFAULT_LETTER.sender,
    photoUrl: state.photoUrl.trim(),
    caption: state.caption.trim(),
  };
}
