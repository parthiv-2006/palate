'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import * as SimpleWebAuthnBrowser from '@simplewebauthn/browser';


function PasswordForm({ mode = 'login' }) {
  const { register1, login, isLoading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    // Validation
    if (!username.trim()) {
      setValidationError('Username is required');
      return;
    }

    if (!password) {
      setValidationError('Password is required');
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setValidationError('Password must be at least 6 characters long');
        return;
      }

      if (password !== confirmPassword) {
        setValidationError('Passwords do not match');
        return;
      }

      try {
        await register1(username.trim(), password, confirmPassword);
      } catch (err) {
        // Error is handled by useAuth hook
      }
    } else {
      try {
        await login(username.trim(), password);
      } catch (err) {
        // Error is handled by useAuth hook
      }
    }
  };

  const displayError = validationError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          placeholder="Username or email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
          autoComplete="username"
        />
      </div>

      <div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
        />
      </div>

      {mode === 'register' && (
        <div>
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
            autoComplete="new-password"
          />
        </div>
      )}

      {displayError && (
        <p className="text-red-500 text-sm">{displayError}</p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading
          ? 'Processing...'
          : mode === 'register'
            ? 'Register'
            : 'Login'
        }
      </button>
    </form>
  );
}


const API_BASE = 'http://localhost:3001/api/auth'; // your Express backend

function AuthForm({ mode = 'login' }) {
  const { register2, login, loginWithToken, isLoading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleRegister = async () => {
    try {
      // Step 1: get options from backend
      const optionsRes = await fetch(`${API_BASE}/register-passkey-options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      // Quick hackathon-safe check for HTML errors
      const text = await optionsRes.text();
      let options;
      try {
        options = JSON.parse(text);
      } catch {
        throw new Error(`Invalid JSON from server: ${text}`);
      }

      // Step 2: browser creates the credential
      const attestation = await SimpleWebAuthnBrowser.startRegistration(options);

      // Step 3: send to backend for verification
      const verifyRes = await fetch(`${API_BASE}/register-passkey-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, attestationResponse: attestation }),
      });

      const verifyText = await verifyRes.text();
      let result;
      try {
        result = JSON.parse(verifyText);
      } catch {
        throw new Error(`Invalid JSON from server: ${verifyText}`);
      }

      if (!result.success) throw new Error(result.error || 'Registration failed');

      // Step 4: Use your auth hook to set state & navigate
      if (result.token) {
        await register2(username, result.token); // overload register to accept a token
      }
    } catch (err) {
      console.error(err);
      setValidationError(err.message || 'Registration failed');
    }
  };

  const handleLogin = async () => {
    try {
      // Step 1: Request options
      const optionsRes = await fetch(`${API_BASE}/login-passkey-options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const options = await optionsRes.json();

      if (options.error) throw new Error(options.error);

      // Step 2: Authenticate in browser
      const assertion = await SimpleWebAuthnBrowser.startAuthentication(options);

      // Step 3: Verify with server
      const verifyRes = await fetch(`${API_BASE}/login-passkey-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, attestationResponse: assertion }),
      });
      const result = await verifyRes.json();

      if (!result.success) throw new Error(result.error || 'Login failed');

      // Use the auth hook to store state
      loginWithToken(username, result.token);
    } catch (err) {
      console.error(err);
      setValidationError(err.message || 'Login failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!username.trim()) {
      setValidationError('Username is required');
      return;
    }

    if (mode === 'register') {
      await handleRegister();
    } else {
      await handleLogin();
    }
  };

  const displayError = validationError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
          autoComplete="username"
        />
      </div>

      {displayError && <p className="text-red-500 text-sm">{displayError}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading
          ? 'Processing...'
          : mode === 'register'
            ? 'Register with Passkey'
            : 'Login'}
      </button>
    </form>
  );
}

export function LoginRegisterTabs({ mode = 'login' }) {
  const [method, setMethod] = useState('password'); // 'password' or 'passkey'

  return (
    <div className="max-w-md mx-auto p-4">
      {/* Tabs */}
      <div className="flex mb-4 border-b border-gray-300">
        <button
          className={`flex-1 py-2 ${
            method === 'password'
              ? 'border-b-2 border-blue-600 font-semibold'
              : ''
          }`}
          onClick={() => setMethod('password')}
        >
          Password
        </button>
        <button
          className={`flex-1 py-2 ${
            method === 'passkey'
              ? 'border-b-2 border-blue-600 font-semibold'
              : ''
          }`}
          onClick={() => setMethod('passkey')}
        >
          Passkey
        </button>
      </div>

      {/* Forms */}
      <div>
        {method === 'password' ? (
          <PasswordForm mode={mode} />
        ) : (
          <AuthForm mode={mode} />
        )}
      </div>
    </div>
  );
}
