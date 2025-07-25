// frontend/src/services/api.js
/**
 * API service for connecting React frontend to PostgreSQL backend
 * Replaces IndexedDB with reliable server-side storage
 */

class APIService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    this.token = localStorage.getItem('auth_token');
  }

  // Auth headers
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.blob();
  }

  // Authentication
  async login(email, password) {
    const response = await fetch(`${this.baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await this.handleResponse(response);
    
    if (data.access_token) {
      this.token = data.access_token;
      localStorage.setItem('auth_token', this.token);
    }
    
    return data;
  }

  async logout() {
    if (this.token) {
      try {
        await fetch(`${this.baseURL}/api/auth/logout`, {
          method: 'POST',
          headers: this.getAuthHeaders()
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  async getCurrentUser() {
    if (!this.token) return null;
    
    try {
      const response = await fetch(`${this.baseURL}/api/auth/me`, {
        headers: this.getAuthHeaders()
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  // Content Management
  async uploadFiles(files, category) {
    const formData = new FormData();
    
    // Add files to form data
    files.forEach(file => {
      formData.append('files', file);
    });
    
    formData.append('category', category);

    const response = await fetch(`${this.baseURL}/api/storage/upload`, {
      method: 'POST',
      body: formData
    });

    return await this.handleResponse(response);
  }

  async getContent(contentId) {
    const response = await fetch(`${this.baseURL}/api/storage/content/${contentId}`);

    return await this.handleResponse(response);
  }

  async listContent(category = null, limit = 100, offset = 0) {
    let url = `${this.baseURL}/api/storage/content?limit=${limit}&offset=${offset}`;
    if (category) {
      url += `&category=${encodeURIComponent(category)}`;
    }

    const response = await fetch(url);

    return await this.handleResponse(response);
  }

  async updateContent(contentId, contentData) {
    const response = await fetch(`${this.baseURL}/api/storage/content/${contentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contentData)
    });

    return await this.handleResponse(response);
  }

  async updateContentTags(contentId, tags) {
    const response = await fetch(`${this.baseURL}/api/storage/content/${contentId}/tags`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags })
    });

    return await this.handleResponse(response);
  }

  async updateContentPostTags(contentId, postTags) {
    const response = await fetch(`${this.baseURL}/api/storage/content/${contentId}/post_tags`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_tags: postTags })
    });

    return await this.handleResponse(response);
  }

  async deleteContent(contentId) {
    const response = await fetch(`${this.baseURL}/api/storage/content/${contentId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    return await this.handleResponse(response);
  }

  async searchContent(query, category = null, limit = 50) {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString()
    });
    
    if (category) {
      params.append('category', category);
    }

    const response = await fetch(`${this.baseURL}/api/storage/search?${params}`);

    return await this.handleResponse(response);
  }

  async getStorageUsage() {
    const response = await fetch(`${this.baseURL}/api/storage/usage`);

    return await this.handleResponse(response);
  }

  async getCategories() {
    const response = await fetch(`${this.baseURL}/api/storage/categories`);
    return await this.handleResponse(response);
  }

  async exportData() {
    const response = await fetch(`${this.baseURL}/api/storage/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    return response.blob();
  }

  async importData(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/api/storage/import`, {
      method: 'POST',
      body: formData
    });

    return await this.handleResponse(response);
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return await this.handleResponse(response);
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  // Demo users (for development)
  async getDemoUsers() {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/demo-users`);
      return await this.handleResponse(response);
    } catch (error) {
      return { users: [] };
    }
  }
}

// Create singleton instance
export const apiService = new APIService();

// Auth hook for React components
export const useAuth = () => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const currentUser = await apiService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await apiService.login(email, password);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };
};

// Storage hook for React components
export const useStorage = () => {
  const [usage, setUsage] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const refreshUsage = async () => {
    try {
      setLoading(true);
      const usageData = await apiService.getStorageUsage();
      setUsage(usageData);
    } catch (error) {
      console.error('Failed to get storage usage:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    refreshUsage();
  }, []);

  const uploadFiles = async (files, category) => {
    try {
      const result = await apiService.uploadFiles(files, category);
      await refreshUsage(); // Refresh usage after upload
      return result;
    } catch (error) {
      throw error;
    }
  };

  const deleteContent = async (contentId) => {
    try {
      const result = await apiService.deleteContent(contentId);
      await refreshUsage(); // Refresh usage after deletion
      return result;
    } catch (error) {
      throw error;
    }
  };

  return {
    usage,
    loading,
    refreshUsage,
    uploadFiles,
    deleteContent
  };
};

// Content management hook
export const useContent = (category = null) => {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const loadContent = async (refresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.listContent(category);
      setItems(response.items || []);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load content:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchContent = async (query) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!query.trim()) {
        await loadContent();
        return;
      }
      
      const response = await apiService.searchContent(query, category);
      setItems(response.items || []);
    } catch (err) {
      setError(err.message);
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateContent = async (contentId, contentData) => {
    try {
      await apiService.updateContent(contentId, contentData);
      await loadContent(); // Refresh list
    } catch (error) {
      throw error;
    }
  };

  const deleteContent = async (contentId) => {
    try {
      await apiService.deleteContent(contentId);
      setItems(items.filter(item => item.id !== contentId));
    } catch (error) {
      throw error;
    }
  };

  React.useEffect(() => {
    loadContent();
  }, [category]);

  return {
    items,
    loading,
    error,
    loadContent,
    searchContent,
    updateContent,
    deleteContent
  };
};

export default apiService;
