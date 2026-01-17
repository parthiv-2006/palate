import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { lobbyApi } from '@/lib/api/lobby';

export function useLobby(lobbyId) {
  const { token } = useAuthStore();

  // Poll lobby status every 2 seconds
  const { data: lobby, isLoading, refetch } = useQuery({
    queryKey: ['lobby', lobbyId],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lobby/${lobbyId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch lobby');
      }
      
      return response.json();
    },
    refetchInterval: 2000,
    enabled: !!lobbyId,
  });

  const participants = lobby?.participants || [];
  const restaurants = lobby?.restaurants || [];

  const startMatching = useMutation({
    mutationFn: async () => {
      return lobbyApi.startMatching(lobbyId);
    },
    onSuccess: () => {
      refetch();
    },
  });

  return {
    lobby,
    participants,
    restaurants,
    isLoading,
    startMatching: startMatching.mutate,
    isStartingMatching: startMatching.isPending,
  };
}
