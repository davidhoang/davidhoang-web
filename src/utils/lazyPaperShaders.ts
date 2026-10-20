/** Shared dynamic import for @paper-design/shaders-react (keeps ~110KiB off default-theme loads). */
let loadPromise: Promise<typeof import('@paper-design/shaders-react')> | null = null;

export function loadPaperShaders() {
  if (!loadPromise) {
    loadPromise = import('@paper-design/shaders-react');
  }
  return loadPromise;
}
