'use client';

import { VoteButton } from './VoteButton';

export function VoteCard({ restaurant, userVote, voteCounts, onVote, isLoading }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      {/* Restaurant Image Placeholder */}
      <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
        {restaurant.image ? (
          <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-white text-6xl font-bold opacity-50">
            {restaurant.name?.charAt(0) || 'R'}
          </div>
        )}
      </div>

      {/* Restaurant Info */}
      <div className="p-6">
        <div className="mb-3">
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
          {restaurant.price_range && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              {restaurant.price_range}
            </span>
          )}
        </div>

        {/* Location */}
        {restaurant.location?.address && (
          <p className="text-sm text-gray-500 flex items-center gap-1 mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {restaurant.location.address}
          </p>
        )}

        {/* Vote Counts */}
        {voteCounts && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="text-green-600 font-semibold">
                ✓ {voteCounts.yes} Yes
              </span>
              <span className="text-red-600 font-semibold">
                ✗ {voteCounts.no} No
              </span>
            </div>
            {voteCounts.total > 0 && (
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${(voteCounts.yes / voteCounts.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Vote Buttons */}
        <VoteButton
          restaurantId={restaurant.id}
          userVote={userVote}
          onVote={onVote}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
