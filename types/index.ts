export type LetterPhase = "closed" | "opening" | "open" | "closing";

export type MusicTrackId = "dawn" | "rain" | "ember" | "none";

export type LetterState = {
  recipient: string;
  message: string;
  sender: string;
  photoUrl: string;
  caption: string;
};

export type MusicSettings = {
  trackId: MusicTrackId;
  volume: number;
  muted: boolean;
};

export type MotesHandle = {
  burst: () => void;
};

export type MusicHandle = {
  start: (trackId: MusicTrackId) => void;
  stop: () => void;
  preview: (trackId: MusicTrackId) => void;
};
