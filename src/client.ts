import axios, { AxiosInstance, AxiosError } from "axios";

const SCOPUS_BASE_URL = "https://api.elsevier.com/content";

let apiKey: string | undefined;

export function setApiKey(key: string) {
  apiKey = key;
}

export function getApiKey(): string | undefined {
  return apiKey;
}

function createClient(): AxiosInstance {
  if (!apiKey) {
    throw new Error("SCOPUS_API_KEY not set. Call setApiKey() first.");
  }

  const client = axios.create({
    baseURL: SCOPUS_BASE_URL,
    headers: {
      "X-ELS-APIKey": apiKey,
      "Accept": "application/json",
    },
  });

  client.interceptors.response.use(undefined, async (error: AxiosError) => {
    if (error.response?.status === 429) {
      const retryAfter = parseInt(
        (error.response.headers["retry-after"] as string) || "2",
        10
      );
      const delay = Math.min(retryAfter * 1000, 10000);
      await new Promise((r) => setTimeout(r, delay));
      return client.request(error.config!);
    }
    return Promise.reject(error);
  });

  return client;
}

let _client: AxiosInstance | undefined;

export function getClient(): AxiosInstance {
  if (!_client) {
    _client = createClient();
  }
  return _client;
}

export function normalizeScopusId(id: string): string {
  return id.startsWith("2-s2.0-") ? id : `2-s2.0-${id}`;
}

export function buildYearFilter(yearFrom?: number, yearTo?: number): string {
  const parts: string[] = [];
  if (yearFrom && yearTo) {
    parts.push(`PUBYEAR > ${yearFrom - 1} AND PUBYEAR < ${yearTo + 1}`);
  } else if (yearFrom) {
    parts.push(`PUBYEAR > ${yearFrom - 1}`);
  } else if (yearTo) {
    parts.push(`PUBYEAR < ${yearTo + 1}`);
  }
  return parts.join(" AND ");
}
