/**
 * Build inbound note→note backlinks for the digital garden.
 *
 * A note "links here" when another published note:
 * - lists this note in `relatedNotes`, or
 * - links to `/notes/{id}` from overview, description, or body
 *   (Markdown, HTML href, or autolinked site URLs).
 */

export type NoteBacklink = {
  id: string;
  title: string;
  href: string;
  description?: string;
};

type NoteBacklinkSource = {
  id: string;
  body?: string;
  data: {
    title: string;
    description?: string;
    overview?: string;
    relatedNotes?: string[];
    draft?: boolean;
    pubDate?: Date;
    updatedDate?: Date;
  };
};

const NOTE_SLUG = '([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)';
const SITE_ORIGIN = '(?:https?:\\/\\/(?:www\\.)?davidhoang\\.com)';
const NOTE_PATH = `${SITE_ORIGIN}?\\/notes\\/${NOTE_SLUG}\\/?`;

/** Markdown `](url)`, HTML `href`, and `<url>` autolinks to note paths. */
const NOTE_HREF_RE = new RegExp(
  `(?:\\]\\(|href\\s*=\\s*["']|<)\\s*${NOTE_PATH}(?:[?#][^)\\s"'<>]*)?\\s*(?:\\)|["']|>)`,
  'gi',
);

function normalizeNoteId(value: string | undefined | null): string | null {
  const id = value?.trim();
  if (!id) return null;
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(id)) return null;
  return id;
}

export function extractLinkedNoteIds(text: string | undefined | null): string[] {
  if (!text) return [];
  const ids = new Set<string>();
  for (const match of text.matchAll(NOTE_HREF_RE)) {
    const id = normalizeNoteId(match[1]);
    if (id) ids.add(id);
  }
  return [...ids];
}

function sourceText(note: NoteBacklinkSource): string {
  const overview = note.data.overview ?? '';
  const description = note.data.description ?? '';
  const body = note.body ?? '';
  return `${overview}\n${description}\n${body}`;
}

function linkedIdsFromNote(note: NoteBacklinkSource): Set<string> {
  const ids = new Set<string>();
  for (const raw of note.data.relatedNotes ?? []) {
    const id = normalizeNoteId(raw);
    if (id) ids.add(id);
  }
  for (const id of extractLinkedNoteIds(sourceText(note))) {
    ids.add(id);
  }
  return ids;
}

function sortDate(note: NoteBacklinkSource): number {
  const date = note.data.updatedDate ?? note.data.pubDate;
  return date ? date.valueOf() : 0;
}

/**
 * Return notes that link to `noteId`, newest first then title.
 * Self-links and unknown target ids are ignored; duplicates collapse.
 */
export function findNoteBacklinks(options: {
  noteId: string;
  notes: NoteBacklinkSource[];
}): NoteBacklink[] {
  const { noteId, notes } = options;
  const knownIds = new Set(notes.map((note) => note.id));
  if (!knownIds.has(noteId)) return [];

  const byId = new Map(notes.map((note) => [note.id, note]));
  const backlinks: NoteBacklink[] = [];

  for (const note of notes) {
    if (note.id === noteId) continue;
    const linked = linkedIdsFromNote(note);
    if (!linked.has(noteId)) continue;

    backlinks.push({
      id: note.id,
      title: note.data.title,
      href: `/notes/${note.id}`,
      description: note.data.description,
    });
  }

  return backlinks.sort((a, b) => {
    const byDate = sortDate(byId.get(b.id)!) - sortDate(byId.get(a.id)!);
    if (byDate !== 0) return byDate;
    return a.title.localeCompare(b.title);
  });
}
