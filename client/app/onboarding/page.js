'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 'spice', title: 'Spice Level', icon: '🌶️' },
  { id: 'budget', title: 'Budget', icon: '💰' },
  { id: 'dietary', title: 'Dietary', icon: '🥗' },
  { id: 'allergies', title: 'Allergies', icon: '⚠️' },
];

const SPICE_LEVELS = [
  { value: 'none', label: 'No Spice', icon: '🍚', desc: 'Keep it mild', gradient: 'from-gray-400 to-gray-500' },
  { value: 'low', label: 'Mild', icon: '🌶️', desc: 'A little kick', gradient: 'from-yellow-400 to-orange-400' },
  { value: 'medium', label: 'Medium', icon: '🌶️🌶️', desc: 'Nice and balanced', gradient: 'from-orange-400 to-red-400' },
  { value: 'high', label: 'Hot', icon: '🌶️🌶️🌶️', desc: 'Bring the heat!', gradient: 'from-red-500 to-pink-600' },
];

const BUDGET_OPTIONS = [
  { value: 'low', label: 'Budget', icon: '$', desc: 'Under $15', gradient: 'from-green-400 to-emerald-500' },
  { value: 'medium', label: 'Moderate', icon: '$$', desc: '$15 - $30', gradient: 'from-blue-400 to-cyan-500' },
  { value: 'high', label: 'Splurge', icon: '$$$', desc: '$30+', gradient: 'from-purple-400 to-pink-500' },
  { value: 'any', label: 'Any', icon: '💰', desc: 'No limit', gradient: 'from-yellow-400 to-amber-500' },
];

const DIETARY_OPTIONS = [
  { id: 'vegetarian', label: 'Vegetarian', icon: '🌱' },
  { id: 'vegan', label: 'Vegan', icon: '🌿' },
  { id: 'pescatarian', label: 'Pescatarian', icon: '🐟' },
  { id: 'halal', label: 'Halal', icon: '☪️' },
  { id: 'kosher', label: 'Kosher', icon: '✡️' },
  { id: 'gluten-free', label: 'Gluten-Free', icon: '🌾' },
  { id: 'lactose-free', label: 'Lactose-Free', icon: '🥛' },
  { id: 'keto', label: 'Keto', icon: '🥑' },
  { id: 'paleo', label: 'Paleo', icon: '🥩' },
];

const ALLERGY_OPTIONS = [
  { id: 'peanuts', label: 'Peanuts', icon: '🥜' },
  { id: 'tree-nuts', label: 'Tree Nuts', icon: '🌰' },
  { id: 'dairy', label: 'Dairy', icon: '🧀' },
  { id: 'eggs', label: 'Eggs', icon: '🥚' },
  { id: 'soy', label: 'Soy', icon: '🫘' },
  { id: 'wheat', label: 'Wheat/Gluten', icon: '🍞' },
  { id: 'fish', label: 'Fish', icon: '🐟' },
  { id: 'shellfish', label: 'Shellfish', icon: '🦐' },
  { id: 'sesame', label: 'Sesame', icon: '🫓' },
];

function Particles() {
  return (
    <div className="particles">
      {[...Array(15)].map((_, i) => (
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

export default function OnboardingPage() {
  const { isAuthenticated, hasHydrated, token } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preferences, setPreferences] = useState({
    spice_level: 'medium',
    budget: 'any',
    dietary_preferences: [],
    allergies: [],
  });

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.push('/');
  }, [isAuthenticated, hasHydrated, router]);

  const toggleItem = (field, item) => {
    setPreferences(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/user/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) throw new Error('Failed to save');

      toast.success('Preferences saved!');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleSubmit();
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!hasHydrated || (!isAuthenticated && hasHydrated)) {
    return (
      <div className="min-h-screen bg-animated-gradient flex items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#ff6b35] animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-animated-gradient text-white relative overflow-hidden">
      <Particles />
      
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#ff6b35]/20 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#7209b7]/20 to-transparent rounded-full blur-3xl"></div>
      
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#ff6b35] to-[#f72585] flex items-center justify-center text-3xl animate-float">
            {STEPS[step].icon}
          </div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="gradient-text">Set Your Preferences</span>
          </h1>
          <p className="text-white/50">Help us find the perfect restaurants for you</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center gap-2 mb-12">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                i === step 
                  ? 'bg-gradient-to-r from-[#ff6b35] to-[#f72585] text-white' 
                  : i < step
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/30'
              }`}
            >
              <span className="text-lg">{s.icon}</span>
              <span className="text-sm font-medium hidden sm:block">{s.title}</span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="glass-card rounded-3xl p-8 mb-8">
          {step === 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">How much spice can you handle?</h2>
              <div className="grid grid-cols-2 gap-4">
                {SPICE_LEVELS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setPreferences(p => ({ ...p, spice_level: option.value }))}
                    className={`p-5 rounded-2xl text-left transition-all ${
                      preferences.spice_level === option.value
                        ? `bg-gradient-to-br ${option.gradient} text-white scale-105 shadow-lg`
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <div className="text-3xl mb-2">{option.icon}</div>
                    <div className="font-bold">{option.label}</div>
                    <div className="text-sm opacity-70">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">What&apos;s your budget?</h2>
              <div className="grid grid-cols-2 gap-4">
                {BUDGET_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setPreferences(p => ({ ...p, budget: option.value }))}
                    className={`p-5 rounded-2xl text-left transition-all ${
                      preferences.budget === option.value
                        ? `bg-gradient-to-br ${option.gradient} text-white scale-105 shadow-lg`
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <div className="text-3xl mb-2 font-bold">{option.icon}</div>
                    <div className="font-bold">{option.label}</div>
                    <div className="text-sm opacity-70">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-2">Any dietary preferences?</h2>
              <p className="text-white/50 mb-6">Select all that apply (optional)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {DIETARY_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    onClick={() => toggleItem('dietary_preferences', option.id)}
                    className={`p-4 rounded-xl text-left transition-all ${
                      preferences.dietary_preferences.includes(option.id)
                        ? 'bg-gradient-to-br from-[#4cc9f0] to-[#7209b7] text-white scale-105'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <span className="text-xl mr-2">{option.icon}</span>
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-2">Any food allergies?</h2>
              <p className="text-white/50 mb-6">We&apos;ll filter these out for your safety</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ALLERGY_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    onClick={() => toggleItem('allergies', option.id)}
                    className={`p-4 rounded-xl text-left transition-all ${
                      preferences.allergies.includes(option.id)
                        ? 'bg-gradient-to-br from-red-500 to-pink-600 text-white scale-105'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <span className="text-xl mr-2">{option.icon}</span>
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          {step > 0 && (
            <button
              onClick={prevStep}
              className="flex-1 py-4 px-6 rounded-2xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all border border-white/10"
            >
              Back
            </button>
          )}
          <button
            onClick={nextStep}
            disabled={isSubmitting}
            className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#ff6b35] to-[#f72585] text-white font-bold hover:opacity-90 disabled:opacity-50 transition-all glow-orange"
          >
            {isSubmitting ? 'Saving...' : step < STEPS.length - 1 ? 'Continue' : 'Finish Setup'}
          </button>
        </div>

        {/* Skip */}
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full mt-4 text-white/40 hover:text-white/60 text-sm transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
