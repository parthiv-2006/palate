'use client';

import { LoginRegisterTabs } from '@/components/auth/PasswordForm';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-center text-gray-900 mb-2">TasteSync</h1>
          <p className="text-center text-gray-600">Find your group's perfect dining match</p>
        </div>
        
        <div className="space-y-4">
          <LoginRegisterTabs mode="register" />
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500 text-center">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
