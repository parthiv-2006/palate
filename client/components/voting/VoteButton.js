'use client';

export function VoteButton({ restaurantId, userVote, onVote, isLoading }) {
  const handleVote = (vote) => {
    if (!isLoading) {
      onVote(restaurantId, vote);
    }
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={() => handleVote('yes')}
        disabled={isLoading}
        className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
          userVote === 'yes'
            ? 'bg-green-600 text-white shadow-lg scale-105'
            : userVote === 'no'
            ? 'bg-gray-200 text-gray-600 hover:bg-green-100'
            : 'bg-green-500 text-white hover:bg-green-600'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {userVote === 'yes' ? '✓ Voted Yes' : 'Vote Yes'}
      </button>
      <button
        onClick={() => handleVote('no')}
        disabled={isLoading}
        className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
          userVote === 'no'
            ? 'bg-red-600 text-white shadow-lg scale-105'
            : userVote === 'yes'
            ? 'bg-gray-200 text-gray-600 hover:bg-red-100'
            : 'bg-red-500 text-white hover:bg-red-600'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {userVote === 'no' ? '✗ Voted No' : 'Vote No'}
      </button>
    </div>
  );
}
