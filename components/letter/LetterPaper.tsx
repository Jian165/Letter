"use client";

import { useState } from "react";
import { resolveLetter } from "@/lib/letter-state";
import type { LetterState } from "@/types";

type Props = {
  letter: LetterState;
  localPreview: string;
};

export function LetterPaper({ letter, localPreview }: Props) {
  const clean = resolveLetter(letter);
  const activePhoto = localPreview || clean.photoUrl;
  const [photoState, setPhotoState] = useState({
    src: activePhoto,
    visible: true,
  });
  const dateLabel = new Date().toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const photoVisible = photoState.src === activePhoto ? photoState.visible : true;

  return (
    <div className="letter-ink-content">
      <div className="letter-ink-inner">
        <div className="paper-creases" aria-hidden="true">
          <div className="crease-h-top" />
          <div className="crease-h-bottom" />
        </div>

        <div className="mb-5 flex items-center justify-between text-ink-quiet">
          <span className="text-xs tracking-wide italic sm:text-sm">
            {dateLabel}
          </span>
          <svg
            className="h-5 w-5 text-terracotta/75 sm:h-6 sm:w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v2m0 0a5 5 0 015 5H7a5 5 0 015-5zm-8 8h16M6 16h12M4.93 6.93l1.41 1.41m11.32-1.41l-1.41 1.41"
            />
          </svg>
        </div>

        <h2 className="letter-salutation-fluid mb-4 font-handwriting font-semibold text-ink-sepia">
          Dear {clean.recipient},
        </h2>

        {activePhoto && photoVisible ? (
          <figure className="polaroid-keepsake">
            <div className="polaroid-tape" aria-hidden="true" />
            <img
              src={activePhoto}
              alt="Shared memory"
              className="keepsake-photo"
              onError={() => setPhotoState({ src: activePhoto, visible: false })}
            />
            {clean.caption ? (
              <figcaption className="mt-2 text-center font-handwriting text-base leading-none text-ink-soft sm:text-lg">
                {clean.caption}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        <div className="letter-body-fluid whitespace-pre-line font-editorial text-ink-sepia/90">
          {clean.message}
        </div>

        <div className="mt-8 flex flex-col items-end border-t border-ink-hairline pt-4 text-right">
          <span className="mb-0.5 text-xs italic text-ink-quiet sm:text-sm">
            Love always,
          </span>
          <p className="letter-signature-fluid font-handwriting font-semibold text-terracotta">
            {clean.sender}
          </p>
        </div>
      </div>
    </div>
  );
}
