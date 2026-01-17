'use client';

import { useParams, useRouter } from 'next/navigation';
import { ParticipantList } from '@/components/lobby/ParticipantList';
import { LobbyCode } from '@/components/lobby/LobbyCode';
import { SecurityBadge } from '@/components/ui/SecurityBadge';
import { useLobby } from '@/lib/hooks/useLobby';
import { useAuth } from '@/lib/hooks/useAuth';
import { lobbyApi } from '@/lib/api/lobby';
import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export default function LobbyRoomPage() {
  const params = useParams();
  const router = useRouter();
  const lobbyId = params.lobbyId;
  const { isAuthenticated, hasHydrated, user } = useAuth();
  const { lobby, participants, isLoading, startMatching, isStartingMatching } = useLobby(lobbyId);
  const queryClient = useQueryClient();

  const isHost = lobby?.host_id === user?.userId;

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
    // Wait for auth state to hydrate before checking authentication
    if (hasHydrated && !isAuthenticated) {
      router.push('/');
      return;
    }

    // Redirect based on lobby status - automatically redirect all members
    if (lobby?.status === 'matching') {
      router.push(`/matching/${lobbyId}`);
    } else if (lobby?.status === 'voting') {
      router.push(`/voting/${lobbyId}`);
    }
    // Note: 'completed' status stays on this page after reset
  }, [isAuthenticated, hasHydrated, router, lobby?.status, lobbyId]);

  const handleStartMatching = async () => {
    try {
      await startMatching();
      toast.success('Matching started!');
      router.push(`/matching/${lobbyId}`);
    } catch (error) {
      toast.error(error.message || 'Failed to start matching. Please try again.');
    }
  };

  const handleLeaveLobby = () => {
    leaveMutation.mutate();
  };

  // Wait for hydration and check authentication
  if (!hasHydrated || (!isAuthenticated && hasHydrated) || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {!hasHydrated ? 'Loading...' : isLoading ? 'Loading lobby...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Lobby: {lobby?.name || `Lobby ${lobbyId?.slice(-6)}`}
              </h2>
              <div className="flex items-center gap-3">
                <SecurityBadge />
                {isHost && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    You are the host
                  </span>
                )}
              </div>
            </div>
            <LobbyCode code={lobby?.code || lobbyId} />
          </div>

          <ParticipantList participants={participants} />

          {/* Action Buttons */}
          <div className="space-y-3">
            {isHost && participants.length >= 2 && (
              <button
                onClick={handleStartMatching}
                disabled={isStartingMatching}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
              >
                {isStartingMatching ? 'Starting...' : `Start Matching (${participants.length} members ready)`}
              </button>
            )}

            {!isHost && participants.length >= 2 && (
              <div className="text-center py-3 px-4 bg-gray-50 rounded-lg text-gray-600 text-sm">
                Waiting for host to start matching...
              </div>
            )}

            {participants.length < 2 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                Wait for at least 2 participants to start matching
              </div>
            )}

            {/* Leave Lobby Button */}
            <button
              onClick={handleLeaveLobby}
              disabled={leaveMutation.isPending}
              className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {leaveMutation.isPending ? 'Leaving...' : 'Leave Lobby'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
