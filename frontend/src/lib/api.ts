import { ApiError, DNSRecord, HostedZone, PaginatedResponse, RecordType, User, ZoneEvent } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiException extends Error {
  code?: string;
  fields?: Record<string, string>;

  constructor(message: string, code?: string, fields?: Record<string, string>) {
    super(message);
    this.name = "ApiException";
    this.code = code;
    this.fields = fields;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  
  // Set credentials: "include" to pass HTTP-Only session cookies
  const defaultOptions: RequestInit = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();

    if (!response.ok) {
      // Parse structured error responses from FastAPI
      const message = data.detail || "An unexpected error occurred";
      const code = response.headers.get("error_code") || data.error_code;
      const fields = data.fields;
      throw new ApiException(message, code, fields);
    }

    return data as T;
  } catch (error: any) {
    if (error instanceof ApiException) {
      throw error;
    }
    throw new ApiException(error.message || "Network request failed");
  }
}

export const api = {
  auth: {
    login: (email: string, password: string): Promise<User> =>
      request<User>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    
    logout: (): Promise<void> =>
      request<void>("/api/auth/logout", {
        method: "POST",
      }),
      
    me: (): Promise<User> =>
      request<User>("/api/auth/me", {
        method: "GET",
      }),
  },
  
  zones: {
    list: (params: {
      search?: string;
      page?: number;
      limit?: number;
      sort_by?: string;
      sort_order?: string;
    } = {}): Promise<PaginatedResponse<HostedZone>> => {
      const query = new URLSearchParams();
      if (params.search) query.append("search", params.search);
      if (params.page) query.append("page", String(params.page));
      if (params.limit) query.append("limit", String(params.limit));
      if (params.sort_by) query.append("sort_by", params.sort_by);
      if (params.sort_order) query.append("sort_order", params.sort_order);
      
      return request<PaginatedResponse<HostedZone>>(`/api/hosted-zones?${query.toString()}`);
    },

    get: (zoneId: string): Promise<HostedZone> =>
      request<HostedZone>(`/api/hosted-zones/${zoneId}`),
      
    create: (data: { name: string; type: "public" | "private"; comment?: string }): Promise<HostedZone> =>
      request<HostedZone>("/api/hosted-zones", {
        method: "POST",
        body: JSON.stringify(data),
      }),
      
    update: (zoneId: string, data: { comment?: string }): Promise<HostedZone> =>
      request<HostedZone>(`/api/hosted-zones/${zoneId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
      
    delete: (zoneId: string): Promise<void> =>
      request<void>(`/api/hosted-zones/${zoneId}`, {
        method: "DELETE",
      }),
      
    events: (zoneId: string): Promise<ZoneEvent[]> =>
      request<ZoneEvent[]>(`/api/hosted-zones/${zoneId}/events`),
  },
  
  records: {
    list: (
      zoneId: string,
      params: { search?: string; type?: string; page?: number; limit?: number } = {}
    ): Promise<PaginatedResponse<DNSRecord>> => {
      const query = new URLSearchParams();
      if (params.search) query.append("search", params.search);
      if (params.type) query.append("type", params.type);
      if (params.page) query.append("page", String(params.page));
      if (params.limit) query.append("limit", String(params.limit));
      
      return request<PaginatedResponse<DNSRecord>>(`/api/hosted-zones/${zoneId}/records?${query.toString()}`);
    },
    
    get: (zoneId: string, recordId: string): Promise<DNSRecord> =>
      request<DNSRecord>(`/api/hosted-zones/${zoneId}/records/${recordId}`),
      
    create: (
      zoneId: string,
      data: {
        name: string;
        type: RecordType;
        ttl: number;
        value?: string;
        extra_json?: Record<string, any>;
      }
    ): Promise<DNSRecord> =>
      request<DNSRecord>(`/api/hosted-zones/${zoneId}/records`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
      
    update: (
      zoneId: string,
      recordId: string,
      data: {
        ttl: number;
        value?: string;
        extra_json?: Record<string, any>;
      }
    ): Promise<DNSRecord> =>
      request<DNSRecord>(`/api/hosted-zones/${zoneId}/records/${recordId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
      
    delete: (zoneId: string, recordId: string): Promise<void> =>
      request<void>(`/api/hosted-zones/${zoneId}/records/${recordId}`, {
        method: "DELETE",
      }),
  },
  
  simulator: {
    resolve: (name: string, type: string): Promise<any> =>
      request<any>(`/api/dns-simulator/resolve?name=${encodeURIComponent(name)}&type=${type}`),
  },
};
