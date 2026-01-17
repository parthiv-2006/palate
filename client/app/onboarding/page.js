'use client';

import { PreferenceForm } from '@/components/onboarding/PreferenceForm';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

export default function OnboardingPage() {
  const { isAuthenticated, hasHydrated, user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth state to hydrate before checking authentication
    if (hasHydrated && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, hasHydrated, router]);

  const handleSubmit = async (preferences) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      // Save preferences to backend
      const response = await fetch(`${API_URL}/user/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          ...preferences,
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Failed to save preferences' } }));
        throw new Error(errorData.error?.message || errorData.message || `Failed to save preferences (${response.status})`);
      }

      // Success - redirect to lobby creation
      toast.success('Preferences saved successfully!');
      router.push('/lobby/create');
    } catch (error) {
      toast.error(error.message || 'Failed to save preferences. Please try again.');
      throw error; // Re-throw to let PreferenceForm handle it
    }
  };

  // Wait for hydration before rendering
  if (!hasHydrated || (!isAuthenticated && hasHydrated)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Set Your Preferences</h2>
          <p className="text-gray-600">
            Tell us about your food preferences so we can find the perfect match for your group.
          </p>
        </div>
        <PreferenceForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
