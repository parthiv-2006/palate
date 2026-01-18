'use client';

/**
 * Reusable Skeleton loader component
 * Use for loading states to make the app feel more polished
 */

export function Skeleton({ className = '', variant = 'default' }) {
  const baseClasses = 'animate-pulse bg-white/10 rounded-lg';
  
  const variants = {
    default: '',
    circle: 'rounded-full',
    text: 'h-4',
    title: 'h-6',
    avatar: 'w-12 h-12 rounded-full',
    card: 'h-32',
    button: 'h-12 rounded-xl',
  };

  return (
    <div className={`${baseClasses} ${variants[variant] || ''} ${className}`} />
  );
}

/**
 * Skeleton for a restaurant card
 */
export function RestaurantCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-5 border border-white/10 animate-pulse">
      <div className="flex gap-4">
        {/* Image placeholder */}
        <div className="w-14 h-14 rounded-xl bg-white/10 flex-shrink-0" />
        
        <div className="flex-1 space-y-3">
          {/* Title */}
          <div className="h-5 bg-white/10 rounded w-3/4" />
          {/* Cuisine */}
          <div className="h-4 bg-white/10 rounded w-1/2" />
          {/* Description */}
          <div className="h-3 bg-white/10 rounded w-full" />
          {/* Rating and price */}
          <div className="flex gap-3">
            <div className="h-4 bg-white/10 rounded w-12" />
            <div className="h-4 bg-white/10 rounded w-8" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for swipe cards
 */
export function SwipeCardSkeleton() {
  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="glass-card rounded-3xl overflow-hidden animate-pulse">
        {/* Image area */}
        <div className="aspect-[4/5] bg-white/10" />
        
        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="h-7 bg-white/10 rounded w-3/4" />
          <div className="h-5 bg-white/10 rounded w-1/2" />
          <div className="space-y-2">
            <div className="h-3 bg-white/10 rounded w-full" />
            <div className="h-3 bg-white/10 rounded w-4/5" />
          </div>
          <div className="flex gap-3 pt-2">
            <div className="h-6 bg-white/10 rounded-full w-16" />
            <div className="h-6 bg-white/10 rounded-full w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for participant list items
 */
export function ParticipantSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 animate-pulse">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-white/10" />
      
      {/* Name */}
      <div className="flex-1">
        <div className="h-4 bg-white/10 rounded w-24" />
      </div>
      
      {/* Status badge */}
      <div className="h-6 bg-white/10 rounded-full w-16" />
    </div>
  );
}

/**
 * Skeleton for participant list
 */
export function ParticipantListSkeleton({ count = 3 }) {
  return (
    <div className="space-y-2">
      {[...Array(count)].map((_, i) => (
        <ParticipantSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for voting cards grid
 */
export function VotingGridSkeleton({ count = 4 }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[...Array(count)].map((_, i) => (
        <RestaurantCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for lobby code display
 */
export function LobbyCodeSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6 animate-pulse">
      <div className="h-4 bg-white/10 rounded w-24 mx-auto mb-4" />
      <div className="flex justify-center gap-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-12 h-14 bg-white/10 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for stats cards
 */
export function StatCardSkeleton() {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10 animate-pulse">
      <div className="h-6 bg-white/10 rounded w-8 mx-auto mb-2" />
      <div className="h-8 bg-white/10 rounded w-12 mx-auto mb-1" />
      <div className="h-3 bg-white/10 rounded w-16 mx-auto" />
    </div>
  );
}

/**
 * Full page loading skeleton
 */
export function PageSkeleton({ children }) {
  return (
    <div className="min-h-screen bg-animated-gradient text-white p-4">
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        {children || (
          <>
            <div className="text-center space-y-4 mb-8">
              <Skeleton className="w-16 h-16 mx-auto" variant="circle" />
              <Skeleton className="w-48 h-8 mx-auto" />
              <Skeleton className="w-64 h-4 mx-auto" />
            </div>
            <VotingGridSkeleton count={4} />
          </>
        )}
      </div>
    </div>
  );
}

export default Skeleton;
