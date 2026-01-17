'use client';

import { useParams, useRouter } from 'next/navigation';
import { ParticipantList } from '@/components/lobby/ParticipantList';
import { LobbyCode } from '@/components/lobby/LobbyCode';
import { SecurityBadge } from '@/components/ui/SecurityBadge';
import { useLobby } from '@/lib/hooks/useLobby';
import { useAuth } from '@/lib/hooks/useAuth';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

export default function LobbyRoomPage() {
  const params = useParams();
  const router = useRouter();
  const lobbyId = params.lobbyId;
  const { isAuthenticated } = useAuth();
  const { lobby, participants, isLoading, startMatching, isStartingMatching } = useLobby(lobbyId);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleStartMatching = async () => {
    try {
      startMatching();
      router.push(`/matching/${lobbyId}`);
    } catch (error) {
      toast.error('Failed to start matching. Please try again.');
    }
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lobby...</p>
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
              <SecurityBadge />
            </div>
            <LobbyCode code={lobby?.code || lobbyId} />
          </div>

          <ParticipantList participants={participants} />

          {participants.length >= 2 && (
            <button
              onClick={handleStartMatching}
              disabled={isStartingMatching}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              {isStartingMatching ? 'Starting...' : `Start Matching (${participants.length} members ready)`}
            </button>
          )}

          {participants.length < 2 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              Wait for at least 2 participants to start matching
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
