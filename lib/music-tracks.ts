import type { MusicTrackId } from "@/types";

export type MusicCredit = {
  title: string;
  artist: string;
  sourceUrl: string;
  licenseUrl: string;
};

export type MusicTrack = {
  id: MusicTrackId;
  label: string;
  src: string | null;
  credit: MusicCredit | null;
};

export const NONE_TRACK: MusicTrack = {
  id: "none",
  label: "None",
  src: null,
  credit: null,
};

export const MUSIC_TRACKS: readonly MusicTrack[] = [
  NONE_TRACK,
  {
    id: "dawn",
    label: "Dawn",
    src: "/audio/dawn.mp3",
    credit: {
      title: "There is Romance",
      artist: "Kevin MacLeod",
      sourceUrl: "https://incompetech.com/",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    },
  },
  {
    id: "rain",
    label: "Rain",
    src: "/audio/rain.mp3",
    credit: {
      title: "What Is Love",
      artist: "Kevin MacLeod",
      sourceUrl: "https://incompetech.com/",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    },
  },
  {
    id: "ember",
    label: "Ember",
    src: "/audio/ember.mp3",
    credit: {
      title: "Touching Moments Four - Melody",
      artist: "Kevin MacLeod",
      sourceUrl: "https://incompetech.com/",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    },
  },
];

export function isMusicTrackId(value: string): value is MusicTrackId {
  return MUSIC_TRACKS.some((track) => track.id === value);
}

export function getMusicTrack(id: MusicTrackId): MusicTrack {
  return MUSIC_TRACKS.find((track) => track.id === id) ?? NONE_TRACK;
}
