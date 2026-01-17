import { apiRequest } from './client';

export const lobbyApi = {
  create: () => apiRequest('/lobby/create', { method: 'POST' }),
  
  join: (lobbyCode) => apiRequest('/lobby/join', {
    method: 'POST',
    body: JSON.stringify({ code: lobbyCode }),
  }),
  
  get: (lobbyId) => apiRequest(`/lobby/${lobbyId}`),
  
  startMatching: (lobbyId) => apiRequest(`/lobby/${lobbyId}/start-matching`, { method: 'POST' }),
  
  getRestaurants: (lobbyId) => apiRequest(`/lobby/${lobbyId}/restaurants`),
  
  swipe: (lobbyId, restaurantId, direction) => apiRequest(`/lobby/${lobbyId}/swipe`, {
    method: 'POST',
    body: JSON.stringify({ restaurantId, direction }),
  }),
};
