export type TimeBucket = 'morning' | 'afternoon' | 'evening' | 'night';

export function getTimeBucket(date: Date = new Date()): TimeBucket {
  const h = date.getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
}

export const greetings: Record<TimeBucket, string> = {
  morning: 'Good morning.',
  afternoon: 'Good afternoon.',
  evening: 'Good evening.',
  night: 'Up late?',
};

export const slotLabels: Record<TimeBucket, string> = {
  morning: 'Hot off the press',
  afternoon: 'From the garden',
  evening: 'Most recent thinking',
  night: 'From the archives',
};

// Milliseconds until the next bucket boundary, so a long-open page can refresh
// without polling on a short timer.
export function msUntilNextBucket(date: Date = new Date()): number {
  const h = date.getHours();
  const nextBoundaryHour = h < 5 ? 5 : h < 12 ? 12 : h < 17 ? 17 : h < 22 ? 22 : 29; // 29 = 5 AM next day
  const next = new Date(date);
  next.setHours(nextBoundaryHour, 0, 0, 0);
  return next.getTime() - date.getTime();
}
