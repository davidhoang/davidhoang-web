export type FeaturedSpeakingDetail = {
  headline: string;
  summary: string;
  image: string;
  imageAlt: string;
  externalLabel?: string;
};

/** Compact hover cards keyed by SpeakingEntry.detailKey. */
export const featuredSpeakingDetails: Record<string, FeaturedSpeakingDetail> = {
  'hatch-amsterdam': {
    headline: 'Hatch Leadership Atelier',
    summary: 'Leadership workshops in Amsterdam.',
    image: '/images/highlights/img-highlights-hatch-conference.webp',
    imageAlt: 'David Hoang presenting at Hatch Leadership Atelier in Amsterdam',
    externalLabel: 'leadershipateliers.com',
  },
};

export function getFeaturedSpeakingDetail(detailKey: string) {
  return featuredSpeakingDetails[detailKey];
}
