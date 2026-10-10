/**
 * Curated “reading now” links for /now — short list, updated when the page is refreshed.
 */

export type NowReadingKind = 'writing' | 'notes' | 'external';

export interface NowReadingItem {
  kind: NowReadingKind;
  /** Content collection id for writing/notes; full URL for external */
  id: string;
  /** Fallback title if the collection entry is missing at build time */
  title: string;
  note: string;
}

export const nowReading: NowReadingItem[] = [
  {
    kind: 'writing',
    id: 'optimizing-for-agents',
    title: 'Optimizing for agents',
    note: 'Agent experience as a first-class design surface on this site',
  },
  {
    kind: 'writing',
    id: 'operator-mode',
    title: 'Operator mode',
    note: 'Leading design when software creation is compressing',
  },
  {
    kind: 'notes',
    id: 'dynamic-interfaces',
    title: 'Dynamic interfaces',
    note: 'Interfaces that adapt — a thread I keep returning to',
  },
];

export function nowReadingHref(item: NowReadingItem): string {
  if (item.kind === 'writing') return `/writing/${item.id}`;
  if (item.kind === 'notes') return `/notes/${item.id}`;
  return item.id;
}
