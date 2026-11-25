export function isSealedBuild(): boolean {
  return (
    process.env.NEXT_PUBLIC_SEALED === "true" ||
    process.env.NEXT_PUBLIC_SEALED === "1"
  );
}
