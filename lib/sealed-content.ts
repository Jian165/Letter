import type { LetterState, MusicSettings, MusicTrackId } from "@/types";

export const SEALED_TRACK_ID: MusicTrackId = "dawn";

export const SEALED_LETTER: LetterState = {
  recipient: "KC",
  message:
    "www.ourwedding.love\n\nI hope this message finds you well. As we approach our wedding day, I wanted to take a moment to express my heartfelt gratitude and love for you.\n\nThank you for being my rock, my confidant, and my greatest supporter. Your unwavering love and support have meant the world to me, and I feel incredibly blessed to have you by my side.\n\nI am truly looking forward to spending the rest of my life with you and creating countless beautiful memories together. I love you more than words can express, and I cannot wait to embark on this journey with you.",
  sender: "Jomar",
  photoUrl: "",
  caption: "",
};

export const SEALED_MUSIC: MusicSettings = {
  trackId: SEALED_TRACK_ID,
  volume: 0.7,
  muted: false,
};
