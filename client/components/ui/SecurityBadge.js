'use client';

export function SecurityBadge() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-sm">
      <span className="text-green-600">✓ Passkeys</span>
      <span className="text-gray-400">|</span>
      <span className="text-green-600">✓ Encrypted preferences</span>
    </div>
  );
}
