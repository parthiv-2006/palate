'use client';

export function AllergySelector({ value = [], onChange }) {
  const allergies = [
    // Top 8 Allergens (Big 8)
    { id: 'peanuts', label: 'Peanuts' },
    { id: 'tree-nuts', label: 'Tree Nuts' },
    { id: 'dairy', label: 'Dairy' },
    { id: 'eggs', label: 'Eggs' },
    { id: 'soy', label: 'Soy' },
    { id: 'wheat', label: 'Wheat/Gluten' },
    { id: 'fish', label: 'Fish' },
    { id: 'shellfish', label: 'Shellfish' },
    // Additional Common Allergies
    { id: 'sesame', label: 'Sesame' },
    { id: 'sulfites', label: 'Sulfites' },
    { id: 'mustard', label: 'Mustard' },
    { id: 'lupin', label: 'Lupin' },
    { id: 'molluscs', label: 'Molluscs' },
    { id: 'celery', label: 'Celery' },
    { id: 'corn', label: 'Corn' },
  ];

  const toggleAllergy = (allergyId) => {
    const newValue = value.includes(allergyId)
      ? value.filter(id => id !== allergyId)
      : [...value, allergyId];
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Allergies & Dietary Restrictions</label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {allergies.map((allergy) => (
          <button
            key={allergy.id}
            type="button"
            onClick={() => toggleAllergy(allergy.id)}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              value.includes(allergy.id)
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-sm font-medium text-gray-700">{allergy.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
