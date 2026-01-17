'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { SwipeStack } from '@/components/matching/SwipeStack';
import { useAuth } from '@/lib/hooks/useAuth';
import { lobbyApi } from '@/lib/api/lobby';
import toast from 'react-hot-toast';
import { useQuery, useMutation } from '@tanstack/react-query';

function Particles() {
  return (
    <div className="particles">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 20}s`,
            animationDuration: `${15 + Math.random() * 10}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function MatchingPage() {
  const params = useParams();
  const router = useRouter();
  const lobbyId = params.lobbyId;
  const { isAuthenticated, hasHydrated } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [swipeProgress, setSwipeProgress] = useState(null);
  const [userDone, setUserDone] = useState(false);

  const { data: lobbyData } = useQuery({
    queryKey: ['lobby', lobbyId],
    queryFn: () => lobbyApi.get(lobbyId),
    enabled: !!lobbyId && hasHydrated && isAuthenticated,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (lobbyData?.status === 'voting') {
      toast.success('Everyone is done! Moving to voting...');
      router.push(`/voting/${lobbyId}`);
    }
  }, [lobbyData?.status, lobbyId, router]);

  const { data: restaurantsData, isLoading: isLoadingRestaurants } = useQuery({
    queryKey: ['restaurants', lobbyId, userLocation],
    queryFn: async () => lobbyApi.getRestaurants(lobbyId, { location: userLocation }),
    enabled: !!lobbyId && hasHydrated && isAuthenticated && !userDone,
    refetchInterval: false,
  });

  const swipeMutation = useMutation({
    mutationFn: async ({ restaurantId, direction }) => lobbyApi.swipe(lobbyId, restaurantId, direction),
    onSuccess: (data) => {
      if (data.progress) {
        setSwipeProgress(data.progress);
        if (data.progress.userDone) {
          setUserDone(true);
          if (data.progress.allDone) {
            toast.success('Everyone is done! Moving to voting...');
            router.push(`/voting/${lobbyId}`);
          } else {
            toast.success("You're done! Waiting for others...", { icon: '⏳' });
          }
        }
      }
      if (data.transitionedToVoting) {
        toast.success('Everyone is done! Moving to voting...');
        router.push(`/voting/${lobbyId}`);
      }
    },
    onError: (error) => toast.error(error.message || 'Failed to record swipe'),
  });

  useEffect(() => {
    if (restaurantsData?.restaurants) {
      setRestaurants(restaurantsData.restaurants);
      if (restaurantsData.totalRestaurants) {
        setSwipeProgress({
          userSwipeCount: restaurantsData.swipedCount || 0,
          totalRestaurants: restaurantsData.totalRestaurants,
          remainingCount: restaurantsData.remainingCount || restaurantsData.restaurants.length,
        });
      }
    }
  }, [restaurantsData]);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.push('/');
  }, [isAuthenticated, hasHydrated, router]);

  // Try to get browser geolocation to improve Yelp search relevance
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation(`${latitude},${longitude}`);
      },
      (err) => {
        // ignore geolocation errors; server will fall back to DB
        console.warn('Geolocation not available or permission denied', err.message);
      },
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, []);

  const handleSwipe = async (restaurantId, direction) => {
    try {
      await swipeMutation.mutateAsync({ restaurantId, direction });
      setRestaurants(prev => prev.filter(r => r.id !== restaurantId));
    } catch (error) {
      console.error('Swipe error:', error);
    }
  };

  const handleEmpty = () => {
    console.log('SwipeStack empty, waiting for server confirmation...');
  };

  if (!hasHydrated || (!isAuthenticated && hasHydrated)) {
    return (
      <div className="min-h-screen bg-animated-gradient flex items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#ff6b35] animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-[#f72585] animate-spin" style={{ animationDirection: 'reverse' }}></div>
        </div>
      </div>
    );
  }

  if (isLoadingRestaurants && !userDone) {
    return (
      <div className="min-h-screen bg-animated-gradient flex items-center justify-center text-white">
        <Particles />
        <div className="text-center relative z-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#ff6b35] to-[#f72585] flex items-center justify-center text-4xl animate-float">
            🍜
          </div>
          <p className="text-xl font-medium mb-2">Finding restaurants...</p>
          <p className="text-white/50">Curating the best options for your group</p>
        </div>
      </div>
    );
  }

  if (userDone) {
    return (
      <div className="min-h-screen bg-animated-gradient text-white relative overflow-hidden p-4">
        <Particles />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-96 h-96 bg-gradient-to-br from-[#4cc9f0]/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <div className="relative z-10 max-w-md mx-auto py-12">
          <div className="glass-card rounded-3xl p-8 text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#4cc9f0] to-[#7209b7] flex items-center justify-center text-5xl animate-float">
              ✨
            </div>
            <h1 className="text-3xl font-bold mb-3 gradient-text">You&apos;re Done!</h1>
            <p className="text-white/60 mb-6">Waiting for your friends to finish swiping...</p>
            
            {swipeProgress && (
              <div className="mb-8">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#4cc9f0]">{swipeProgress.userSwipeCount || swipeProgress.totalRestaurants}</div>
                    <div className="text-white/40 text-sm">Swiped</div>
                  </div>
                  <div className="text-2xl text-white/30">/</div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">{swipeProgress.totalRestaurants}</div>
                    <div className="text-white/40 text-sm">Total</div>
                  </div>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#4cc9f0] to-[#7209b7] rounded-full transition-all duration-500"
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-5 h-5 border-2 border-white/30 border-t-[#4cc9f0] rounded-full animate-spin"></div>
              <span className="text-white/50">Syncing with group...</span>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="px-8 py-3 rounded-2xl bg-white/10 text-white/70 font-medium hover:bg-white/20 transition-all border border-white/10"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isProcessingLastSwipe = restaurants.length === 0 && !userDone && swipeMutation.isPending;
  const isWaitingForConfirmation = restaurants.length === 0 && !userDone && !swipeMutation.isPending;

  if (isProcessingLastSwipe || (isWaitingForConfirmation && swipeProgress?.userSwipeCount >= swipeProgress?.totalRestaurants)) {
    return (
      <div className="min-h-screen bg-animated-gradient flex items-center justify-center text-white">
        <Particles />
        <div className="text-center relative z-10">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#ff6b35] animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-[#f72585] animate-spin" style={{ animationDirection: 'reverse' }}></div>
            <div className="absolute inset-4 rounded-full border-4 border-transparent border-t-[#4cc9f0] animate-spin" style={{ animationDuration: '0.5s' }}></div>
          </div>
          <p className="text-xl font-medium">Finishing up...</p>
        </div>
      </div>
    );
  }

  const progress = swipeProgress ? Math.round((swipeProgress.userSwipeCount / swipeProgress.totalRestaurants) * 100) : 0;

  return (
    <div className="min-h-screen bg-animated-gradient text-white relative overflow-hidden">
      <Particles />
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[#ff6b35]/10 to-transparent rounded-full blur-3xl"></div>
      
      {/* Header */}
      <div className="relative z-10 text-center pt-8 pb-4 px-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          <span className="gradient-text">Find Your Match</span>
        </h1>
        <p className="text-white/50">Swipe right to like, left to pass</p>
        
        {/* Progress Bar */}
        {swipeProgress && (
          <div className="max-w-md mx-auto mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-white/50">{swipeProgress.userSwipeCount || 0} of {swipeProgress.totalRestaurants}</span>
              <span className="text-[#ff6b35] font-bold">{progress}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#ff6b35] to-[#f72585] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Swipe Area */}
      <div className="relative z-10 px-4 pb-8">
        <SwipeStack
          restaurants={restaurants}
          onSwipe={handleSwipe}
          onEmpty={handleEmpty}
        />
      </div>

      {/* Keyboard Hints */}
      <div className="fixed bottom-6 left-0 right-0 z-10">
        <div className="flex justify-center gap-6 text-white/30 text-sm">
          <div className="flex items-center gap-2">
            <kbd className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-xs">←</kbd>
            <span>Pass</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-xs">→</kbd>
            <span>Like</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-xs">Space</kbd>
            <span>Like</span>
          </div>
        </div>
      </div>
    </div>
  );
}
