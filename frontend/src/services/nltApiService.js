/**
 * NLT API Service
 * Handles communication with the NLT API for Bible content
 */

class NLTApiService {
  constructor() {
    this.baseUrl = 'https://api.nlt.to/api';
    this.apiKey = process.env.REACT_APP_NLT_API_KEY || '9da788bb-df2e-43b3-9a4b-4c511d5413cc';
    this.cache = new Map();
    this.rateLimitDelay = 100; // ms between requests
    this.lastRequestTime = 0;
  }

  /**
   * Rate limiting helper
   */
  async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Make API request with error handling
   */
  async makeRequest(endpoint, params = {}) {
    await this.rateLimit();
    
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('key', this.apiKey);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });

    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      console.error('NLT API request failed:', error);
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  /**
   * Get passage text
   */
  async getPassage(reference, version = 'NLT') {
    const cacheKey = `passage:${reference}:${version}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const htmlResponse = await this.makeRequest('/passages', {
        ref: reference,
        version: version
      });

      const parsed = this.parsePassageHTML(htmlResponse, reference, version);
      this.cache.set(cacheKey, parsed);
      
      return parsed;
    } catch (error) {
      console.error(`Failed to get passage ${reference}:`, error);
      throw error;
    }
  }

  /**
   * Search for text
   */
  async search(query, version = 'NLT', limit = 50) {
    if (!query.trim()) return [];

    const cacheKey = `search:${query}:${version}:${limit}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const htmlResponse = await this.makeRequest('/search', {
        text: query,
        version: version
      });

      const results = this.parseSearchHTML(htmlResponse, version, limit);
      this.cache.set(cacheKey, results);
      
      return results;
    } catch (error) {
      console.error(`Search failed for "${query}":`, error);
      throw error;
    }
  }

  /**
   * Parse reference string
   */
  async parseReference(reference) {
    try {
      const jsonResponse = await this.makeRequest('/parse', {
        ref: reference
      });

      return jsonResponse;
    } catch (error) {
      console.error(`Failed to parse reference ${reference}:`, error);
      throw error;
    }
  }

  /**
   * Parse HTML passage response
   * TODO: Implement proper HTML parsing
   */
  parsePassageHTML(html, reference, version) {
    // Placeholder implementation
    // In real implementation, parse HTML to extract verses
    return {
      reference,
      version,
      book: reference.split(' ')[0],
      chapter: parseInt(reference.split(' ')[1]?.split(':')[0]) || 1,
      verses: [
        {
          number: 1,
          text: "Parsed verse text will go here when HTML parser is implemented"
        }
      ]
    };
  }

  /**
   * Parse HTML search response
   * TODO: Implement proper HTML parsing
   */
  parseSearchHTML(html, version, limit) {
    // Placeholder implementation
    // In real implementation, parse HTML to extract search results
    return [
      {
        reference: "John 3:16",
        book: "John",
        chapter: 3,
        verse: 16,
        text: "Search result text will go here when HTML parser is implemented",
        version
      }
    ];
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize() {
    return this.cache.size;
  }
}

// Export singleton instance
export const nltApiService = new NLTApiService();

// Export class for testing
export { NLTApiService };