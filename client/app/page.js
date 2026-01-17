'use client';

import { PasswordForm } from '@/components/auth/PasswordForm';
import Link from 'next/link';

function FloatingEmojis() {
  const emojis = ['🍕', '🍣', '🌮', '🍜', '🍔', '🥗', '🍱', '🥘', '🍝', '🍛'];
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {emojis.map((emoji, i) => (
        <div
          key={i}
          className="absolute text-4xl opacity-20 animate-float"
          style={{
            left: `${(i * 10) + 5}%`,
            top: `${Math.random() * 80 + 10}%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
          }}
        >
          {emoji}
        </div>
      ))}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-animated-gradient text-white relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-[#ff6b35]/30 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tr from-[#7209b7]/30 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-gradient-to-r from-[#4cc9f0]/20 to-transparent rounded-full blur-3xl"></div>
      </div>
      
      <FloatingEmojis />
      
      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ff6b35] to-[#f72585] mb-4 animate-float shadow-2xl">
            <span className="text-4xl">🍽️</span>
          </div>
          <h1 className="text-5xl font-bold mb-3">
            <span className="gradient-text">TasteSync</span>
          </h1>
          <p className="text-white/60 text-lg">
            Find your group's perfect dining match
          </p>
        </div>
        
        {/* Auth Card */}
        <div className="glass-card rounded-3xl p-8 backdrop-blur-xl border border-white/10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
            <p className="text-white/50 text-sm">Join the food discovery revolution</p>
          </div>
          
          <PasswordForm mode="register" />
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-transparent text-white/40 text-sm">or</span>
            </div>
          </div>

          <p className="text-center text-white/50 text-sm">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#4cc9f0] hover:text-[#7209b7] font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
        
        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { icon: '👥', label: 'Group Voting' },
            { icon: '🎯', label: 'Smart Match' },
            { icon: '⚡', label: 'Real-time' },
          ].map((feature, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl mb-1">{feature.icon}</div>
              <div className="text-white/40 text-xs">{feature.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
