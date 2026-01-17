'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { lobbyApi } from '@/lib/api/lobby';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function VotingPage() {
  const params = useParams();
  const router = useRouter();
  const lobbyId = params.lobbyId;
  const { isAuthenticated, hasHydrated, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  // Fetch voting data
  const { data: votingData, isLoading, error, refetch } = useQuery({
    queryKey: ['voting', lobbyId],
    queryFn: async () => {
      return lobbyApi.getVotingData(lobbyId);
    },
    enabled: !!lobbyId && hasHydrated && isAuthenticated,
    refetchInterval: 3000, // Poll for updates
  });

  // Fetch lobby data to check if user is host and handle status changes
  const { data: lobbyData } = useQuery({
    queryKey: ['lobby', lobbyId],
    queryFn: () => lobbyApi.get(lobbyId),
    enabled: !!lobbyId && hasHydrated && isAuthenticated,
    refetchInterval: 3000, // Poll for status changes (e.g., after reset)
  });

  const isHost = lobbyData?.host_id === user?.userId;

  // Redirect if lobby was reset (status changed to 'waiting')
  useEffect(() => {
    if (lobbyData?.status === 'waiting') {
      toast('Lobby was reset. Returning to lobby room...', { icon: '🔄' });
      router.push(`/lobby/${lobbyId}/room`);
    } else if (lobbyData?.status === 'matching') {
      router.push(`/matching/${lobbyId}`);
    }
  }, [lobbyData?.status, lobbyId, router]);

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async (restaurantId) => {
      return lobbyApi.vote(lobbyId, restaurantId);
    },
    onSuccess: (data) => {
      toast.success('Vote recorded!');
      queryClient.invalidateQueries(['voting', lobbyId]);
      
      if (data.allVoted) {
        toast.success('Everyone has voted! Revealing results...', {
          duration: 3000,
        });
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to record vote');
    },
  });

  // Reset lobby mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      return lobbyApi.resetLobby(lobbyId);
    },
    onSuccess: () => {
      toast.success('Lobby reset! Starting new round...');
      queryClient.invalidateQueries(['lobby', lobbyId]);
      queryClient.invalidateQueries(['voting', lobbyId]);
      router.push(`/lobby/${lobbyId}/room`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reset lobby');
    },
  });

  // Leave lobby mutation
  const leaveMutation = useMutation({
    mutationFn: async () => {
      return lobbyApi.leaveLobby(lobbyId);
    },
    onSuccess: (data) => {
      toast.success(data.message || 'You left the lobby');
      queryClient.invalidateQueries(['lobby', lobbyId]);
      router.push('/lobby/create');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to leave lobby');
    },
  });

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, hasHydrated, router]);

  // If user already voted, set the selected restaurant
  useEffect(() => {
    if (votingData?.userVote) {
      setSelectedRestaurant(votingData.userVote);
    }
  }, [votingData?.userVote]);

  // Redirect to results when completed
  useEffect(() => {
    if (votingData?.status === 'completed') {
      // Stay on this page but show results
    }
  }, [votingData?.status]);

  const handleVote = async (restaurantId) => {
    setSelectedRestaurant(restaurantId);
    await voteMutation.mutateAsync(restaurantId);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading voting options...</p>
        </div>
      </div>
    );
  }

  // Handle error - check if it's because lobby was reset
  if (error) {
    // If lobby status is available and not in voting phase, redirect appropriately
    if (lobbyData?.status === 'waiting') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Lobby was reset. Redirecting...</p>
          </div>
        </div>
      );
    }
    
    if (lobbyData?.status === 'matching') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Redirecting to matching...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error.message || 'Failed to load voting data'}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push(`/lobby/${lobbyId}/room`)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show results when completed
  if (votingData?.status === 'completed') {
    const winner = votingData.restaurants?.find(r => r.id === votingData.winningRestaurant);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4">
        <div className="max-w-2xl mx-auto py-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">We Have a Winner!</h1>
            <p className="text-gray-600 mb-8">The group has decided on...</p>
            
            {winner && (
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white mb-8">
                <h2 className="text-2xl font-bold mb-2">{winner.name}</h2>
                <p className="text-green-100 mb-2">{winner.cuisine}</p>
                {winner.location?.address && (
                  <p className="text-green-100 text-sm">{winner.location.address}</p>
                )}
                {winner.rating && (
                  <div className="mt-4 inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                    <span>⭐</span>
                    <span>{winner.rating}/5</span>
                  </div>
                )}
                <div className="mt-4">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                    {winner.voteCount} vote{winner.voteCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}

            {/* Session Stats */}
            <div className="mb-8 p-4 bg-gray-50 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">Session Stats</h3>
              <div className="flex justify-center gap-6 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{votingData?.participantCount || 0}</div>
                  <div className="text-gray-500">Participants</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{votingData?.restaurants?.length || 0}</div>
                  <div className="text-gray-500">Consensus Picks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{votingData?.voteCount || 0}</div>
                  <div className="text-gray-500">Total Votes</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {isHost && (
                <button
                  onClick={() => resetMutation.mutate()}
                  disabled={resetMutation.isPending}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resetMutation.isPending ? 'Resetting...' : 'Start New Round'}
                </button>
              )}
              <button
                onClick={() => leaveMutation.mutate()}
                disabled={leaveMutation.isPending}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {leaveMutation.isPending ? 'Leaving...' : 'Leave Lobby'}
              </button>
            </div>

            {!isHost && (
              <p className="mt-4 text-sm text-gray-500">
                Only the host can start a new round. Waiting for host...
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const restaurants = votingData?.restaurants || [];
  const hasVoted = !!votingData?.userVote;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Vote for Your Favorite!</h1>
          <p className="text-gray-600">
            Everyone liked these restaurants. Now pick your top choice!
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm">
            <span>🗳️</span>
            <span>{votingData?.voteCount || 0} of {votingData?.participantCount || 0} voted</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {restaurants.map((restaurant) => {
            const isSelected = selectedRestaurant === restaurant.id;
            const isUserVote = votingData?.userVote === restaurant.id;
            
            return (
              <div
                key={restaurant.id}
                className={`
                  bg-white rounded-xl shadow-lg p-6 cursor-pointer transition-all
                  ${isSelected ? 'ring-4 ring-orange-500 transform scale-[1.02]' : 'hover:shadow-xl'}
                  ${isUserVote ? 'bg-orange-50' : ''}
                `}
                onClick={() => !voteMutation.isPending && handleVote(restaurant.id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{restaurant.name}</h3>
                    <p className="text-gray-600">{restaurant.cuisine}</p>
                  </div>
                  {isUserVote && (
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm">
                      Your Vote
                    </span>
                  )}
                </div>

                {restaurant.description && (
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{restaurant.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {restaurant.rating && (
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">⭐</span>
                        <span className="text-gray-700">{restaurant.rating}</span>
                      </div>
                    )}
                    {restaurant.price_range && (
                      <span className="text-green-600 font-medium">{restaurant.price_range}</span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {restaurant.voteCount} vote{restaurant.voteCount !== 1 ? 's' : ''}
                  </div>
                </div>

                {restaurant.location?.address && (
                  <p className="text-sm text-gray-400 mt-4">{restaurant.location.address}</p>
                )}
              </div>
            );
          })}
        </div>

        {restaurants.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No restaurants available for voting.</p>
            <p className="text-sm text-gray-400 mt-2">
              This might happen if no one swiped right on the same restaurants.
            </p>
            <button
              onClick={() => router.push('/lobby/create')}
              className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Back to Home
            </button>
          </div>
        )}

        {hasVoted && (
          <div className="mt-8 text-center">
            <div className="bg-white rounded-xl shadow p-6">
              <p className="text-gray-600">
                You&apos;ve voted! Waiting for others to finish...
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
                <span className="text-sm text-gray-500">
                  {votingData?.voteCount || 0} of {votingData?.participantCount || 0} votes received
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
