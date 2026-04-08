declare global {
	interface Window {
		__AURORA_API_BASE_URL__?: string;
	}
}

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

function normalizeApiBaseUrl(rawValue: string | null | undefined): string {
	const value = rawValue?.trim();
	if (!value) {
		return DEFAULT_API_BASE_URL;
	}

	return value.replace(/\/+$/, '');
}

function readRuntimeApiBaseUrl(): string {
	if (typeof window === 'undefined') {
		return DEFAULT_API_BASE_URL;
	}

	return normalizeApiBaseUrl(window.__AURORA_API_BASE_URL__);
}

export const API_CONFIG = Object.freeze({
	baseUrl: readRuntimeApiBaseUrl(),
});

export function buildApiUrl(path: string): string {
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	return `${API_CONFIG.baseUrl}${normalizedPath}`;
}

export function buildApiUrlWithSearch(
	path: string,
	params: Record<string, string | number | boolean | null | undefined>,
): string {
	const searchParams = new URLSearchParams();

	for (const [key, value] of Object.entries(params)) {
		if (value === null || value === undefined || value === '') {
			continue;
		}

		searchParams.set(key, String(value));
	}

	const queryString = searchParams.toString();
	return queryString ? `${buildApiUrl(path)}?${queryString}` : buildApiUrl(path);
}
