export function preload(key: string): string {
  const dotIndex = key.indexOf(".");
  if (dotIndex <= 0) return "";
  const namespace = key.substring(0, dotIndex);
  return namespace;
}

export function getPreloadLinks(
  namespaces: string[],
  locale: string,
  basePath: string = "/assets"
): string {
  return namespaces
    .map(
      (ns) =>
        `<link rel="modulepreload" href="${basePath}/${locale}/${ns}.json" />`
    )
    .join("\n");
}
