interface TranscriptProps {
  userTranscript: string;
  assistantMessage: string;
}

export function Transcript({ userTranscript, assistantMessage }: TranscriptProps) {
  return (
    <div className="space-y-4">
      {userTranscript && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 mb-1">You</p>
              <p className="text-gray-700">{userTranscript}</p>
            </div>
          </div>
        </div>
      )}

      {assistantMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 mb-1">AI Assistant</p>
              <p className="text-gray-700">{assistantMessage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
