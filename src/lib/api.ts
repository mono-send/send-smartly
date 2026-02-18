export const API_BASE_URL = "https://internal-api.monosend.io/v1.0";
export const API_BASE_URL_V1_1 = "https://internal-api.monosend.io/v1.1";

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

export const api = async (endpoint: string, options: RequestOptions = {}, baseUrl = API_BASE_URL) => {
  const token = localStorage.getItem("access_token");
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // Handle 401 - redirect to login
  if (response.status === 401) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  return response;
};
