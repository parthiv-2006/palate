import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

/**
 * Register a new Passkey for a user
 * @param {string} username - User's username/email
 * @returns {Promise<{success: boolean, userId: string}>} - Registration response
 */
export async function registerPasskey(username) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  
  // Step 1: Get registration options from backend
  const response = await fetch(`${API_URL}/auth/passkey/register-options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Failed to get registration options' } }));
    throw new Error(errorData.error?.message || `Failed to get registration options (${response.status})`);
  }
  
  const options = await response.json();

  // Step 2: Start Passkey registration in browser
  const attestation = await startRegistration(options);

  // Step 3: Send attestation to backend for verification
  const verifyResponse = await fetch(`${API_URL}/auth/passkey/register-verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, attestation })
  });

  if (!verifyResponse.ok) {
    const errorData = await verifyResponse.json().catch(() => ({ error: { message: 'Passkey registration verification failed' } }));
    throw new Error(errorData.error?.message || `Passkey registration verification failed (${verifyResponse.status})`);
  }

  const result = await verifyResponse.json();
  if (result.verified) {
    return { success: true, userId: result.userId, token: result.token };
  }
  throw new Error('Passkey registration failed');
}

/**
 * Authenticate with existing Passkey
 * @param {string} username - User's username/email
 * @returns {Promise<{success: boolean, token: string, userId: string}>} - Auth result
 */
export async function authenticatePasskey(username) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  
  // Step 1: Get authentication options from backend
  const response = await fetch(`${API_URL}/auth/passkey/auth-options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Failed to get authentication options' } }));
    throw new Error(errorData.error?.message || `Failed to get authentication options (${response.status})`);
  }
  
  const options = await response.json();

  // Step 2: Start Passkey authentication in browser
  const assertion = await startAuthentication(options);

  // Step 3: Send assertion to backend for verification
  const verifyResponse = await fetch(`${API_URL}/auth/passkey/auth-verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, assertion })
  });

  if (!verifyResponse.ok) {
    const errorData = await verifyResponse.json().catch(() => ({ error: { message: 'Passkey authentication verification failed' } }));
    throw new Error(errorData.error?.message || `Passkey authentication verification failed (${verifyResponse.status})`);
  }

  const result = await verifyResponse.json();
  if (result.verified) {
    // Store auth token
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('user_id', result.userId);
    }
    return { success: true, token: result.token, userId: result.userId };
  }
  throw new Error('Passkey authentication failed');
}
