'use client';

export function BudgetSelector({ value, onChange }) {
  const budgetTiers = [
    { value: 'low', label: '$', description: 'Budget-friendly', icon: '💰' },
    { value: 'medium', label: '$$', description: 'Moderate', icon: '💵' },
    { value: 'high', label: '$$$', description: 'Upscale', icon: '💎' },
    { value: 'any', label: 'Any', description: 'No preference', icon: '✨' },
  ];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Budget Preference</label>
      <div className="grid grid-cols-4 gap-3">
        {budgetTiers.map((tier) => (
          <button
            key={tier.value}
            type="button"
            onClick={() => onChange(tier.value)}
            className={`p-4 rounded-lg border-2 transition-all ${
              value === tier.value
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-1">{tier.icon}</div>
            <div className="text-sm font-bold text-gray-700 mb-0.5">{tier.label}</div>
            <div className="text-xs text-gray-500">{tier.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
