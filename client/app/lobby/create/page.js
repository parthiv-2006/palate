'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { lobbyApi } from '@/lib/api/lobby';
import toast from 'react-hot-toast';
import { LobbyCode } from '@/components/lobby/LobbyCode';
import { ParticipantList } from '@/components/lobby/ParticipantList';
import { SecurityBadge } from '@/components/ui/SecurityBadge';
import { useLobby } from '@/lib/hooks/useLobby';
import { useEffect } from 'react';

export default function CreateLobbyPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [lobbyId, setLobbyId] = useState(null);

  const { lobby, participants, startMatching, isStartingMatching } = useLobby(lobbyId);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleCreateLobby = async () => {
    setIsCreating(true);
    try {
      const result = await lobbyApi.create();
      setLobbyId(result.lobbyId || result.id);
      toast.success('Lobby created! Share the code with your friends.');
    } catch (error) {
      toast.error(error.message || 'Failed to create lobby. Please try again.');
      console.error('Lobby creation error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartMatching = async () => {
    try {
      startMatching();
      router.push(`/matching/${lobbyId}`);
    } catch (error) {
      toast.error('Failed to start matching. Please try again.');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  // Show lobby creation button if no lobby exists
  if (!lobbyId && !isCreating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Create a Lobby</h1>
          <p className="text-gray-600">Start a group dining session and invite your friends</p>
          <button
            onClick={handleCreateLobby}
            disabled={isCreating}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
          >
            {isCreating ? 'Creating...' : 'Create Lobby'}
          </button>
        </div>
      </div>
    );
  }

  // Show lobby room if lobby exists
  if (lobbyId) {
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
              <LobbyCode code={lobby?.code} />
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

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Creating lobby...</p>
      </div>
    </div>
  );
}
