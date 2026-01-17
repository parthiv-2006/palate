'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export function SwipeCard({ restaurant, onSwipe, index, isTop }) {
  const [dragDirection, setDragDirection] = useState(null);

  const handleDragEnd = (event, info) => {
    const swipeThreshold = 100;
    const velocityThreshold = 500;

    if (Math.abs(info.offset.x) > swipeThreshold || Math.abs(info.velocity.x) > velocityThreshold) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      onSwipe(restaurant.id, direction);
    } else {
      setDragDirection(null);
    }
  };

  const handleDrag = (event, info) => {
    if (Math.abs(info.offset.x) > 50) {
      setDragDirection(info.offset.x > 0 ? 'right' : 'left');
    } else {
      setDragDirection(null);
    }
  };

  const rotation = dragDirection === 'right' ? 15 : dragDirection === 'left' ? -15 : 0;
  const opacity = isTop ? 1 : 0.7;

  return (
    <motion.div
      className="absolute inset-0 bg-white rounded-2xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing"
      style={{
        zIndex: 10 - index,
        opacity,
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      animate={{
        rotate: rotation,
        scale: isTop ? 1 : 0.95,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
    >
      {/* Swipe indicators */}
      {dragDirection && (
        <motion.div
          className={`absolute inset-0 flex items-center justify-center text-6xl font-bold z-10 ${
            dragDirection === 'right' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {dragDirection === 'right' ? '✓' : '✗'}
        </motion.div>
      )}

      {/* Restaurant image */}
      <div className="relative h-64 bg-gradient-to-br from-gray-200 to-gray-300">
        {restaurant.image ? (
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}
        
        {/* Price range badge */}
        {restaurant.price_range && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">
            {restaurant.price_range}
          </div>
        )}

        {/* Rating badge */}
        {restaurant.rating && (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
            <span>⭐</span>
            <span>{restaurant.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Restaurant info */}
      <div className="p-6">
        <div className="mb-2">
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{restaurant.name}</h3>
          <p className="text-lg text-blue-600 font-medium">{restaurant.cuisine}</p>
        </div>

        {restaurant.description && (
          <p className="text-gray-600 mb-4 line-clamp-2">{restaurant.description}</p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {restaurant.dietary_options?.slice(0, 3).map((option, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
            >
              {option}
            </span>
          ))}
          {restaurant.spice_level && (
            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
              {restaurant.spice_level} spice
            </span>
          )}
        </div>

        {/* Location */}
        {restaurant.location?.address && (
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {restaurant.location.address}
          </p>
        )}
      </div>

      {/* Swipe hints */}
      {isTop && !dragDirection && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-8 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span className="text-red-500">←</span>
            <span>Pass</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Like</span>
            <span className="text-green-500">→</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
