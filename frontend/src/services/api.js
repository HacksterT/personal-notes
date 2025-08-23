// frontend/src/services/api.js
/**
 * API service for connecting React frontend to PostgreSQL backend
 * Replaces IndexedDB with reliable server-side storage
 */

class APIService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";
    this.token = localStorage.getItem("auth_token");
  }

  // Auth headers
  getAuthHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Enhanced error classification
  classifyError(response, error) {
    if (!navigator.onLine) {
      return {
        type: 'NETWORK_ERROR',
        message: 'No internet connection. Please check your network and try again.',
        retryable: true,
        userAction: 'Check your internet connection'
      };
    }

    if (response) {
      switch (response.status) {
        case 404:
          return {
            type: 'NOT_FOUND',
            message: 'The requested content was not found.',
            retryable: false,
            userAction: 'The content may have been deleted or moved'
          };
        case 401:
          return {
            type: 'UNAUTHORIZED',
            message: 'Authentication required. Please log in again.',
            retryable: false,
            userAction: 'Please log in again'
          };
        case 403:
          return {
            type: 'FORBIDDEN',
            message: 'You do not have permission to access this content.',
            retryable: false,
            userAction: 'Contact administrator for access'
          };
        case 429:
          return {
            type: 'RATE_LIMITED',
            message: 'Too many requests. Please wait a moment and try again.',
            retryable: true,
            userAction: 'Wait a moment before trying again'
          };
        case 500:
        case 502:
        case 503:
        case 504:
          return {
            type: 'SERVER_ERROR',
            message: 'Server error occurred. Please try again in a moment.',
            retryable: true,
            userAction: 'Try again in a few moments'
          };
        default:
          return {
            type: 'HTTP_ERROR',
            message: `Request failed with status ${response.status}`,
            retryable: response.status >= 500,
            userAction: 'Please try again'
          };
      }
    }

    // Network or other errors
    if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
      return {
        type: 'NETWORK_ERROR',
        message: 'Network error occurred. Please check your connection.',
        retryable: true,
        userAction: 'Check your internet connection'
      };
    }

    return {
      type: 'UNKNOWN_ERROR',
      message: error?.message || 'An unexpected error occurred',
      retryable: false,
      userAction: 'Please try again or contact support'
    };
  }

  // Retry logic for content retrieval operations
  async withRetry(operation, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry if error is not retryable
        if (error.retryable === false) {
          throw error;
        }
        
        // Don't retry on last attempt
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
        console.log(`Retrying operation, attempt ${attempt + 1}/${maxRetries}`);
      }
    }
    
    throw lastError;
  }

  // Handle API responses with enhanced error handling
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorInfo = this.classifyError(response);
      
      const enhancedError = new Error(errorInfo.message);
      enhancedError.type = errorInfo.type;
      enhancedError.retryable = errorInfo.retryable;
      enhancedError.userAction = errorInfo.userAction;
      enhancedError.status = response.status;
      enhancedError.detail = errorData.detail;
      
      throw enhancedError;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return await response.blob();
  }

  // Authentication
  async login(email, password) {
    const response = await fetch(`${this.baseURL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await this.handleResponse(response);

    if (data.access_token) {
      this.token = data.access_token;
      localStorage.setItem("auth_token", this.token);
    }

    return data;
  }

  async logout() {
    if (this.token) {
      try {
        await fetch(`${this.baseURL}/api/auth/logout`, {
          method: "POST",
          headers: this.getAuthHeaders(),
        });
      } catch (error) {
        console.error("Logout error:", error);
      }
    }

    this.token = null;
    localStorage.removeItem("auth_token");
  }

  async getCurrentUser() {
    if (!this.token) {
      throw new Error("No authentication token available");
    }

    const response = await fetch(`${this.baseURL}/api/auth/me`, {
      headers: this.getAuthHeaders(),
    });

    return await this.handleResponse(response);
  }

  // Content Management
  async uploadFiles(files, category) {
    const formData = new FormData();

    // Add files to form data
    files.forEach((file) => {
      formData.append("files", file);
    });

    formData.append("category", category);

    // Add auth headers for consistency (don't include Content-Type, let browser set it for FormData)
    const headers = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}/api/storage/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    return await this.handleResponse(response);
  }

  async getContent(contentId) {
    return await this.withRetry(async () => {
      const response = await fetch(
        `${this.baseURL}/api/storage/content/${contentId}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      return await this.handleResponse(response);
    });
  }

  async listContent(category = null, limit = 100, offset = 0) {
    return await this.withRetry(async () => {
      let url = `${this.baseURL}/api/storage/content?limit=${limit}&offset=${offset}`;
      if (category) {
        url += `&category=${encodeURIComponent(category)}`;
      }

      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      });

      return await this.handleResponse(response);
    });
  }

  async updateContent(contentId, contentData) {
    const response = await fetch(
      `${this.baseURL}/api/storage/content/${contentId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contentData),
      }
    );

    return await this.handleResponse(response);
  }

  async updateContentTags(contentId, tags) {
    const response = await fetch(
      `${this.baseURL}/api/storage/content/${contentId}/tags`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
      }
    );

    return await this.handleResponse(response);
  }

  async updateContentPostTags(contentId, postTags) {
    const response = await fetch(
      `${this.baseURL}/api/storage/content/${contentId}/post_tags`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_tags: postTags }),
      }
    );

    return await this.handleResponse(response);
  }

  async deleteContent(contentId) {
    const response = await fetch(
      `${this.baseURL}/api/storage/content/${contentId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }
    );

    return await this.handleResponse(response);
  }

  async searchContent(query, category = null, limit = 50) {
    return await this.withRetry(async () => {
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
      });

      if (category) {
        params.append("category", category);
      }

      const response = await fetch(
        `${this.baseURL}/api/storage/search?${params}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      return await this.handleResponse(response);
    });
  }

  async getStorageUsage() {
    const response = await fetch(`${this.baseURL}/api/storage/usage`, {
      headers: this.getAuthHeaders(),
    });

    return await this.handleResponse(response);
  }

  async getCategories() {
    const response = await fetch(`${this.baseURL}/api/storage/categories`, {
      headers: this.getAuthHeaders(),
    });
    return await this.handleResponse(response);
  }

  async exportData() {
    const response = await fetch(`${this.baseURL}/api/storage/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    return response.blob();
  }

  async importData(file) {
    const formData = new FormData();
    formData.append("file", file);

    // Add auth headers for consistency
    const headers = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}/api/storage/import`, {
      method: "POST",
      headers,
      body: formData,
    });

    return await this.handleResponse(response);
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return await this.handleResponse(response);
    } catch (error) {
      return { status: "error", error: error.message };
    }
  }

  // Demo users (for development)
  async getDemoUsers() {
    const response = await fetch(`${this.baseURL}/api/auth/demo-users`);
    return await this.handleResponse(response);
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
      console.error("Auth check failed:", error);
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
      console.error("Logout error:", error);
    }
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };
};

// Storage hook for React components
export const useStorage = () => {
  const [usage, setUsage] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const refreshUsage = async () => {
    try {
      setLoading(true);
      setError(null);
      const usageData = await apiService.getStorageUsage();
      setUsage(usageData);
    } catch (err) {
      const errorMessage = "Failed to get storage usage. Please try again.";
      console.error("Storage usage error:", err);
      setError(errorMessage);
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
    error,
    refreshUsage,
    uploadFiles,
    deleteContent,
  };
};

// Content management hook
export const useContent = (category = null) => {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.listContent(category);
      setItems(response.items || []);
    } catch (err) {
      const errorMessage = "Failed to load content. Please try again.";
      setError(errorMessage);
      console.error("Content loading error:", err);
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
      const errorMessage = "Search failed. Please try again.";
      setError(errorMessage);
      console.error("Content search error:", err);
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
      setItems(items.filter((item) => item.id !== contentId));
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
    deleteContent,
  };
};

export default apiService;
