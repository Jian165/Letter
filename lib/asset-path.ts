const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");

export function withBasePath(src: string): string {
  if (!src || !src.startsWith("/") || src.startsWith("//")) {
    return src;
  }

  return `${basePath}${src}`;
}
