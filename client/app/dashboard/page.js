'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { userApi } from '@/lib/api/user';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FeedbackForm, FeedbackPrompt } from '@/components/feedback/FeedbackForm';

const SPICE_LEVELS = [
  { value: 'none', label: 'No Spice', icon: '🍚', color: 'from-gray-400 to-gray-500' },
  { value: 'low', label: 'Mild', icon: '🌶️', color: 'from-yellow-400 to-orange-400' },
  { value: 'medium', label: 'Medium', icon: '🌶️🌶️', color: 'from-orange-400 to-red-400' },
  { value: 'high', label: 'Hot', icon: '🌶️🌶️🌶️', color: 'from-red-500 to-pink-600' },
];

const BUDGET_OPTIONS = [
  { value: 'low', label: 'Budget', icon: '$', color: 'from-green-400 to-emerald-500' },
  { value: 'medium', label: 'Moderate', icon: '$$', color: 'from-blue-400 to-cyan-500' },
  { value: 'high', label: 'Splurge', icon: '$$$', color: 'from-purple-400 to-pink-500' },
  { value: 'any', label: 'Any', icon: '💰', color: 'from-yellow-400 to-amber-500' },
];

const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Pescatarian', 'Halal', 'Kosher', 'Gluten-Free', 'Lactose-Free', 'Keto', 'Paleo'];
const ALLERGY_OPTIONS = ['Peanuts', 'Tree Nuts', 'Dairy', 'Eggs', 'Soy', 'Wheat/Gluten', 'Fish', 'Shellfish', 'Sesame'];

// Animated background particles
function Particles() {
  return (
    <div className="particles">
      {[...Array(20)].map((_, i) => (
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

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated, user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [isEditingPrefs, setIsEditingPrefs] = useState(false);
  const [editedPrefs, setEditedPrefs] = useState(null);
  const [feedbackVisit, setFeedbackVisit] = useState(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: userApi.getProfile,
    enabled: hasHydrated && isAuthenticated,
  });

  const { data: pendingFeedback } = useQuery({
    queryKey: ['pendingFeedback'],
    queryFn: userApi.getPendingFeedback,
    enabled: hasHydrated && isAuthenticated,
  });

  const updatePrefsMutation = useMutation({
    mutationFn: userApi.updatePreferences,
    onSuccess: () => {
      toast.success('Preferences updated!');
      queryClient.invalidateQueries(['profile']);
      setIsEditingPrefs(false);
    },
    onError: (error) => toast.error(error.message || 'Failed to update preferences'),
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ visitId, feedback }) => userApi.submitFeedback(visitId, feedback),
    onSuccess: () => {
      toast.success('Thanks for your feedback!');
      queryClient.invalidateQueries(['profile']);
      queryClient.invalidateQueries(['pendingFeedback']);
      setFeedbackVisit(null);
    },
    onError: (error) => toast.error(error.message || 'Failed to submit feedback'),
  });

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.push('/');
  }, [isAuthenticated, hasHydrated, router]);

  useEffect(() => {
    if (profile?.preferences && !editedPrefs) setEditedPrefs(profile.preferences);
  }, [profile?.preferences, editedPrefs]);

  const handleSavePreferences = () => updatePrefsMutation.mutate(editedPrefs);
  const toggleArrayItem = (array, item) => array.includes(item) ? array.filter(i => i !== item) : [...array, item];

  if (!hasHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-animated-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#ff6b35] animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-[#f72585] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
          </div>
          <p className="mt-6 text-gray-400 font-medium">Loading your taste profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const pendingCount = pendingFeedback?.count || 0;

  return (
    <div className="min-h-screen bg-animated-gradient text-white relative overflow-hidden">
      <Particles />
      
      {/* Feedback Modal */}
      {feedbackVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <FeedbackForm
              visit={feedbackVisit}
              onSubmit={(feedback) => feedbackMutation.mutate({ visitId: feedbackVisit.id, feedback })}
              onCancel={() => setFeedbackVisit(null)}
              isSubmitting={feedbackMutation.isPending}
            />
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="relative z-10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f72585] flex items-center justify-center text-xl animate-float">
                🍜
              </div>
              <h1 className="text-2xl font-bold">
                <span className="gradient-text">TasteSync</span>
              </h1>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.push('/profile')}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7209b7] to-[#f72585] flex items-center justify-center text-sm font-bold cursor-pointer">
                  {(profile?.username || user?.username || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="text-white/80 font-medium hidden sm:block">{profile?.username || user?.username}</span>
              </button>
              <button
                onClick={() => { logout(); router.push('/'); }}
                className="text-white/50 hover:text-white transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Pending Feedback Banner */}
        {pendingCount > 0 && (
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#ff6b35]/20 to-[#f72585]/20 border border-[#ff6b35]/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f72585] flex items-center justify-center text-2xl animate-pulse">
                  ⭐
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {pendingCount} {pendingCount === 1 ? 'restaurant' : 'restaurants'} awaiting your review
                  </h3>
                  <p className="text-white/50 text-sm">Help us learn your preferences!</p>
                </div>
              </div>
              {pendingFeedback?.visits?.[0] && (
                <button
                  onClick={() => setFeedbackVisit(pendingFeedback.visits[0])}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#f72585] text-white font-medium hover:opacity-90 transition-all"
                >
                  Leave Feedback
                </button>
              )}
            </div>
          </section>
        )}

        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl glass-card p-8 md:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#ff6b35]/30 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#f72585]/20 to-transparent rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Ready to find your <span className="gradient-text">perfect meal</span>?
            </h2>
            <p className="text-white/60 text-lg mb-8 max-w-xl">
              Swipe, match, and discover the restaurant your whole group will love.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
              <button
                onClick={() => router.push('/lobby/create')}
                className="group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-[#ff6b35] to-[#f72585] hover:scale-[1.02] transition-all duration-300 glow-orange"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <div className="relative z-10 text-left">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🚀</div>
                  <h3 className="text-xl font-bold mb-1">Create Lobby</h3>
                  <p className="text-white/80 text-sm">Start a new group session</p>
                </div>
              </button>
              
              <button
                onClick={() => router.push('/lobby/join')}
                className="group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-[#7209b7] to-[#4cc9f0] hover:scale-[1.02] transition-all duration-300 glow-cyan"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <div className="relative z-10 text-left">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🎯</div>
                  <h3 className="text-xl font-bold mb-1">Join Lobby</h3>
                  <p className="text-white/80 text-sm">Enter code to join friends</p>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Stats Row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: profile?.totalVisits || 0, label: 'Places Visited', icon: '🍽️', gradient: 'from-[#ff6b35] to-[#f72585]' },
            { value: profile?.visits?.filter(v => v.rating >= 4).length || 0, label: 'Favorites', icon: '⭐', gradient: 'from-[#ffd60a] to-[#ff6b35]' },
            { value: (profile?.preferences?.dietary_preferences || []).length, label: 'Preferences', icon: '🥗', gradient: 'from-[#4cc9f0] to-[#7209b7]' },
            { value: new Set(profile?.visits?.map(v => v.restaurant_cuisine)).size || 0, label: 'Cuisines', icon: '🌍', gradient: 'from-[#7209b7] to-[#f72585]' },
          ].map((stat, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 hover:scale-[1.02] transition-all duration-300 group">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-white/50 text-sm">{stat.label}</div>
            </div>
          ))}
        </section>

        {/* Pending Feedback Section */}
        {pendingCount > 0 && (
          <section className="glass-card rounded-3xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f72585] flex items-center justify-center text-xl">
                ⭐
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Share Your Experience</h2>
                <p className="text-white/50 text-sm">How was your meal? Your feedback helps improve recommendations.</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {pendingFeedback?.visits?.map((visit) => (
                <FeedbackPrompt
                  key={visit.id}
                  visit={visit}
                  onClick={() => setFeedbackVisit(visit)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Preferences Section */}
        <section className="glass-card rounded-3xl p-6 md:p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Your Taste Profile</h2>
              <p className="text-white/50">Fine-tune your preferences for better matches</p>
            </div>
            {!isEditingPrefs ? (
              <button
                onClick={() => setIsEditingPrefs(true)}
                className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all"
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => { setIsEditingPrefs(false); setEditedPrefs(profile?.preferences); }}
                  className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePreferences}
                  disabled={updatePrefsMutation.isPending}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#f72585] text-white font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {updatePrefsMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {isEditingPrefs && editedPrefs ? (
            <div className="space-y-8">
              {/* Spice Level */}
              <div>
                <label className="block text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Spice Tolerance</label>
                <div className="flex gap-3 flex-wrap">
                  {SPICE_LEVELS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setEditedPrefs({ ...editedPrefs, spice_level: option.value })}
                      className={`px-5 py-3 rounded-xl font-medium transition-all ${
                        editedPrefs.spice_level === option.value
                          ? `bg-gradient-to-r ${option.color} text-white scale-105`
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {option.icon} {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Budget</label>
                <div className="flex gap-3 flex-wrap">
                  {BUDGET_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setEditedPrefs({ ...editedPrefs, budget: option.value })}
                      className={`px-5 py-3 rounded-xl font-medium transition-all ${
                        editedPrefs.budget === option.value
                          ? `bg-gradient-to-r ${option.color} text-white scale-105`
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {option.icon} {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dietary */}
              <div>
                <label className="block text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Dietary Preferences</label>
                <div className="flex gap-2 flex-wrap">
                  {DIETARY_OPTIONS.map(option => (
                    <button
                      key={option}
                      onClick={() => setEditedPrefs({
                        ...editedPrefs,
                        dietary_preferences: toggleArrayItem(editedPrefs.dietary_preferences || [], option)
                      })}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        (editedPrefs.dietary_preferences || []).includes(option)
                          ? 'bg-gradient-to-r from-[#4cc9f0] to-[#7209b7] text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Allergies */}
              <div>
                <label className="block text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Allergies</label>
                <div className="flex gap-2 flex-wrap">
                  {ALLERGY_OPTIONS.map(option => (
                    <button
                      key={option}
                      onClick={() => setEditedPrefs({
                        ...editedPrefs,
                        allergies: toggleArrayItem(editedPrefs.allergies || [], option)
                      })}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        (editedPrefs.allergies || []).includes(option)
                          ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Spice Level', value: SPICE_LEVELS.find(s => s.value === profile?.preferences?.spice_level)?.label || 'Medium', icon: SPICE_LEVELS.find(s => s.value === profile?.preferences?.spice_level)?.icon || '🌶️', gradient: 'from-orange-500 to-red-500' },
                { label: 'Budget', value: BUDGET_OPTIONS.find(b => b.value === profile?.preferences?.budget)?.label || 'Any', icon: BUDGET_OPTIONS.find(b => b.value === profile?.preferences?.budget)?.icon || '💰', gradient: 'from-green-500 to-emerald-500' },
                { label: 'Dietary', value: (profile?.preferences?.dietary_preferences || []).length > 0 ? `${profile.preferences.dietary_preferences.length} set` : 'None', icon: '🥗', gradient: 'from-purple-500 to-pink-500' },
                { label: 'Allergies', value: (profile?.preferences?.allergies || []).length > 0 ? `${profile.preferences.allergies.length} set` : 'None', icon: '⚠️', gradient: 'from-red-500 to-orange-500' },
              ].map((item, i) => (
                <div key={i} className="bg-white/5 rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center text-lg mb-3`}>
                    {item.icon}
                  </div>
                  <div className="text-white/50 text-sm mb-1">{item.label}</div>
                  <div className="text-white font-semibold">{item.value}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Visit History */}
        <section className="glass-card rounded-3xl p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Recent Visits</h2>
              <p className="text-white/50">Your culinary journey so far</p>
            </div>
            {(profile?.totalVisits || 0) > 0 && (
              <span className="px-4 py-2 rounded-full bg-white/10 text-white/70 text-sm font-medium">
                {profile.totalVisits} total
              </span>
            )}
          </div>

          {(profile?.visits || []).length > 0 ? (
            <div className="grid gap-4">
              {profile.visits.map((visit, idx) => (
                <div 
                  key={visit.id}
                  className="group flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#ff6b35]/50 hover:bg-white/10 transition-all cursor-pointer"
                  style={{ animationDelay: `${idx * 100}ms` }}
                  onClick={() => !visit.feedback_completed && setFeedbackVisit(visit)}
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f72585] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    🍜
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{visit.restaurant_name}</h3>
                    <p className="text-white/50 text-sm">{visit.restaurant_cuisine}</p>
                    {visit.would_return !== undefined && (
                      <div className="flex items-center gap-2 mt-1">
                        {visit.would_return ? (
                          <span className="text-xs text-green-400 flex items-center gap-1">
                            <span>👍</span> Would return
                          </span>
                        ) : (
                          <span className="text-xs text-red-400 flex items-center gap-1">
                            <span>👎</span> Once was enough
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {visit.rating ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#ffd60a]/20 to-[#ff6b35]/20 border border-[#ffd60a]/30">
                      <span>⭐</span>
                      <span className="text-[#ffd60a] font-semibold">{visit.rating}</span>
                    </div>
                  ) : (
                    <div className="px-3 py-1.5 rounded-full bg-[#ff6b35]/20 border border-[#ff6b35]/30 text-[#ff6b35] text-xs font-medium">
                      Rate
                    </div>
                  )}
                  <div className="text-white/30 text-sm hidden sm:block">
                    {new Date(visit.visited_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4 animate-float">🍽️</div>
              <p className="text-white/50 text-lg mb-2">No visits yet</p>
              <p className="text-white/30 text-sm">Complete a group session to see your history</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
