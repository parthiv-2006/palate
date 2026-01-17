import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { lobbyApi } from '@/lib/api/lobby';

export function useLobby(lobbyId) {
  const token = useAuthStore((state) => state.token);

  // Poll lobby status every 2 seconds
  const { data: lobby, isLoading, refetch, error } = useQuery({
    queryKey: ['lobby', lobbyId],
    queryFn: async () => {
      if (!lobbyId) {
        throw new Error('Lobby ID is required');
      }
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/lobby/${lobbyId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Failed to fetch lobby' } }));
        throw new Error(errorData.error?.message || `Failed to fetch lobby (${response.status})`);
      }
      
      const data = await response.json();
      return data;
    },
    refetchInterval: 2000, // Poll every 2 seconds
    enabled: !!lobbyId, // Only run query if lobbyId exists
    retry: 2, // Retry failed requests
    staleTime: 0, // Always consider data stale to ensure fresh updates
  });

  // Ensure participants is always an array
  const participants = Array.isArray(lobby?.participants) ? lobby.participants : [];
  const restaurants = Array.isArray(lobby?.restaurants) ? lobby.restaurants : [];

  const startMatching = useMutation({
    mutationFn: async () => {
      return lobbyApi.startMatching(lobbyId);
    },
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      throw error; // Re-throw to let component handle it
    },
  });

  return {
    lobby,
    participants,
    restaurants,
    isLoading,
    error,
    startMatching: startMatching.mutateAsync, // Use mutateAsync to return a promise
    isStartingMatching: startMatching.isPending,
  };
}
