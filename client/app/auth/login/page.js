'use client';

import { LoginRegisterTabs } from '@/components/auth/PasswordForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-animated-gradient text-white relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-[#4cc9f0]/30 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-gradient-to-tr from-[#f72585]/30 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-0 w-72 h-72 bg-gradient-to-l from-[#7209b7]/20 to-transparent rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* Back Button */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4cc9f0] to-[#7209b7] mb-4 animate-float shadow-2xl">
            <span className="text-3xl">👋</span>
          </div>
          <h1 className="text-4xl font-bold mb-3">
            <span className="gradient-text">Welcome Back</span>
          </h1>
          <p className="text-white/60">
            Sign in to continue your food journey
          </p>
        </div>
        
        {/* Auth Card */}
        <div className="glass-card rounded-3xl p-8 backdrop-blur-xl border border-white/10">
          <LoginRegisterTabs mode="login" />
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-transparent text-white/40 text-sm">or</span>
            </div>
          </div>

          <p className="text-center text-white/50 text-sm">
            New to TasteSync?{' '}
            <Link href="/" className="text-[#ff6b35] hover:text-[#f72585] font-semibold transition-colors">
              Create account
            </Link>
          </p>
        </div>
        
        {/* Footer */}
        <p className="mt-8 text-center text-white/30 text-xs">
          Your next favorite meal is just a swipe away
        </p>
      </div>
    </div>
  );
}
