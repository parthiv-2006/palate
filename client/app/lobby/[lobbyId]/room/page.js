'use client';

import { useParams, useRouter } from 'next/navigation';
import { useLobby } from '@/lib/hooks/useLobby';
import { useAuth } from '@/lib/hooks/useAuth';
import { lobbyApi } from '@/lib/api/lobby';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { VibeCheck, VibeCheckSummary } from '@/components/lobby/VibeCheck';

function Particles() {
  return (
    <div className="particles">
      {[...Array(15)].map((_, i) => (
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

export default function LobbyRoomPage() {
  const params = useParams();
  const router = useRouter();
  const lobbyId = params.lobbyId;
  const { isAuthenticated, hasHydrated, user } = useAuth();
  const { lobby, participants, isLoading, startMatching, isStartingMatching } = useLobby(lobbyId);
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const isHost = lobby?.host_id === (user?.userId || user?.id);

  // Fetch vibe check status
  const { data: vibeCheckStatus, refetch: refetchVibeCheck } = useQuery({
    queryKey: ['vibeCheck', lobbyId],
    queryFn: () => lobbyApi.getVibeCheckStatus(lobbyId),
    enabled: !!lobbyId && hasHydrated && isAuthenticated,
    refetchInterval: 3000,
  });

  const hasCompletedVibeCheck = vibeCheckStatus?.userIsReady || false;
  const allReady = vibeCheckStatus?.allReady || false;
  const readyCount = vibeCheckStatus?.readyCount || 0;

  // Submit vibe check mutation
  const vibeCheckMutation = useMutation({
    mutationFn: async (vibeCheck) => lobbyApi.submitVibeCheck(lobbyId, vibeCheck),
    onSuccess: () => {
      toast.success('Vibe check complete!');
      queryClient.invalidateQueries(['vibeCheck', lobbyId]);
      refetchVibeCheck();
    },
    onError: (error) => toast.error(error.message || 'Failed to submit vibe check'),
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

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/');
      return;
    }
    if (lobby?.status === 'matching') {
      router.push(`/matching/${lobbyId}`);
    } else if (lobby?.status === 'voting') {
      router.push(`/voting/${lobbyId}`);
    }
  }, [isAuthenticated, hasHydrated, router, lobby?.status, lobbyId]);

  const handleStartMatching = async () => {
    if (!allReady) {
      toast.error('Everyone must complete the vibe check first!');
      return;
    }
    try {
      // Attempt to get geolocation before starting matching to enable Yelp enrichment
      let locToSend = null;
      if ('geolocation' in navigator) {
        try {
          const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 }));
          const { latitude, longitude } = pos.coords;
          const locStr = `${latitude},${longitude}`;
          setUserLocation(locStr);
          locToSend = locStr;
        } catch (e) {
          console.warn('Geolocation unavailable or denied', e.message || e);
        }
      }
      await startMatching({ location: locToSend });
      toast.success('Matching started!');
      router.push(`/matching/${lobbyId}`);
    } catch (error) {
      toast.error(error.message || 'Failed to start matching.');
    }
  };

  const copyCode = () => {
    const code = lobby?.code || lobbyId;
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!hasHydrated || (!isAuthenticated && hasHydrated) || isLoading) {
    return (
      <div className="min-h-screen bg-animated-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#ff6b35] animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-[#f72585] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
          </div>
          <p className="mt-6 text-white/50 font-medium">
            {!hasHydrated ? 'Loading...' : isLoading ? 'Loading lobby...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    );
  }

  // Show Vibe Check form if user hasn't completed it
  if (!hasCompletedVibeCheck && lobby?.status === 'waiting') {
    return (
      <div className="min-h-screen bg-animated-gradient text-white relative overflow-hidden p-4">
        <Particles />
        
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#ff6b35]/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-[#7209b7]/20 to-transparent rounded-full blur-3xl"></div>
        
        <div className="relative z-10 max-w-lg mx-auto py-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 mb-4">
              <span className="text-sm text-white/70">Lobby</span>
              <span className="text-sm font-mono font-bold text-[#4cc9f0]">{lobby?.code}</span>
            </div>
            <p className="text-white/50 text-sm">
              {participants.length} participant{participants.length !== 1 ? 's' : ''} in lobby
            </p>
          </div>

          <VibeCheck 
            onSubmit={(vibeCheck) => vibeCheckMutation.mutate(vibeCheck)}
            isSubmitting={vibeCheckMutation.isPending}
            initialValues={vibeCheckStatus?.userVibeCheck}
          />

          <button
            onClick={() => leaveMutation.mutate()}
            disabled={leaveMutation.isPending}
            className="w-full mt-4 py-3 text-white/40 hover:text-white/60 text-sm transition-colors"
          >
            {leaveMutation.isPending ? 'Leaving...' : 'Leave Lobby'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-animated-gradient text-white relative overflow-hidden p-4">
      <Particles />
      
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#4cc9f0]/20 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-[#ff6b35]/20 to-transparent rounded-full blur-3xl"></div>
      
      <div className="relative z-10 max-w-2xl mx-auto py-8">
        <button
          onClick={() => router.push('/dashboard')}
          className="mb-6 flex items-center gap-2 text-white/50 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        <div className="glass-card rounded-3xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-white/10 bg-gradient-to-r from-[#4cc9f0]/10 to-[#7209b7]/10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">Lobby Room</h1>
                  {isHost && (
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#ffd60a] to-[#ff6b35] text-xs font-bold text-black">
                      HOST
                    </span>
                  )}
                </div>
                <p className="text-white/50 text-sm">
                  {allReady ? 'Everyone is ready!' : `Waiting for vibe checks (${readyCount}/${participants.length})`}
                </p>
              </div>
              
              <button
                onClick={copyCode}
                className="group flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/20"
              >
                <span className="text-2xl font-mono font-bold tracking-wider text-[#4cc9f0]">
                  {lobby?.code || lobbyId?.slice(-6)}
                </span>
                <div className={`p-2 rounded-lg ${copied ? 'bg-green-500' : 'bg-white/10 group-hover:bg-white/20'} transition-all`}>
                  {copied ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Your Vibe Check Summary */}
          {vibeCheckStatus?.userVibeCheck && (
            <div className="p-4 mx-6 mt-6 rounded-2xl bg-gradient-to-r from-[#ff6b35]/10 to-[#f72585]/10 border border-[#ff6b35]/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white/70">Your Vibe</span>
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Ready
                </span>
              </div>
              <VibeCheckSummary vibeCheck={vibeCheckStatus.userVibeCheck} />
            </div>
          )}
          
          {/* Participants */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-white/50 text-sm uppercase tracking-wider font-semibold">Squad</span>
              <span className="px-2 py-0.5 rounded-full bg-[#4cc9f0]/20 text-[#4cc9f0] text-xs font-bold">
                {participants.length}
              </span>
              {allReady && (
                <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold ml-auto">
                  All Ready!
                </span>
              )}
            </div>
            
            <div className="grid gap-3 mb-6">
              {vibeCheckStatus?.participants?.map((participant, idx) => (
                <div
                  key={participant.user_id}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7209b7] to-[#f72585] flex items-center justify-center text-lg font-bold">
                      {participant.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#1a1a2e] ${
                      participant.isReady ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                    }`}></div>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white flex items-center gap-2">
                      {participant.name}
                      {participants.find(p => p.user_id === participant.user_id)?.isHost && <span className="text-lg">👑</span>}
                    </div>
                    <div className="text-white/40 text-sm">
                      {participant.isReady ? (
                        <span className="text-green-400">Vibe check complete</span>
                      ) : (
                        <span className="text-yellow-400">Setting their vibe...</span>
                      )}
                    </div>
                  </div>
                  {participant.isReady ? (
                    <span className="text-green-400 text-xl">✓</span>
                  ) : (
                    <div className="w-5 h-5 border-2 border-yellow-500/50 border-t-yellow-500 rounded-full animate-spin"></div>
                  )}
                </div>
              ))}
              
              {participants.length < 2 && (
                <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-white/20 text-white/40">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center animate-pulse">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">Waiting for friends...</div>
                    <div className="text-sm">Share the code above to invite</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="space-y-3">
              {isHost && participants.length >= 2 ? (
                <button
                  onClick={handleStartMatching}
                  disabled={isStartingMatching || !allReady}
                  className={`w-full py-4 px-6 rounded-2xl text-white font-bold text-lg transition-all hover:scale-[1.01] ${
                    allReady 
                      ? 'bg-gradient-to-r from-[#ff6b35] to-[#f72585] hover:opacity-90 glow-orange'
                      : 'bg-white/20 cursor-not-allowed'
                  } disabled:opacity-50`}
                >
                  {isStartingMatching ? (
                    <span className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Starting...
                    </span>
                  ) : allReady ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="text-xl">🚀</span>
                      Start Matching ({participants.length} ready)
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span className="text-xl">⏳</span>
                      Waiting for vibe checks ({readyCount}/{participants.length})
                    </span>
                  )}
                </button>
              ) : !isHost && participants.length >= 2 ? (
                <div className="flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-[#4cc9f0] rounded-full animate-spin"></div>
                  <span className="text-white/70">
                    {allReady ? 'Waiting for host to start...' : `Waiting for vibe checks (${readyCount}/${participants.length})`}
                  </span>
                </div>
              ) : (
                <div className="text-center py-4 text-white/40 text-sm">
                  Need at least 2 participants to start matching
                </div>
              )}

              <button
                onClick={() => leaveMutation.mutate()}
                disabled={leaveMutation.isPending}
                className="w-full py-3 px-6 rounded-2xl bg-white/10 text-white/70 font-medium hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/10 hover:border-red-500/30"
              >
                {leaveMutation.isPending ? 'Leaving...' : 'Leave Lobby'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
