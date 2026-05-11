const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Register a new user with password
 * @param {string} username - User's username/email
 * @param {string} password - User's password
 * @param {string} confirmPassword - Password confirmation
 * @returns {Promise<{success: boolean, userId: string, token: string}>} - Registration response
 */
export async function registerWithPassword(username, password, confirmPassword) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, confirmPassword })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Registration failed' } }));
    throw new Error(errorData.error?.message || `Registration failed (${response.status})`);
  }

  const result = await response.json();
  if (result.success) {
    return { success: true, userId: result.userId, token: result.token };
  }
  throw new Error('Registration failed');
}

/**
 * Login with username and password
 * @param {string} username - User's username/email
 * @param {string} password - User's password
 * @returns {Promise<{success: boolean, token: string, userId: string}>} - Auth result
 */
export async function loginWithPassword(username, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Login failed' } }));
    throw new Error(errorData.error?.message || `Login failed (${response.status})`);
  }

  const result = await response.json();
  if (result.success) {
    return { success: true, token: result.token, userId: result.userId };
  }
  throw new Error('Login failed');
}
