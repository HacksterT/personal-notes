/**
 * Bible Service - Fixed for the actual JSON structure:
 * [
 *   {
 *     "abbrev": "gn",
 *     "chapters": [
 *       ["Verse text 1", "Verse text 2", ...]
 *     ]
 *   }
 * ]
 */

class BibleService {
  constructor() {
    this.bibles = new Map();
    this.loadedVersions = new Set();
    this.loading = new Map();
    
    // Book name mapping from abbreviations
    this.bookNames = {
      'gn': 'Genesis',
      'ex': 'Exodus', 
      'lv': 'Leviticus',
      'nm': 'Numbers',
      'dt': 'Deuteronomy',
      'jos': 'Joshua',
      'jdg': 'Judges',
      'ru': 'Ruth',
      '1sm': '1 Samuel',
      '2sm': '2 Samuel',
      '1kg': '1 Kings',
      '2kg': '2 Kings',
      '1ch': '1 Chronicles',
      '2ch': '2 Chronicles',
      'ezr': 'Ezra',
      'neh': 'Nehemiah',
      'est': 'Esther',
      'job': 'Job',
      'ps': 'Psalms',
      'pr': 'Proverbs',
      'ec': 'Ecclesiastes',
      'sg': 'Song of Solomon',
      'is': 'Isaiah',
      'jer': 'Jeremiah',
      'lm': 'Lamentations',
      'ezk': 'Ezekiel',
      'dn': 'Daniel',
      'ho': 'Hosea',
      'jl': 'Joel',
      'am': 'Amos',
      'ob': 'Obadiah',
      'jnh': 'Jonah',
      'mc': 'Micah',
      'na': 'Nahum',
      'hb': 'Habakkuk',
      'zep': 'Zephaniah',
      'hg': 'Haggai',
      'zec': 'Zechariah',
      'mal': 'Malachi',
      'mt': 'Matthew',
      'mk': 'Mark',
      'lk': 'Luke',
      'jn': 'John',
      'ac': 'Acts',
      'ro': 'Romans',
      '1co': '1 Corinthians',
      '2co': '2 Corinthians',
      'ga': 'Galatians',
      'eph': 'Ephesians',
      'php': 'Philippians',
      'col': 'Colossians',
      '1th': '1 Thessalonians',
      '2th': '2 Thessalonians',
      '1tm': '1 Timothy',
      '2tm': '2 Timothy',
      'tt': 'Titus',
      'phm': 'Philemon',
      'heb': 'Hebrews',
      'jas': 'James',
      '1pe': '1 Peter',
      '2pe': '2 Peter',
      '1jn': '1 John',
      '2jn': '2 John',
      '3jn': '3 John',
      'jud': 'Jude',
      'rv': 'Revelation'
    };
  }

  /**
   * Load a Bible version on demand
   */
  async loadVersion(version = 'kjv') {
    const versionKey = version.toLowerCase();
    
    if (this.loadedVersions.has(versionKey)) {
      return this.bibles.get(versionKey);
    }

    if (this.loading.has(versionKey)) {
      return this.loading.get(versionKey);
    }

    const loadPromise = this._fetchBibleData(versionKey);
    this.loading.set(versionKey, loadPromise);

    try {
      const bibleData = await loadPromise;
      this.bibles.set(versionKey, bibleData);
      this.loadedVersions.add(versionKey);
      this.loading.delete(versionKey);
      
      console.log(`✅ Loaded Bible version: ${version.toUpperCase()}`);
      console.log(`📊 Books loaded: ${bibleData.length}`);
      return bibleData;
    } catch (error) {
      this.loading.delete(versionKey);
      console.error(`❌ Failed to load Bible version: ${version}`, error);
      throw error;
    }
  }

  /**
   * Fetch Bible data from public folder
   * @private
   */
  async _fetchBibleData(version) {
    const response = await fetch(`/bibles/en_${version}.json`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Could not load Bible version ${version}`);
    }
    
    return response.json();
  }

  /**
   * Get a specific verse
   */
  async getVerse(book, chapter, verse, version = 'kjv') {
    const bible = await this.loadVersion(version);
    
    const bookData = this._findBook(bible, book);
    if (!bookData) {
      throw new Error(`Book "${book}" not found in ${version.toUpperCase()}`);
    }
    
    const bookName = this._getBookName(bookData.abbrev);
    
    // Chapter is 1-based, but array is 0-based
    const chapterIndex = chapter - 1;
    if (!bookData.chapters[chapterIndex]) {
      throw new Error(`${bookName} ${chapter} not found`);
    }
    
    // Verse is 1-based, but array is 0-based
    const verseIndex = verse - 1;
    const verseText = bookData.chapters[chapterIndex][verseIndex];
    if (!verseText) {
      throw new Error(`${bookName} ${chapter}:${verse} not found`);
    }
    
    return {
      reference: `${bookName} ${chapter}:${verse}`,
      version: version.toUpperCase(),
      text: verseText,
      book: bookName,
      chapter,
      verse
    };
  }

  /**
   * Get an entire chapter
   */
  async getChapter(book, chapter, version = 'kjv') {
    const bible = await this.loadVersion(version);
    
    const bookData = this._findBook(bible, book);
    if (!bookData) {
      throw new Error(`Book "${book}" not found in ${version.toUpperCase()}`);
    }
    
    const bookName = this._getBookName(bookData.abbrev);
    
    // Chapter is 1-based, but array is 0-based
    const chapterIndex = chapter - 1;
    const chapterVerses = bookData.chapters[chapterIndex];
    if (!chapterVerses) {
      throw new Error(`${bookName} ${chapter} not found`);
    }
    
    return {
      book: bookName,
      chapter,
      version: version.toUpperCase(),
      verses: chapterVerses.map((text, index) => ({
        reference: `${bookName} ${chapter}:${index + 1}`,
        verse: index + 1,
        text: text
      }))
    };
  }

  /**
   * Search for verses containing specific text
   */
  async searchText(query, version = 'kjv', limit = 50) {
    if (!query || !query.trim()) {
      return [];
    }

    const bible = await this.loadVersion(version);
    const results = [];
    const searchTerm = query.toLowerCase();
    
    for (const book of bible) {
      const bookName = this._getBookName(book.abbrev);
      
      for (let chapterIndex = 0; chapterIndex < book.chapters.length; chapterIndex++) {
        const chapter = book.chapters[chapterIndex];
        const chapterNumber = chapterIndex + 1;
        
        for (let verseIndex = 0; verseIndex < chapter.length; verseIndex++) {
          const verseText = chapter[verseIndex];
          const verseNumber = verseIndex + 1;
          
          if (verseText.toLowerCase().includes(searchTerm)) {
            results.push({
              reference: `${bookName} ${chapterNumber}:${verseNumber}`,
              book: bookName,
              chapter: chapterNumber,
              verse: verseNumber,
              text: verseText,
              version: version.toUpperCase()
            });
            
            if (results.length >= limit) break;
          }
        }
        if (results.length >= limit) break;
      }
      if (results.length >= limit) break;
    }
    
    return results;
  }

  /**
   * Get all books for navigation
   */
  async getBooks(version = 'kjv') {
    const bible = await this.loadVersion(version);
    return bible.map(book => ({
      id: book.abbrev,
      name: this._getBookName(book.abbrev),
      chapters: book.chapters.length
    }));
  }

  /**
   * Get book name from abbreviation
   * @private
   */
  _getBookName(abbrev) {
    return this.bookNames[abbrev.toLowerCase()] || abbrev.toUpperCase();
  }

  /**
   * Find a book by name or abbreviation (case-insensitive)
   * @private
   */
  _findBook(bible, bookName) {
    const searchName = bookName.toLowerCase().trim();
    
    // First try to find by abbreviation
    let found = bible.find(book => 
      book.abbrev && book.abbrev.toLowerCase() === searchName
    );
    
    if (found) return found;
    
    // Then try to find by full name
    found = bible.find(book => {
      const fullName = this._getBookName(book.abbrev);
      return fullName.toLowerCase() === searchName ||
             fullName.toLowerCase().startsWith(searchName);
    });
    
    return found;
  }

  /**
   * Get available Bible versions
   */
  getAvailableVersions() {
    return [
      { code: 'kjv', name: 'King James Version', abbreviation: 'KJV' },
      { code: 'bbe', name: 'Bible in Basic English', abbreviation: 'BBE' }
    ];
  }

  /**
   * Get random verse for inspiration
   */
  async getRandomVerse(version = 'kjv') {
    const bible = await this.loadVersion(version);
    
    // Pick random book
    const randomBook = bible[Math.floor(Math.random() * bible.length)];
    const bookName = this._getBookName(randomBook.abbrev);
    
    // Pick random chapter
    const randomChapterIndex = Math.floor(Math.random() * randomBook.chapters.length);
    const randomChapter = randomBook.chapters[randomChapterIndex];
    const chapterNumber = randomChapterIndex + 1;
    
    // Pick random verse
    const randomVerseIndex = Math.floor(Math.random() * randomChapter.length);
    const randomVerseText = randomChapter[randomVerseIndex];
    const verseNumber = randomVerseIndex + 1;
    
    return {
      reference: `${bookName} ${chapterNumber}:${verseNumber}`,
      version: version.toUpperCase(),
      text: randomVerseText,
      book: bookName,
      chapter: chapterNumber,
      verse: verseNumber
    };
  }
}

// Export singleton instance
export const bibleService = new BibleService();

// Export class for testing
export { BibleService };