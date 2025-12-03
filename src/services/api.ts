import { setCookie, getCookie, deleteCookie } from "@/lib/cookies";

// Use relative URL in development (proxied through Vite) or absolute in production
const API_BASE_URL = import.meta.env.PROD
  ? "http://localhost:8080/api/v1"
  : "/api/v1";

export interface User {
  id?: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message?: string;
  token?: string;
  refreshToken?: string;
  user?: User;
  [key: string]: unknown; // Allow for additional fields
}

export interface TextContent {
  id?: string;
  key: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  published?: boolean;
  tags?: string[];
  featuredImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImageUploadResponse {
  filename?: string;
  url?: string;
  [key: string]: unknown;
}

export interface PageConfig {
  id?: string;
  pageKey: string;
  title: string;
  description?: string;
  config: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

class ApiService {
  private getAuthHeaders(includeContentType: boolean = true): HeadersInit {
    const token = getCookie("token");
    const headers: HeadersInit = {};

    if (includeContentType) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      throw new Error(
        error.message || `HTTP error! status: ${response.status}`
      );
    }
    return response.json();
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const data = await this.handleResponse<LoginResponse>(response);
    if (data.token) {
      setCookie("token", data.token, 7); // 7 days expiry
    }
    if (data.refreshToken) {
      setCookie("refreshToken", data.refreshToken, 30); // 30 days expiry
    }
    return data;
  }

  async logout(): Promise<void> {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: this.getAuthHeaders(),
    });
    deleteCookie("token");
    deleteCookie("refreshToken");
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await this.handleResponse<LoginResponse>(response);
    if (data.token) {
      setCookie("token", data.token, 7); // 7 days expiry
    }
    if (data.refreshToken) {
      setCookie("refreshToken", data.refreshToken, 30); // 30 days expiry
    }
    return data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<User>(response);
  }

  // Text Content endpoints
  async getTextContents(): Promise<TextContent[]> {
    const response = await fetch(`${API_BASE_URL}/cms/text`, {
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<
      TextContent[] | { data?: TextContent[]; items?: TextContent[] }
    >(response);

    // Normalise different possible response shapes to an array
    if (Array.isArray(data)) {
      return data as TextContent[];
    }
    if (Array.isArray(data?.data)) {
      return data.data as TextContent[];
    }
    if (Array.isArray(data?.items)) {
      return data.items as TextContent[];
    }

    // Fallback: no items
    return [];
  }

  async getTextContentById(id: string): Promise<TextContent> {
    const response = await fetch(`${API_BASE_URL}/cms/text/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<TextContent>(response);
  }

  async getTextContentByKey(key: string): Promise<TextContent> {
    const response = await fetch(`${API_BASE_URL}/cms/text/key/${key}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<TextContent>(response);
  }

  async createTextContent(
    data: Omit<TextContent, "id" | "createdAt" | "updatedAt">
  ): Promise<TextContent> {
    const response = await fetch(`${API_BASE_URL}/cms/text`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<TextContent>(response);
  }

  async updateTextContent(
    id: string,
    data: Partial<TextContent>
  ): Promise<TextContent> {
    const response = await fetch(`${API_BASE_URL}/cms/text/${id}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<TextContent>(response);
  }

  async deleteTextContent(id: string): Promise<void> {
    await fetch(`${API_BASE_URL}/cms/text/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });
  }

  // Blog endpoints
  async getBlogPosts(published?: boolean): Promise<BlogPost[]> {
    const params = published !== undefined ? `?published=${published}` : "";
    const response = await fetch(`${API_BASE_URL}/cms/blog${params}`, {
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<
      BlogPost[] | { data?: BlogPost[]; items?: BlogPost[] }
    >(response);

    // Normalise different possible response shapes to an array
    if (Array.isArray(data)) {
      return data as BlogPost[];
    }
    if (Array.isArray(data?.data)) {
      return data.data as BlogPost[];
    }
    if (Array.isArray(data?.items)) {
      return data.items as BlogPost[];
    }

    // Fallback: no items
    return [];
  }

  async getBlogPostById(id: string): Promise<BlogPost> {
    const response = await fetch(`${API_BASE_URL}/cms/blog/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<BlogPost>(response);
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost> {
    const response = await fetch(`${API_BASE_URL}/cms/blog/slug/${slug}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<BlogPost>(response);
  }

  async createBlogPost(
    data: Omit<BlogPost, "id" | "createdAt" | "updatedAt">
  ): Promise<BlogPost> {
    const response = await fetch(`${API_BASE_URL}/cms/blog`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<BlogPost>(response);
  }

  async updateBlogPost(id: string, data: Partial<BlogPost>): Promise<BlogPost> {
    const response = await fetch(`${API_BASE_URL}/cms/blog/${id}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<BlogPost>(response);
  }

  async deleteBlogPost(id: string): Promise<void> {
    await fetch(`${API_BASE_URL}/cms/blog/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });
  }

  // Page Config endpoints
  async getPageConfigs(): Promise<PageConfig[]> {
    const response = await fetch(`${API_BASE_URL}/cms/page-config`, {
      headers: this.getAuthHeaders(),
    });
    const data = await this.handleResponse<
      PageConfig[] | { data?: PageConfig[]; items?: PageConfig[] }
    >(response);

    // Normalise different possible response shapes to an array
    if (Array.isArray(data)) {
      return data as PageConfig[];
    }
    if (Array.isArray(data?.data)) {
      return data.data as PageConfig[];
    }
    if (Array.isArray(data?.items)) {
      return data.items as PageConfig[];
    }

    // Fallback: no items
    return [];
  }

  async getPageConfigById(id: string): Promise<PageConfig> {
    const response = await fetch(`${API_BASE_URL}/cms/page-config/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<PageConfig>(response);
  }

  async getPageConfigByKey(pageKey: string): Promise<PageConfig> {
    const response = await fetch(
      `${API_BASE_URL}/cms/page-config/key/${pageKey}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse<PageConfig>(response);
  }

  async createPageConfig(
    data: Omit<PageConfig, "id" | "createdAt" | "updatedAt">
  ): Promise<PageConfig> {
    const response = await fetch(`${API_BASE_URL}/cms/page-config`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<PageConfig>(response);
  }

  async updatePageConfig(
    id: string,
    data: Partial<PageConfig>
  ): Promise<PageConfig> {
    const response = await fetch(`${API_BASE_URL}/cms/page-config/${id}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse<PageConfig>(response);
  }

  async deletePageConfig(id: string): Promise<void> {
    await fetch(`${API_BASE_URL}/cms/page-config/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });
  }

  // Image endpoints
  async getImages(): Promise<string[]> {
    const token = getCookie("token");
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE_URL}/images`, {
      headers,
    });
    const data = await this.handleResponse<
      string[] | { data?: string[]; items?: string[] }
    >(response);

    // Normalise different possible response shapes to an array
    if (Array.isArray(data)) {
      return data as string[];
    }
    if (Array.isArray(data?.data)) {
      return data.data as string[];
    }
    if (Array.isArray(data?.items)) {
      return data.items as string[];
    }

    // Fallback: no items
    return [];
  }

  async uploadImage(file: File): Promise<ImageUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const token = getCookie("token");
    const response = await fetch(`${API_BASE_URL}/image/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    return this.handleResponse<ImageUploadResponse>(response);
  }

  async compressImage(file: File): Promise<ImageUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const token = getCookie("token");
    const response = await fetch(`${API_BASE_URL}/image/compress`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    return this.handleResponse<ImageUploadResponse>(response);
  }

  getImageUrl(filename: string): string {
    return `${API_BASE_URL}/image/${filename}`;
  }

  // Health check
  async healthCheck(): Promise<{ status?: string; [key: string]: unknown }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return this.handleResponse<{ status?: string; [key: string]: unknown }>(
      response
    );
  }
}

export const apiService = new ApiService();
