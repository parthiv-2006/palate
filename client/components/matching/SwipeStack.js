'use client';

import { SwipeCard } from './SwipeCard';
import { useState, useEffect } from 'react';

export function SwipeStack({ restaurants, onSwipe, onEmpty }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipedRestaurants, setSwipedRestaurants] = useState(new Set());

  useEffect(() => {
    // Reset when restaurants change
    setCurrentIndex(0);
    setSwipedRestaurants(new Set());
  }, [restaurants]);

  const handleSwipe = (restaurantId, direction) => {
    if (swipedRestaurants.has(restaurantId)) {
      return; // Already swiped
    }

    setSwipedRestaurants(prev => new Set([...prev, restaurantId]));
    
    // Call the parent's onSwipe handler
    onSwipe(restaurantId, direction);

    // Move to next restaurant
    setTimeout(() => {
      if (currentIndex + 1 >= restaurants.length) {
        // No more restaurants
        if (onEmpty) {
          onEmpty();
        }
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    }, 300); // Wait for animation
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (currentIndex >= restaurants.length) return;

      const currentRestaurant = restaurants[currentIndex];
      if (!currentRestaurant) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          handleSwipe(currentRestaurant.id, 'left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          handleSwipe(currentRestaurant.id, 'right');
          break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          handleSwipe(currentRestaurant.id, 'right');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, restaurants]);

  if (!restaurants || restaurants.length === 0) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-gray-50 rounded-2xl">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-2">No more restaurants to swipe</p>
          <p className="text-sm text-gray-500">Waiting for more options...</p>
        </div>
      </div>
    );
  }

  const visibleCards = restaurants.slice(currentIndex, currentIndex + 3);
  const remainingCount = restaurants.length - currentIndex;

  return (
    <div className="relative w-full max-w-md mx-auto h-[600px]">
      {visibleCards.map((restaurant, idx) => (
        <SwipeCard
          key={restaurant.id}
          restaurant={restaurant}
          onSwipe={handleSwipe}
          index={idx}
          isTop={idx === 0}
        />
      ))}

      {/* Progress indicator */}
      <div className="absolute -bottom-8 left-0 right-0">
        <div className="flex items-center justify-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: Math.min(remainingCount, 5) }).map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === 0 ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>
          {remainingCount > 5 && (
            <span className="text-sm text-gray-500 ml-2">+{remainingCount - 5} more</span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="absolute -bottom-20 left-0 right-0 flex justify-center gap-4">
        <button
          onClick={() => {
            const currentRestaurant = restaurants[currentIndex];
            if (currentRestaurant) {
              handleSwipe(currentRestaurant.id, 'left');
            }
          }}
          className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
          aria-label="Swipe left"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <button
          onClick={() => {
            const currentRestaurant = restaurants[currentIndex];
            if (currentRestaurant) {
              handleSwipe(currentRestaurant.id, 'right');
            }
          }}
          className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors"
          aria-label="Swipe right"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
