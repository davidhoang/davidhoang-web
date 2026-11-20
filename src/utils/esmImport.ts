/** Bypass Vite’s shared preload helper (hosted in career-components → react-vendor). */
export function importEsm<T = unknown>(specifier: string): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval -- intentional runtime import indirection
  return new Function('s', 'return import(s)')(specifier) as Promise<T>;
}