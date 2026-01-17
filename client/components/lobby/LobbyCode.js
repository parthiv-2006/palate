'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function LobbyCode({ code, onJoin }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const router = useRouter();

  // Display mode (code provided)
  if (code) {
    return (
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-3 font-medium">Lobby Code</p>
        <div className="flex gap-2 justify-center mb-2">
          {code.toString().split('').map((digit, i) => (
            <div
              key={i}
              className="w-14 h-14 bg-blue-600 text-white text-3xl font-bold rounded-lg flex items-center justify-center shadow-md"
            >
              {digit}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">Share this code with your friends</p>
      </div>
    );
  }

  // Entry mode (joining lobby)
  const handleDigitChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;
    
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    // Auto-focus next input
    if (value && index < 5) {
      setTimeout(() => {
        document.getElementById(`digit-${index + 1}`)?.focus();
      }, 10);
    }

    // Auto-submit when all digits entered
    if (newDigits.every(d => d !== '') && newDigits.join('').length === 6) {
      handleJoin(newDigits.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace to move to previous input
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      document.getElementById(`digit-${index - 1}`)?.focus();
    }
  };

  const handleJoin = async (joinCode) => {
    if (onJoin) {
      await onJoin(joinCode);
    } else {
      router.push(`/lobby/${joinCode}/room`);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-center text-gray-600 font-semibold">Enter Lobby Code</p>
      <div className="flex gap-2 justify-center">
        {digits.map((digit, i) => (
          <input
            key={i}
            id={`digit-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-14 h-14 text-center text-3xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
            autoComplete="off"
          />
        ))}
      </div>
    </div>
  );
}
