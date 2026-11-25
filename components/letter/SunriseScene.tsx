import type { Ref } from "react";
import { MotesCanvas } from "@/components/letter/MotesCanvas";
import type { MotesHandle } from "@/types";

type Props = {
  motesRef: Ref<MotesHandle>;
};

export function SunriseScene({ motesRef }: Props) {
  return (
    <>
      <div className="sunrise-sky-layer" aria-hidden="true" />
      <div className="horizon-bloom" aria-hidden="true" />
      <div className="predawn-stars" aria-hidden="true" />
      <div className="sunrise-orb" aria-hidden="true" />
      <MotesCanvas motesRef={motesRef} />
    </>
  );
}
