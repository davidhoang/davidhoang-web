/** Sites listed on /blogroll — the WordPress habit of naming what you actually read. */
export type BlogrollEntry = {
  name: string;
  url: string;
};

export const blogroll: readonly BlogrollEntry[] = [
  { name: 'Amelia Wattenberger', url: 'https://wattenberger.com' },
  { name: 'Brian Lovin', url: 'https://brianlovin.com' },
  { name: 'Ehsan Noursalehi', url: 'https://thisisehsan.com' },
  { name: 'Linda Dong', url: 'https://www.lindadong.com/' },
  { name: 'Linus Lee', url: 'https://thesephist.com/' },
  { name: 'Maggie Appleton', url: 'https://maggieappleton.com' },
  { name: 'Nayli Naza', url: 'https://www.nayli.ai/' },
  { name: 'Savannah Niles', url: 'https://www.savannahniles.com/' },
  { name: 'Yesenia Perez-Cruz', url: 'https://www.yeseniaperezcruz.com/' },
];
