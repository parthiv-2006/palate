'use client';

export function ParticipantList({ participants = [] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800">
        Participants ({participants.length})
      </h3>
      
      {participants.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Waiting for participants to join...</p>
          <p className="text-sm mt-2">Share your lobby code to invite friends</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {participants.map((participant, index) => (
            <div
              key={participant.id || index}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {participant.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">
                  {participant.name || 'Anonymous'}
                </div>
                {participant.isHost && (
                  <div className="text-xs text-blue-600 font-medium">Host</div>
                )}
              </div>
              {participant.isReady && (
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
