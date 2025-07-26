/**
 * Bible Service - Updated for Backend API Integration
 * Connects React frontend to backend Bible APIs with cache-first strategy.
 * 
 * Supports only 2 versions: NLT (contemporary) and KJV
 * 
 * This service:
 * 1. Calls backend REST APIs instead of loading local JSON files
 * 2. Maintains compatibility with existing React components
 * 3. Handles loading states, errors, and compliance warnings
 * 4. Supports the cache-first, API-fallback architecture
 */

class BibleService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    this.cache = new Map(); // Local cache for navigation data, etc.
    this.loadingPromises = new Map(); // Prevent duplicate requests
    
    // Only 2 supported versions as requested
    this.availableVersions = [
      { code: 'NLT', name: 'New Living Translation', abbreviation: 'NLT' },
      { code: 'KJV', name: 'King James Version', abbreviation: 'KJV' }
    ];
  }

  /**
   * Handle API responses with proper error handling
   * @private
   */
  async _handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Make authenticated API request
   * @private
   */
  async _apiRequest(endpoint, options = {}) {
    const url = `${this.baseURL}/api/bible${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      return await this._handleResponse(response);
    } catch (error) {
      console.error(`❌ Bible API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Get a complete Bible chapter - MAIN METHOD
   * This is the primary method that components will use
   */
  async getChapter(book, chapter, version = 'NLT') {
    // Validate version
    if (!['NLT', 'KJV'].includes(version)) {
      throw new Error(`Unsupported Bible version: ${version}. Only NLT and KJV are supported.`);
    }

    const cacheKey = `chapter:${book}:${chapter}:${version}`;
    
    // Prevent duplicate requests
    if (this.loadingPromises.has(cacheKey)) {
      return await this.loadingPromises.get(cacheKey);
    }

    const promise = this._fetchChapter(book, chapter, version);
    this.loadingPromises.set(cacheKey, promise);

    try {
      const result = await promise;
      this.loadingPromises.delete(cacheKey);
      return result;
    } catch (error) {
      this.loadingPromises.delete(cacheKey);
      throw error;
    }
  }

  /**
   * Internal method to fetch chapter from backend
   * @private
   */
  async _fetchChapter(book, chapter, version) {
    console.log(`📖 Fetching ${book} ${chapter} (${version}) from backend...`);
    
    const response = await this._apiRequest(`/chapter/${encodeURIComponent(book)}/${chapter}?version=${version}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to load Bible chapter');
    }

    // Log cache/storage info for learning
    if (response.from_cache) {
      console.log(`⚡ Cache hit: ${book} ${chapter} loaded instantly`);
    } else {
      console.log(`🌐 API call: ${book} ${chapter} fetched from NLT API ${response.stored ? '& stored' : ''}`);
    }

    if (response.compliance_warning) {
      console.warn(`⚠️ Compliance warning: ${response.compliance_warning}`);
    }

    // Transform backend response to match existing component expectations
    return {
      book: response.book,
      book_abbrev: response.book_abbrev,
      chapter: response.chapter,
      version: response.version,
      // Transform verses array to match existing component format
      verses: response.verses.map(verse => ({
        reference: `${response.book} ${response.chapter}:${verse.number}`,
        verse: verse.number,
        number: verse.number, // Some components expect 'number'
        text: verse.text
      })),
      // Additional metadata from backend
      verse_count: response.verse_count,
      from_cache: response.from_cache,
      stored: response.stored,
      compliance_warning: response.compliance_warning
    };
  }

  /**
   * Get a specific verse from a chapter
   */
  async getVerse(book, chapter, verse, version = 'NLT') {
    const chapterData = await this.getChapter(book, chapter, version);
    
    const verseData = chapterData.verses.find(v => v.verse === verse);
    if (!verseData) {
      throw new Error(`${book} ${chapter}:${verse} not found`);
    }

    return {
      reference: verseData.reference,
      version: chapterData.version,
      text: verseData.text,
      book: chapterData.book,
      chapter: chapterData.chapter,
      verse: verse
    };
  }

  /**
   * Search Bible text
   */
  async searchText(query, version = 'NLT', limit = 50) {
    if (!query || !query.trim()) {
      return [];
    }

    // Validate version
    if (!['NLT', 'KJV'].includes(version)) {
      throw new Error(`Unsupported Bible version: ${version}. Only NLT and KJV are supported.`);
    }

    console.log(`🔍 Searching for "${query}" in ${version}...`);
    
    const response = await this._apiRequest(`/search?q=${encodeURIComponent(query)}&version=${version}&limit=${limit}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Bible search failed');
    }

    // Log search info
    if (response.searched_cached_only) {
      console.log(`📚 Searched cached content only (${response.result_count} results)`);
    } else {
      console.log(`🌐 Full Bible search completed (${response.result_count} results)`);
    }

    // Transform backend response to match existing expectations
    return response.results.map(result => ({
      reference: result.reference,
      book: result.book,
      chapter: result.chapter,
      verse: result.verse,
      text: result.text,
      version: result.version,
      from_cache: result.from_cache
    }));
  }

  /**
   * Get all books for navigation (cached)
   */
  async getBooks(version = 'NLT') {
    // Validate version
    if (!['NLT', 'KJV'].includes(version)) {
      throw new Error(`Unsupported Bible version: ${version}. Only NLT and KJV are supported.`);
    }

    const cacheKey = `navigation:${version}`;
    
    // Return cached navigation data if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    console.log(`📚 Loading Bible navigation data...`);
    
    const response = await this._apiRequest('/navigation');
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to load Bible navigation');
    }

    // Combine and transform to match existing component expectations
    const allBooks = [
      ...response.old_testament,
      ...response.new_testament
    ].map(book => ({
      id: book.abbrev,
      abbrev: book.abbrev,
      name: book.name,
      chapters: book.total_chapters,
      category: book.category,
      color_code: book.color_code,
      testament: book.id <= 39 ? 'OT' : 'NT'
    }));

    // Cache the result
    this.cache.set(cacheKey, allBooks);
    
    console.log(`✅ Loaded ${allBooks.length} books for navigation`);
    
    return allBooks;
  }

  /**
   * Get books organized by testament (for advanced navigation components)
   */
  async getBooksOrganized(version = 'NLT') {
    // Validate version
    if (!['NLT', 'KJV'].includes(version)) {
      throw new Error(`Unsupported Bible version: ${version}. Only NLT and KJV are supported.`);
    }

    const response = await this._apiRequest('/navigation');
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to load Bible navigation');
    }

    return {
      old_testament: response.old_testament,
      new_testament: response.new_testament,
      compliance: response.compliance
    };
  }

  /**
   * Get compliance status and usage statistics
   */
  async getComplianceStatus() {
    const response = await this._apiRequest('/compliance');
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to load compliance data');
    }

    return response.statistics;
  }

  /**
   * Initialize Bible session (preload cached content)
   */
  async initializeSession(version = 'NLT') {
    // Validate version
    if (!['NLT', 'KJV'].includes(version)) {
      throw new Error(`Unsupported Bible version: ${version}. Only NLT and KJV are supported.`);
    }

    console.log(`🚀 Initializing Bible session for ${version}...`);
    
    const response = await this._apiRequest('/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ version })
    });

    if (!response.success) {
      throw new Error('Failed to initialize Bible session');
    }

    console.log(`✅ Session initialized: ${response.cached_chapters} cached chapters, ${response.missing_chapters} to load`);
    
    return response;
  }

  /**
   * Get available Bible versions (only NLT and KJV)
   */
  getAvailableVersions() {
    return this.availableVersions;
  }

  /**
   * Get random verse (using existing getVerse method)
   */
  async getRandomVerse(version = 'NLT') {
    // Validate version
    if (!['NLT', 'KJV'].includes(version)) {
      version = 'NLT'; // Default to NLT if invalid
    }

    // For now, return a well-known verse
    // In a real implementation, you could call a backend endpoint for this
    return await this.getVerse('John', 3, 16, version);
  }

  /**
   * Clear local caches
   */
  clearCache() {
    this.cache.clear();
    this.loadingPromises.clear();
    console.log('🗑️ Bible service cache cleared');
  }

  /**
   * Helper method to find book by name or abbreviation (for compatibility)
   */
  async findBook(bookName, version = 'NLT') {
    const books = await this.getBooks(version);
    const searchName = bookName.toLowerCase().trim();
    
    // First try to find by abbreviation
    let found = books.find(book => 
      book.abbrev && book.abbrev.toLowerCase() === searchName
    );
    
    if (found) return found;
    
    // Then try to find by full name
    found = books.find(book => {
      return book.name.toLowerCase() === searchName ||
             book.name.toLowerCase().startsWith(searchName);
    });
    
    return found;
  }
}

// Export singleton instance
export const bibleService = new BibleService();

// Export class for testing
export { BibleService };