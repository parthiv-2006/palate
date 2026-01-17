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
  const { isAuthenticated, hasHydrated } = useAuth();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [lobbyId, setLobbyId] = useState(null);

  const { lobby, participants, startMatching, isStartingMatching } = useLobby(lobbyId);

  useEffect(() => {
    // Wait for auth state to hydrate before checking authentication
    if (hasHydrated && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, hasHydrated, router]);

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
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          <button
            onClick={() => router.push('/lobby/join')}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition-colors"
          >
            Join Lobby
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
