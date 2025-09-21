// API service for handling all backend calls
import { getUserFromToken } from './jwt';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002';
const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_BASE_URL || 'http://localhost:3001';
const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_BASE_URL || 'http://localhost:3003';

class ApiService {
  private authToken: string | null = null;

  constructor() {
    // Initialize auth token from localStorage if available
    if (typeof window !== 'undefined') {
      this.authToken = localStorage.getItem('authToken');
    }
  }

  // Set authentication token
  setAuthToken(token: string) {
    this.authToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  // Clear authentication token
  clearAuthToken() {
    this.authToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  getAuthToken() {
    return this.authToken;
  }

  getUserFromToken() {
    const token = this.getAuthToken();
    if (!token) return null;
    return getUserFromToken(token);
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  private async apiCall(url: string, options: RequestInit = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.clearAuthToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/admin/login';
          }
          throw new Error('Unauthorized');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
          } catch (error) {
            throw error;
          }
  }

  // Authentication API calls
  async login(email: string, password: string) {
    const response = await this.apiCall(`${AUTH_BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

        if (response.success) {
          // Try different possible token locations
          const token = response.token || response.data?.token || response.data?.accessToken;
          if (token) {
            this.setAuthToken(token);
          }
        }

    return response;
  }

  async signup(username: string, email: string, password: string) {
    const response = await this.apiCall(`${AUTH_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });

    if (response.success) {
      // Try different possible token locations
      const token = response.token || response.data?.token || response.data?.accessToken;
      if (token) {
        this.setAuthToken(token);
      }
    }

    return response;
  }

  async getProfile() {
    return await this.apiCall(`${AUTH_BASE_URL}/api/auth/profile`);
  }

  async logout() {
    this.clearAuthToken();
    return { success: true, message: 'Logged out successfully' };
  }

  // Course Management API calls
  async getCourses(params: Record<string, any> = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString 
      ? `${API_BASE_URL}/api/courses?${queryString}`
      : `${API_BASE_URL}/api/courses`;
    
    
    return await this.apiCall(url);
  }

  // Advanced search with Elasticsearch
  async searchCourses(searchParams: {
    query?: string;
    category?: string;
    instructor?: string;
    level?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }) {
    const queryString = new URLSearchParams(
      Object.entries(searchParams)
        .filter(([_, value]) => value !== undefined && value !== '')
        .map(([key, value]) => [key, String(value)])
    ).toString();
    
    const url = queryString 
      ? `${API_BASE_URL}/api/search/courses?${queryString}`
      : `${API_BASE_URL}/api/search/courses`;
    
    
    return await this.apiCall(url);
  }

  async getCourseById(id: string) {
    return await this.apiCall(`${API_BASE_URL}/api/courses/${id}`);
  }

  async createCourse(courseData: any) {
    return await this.apiCall(`${API_BASE_URL}/api/courses`, {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
  }

  async updateCourse(id: string, courseData: any) {
    return await this.apiCall(`${API_BASE_URL}/api/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    });
  }

  async deleteCourse(id: string) {
    return await this.apiCall(`${API_BASE_URL}/api/courses/${id}`, {
      method: 'DELETE',
    });
  }


  // File upload API calls
  async uploadCSV(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload/csv`, {
        method: 'POST',
        headers: {
          'Authorization': this.authToken ? `Bearer ${this.authToken}` : '',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Statistics API calls
  async getCourseStats() {
    return await this.apiCall(`${API_BASE_URL}/api/courses/stats/overview`);
  }

  // Update student enrollments
  async updateEnrollments() {
    return await this.apiCall(`${API_BASE_URL}/api/courses/update-enrollments`, {
      method: 'POST'
    });
  }

  // AI Recommendation API calls
  async getRecommendations(preferences: {
    topics: string[];
    skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
    duration?: string;
    interests?: string[];
  }) {
    return await this.apiCall(`${AI_BASE_URL}/api/recommendations`, {
      method: 'POST',
      body: JSON.stringify(preferences),
    });
  }

  async getSampleRecommendations() {
    return await this.apiCall(`${AI_BASE_URL}/api/recommendations/sample`);
  }


  // Health check API calls
  async checkHealth() {
    try {
      const authHealth = await this.apiCall(`${AUTH_BASE_URL}/health`);
      const courseHealth = await this.apiCall(`${API_BASE_URL}/health`);
      const aiHealth = await this.apiCall(`${AI_BASE_URL}/health`);
      
      return {
        auth: authHealth,
        course: courseHealth,
        ai: aiHealth,
        allHealthy: true
      };
    } catch (error) {
      return {
        error: (error as Error).message,
        allHealthy: false
      };
    }
  }
}

export const apiService = new ApiService();
export default apiService;
