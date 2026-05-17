import Constants from "expo-constants";

export interface TaalBulletin {
  id: number;
  sourceUrl: string;
  title: string;
  publishedAt?: string;
  alertLevel?: string;
  rawText: string;
  scrapedAt: string;
}

export interface TaalBulletinExplanation {
  id: number;
  sourceUrl: string;
  plainLanguageSummary: string[];
  safetyNote: string;
}

const API_PATH = "/api/bulletins/taal";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function getConfiguredBaseUrl() {
  const configured = Constants.expoConfig?.extra?.taalBulletinApiBaseUrl;
  return typeof configured === "string" && configured.trim().length > 0
    ? trimTrailingSlash(configured.trim())
    : undefined;
}

function inferLanBaseUrl() {
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(":")[0];

  if (host && host !== "localhost" && host !== "127.0.0.1") {
    return `http://${host}:3000`;
  }

  return "http://192.168.x.x:3000";
}

export const TAAL_BULLETIN_API_BASE_URL = getConfiguredBaseUrl() ?? inferLanBaseUrl();

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(`${TAAL_BULLETIN_API_BASE_URL}${API_PATH}${path}`);
  const text = await response.text();

  if (!response.ok) {
    let message = `Bulletin request failed with HTTP ${response.status}.`;
    try {
      const parsed = JSON.parse(text) as { error?: string };
      if (parsed.error) {
        message = parsed.error;
      }
    } catch {
      if (text.trim()) {
        message = text.trim();
      }
    }

    throw new Error(message);
  }

  return JSON.parse(text) as T;
}

export function getLatestTaalBulletin() {
  return requestJson<TaalBulletin>("/latest");
}

export function getTaalBulletinById(id: number | string) {
  return requestJson<TaalBulletin>(`/${encodeURIComponent(id)}`);
}

export function explainTaalBulletinById(id: number | string) {
  return requestJson<TaalBulletinExplanation>(`/${encodeURIComponent(id)}/explain`);
}

export function explainLatestTaalBulletin() {
  return requestJson<TaalBulletinExplanation>("/latest/explain");
}
