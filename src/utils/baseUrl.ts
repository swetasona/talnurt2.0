/**
 * Returns the base URL of the application.
 * On the client side, it uses the window location.
 * On the server side, it uses the NEXTAUTH_URL environment variable.
 * This helps ensure API requests are made to the correct port.
 */
export function getBaseUrl(): string {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Return the origin of the current window location
    return window.location.origin;
  }
  
  // In server-side context, use the NEXTAUTH_URL environment variable
  // or fallback to a default value
  return process.env.NEXTAUTH_URL || 'http://localhost:3000';
}

/**
 * Returns the API URL, which is the base URL plus '/api'
 */
export function getApiUrl(): string {
  return `${getBaseUrl()}/api`;
}

/**
 * Returns the full URL for a given API endpoint
 * @param endpoint - API endpoint path (e.g., '/auth/session')
 */
export function getFullApiUrl(endpoint: string): string {
  const apiUrl = getApiUrl();
  // Ensure endpoint starts with a slash
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${apiUrl}${normalizedEndpoint}`;
} 