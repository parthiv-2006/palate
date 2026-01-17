'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LobbyCode } from '@/components/lobby/LobbyCode';
import { lobbyApi } from '@/lib/api/lobby';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/hooks/useAuth';

export default function JoinLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isJoining, setIsJoining] = useState(false);
  const lobbyCode = params.lobbyId;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleJoin = async (code) => {
    if (code.length !== 6) {
      toast.error('Lobby code must be 6 digits');
      return;
    }

    setIsJoining(true);
    try {
      const result = await lobbyApi.join(code);
      toast.success('Joined lobby successfully!');
      router.push(`/lobby/${result.lobbyId || code}/room`);
    } catch (error) {
      toast.error(error.message || 'Failed to join lobby. Please check the code and try again.');
      console.error('Join lobby error:', error);
    } finally {
      setIsJoining(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Lobby</h1>
          <p className="text-gray-600">Enter the 6-digit code to join a group dining session</p>
        </div>

        <LobbyCode onJoin={handleJoin} />

        {isJoining && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Joining lobby...</p>
          </div>
        )}

        <div className="pt-4 border-t">
          <button
            onClick={() => router.push('/lobby/create')}
            className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Or create a new lobby
          </button>
        </div>
      </div>
    </div>
  );
}
