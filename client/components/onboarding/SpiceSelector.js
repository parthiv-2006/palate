'use client';

export function SpiceSelector({ value, onChange }) {
  const spiceLevels = [
    { value: 'none', label: 'No Spice', icon: '😌' },
    { value: 'low', label: 'Mild', icon: '🌶️' },
    { value: 'medium', label: 'Medium', icon: '🌶️🌶️' },
    { value: 'high', label: 'Hot', icon: '🌶️🌶️🌶️' },
  ];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Spice Tolerance</label>
      <div className="grid grid-cols-4 gap-3">
        {spiceLevels.map((level) => (
          <button
            key={level.value}
            type="button"
            onClick={() => onChange(level.value)}
            className={`p-4 rounded-lg border-2 transition-all ${
              value === level.value
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-1">{level.icon}</div>
            <div className="text-xs font-medium text-gray-700">{level.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
