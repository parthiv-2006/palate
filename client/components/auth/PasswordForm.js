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
  const [showPassword, setShowPassword] = useState(false);

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
      {/* Username Input */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-white/30 group-focus-within:text-[#4cc9f0] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#4cc9f0] focus:bg-white/10 transition-all"
          disabled={isLoading}
          autoComplete="username"
        />
      </div>

      {/* Password Input */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-white/30 group-focus-within:text-[#4cc9f0] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#4cc9f0] focus:bg-white/10 transition-all"
          disabled={isLoading}
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/30 hover:text-white/60 transition-colors"
        >
          {showPassword ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Confirm Password (Register only) */}
      {mode === 'register' && (
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-white/30 group-focus-within:text-[#4cc9f0] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#4cc9f0] focus:bg-white/10 transition-all"
            disabled={isLoading}
            autoComplete="new-password"
          />
        </div>
      )}

      {/* Error Message */}
      {displayError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30">
          <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-400 text-sm">{displayError}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#ff6b35] to-[#f72585] text-white font-bold text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#ff6b35]/25"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Processing...
          </span>
        ) : mode === 'register' ? (
          <span className="flex items-center justify-center gap-2">
            <span>Create Account</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>Sign In</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </span>
        )}
      </button>
    </form>
  );
}


const API_BASE = 'http://localhost:3001/api/auth';

function AuthForm({ mode = 'login' }) {
  const { register2, loginWithToken, isLoading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleRegister = async () => {
    try {
      const optionsRes = await fetch(`${API_BASE}/register-passkey-options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const text = await optionsRes.text();
      let options;
      try {
        options = JSON.parse(text);
      } catch {
        throw new Error(`Invalid JSON from server: ${text}`);
      }

      const attestation = await SimpleWebAuthnBrowser.startRegistration(options);

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

      if (result.token) {
        await register2(username, result.token);
      }
    } catch (err) {
      console.error(err);
      setValidationError(err.message || 'Registration failed');
    }
  };

  const handleLogin = async () => {
    try {
      const optionsRes = await fetch(`${API_BASE}/login-passkey-options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const options = await optionsRes.json();

      if (options.error) throw new Error(options.error);

      const assertion = await SimpleWebAuthnBrowser.startAuthentication(options);

      const verifyRes = await fetch(`${API_BASE}/login-passkey-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, attestationResponse: assertion }),
      });
      const result = await verifyRes.json();

      if (!result.success) throw new Error(result.error || 'Login failed');

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
      {/* Username Input - Dark themed */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-white/30 group-focus-within:text-[#4cc9f0] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#4cc9f0] focus:bg-white/10 transition-all"
          disabled={isLoading}
          autoComplete="username"
        />
      </div>

      {/* Info text */}
      <p className="text-white/40 text-xs text-center">
        {mode === 'register' 
          ? 'Use your device biometrics or security key to create an account'
          : 'Use your saved passkey to sign in securely'
        }
      </p>

      {/* Error Message */}
      {displayError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30">
          <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-400 text-sm">{displayError}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#4cc9f0] to-[#7209b7] text-white font-bold text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#7209b7]/25"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Processing...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
            <span>{mode === 'register' ? 'Register with Passkey' : 'Sign in with Passkey'}</span>
          </span>
        )}
      </button>
    </form>
  );
}

export function LoginRegisterTabs({ mode = 'login' }) {
  const [method, setMethod] = useState('password');

  return (
    <div>
      {/* Tabs - Dark themed */}
      <div className="flex mb-6 p-1 bg-white/5 rounded-xl">
        <button
          type="button"
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            method === 'password'
              ? 'bg-gradient-to-r from-[#ff6b35] to-[#f72585] text-white shadow-lg'
              : 'text-white/50 hover:text-white'
          }`}
          onClick={() => setMethod('password')}
        >
          Password
        </button>
        <button
          type="button"
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            method === 'passkey'
              ? 'bg-gradient-to-r from-[#4cc9f0] to-[#7209b7] text-white shadow-lg'
              : 'text-white/50 hover:text-white'
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
