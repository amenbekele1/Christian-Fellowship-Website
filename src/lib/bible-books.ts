/** The 66 books of the Protestant canon and reference helpers (safe for client code). */

// ── Protestant canon (USFM ids, KJV chapter counts) ─────────────
/** Names: English, and Amharic as printed in the NASV (from YouVersion). */
export const BOOKS: { id: string; name: string; am: string; chapters: number }[] = [
  ["GEN", "Genesis", "ዘፍጥረት", 50],
  ["EXO", "Exodus", "ዘፀአት", 40],
  ["LEV", "Leviticus", "ዘሌዋውያን", 27],
  ["NUM", "Numbers", "ዘኍልቍ", 36],
  ["DEU", "Deuteronomy", "ዘዳግም", 34],
  ["JOS", "Joshua", "ኢያሱ", 24],
  ["JDG", "Judges", "መሳፍንት", 21],
  ["RUT", "Ruth", "ሩት", 4],
  ["1SA", "1 Samuel", "1 ሳሙኤል", 31],
  ["2SA", "2 Samuel", "2 ሳሙኤል", 24],
  ["1KI", "1 Kings", "1 ነገሥት", 22],
  ["2KI", "2 Kings", "2 ነገሥት", 25],
  ["1CH", "1 Chronicles", "1 ዜና መዋዕል", 29],
  ["2CH", "2 Chronicles", "2 ዜና መዋዕል", 36],
  ["EZR", "Ezra", "ዕዝራ", 10],
  ["NEH", "Nehemiah", "ነህምያ", 13],
  ["EST", "Esther", "አስቴር", 10],
  ["JOB", "Job", "ኢዮብ", 42],
  ["PSA", "Psalms", "መዝሙር", 150],
  ["PRO", "Proverbs", "ምሳሌ", 31],
  ["ECC", "Ecclesiastes", "መክብብ", 12],
  ["SNG", "Song of Solomon", "ማሕልየ መሓልይ", 8],
  ["ISA", "Isaiah", "ኢሳይያስ", 66],
  ["JER", "Jeremiah", "ኤርምያስ", 52],
  ["LAM", "Lamentations", "ሰቈቃወ", 5],
  ["EZK", "Ezekiel", "ሕዝቅኤል", 48],
  ["DAN", "Daniel", "ዳንኤል", 12],
  ["HOS", "Hosea", "ሆሴዕ", 14],
  ["JOL", "Joel", "ኢዩኤል", 3],
  ["AMO", "Amos", "አሞጽ", 9],
  ["OBA", "Obadiah", "አብድዩ", 1],
  ["JON", "Jonah", "ዮናስ", 4],
  ["MIC", "Micah", "ሚክያስ", 7],
  ["NAM", "Nahum", "ናሆም", 3],
  ["HAB", "Habakkuk", "ዕንባቆም", 3],
  ["ZEP", "Zephaniah", "ሶፎንያስ", 3],
  ["HAG", "Haggai", "ሐጌ", 2],
  ["ZEC", "Zechariah", "ዘካርያስ", 14],
  ["MAL", "Malachi", "ሚልክያስ", 4],
  ["MAT", "Matthew", "ማቴዎስ", 28],
  ["MRK", "Mark", "ማርቆስ", 16],
  ["LUK", "Luke", "ሉቃስ", 24],
  ["JHN", "John", "ዮሐንስ", 21],
  ["ACT", "Acts", "ሐዋርያት ሥራ", 28],
  ["ROM", "Romans", "ሮሜ", 16],
  ["1CO", "1 Corinthians", "1 ቆሮንቶስ", 16],
  ["2CO", "2 Corinthians", "2 ቆሮንቶስ", 13],
  ["GAL", "Galatians", "ገላትያ", 6],
  ["EPH", "Ephesians", "ኤፌሶን", 6],
  ["PHP", "Philippians", "ፊልጵስዩስ", 4],
  ["COL", "Colossians", "ቈላስይስ", 4],
  ["1TH", "1 Thessalonians", "1 ተሰሎንቄ", 5],
  ["2TH", "2 Thessalonians", "2 ተሰሎንቄ", 3],
  ["1TI", "1 Timothy", "1 ጢሞቴዎስ", 6],
  ["2TI", "2 Timothy", "2 ጢሞቴዎስ", 4],
  ["TIT", "Titus", "ቲቶ", 3],
  ["PHM", "Philemon", "ፊልሞና", 1],
  ["HEB", "Hebrews", "ዕብራውያን", 13],
  ["JAS", "James", "ያዕቆብ", 5],
  ["1PE", "1 Peter", "1 ጴጥሮስ", 5],
  ["2PE", "2 Peter", "2 ጴጥሮስ", 3],
  ["1JN", "1 John", "1 ዮሐንስ", 5],
  ["2JN", "2 John", "2 ዮሐንስ", 1],
  ["3JN", "3 John", "3 ዮሐንስ", 1],
  ["JUD", "Jude", "ይሁዳ", 1],
  ["REV", "Revelation", "ራእይ", 22],
].map(([id, name, am, chapters]) => ({ id: id as string, name: name as string, am: am as string, chapters: chapters as number }));

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

