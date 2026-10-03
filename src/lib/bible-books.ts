/** The 66 books of the Protestant canon and reference helpers (safe for client code). */

// ── Protestant canon (USFM ids, KJV chapter counts) ─────────────
export const BOOKS: { id: string; name: string; chapters: number }[] = [
  ["GEN", "Genesis", 50], ["EXO", "Exodus", 40], ["LEV", "Leviticus", 27], ["NUM", "Numbers", 36],
  ["DEU", "Deuteronomy", 34], ["JOS", "Joshua", 24], ["JDG", "Judges", 21], ["RUT", "Ruth", 4],
  ["1SA", "1 Samuel", 31], ["2SA", "2 Samuel", 24], ["1KI", "1 Kings", 22], ["2KI", "2 Kings", 25],
  ["1CH", "1 Chronicles", 29], ["2CH", "2 Chronicles", 36], ["EZR", "Ezra", 10], ["NEH", "Nehemiah", 13],
  ["EST", "Esther", 10], ["JOB", "Job", 42], ["PSA", "Psalms", 150], ["PRO", "Proverbs", 31],
  ["ECC", "Ecclesiastes", 12], ["SNG", "Song of Solomon", 8], ["ISA", "Isaiah", 66], ["JER", "Jeremiah", 52],
  ["LAM", "Lamentations", 5], ["EZK", "Ezekiel", 48], ["DAN", "Daniel", 12], ["HOS", "Hosea", 14],
  ["JOL", "Joel", 3], ["AMO", "Amos", 9], ["OBA", "Obadiah", 1], ["JON", "Jonah", 4],
  ["MIC", "Micah", 7], ["NAM", "Nahum", 3], ["HAB", "Habakkuk", 3], ["ZEP", "Zephaniah", 3],
  ["HAG", "Haggai", 2], ["ZEC", "Zechariah", 14], ["MAL", "Malachi", 4],
  ["MAT", "Matthew", 28], ["MRK", "Mark", 16], ["LUK", "Luke", 24], ["JHN", "John", 21],
  ["ACT", "Acts", 28], ["ROM", "Romans", 16], ["1CO", "1 Corinthians", 16], ["2CO", "2 Corinthians", 13],
  ["GAL", "Galatians", 6], ["EPH", "Ephesians", 6], ["PHP", "Philippians", 4], ["COL", "Colossians", 4],
  ["1TH", "1 Thessalonians", 5], ["2TH", "2 Thessalonians", 3], ["1TI", "1 Timothy", 6], ["2TI", "2 Timothy", 4],
  ["TIT", "Titus", 3], ["PHM", "Philemon", 1], ["HEB", "Hebrews", 13], ["JAS", "James", 5],
  ["1PE", "1 Peter", 5], ["2PE", "2 Peter", 3], ["1JN", "1 John", 5], ["2JN", "2 John", 1],
  ["3JN", "3 John", 1], ["JUD", "Jude", 1], ["REV", "Revelation", 22],
].map(([id, name, chapters]) => ({ id: id as string, name: name as string, chapters: chapters as number }));

export function getBook(id: string) {
  return BOOKS.find((b) => b.id === id);
}

export interface PassageRange {
  bookId: string;
  startChapter: number;
  startVerse?: number | null;
  endChapter?: number | null;
  endVerse?: number | null;
}

/** "John 3:16–21", "Acts 2", "Romans 8:28–9:5" */
export function formatReference(r: PassageRange): string {
  const book = getBook(r.bookId)?.name ?? r.bookId;
  const endCh = r.endChapter ?? r.startChapter;
  if (!r.startVerse) {
    return endCh !== r.startChapter ? `${book} ${r.startChapter}–${endCh}` : `${book} ${r.startChapter}`;
  }
  if (endCh !== r.startChapter) return `${book} ${r.startChapter}:${r.startVerse}–${endCh}:${r.endVerse ?? 1}`;
  if (r.endVerse && r.endVerse !== r.startVerse) return `${book} ${r.startChapter}:${r.startVerse}–${r.endVerse}`;
  return `${book} ${r.startChapter}:${r.startVerse}`;
}

/** API.Bible passage id, e.g. "JHN.3.16-JHN.3.21" or "ACT.2". */
export function passageId(r: PassageRange): string {
  const endCh = r.endChapter ?? r.startChapter;
  if (!r.startVerse) {
    return endCh !== r.startChapter
      ? `${r.bookId}.${r.startChapter}-${r.bookId}.${endCh}`
      : `${r.bookId}.${r.startChapter}`;
  }
  const end = `${r.bookId}.${endCh}.${r.endVerse ?? r.startVerse}`;
  return `${r.bookId}.${r.startChapter}.${r.startVerse}-${end}`;
}

// ── Amharic on Bible.com ─────────────────────────────────────────
// Opens the passage on Bible.com (or the YouVersion app, if installed).
// Linking needs no licence.
// The NASV is now shown in the app (via YouVersion Platform); only the
// 1962, which isn't licensed to apps, still opens on Bible.com.
export const AMHARIC_VERSIONS = [
  { key: "AM1962", label: "1962", title: "አማርኛ 1954 (1962)", youVersionId: 3867 },
] as const;

/**
 * Bible.com link for a passage. YouVersion links can't span chapters, so a
 * multi-chapter passage opens at its first chapter.
 */
export function bibleComUrl(youVersionId: number, r: PassageRange): string {
  const endCh = r.endChapter ?? r.startChapter;
  let ref = `${r.bookId}.${r.startChapter}`;
  if (r.startVerse && endCh === r.startChapter) {
    ref += `.${r.startVerse}`;
    if (r.endVerse && r.endVerse !== r.startVerse) ref += `-${r.endVerse}`;
  }
  return `https://www.bible.com/bible/${youVersionId}/${ref}`;
}

