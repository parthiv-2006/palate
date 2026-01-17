'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function ResultsReveal({ results, winner, restaurants, onClose }) {
  const [showWinner, setShowWinner] = useState(false);
  const [winnerRestaurant, setWinnerRestaurant] = useState(null);

  useEffect(() => {
    // Find winner restaurant details
    if (winner) {
      const found = winner.restaurant || restaurants?.find(r => r.id === winner.restaurantId);
      setWinnerRestaurant(found || {
        id: winner.restaurantId,
        name: 'Winner Restaurant',
        cuisine: 'Unknown',
      });
    }
  }, [winner, restaurants]);

  useEffect(() => {
    // Animate winner reveal after a short delay
    const timer = setTimeout(() => {
      setShowWinner(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-2xl p-8 md:p-12"
        >
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Results Are In!</h1>
            <p className="text-xl text-gray-600">Your group has decided</p>
          </div>

          {showWinner && winnerRestaurant && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8"
            >
              <div className="bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl p-8 text-white text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-4xl font-bold mb-2">{winnerRestaurant.name}</h2>
                <p className="text-2xl opacity-90">{winnerRestaurant.cuisine}</p>
                {winnerRestaurant.description && (
                  <p className="mt-4 text-lg opacity-80">{winnerRestaurant.description}</p>
                )}
                <div className="mt-6 flex justify-center gap-6 text-lg">
                  <div>
                    <span className="font-semibold">{winner.yes}</span> Yes votes
                  </div>
                  <div>
                    <span className="font-semibold">{winner.no}</span> No votes
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* All Results */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">All Results</h3>
            <div className="space-y-4">
              {results
                .sort((a, b) => b.score - a.score)
                .map((result, idx) => {
                  const restaurant = result.restaurant || restaurants?.find(r => r.id === result.restaurantId);
                  return (
                    <motion.div
                      key={result.restaurantId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + idx * 0.1 }}
                      className={`p-4 rounded-lg border-2 ${
                        result.restaurantId === winner?.restaurantId
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-lg text-gray-900">
                            {restaurant?.name || `Restaurant ${idx + 1}`}
                          </h4>
                          <p className="text-sm text-gray-600">{restaurant?.cuisine || 'Unknown'}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex gap-4 text-sm">
                            <span className="text-green-600 font-semibold">
                              ✓ {result.yes}
                            </span>
                            <span className="text-red-600 font-semibold">
                              ✗ {result.no}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Score: {result.score}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </div>

          {/* Action Button */}
          <div className="text-center">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start New Session
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
