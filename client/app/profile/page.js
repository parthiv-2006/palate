'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { userApi } from '@/lib/api/user';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell } from 'recharts';

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

const CHART_COLORS = {
  primary: '#ff6b35',
  secondary: '#f72585',
  accent: '#7209b7',
  cyan: '#4cc9f0',
  yellow: '#ffd60a',
};

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated, user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: userApi.getProfile,
    enabled: hasHydrated && isAuthenticated,
  });

  // Export analytics data as JSON
  const exportAnalytics = () => {
    const cuisineData = profile?.preferences?.cuisine_data || [];
    const tagData = profile?.preferences?.tag_data || [];

    const exportData = {
      exportDate: new Date().toISOString(),
      username: profile?.username || user?.username,
      summary: {
        cuisinesTried: cuisineData.length,
        totalCuisineVisits: cuisineData.reduce((sum, c) => sum + (c.visit_count || 0), 0),
        tagsTracked: tagData.length,
        totalTagVisits: tagData.reduce((sum, t) => sum + (t.visit_count || 0), 0),
      },
      cuisinePreferences: cuisineData.map(c => ({
        cuisine: c.cuisine,
        visitCount: c.visit_count,
        averageRating: Number((c.average_rating || 0).toFixed(2)),
        wouldReturnCount: c.would_return_count || 0,
        lastVisited: c.last_visited,
        aspects: c.average_aspects,
      })),
      tagPreferences: tagData.map(t => ({
        tag: t.tag,
        visitCount: t.visit_count,
        averageRating: Number((t.average_rating || 0).toFixed(2)),
        lastVisited: t.last_visited,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tastesync-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.push('/');
  }, [isAuthenticated, hasHydrated, router]);

  if (!hasHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-animated-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#ff6b35] animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-[#f72585] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
          </div>
          <p className="mt-6 text-gray-400 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const cuisineData = profile?.preferences?.cuisine_data || [];
  const tagData = profile?.preferences?.tag_data || [];

  // Sort cuisines by visit count (most visited first)
  const sortedCuisines = [...cuisineData].sort((a, b) => (b.visit_count || 0) - (a.visit_count || 0));

  // Sort tags by visit count (most visited first)
  const sortedTags = [...tagData].sort((a, b) => (b.visit_count || 0) - (a.visit_count || 0));

  return (
    <div className="min-h-screen bg-animated-gradient text-white relative overflow-hidden">
      <Particles />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
              >
                ←
              </button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f72585] flex items-center justify-center text-xl animate-float">
                📊
              </div>
              <h1 className="text-2xl font-bold">
                <span className="gradient-text">Your Profile</span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={exportAnalytics}
                className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4cc9f0] to-[#7209b7] hover:opacity-90 transition-all font-medium text-sm shadow-lg hover:shadow-[#4cc9f0]/25"
              >
                <span className="group-hover:scale-110 transition-transform">📥</span>
                <span className="hidden sm:inline">Export Analytics</span>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7209b7] to-[#f72585] flex items-center justify-center text-sm font-bold">
                  {(profile?.username || user?.username || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="text-white/80 font-medium hidden sm:block">{profile?.username || user?.username}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Summary Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              value: cuisineData.length,
              label: 'Cuisines Tried',
              icon: '🌍',
              gradient: 'from-[#7209b7] to-[#f72585]'
            },
            {
              value: cuisineData.reduce((sum, c) => sum + (c.visit_count || 0), 0),
              label: 'Total Cuisine Visits',
              icon: '🍽️',
              gradient: 'from-[#ff6b35] to-[#f72585]'
            },
            {
              value: tagData.length,
              label: 'Tags Tracked',
              icon: '🏷️',
              gradient: 'from-[#4cc9f0] to-[#7209b7]'
            },
            {
              value: tagData.reduce((sum, t) => sum + (t.visit_count || 0), 0),
              label: 'Total Tag Visits',
              icon: '⭐',
              gradient: 'from-[#ffd60a] to-[#ff6b35]'
            },
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

        {/* Cuisine Statistics */}
        <section className="glass-card rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7209b7] to-[#f72585] flex items-center justify-center text-2xl">
              🌍
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Cuisine Preferences</h2>
              <p className="text-white/50 text-sm">Your dining history by cuisine type</p>
            </div>
          </div>

          {sortedCuisines.length > 0 ? (
            <div className="space-y-8">
              {/* Cuisine Visit Count Histogram */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Visits by Cuisine</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sortedCuisines.slice(0, 10).map(c => ({
                    cuisine: c.cuisine,
                    visits: c.visit_count || 0
                  }))} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="cuisine"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.7)' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Bar dataKey="visits" fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]}>
                      {sortedCuisines.slice(0, 10).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? CHART_COLORS.primary : CHART_COLORS.secondary} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Average Rating by Cuisine */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Average Rating by Cuisine</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sortedCuisines.slice(0, 10).map(c => ({
                    cuisine: c.cuisine,
                    rating: Number((c.average_rating || 0).toFixed(1))
                  }))} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="cuisine"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                    />
                    <YAxis
                      domain={[0, 5]}
                      tick={{ fill: 'rgba(255,255,255,0.7)' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Bar dataKey="rating" fill={CHART_COLORS.yellow} radius={[8, 8, 0, 0]}>
                      {sortedCuisines.slice(0, 10).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? CHART_COLORS.yellow : CHART_COLORS.accent} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Cuisine Aspect Ratings - Radar Chart */}
              {sortedCuisines.length > 0 && sortedCuisines[0].average_aspects && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Aspect Ratings (Top 3 Cuisines)</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    {sortedCuisines.slice(0, 3).map((cuisine) => {
                      const aspects = [
                        { aspect: 'Food', value: cuisine.average_aspects?.food_quality || 0 },
                        { aspect: 'Service', value: cuisine.average_aspects?.service || 0 },
                        { aspect: 'Ambiance', value: cuisine.average_aspects?.ambiance || 0 },
                        { aspect: 'Value', value: cuisine.average_aspects?.value || 0 },
                      ].filter(a => a.value > 0);

                      return aspects.length > 0 ? (
                        <div key={cuisine.cuisine} className="bg-white/5 rounded-2xl p-4">
                          <h4 className="text-white font-semibold mb-4 text-center">{cuisine.cuisine}</h4>
                          <ResponsiveContainer width="100%" height={250}>
                            <RadarChart data={aspects}>
                              <PolarGrid stroke="rgba(255,255,255,0.2)" />
                              <PolarAngleAxis
                                dataKey="aspect"
                                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                              />
                              <PolarRadiusAxis
                                angle={90}
                                domain={[0, 5]}
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                              />
                              <Radar
                                name={cuisine.cuisine}
                                dataKey="value"
                                stroke={CHART_COLORS.primary}
                                fill={CHART_COLORS.primary}
                                fillOpacity={0.6}
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4 animate-float">🌍</div>
              <p className="text-white/50 text-lg mb-2">No cuisine data yet</p>
              <p className="text-white/30 text-sm">Start visiting restaurants and leaving reviews to see your preferences</p>
            </div>
          )}
        </section>

        {/* Tag Statistics */}
        <section className="glass-card rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4cc9f0] to-[#7209b7] flex items-center justify-center text-2xl">
              🏷️
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Tag Preferences</h2>
              <p className="text-white/50 text-sm">Your preferences by restaurant tags</p>
            </div>
          </div>

          {sortedTags.length > 0 ? (
            <div className="space-y-8">
              {/* Tag Visit Count Histogram */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Visits by Tag</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={sortedTags.slice(0, 15).map(t => ({
                      tag: t.tag.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                      visits: t.visit_count || 0
                    }))}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      type="number"
                      tick={{ fill: 'rgba(255,255,255,0.7)' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="tag"
                      width={90}
                      tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Bar dataKey="visits" fill={CHART_COLORS.cyan} radius={[0, 8, 8, 0]}>
                      {sortedTags.slice(0, 15).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index % 3 === 0 ? CHART_COLORS.cyan : index % 3 === 1 ? CHART_COLORS.accent : CHART_COLORS.secondary}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Average Rating by Tag */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Average Rating by Tag</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={sortedTags.slice(0, 15).map(t => ({
                      tag: t.tag.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                      rating: Number((t.average_rating || 0).toFixed(1))
                    }))}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      type="number"
                      domain={[0, 5]}
                      tick={{ fill: 'rgba(255,255,255,0.7)' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="tag"
                      width={90}
                      tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Bar dataKey="rating" fill={CHART_COLORS.yellow} radius={[0, 8, 8, 0]}>
                      {sortedTags.slice(0, 15).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index % 2 === 0 ? CHART_COLORS.yellow : CHART_COLORS.primary}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4 animate-float">🏷️</div>
              <p className="text-white/50 text-lg mb-2">No tag data yet</p>
              <p className="text-white/30 text-sm">Tag restaurants when you leave reviews to track your preferences</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
