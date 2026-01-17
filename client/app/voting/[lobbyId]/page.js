'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { lobbyApi } from '@/lib/api/lobby';
import toast from 'react-hot-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { VoteCard } from '@/components/voting/VoteCard';
import { ResultsReveal } from '@/components/voting/ResultsReveal';

export default function VotingPage() {
  const params = useParams();
  const router = useRouter();
  const lobbyId = params.lobbyId;
  const { isAuthenticated, hasHydrated } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // Fetch consensus restaurants and vote data
  const { data: votesData, isLoading: isLoadingVotes, refetch: refetchVotes } = useQuery({
    queryKey: ['votes', lobbyId],
    queryFn: async () => {
      return lobbyApi.getVotes(lobbyId);
    },
    enabled: !!lobbyId && hasHydrated && isAuthenticated,
    refetchInterval: 2000, // Poll every 2 seconds for vote updates
  });

  // Fetch results when all votes are in
  const { data: resultsData, refetch: refetchResults } = useQuery({
    queryKey: ['results', lobbyId],
    queryFn: async () => {
      return lobbyApi.getResults(lobbyId);
    },
    enabled: !!lobbyId && hasHydrated && isAuthenticated && votesData?.allVoted,
    refetchInterval: votesData?.allVoted ? false : 2000,
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ restaurantId, vote }) => {
      return lobbyApi.submitVote(lobbyId, restaurantId, vote);
    },
    onSuccess: () => {
      refetchVotes();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit vote');
    },
  });

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, hasHydrated, router]);

  useEffect(() => {
    // Set restaurants from votes data (which includes restaurant details)
    if (votesData?.restaurants) {
      setRestaurants(votesData.restaurants);
    }
  }, [votesData]);

  useEffect(() => {
    // Show results when all votes are in
    if (votesData?.allVoted && resultsData) {
      setShowResults(true);
    }
  }, [votesData?.allVoted, resultsData]);

  const handleVote = async (restaurantId, vote) => {
    try {
      await voteMutation.mutateAsync({ restaurantId, vote });
      toast.success(`Vote ${vote === 'yes' ? 'submitted' : 'recorded'}!`);
    } catch (error) {
      console.error('Vote error:', error);
    }
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

  if (isLoadingVotes) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading voting options...</p>
        </div>
      </div>
    );
  }

  if (showResults && resultsData) {
    return (
      <ResultsReveal
        results={resultsData.results}
        winner={resultsData.winner}
        restaurants={restaurants}
        onClose={() => router.push('/lobby/create')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Cast Your Vote</h1>
          <p className="text-gray-600">Vote on the restaurants your group matched on</p>
          {votesData && (
            <p className="text-sm text-gray-500 mt-2">
              {votesData.participantCount - Object.keys(votesData.userVotes || {}).length} more votes needed
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {restaurants.map((restaurant) => (
            <VoteCard
              key={restaurant.id}
              restaurant={restaurant}
              userVote={votesData?.userVotes?.[restaurant.id]}
              voteCounts={votesData?.voteCounts?.[restaurant.id]}
              onVote={handleVote}
              isLoading={voteMutation.isPending}
            />
          ))}
        </div>

        {restaurants.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No restaurants available for voting yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
