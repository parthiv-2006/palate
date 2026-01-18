'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { lobbyApi } from '@/lib/api/lobby';
import { userApi } from '@/lib/api/user';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Confetti } from '@/components/ui/Confetti';

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

export default function VotingPage() {
  const params = useParams();
  const router = useRouter();
  const lobbyId = params.lobbyId;
  const { isAuthenticated, hasHydrated, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiTriggeredRef = useRef(false);

  const { data: votingData, isLoading, error, refetch } = useQuery({
    queryKey: ['voting', lobbyId],
    queryFn: async () => lobbyApi.getVotingData(lobbyId),
    enabled: !!lobbyId && hasHydrated && isAuthenticated,
    refetchInterval: 3000,
  });

  const { data: lobbyData } = useQuery({
    queryKey: ['lobby', lobbyId],
    queryFn: () => lobbyApi.get(lobbyId),
    enabled: !!lobbyId && hasHydrated && isAuthenticated,
    refetchInterval: 3000,
  });

  const isHost = lobbyData?.host_id === (user?.userId || user?.id);

  useEffect(() => {
    if (lobbyData?.status === 'waiting') {
      toast('Lobby was reset. Returning...', { icon: '🔄' });
      router.push(`/lobby/${lobbyId}/room`);
    } else if (lobbyData?.status === 'matching') {
      router.push(`/matching/${lobbyId}`);
    }
  }, [lobbyData?.status, lobbyId, router]);

  const voteMutation = useMutation({
    mutationFn: async (restaurantId) => lobbyApi.vote(lobbyId, restaurantId),
    onSuccess: (data) => {
      toast.success('Vote recorded!');
      queryClient.invalidateQueries(['voting', lobbyId]);
      if (data.allVoted) {
        toast.success('Everyone voted! Revealing results...', { duration: 3000 });
      }
    },
    onError: (error) => toast.error(error.message || 'Failed to record vote'),
  });

  const resetMutation = useMutation({
    mutationFn: async () => lobbyApi.resetLobby(lobbyId),
    onSuccess: () => {
      toast.success('Lobby reset!');
      queryClient.invalidateQueries(['lobby', lobbyId]);
      queryClient.invalidateQueries(['voting', lobbyId]);
      router.push(`/lobby/${lobbyId}/room`);
    },
    onError: (error) => toast.error(error.message || 'Failed to reset lobby'),
  });

  const leaveMutation = useMutation({
    mutationFn: async () => lobbyApi.leaveLobby(lobbyId),
    onSuccess: (data) => {
      toast.success(data.message || 'You left the lobby');
      queryClient.invalidateQueries(['lobby', lobbyId]);
      router.push('/dashboard');
    },
    onError: (error) => toast.error(error.message || 'Failed to leave lobby'),
  });

  const revoteMutation = useMutation({
    mutationFn: async (useTiedOnly) => lobbyApi.revoteLobby(lobbyId, useTiedOnly),
    onSuccess: (data) => {
      toast.success(data.message || 'Revoting started!');
      queryClient.invalidateQueries(['voting', lobbyId]);
    },
    onError: (error) => toast.error(error.message || 'Failed to start revote'),
  });

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.push('/');
  }, [isAuthenticated, hasHydrated, router]);

  useEffect(() => {
    if (votingData?.userVote) setSelectedRestaurant(votingData.userVote);
  }, [votingData?.userVote]);

  // Trigger confetti when voting is completed
  useEffect(() => {
    if (votingData?.status === 'completed' && votingData?.winningRestaurant && !confettiTriggeredRef.current) {
      confettiTriggeredRef.current = true;
      // Small delay to ensure the winner screen is visible
      setTimeout(() => setShowConfetti(true), 300);
    }
  }, [votingData?.status, votingData?.winningRestaurant]);

  const visitRecordedRef = useRef(false);

  useEffect(() => {
    if (votingData?.status === 'completed' && votingData?.winningRestaurant && !visitRecordedRef.current) {
      visitRecordedRef.current = true;
      const winner = votingData.restaurants?.find(r => r.id === votingData.winningRestaurant);
      if (winner) {
        userApi.addVisit({
          restaurant_id: winner.id,
          restaurant_name: winner.name,
          restaurant_cuisine: winner.cuisine,
          restaurant_image: winner.image || winner.imageUrl,
          lobby_id: lobbyId,
        }).catch(err => console.error('Failed to record visit:', err));
      }
    }
  }, [votingData?.status, votingData?.winningRestaurant, votingData?.restaurants, lobbyId]);

  const handleVote = async (restaurantId) => {
    setSelectedRestaurant(restaurantId);
    await voteMutation.mutateAsync(restaurantId);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-animated-gradient flex items-center justify-center text-white">
        <Particles />
        <div className="text-center relative z-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#ffd60a] to-[#ff6b35] flex items-center justify-center text-4xl animate-float">
            🗳️
          </div>
          <p className="text-xl font-medium mb-2">Loading voting options...</p>
          <p className="text-white/50">Getting the best choices</p>
        </div>
      </div>
    );
  }

  if (error) {
    if (lobbyData?.status === 'waiting' || lobbyData?.status === 'matching') {
      return (
        <div className="min-h-screen bg-animated-gradient flex items-center justify-center text-white">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#ff6b35] animate-spin"></div>
            </div>
            <p className="text-white/70">Redirecting...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-animated-gradient flex items-center justify-center text-white p-4">
        <Particles />
        <div className="glass-card rounded-3xl p-8 text-center max-w-md">
          <div className="text-5xl mb-4">😕</div>
          <p className="text-red-400 mb-6">{error.message || 'Failed to load voting data'}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => refetch()} className="px-6 py-3 bg-gradient-to-r from-[#ff6b35] to-[#f72585] text-white rounded-xl font-semibold hover:opacity-90 transition-all">
              Try Again
            </button>
            <button onClick={() => router.push(`/lobby/${lobbyId}/room`)} className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all">
              Back to Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Winner Screen
  if (votingData?.status === 'completed') {
    const winner = votingData.restaurants?.find(r => r.id === votingData.winningRestaurant);
    
    return (
      <div className="min-h-screen bg-animated-gradient text-white relative overflow-hidden p-4">
        <Confetti trigger={showConfetti} type="celebration" />
        <Particles />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[500px] h-[500px] bg-gradient-to-br from-[#ffd60a]/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <div className="relative z-10 max-w-2xl mx-auto py-12">
          <div className="glass-card rounded-3xl p-8 text-center overflow-hidden">
            {/* Celebration Header */}
            <div className="relative mb-8">
              <div className="text-7xl mb-4 animate-float">🎉</div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="gradient-text">We Have a Winner!</span>
              </h1>
              <p className="text-white/60">The group has spoken</p>
            </div>
            
            {winner && (
              <div className="relative rounded-2xl p-6 mb-8 bg-gradient-to-r from-[#ff6b35]/20 to-[#f72585]/20 border border-[#ff6b35]/30 overflow-hidden">
                <div className="absolute inset-0 shimmer"></div>
                <div className="relative z-10">
                  <div className="text-4xl mb-4">🍽️</div>
                  <h2 className="text-3xl font-bold text-white mb-2">{winner.name}</h2>
                  <p className="text-lg font-medium bg-gradient-to-r from-[#ff6b35] to-[#f72585] bg-clip-text text-transparent mb-4">
                    {winner.cuisine}
                  </p>
                  {winner.location?.address && (
                    <p className="text-white/50 text-sm mb-4">{winner.location.address}</p>
                  )}
                  <div className="flex items-center justify-center gap-4">
                    {winner.rating && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ffd60a]/20 border border-[#ffd60a]/30">
                        <span>⭐</span>
                        <span className="text-[#ffd60a] font-bold">{winner.rating}/5</span>
                      </div>
                    )}
                    <div className="px-4 py-1.5 rounded-full bg-white/10">
                      <span className="text-white font-medium">{winner.voteCount} votes</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { value: votingData?.participantCount || 0, label: 'Participants', icon: '👥' },
                { value: votingData?.restaurants?.length || 0, label: 'Choices', icon: '🍴' },
                { value: votingData?.voteCount || 0, label: 'Votes', icon: '🗳️' },
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-white/40 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {isHost && (
                <button
                  onClick={() => resetMutation.mutate()}
                  disabled={resetMutation.isPending}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#4cc9f0] to-[#7209b7] text-white font-bold text-lg hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {resetMutation.isPending ? 'Resetting...' : '🚀 Start New Round'}
                </button>
              )}
              <button
                onClick={() => leaveMutation.mutate()}
                disabled={leaveMutation.isPending}
                className="w-full py-3 px-6 rounded-2xl bg-white/10 text-white/70 font-medium hover:bg-white/20 transition-all border border-white/10"
              >
                {leaveMutation.isPending ? 'Leaving...' : 'Leave Lobby'}
              </button>
              {!isHost && (
                <p className="text-white/40 text-sm mt-4">Only the host can start a new round</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const restaurants = votingData?.restaurants || [];
  const hasVoted = !!votingData?.userVote;
  const progress = Math.round(((votingData?.voteCount || 0) / (votingData?.participantCount || 1)) * 100);

  return (
    <div className="min-h-screen bg-animated-gradient text-white relative overflow-hidden">
      <Particles />
      
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#ffd60a]/10 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#ff6b35]/10 to-transparent rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-4xl mx-auto p-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="gradient-text">Cast Your Vote!</span>
          </h1>
          <p className="text-white/50 mb-6">Pick your top choice from the group favorites</p>
          
          {/* Progress */}
          <div className="max-w-sm mx-auto">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-white/50">{votingData?.voteCount || 0} of {votingData?.participantCount || 0} voted</span>
              <span className="text-[#ffd60a] font-bold">{progress}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#ffd60a] to-[#ff6b35] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Restaurant Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {restaurants.map((restaurant, idx) => {
            const isSelected = selectedRestaurant === restaurant.id;
            const isUserVote = votingData?.userVote === restaurant.id;
            
            return (
              <button
                key={restaurant.id}
                onClick={() => !voteMutation.isPending && handleVote(restaurant.id)}
                disabled={voteMutation.isPending}
                className={`
                  relative text-left p-5 rounded-2xl transition-all duration-300 border
                  ${isSelected || isUserVote 
                    ? 'bg-gradient-to-br from-[#ff6b35]/20 to-[#f72585]/20 border-[#ff6b35]/50 scale-[1.02]' 
                    : 'glass-card border-white/10 hover:border-white/30 hover:scale-[1.01]'}
                  disabled:opacity-50
                `}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {isUserVote && (
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-gradient-to-r from-[#ff6b35] to-[#f72585] text-white text-xs font-bold">
                    Your Vote ✓
                  </div>
                )}
                
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff6b35]/30 to-[#f72585]/30 flex items-center justify-center text-2xl flex-shrink-0">
                    🍽️
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white mb-1 truncate">{restaurant.name}</h3>
                    <p className="text-[#ff6b35] font-medium text-sm mb-2">{restaurant.cuisine}</p>
                    
                    {restaurant.description && (
                      <p className="text-white/40 text-sm line-clamp-1 mb-3">{restaurant.description}</p>
                    )}
                    
                    <div className="flex items-center gap-3 text-sm">
                      {restaurant.rating && (
                        <div className="flex items-center gap-1 text-[#ffd60a]">
                          <span>⭐</span>
                          <span>{restaurant.rating}</span>
                        </div>
                      )}
                      {restaurant.price_range && (
                        <span className="text-[#4cc9f0]">{restaurant.price_range}</span>
                      )}
                      <span className="text-white/30 ml-auto">{restaurant.voteCount} vote{restaurant.voteCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {restaurants.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4 animate-float">🤷</div>
            <p className="text-white/50 text-lg mb-2">No restaurants to vote on</p>
            <p className="text-white/30 text-sm mb-6">No one swiped right on the same restaurants</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-[#ff6b35] to-[#f72585] text-white rounded-xl font-semibold hover:opacity-90"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {/* Waiting State */}
        {hasVoted && !votingData?.isTied && (
          <div className="mt-8 glass-card rounded-2xl p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-[#ffd60a] rounded-full animate-spin"></div>
              <span className="text-white/70">Waiting for others...</span>
            </div>
            <p className="text-white/40 text-sm">{votingData?.voteCount} of {votingData?.participantCount} votes in</p>
          </div>
        )}
      </div>

      {/* Tie Modal */}
      {votingData?.isTied && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-3xl p-8 max-w-md w-full mx-4 border border-white/20 animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-float">🤝</div>
              <h2 className="text-2xl font-bold text-white mb-2">It&apos;s a Tie!</h2>
              <p className="text-white/60 mb-6">
                {votingData.tiedRestaurants?.length || 0} restaurants got equal votes
              </p>
              
              {isHost ? (
                <div className="space-y-3">
                  <p className="text-white/40 text-sm mb-4">As host, choose how to proceed:</p>
                  <button
                    onClick={() => revoteMutation.mutate(true)}
                    disabled={revoteMutation.isPending}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#ffd60a] to-[#ff6b35] text-black font-bold hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {revoteMutation.isPending ? 'Starting...' : '🎯 Revote Tied Only'}
                  </button>
                  <button
                    onClick={() => revoteMutation.mutate(false)}
                    disabled={revoteMutation.isPending}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#ff6b35] to-[#f72585] text-white font-bold hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {revoteMutation.isPending ? 'Starting...' : '🔄 Revote All Options'}
                  </button>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-4 bg-[#1a1a2e] text-white/30 text-sm">or</span>
                    </div>
                  </div>
                  <button
                    onClick={() => resetMutation.mutate()}
                    disabled={resetMutation.isPending}
                    className="w-full py-3 px-6 rounded-2xl bg-white/10 text-white/70 font-medium hover:bg-white/20 transition-all border border-white/10"
                  >
                    {resetMutation.isPending ? 'Resetting...' : '🚀 Start Fresh'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-[#ffd60a] rounded-full animate-spin"></div>
                    <span className="text-white/70">Waiting for host...</span>
                  </div>
                  <p className="text-white/40 text-sm">The host will decide what happens next</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
