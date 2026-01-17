'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { SwipeStack } from '@/components/matching/SwipeStack';
import { useAuth } from '@/lib/hooks/useAuth';
import { lobbyApi } from '@/lib/api/lobby';
import toast from 'react-hot-toast';
import { useQuery, useMutation } from '@tanstack/react-query';

export default function MatchingPage() {
  const params = useParams();
  const router = useRouter();
  const lobbyId = params.lobbyId;
  const { isAuthenticated, hasHydrated } = useAuth();
  const [restaurants, setRestaurants] = useState([]);

  // Fetch restaurants
  const { data: restaurantsData, isLoading: isLoadingRestaurants, refetch: refetchRestaurants } = useQuery({
    queryKey: ['restaurants', lobbyId],
    queryFn: async () => {
      return lobbyApi.getRestaurants(lobbyId);
    },
    enabled: !!lobbyId && hasHydrated && isAuthenticated,
    refetchInterval: 5000, // Refetch every 5 seconds to get new restaurants
  });

  // Swipe mutation
  const swipeMutation = useMutation({
    mutationFn: async ({ restaurantId, direction }) => {
      return lobbyApi.swipe(lobbyId, restaurantId, direction);
    },
    onSuccess: (data) => {
      // Check if consensus reached
      if (data.consensusReached && data.consensusRestaurants?.length > 0) {
        toast.success('Group match found! Moving to voting...');
        setTimeout(() => {
          router.push(`/voting/${lobbyId}`);
        }, 1500);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to record swipe');
    },
  });

  useEffect(() => {
    if (restaurantsData?.restaurants) {
      setRestaurants(restaurantsData.restaurants);
    }
  }, [restaurantsData]);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, hasHydrated, router]);

  const handleSwipe = async (restaurantId, direction) => {
    try {
      await swipeMutation.mutateAsync({ restaurantId, direction });
      
      // Remove swiped restaurant from local state
      setRestaurants(prev => prev.filter(r => r.id !== restaurantId));
      
      // Track event (for Amplitude-style analytics)
      if (typeof window !== 'undefined') {
        // This will be integrated with event tracking later
        console.log('Swipe event:', { restaurantId, direction, lobbyId });
      }
    } catch (error) {
      console.error('Swipe error:', error);
    }
  };

  const handleEmpty = () => {
    toast('You\'ve swiped through all restaurants! Fetching more...', {
      icon: 'ℹ️',
    });
    refetchRestaurants();
  };

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

  if (isLoadingRestaurants) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading restaurants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Find Your Match</h1>
          <p className="text-gray-600">Swipe right on restaurants you like, left to pass</p>
          <p className="text-sm text-gray-500 mt-2">
            Use arrow keys, or click the buttons below
          </p>
        </div>

        <SwipeStack
          restaurants={restaurants}
          onSwipe={handleSwipe}
          onEmpty={handleEmpty}
        />

        {/* Keyboard shortcuts hint */}
        <div className="mt-24 text-center">
          <div className="inline-flex gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">←</kbd>
              <span>or</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">A</kbd>
              <span>Pass</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">→</kbd>
              <span>or</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">D</kbd>
              <span>Like</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Space</kbd>
              <span>Like</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
