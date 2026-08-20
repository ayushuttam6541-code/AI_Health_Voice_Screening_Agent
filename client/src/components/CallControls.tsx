import { CallStatus } from "../types/health";

interface CallControlsProps {
  status: CallStatus;
  isConnected: boolean;
  isRecording: boolean;

  onStartCall: () => void;
  onEndCall: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export function CallControls({
  status,
  isConnected,
  isRecording,

  onStartCall,
  onEndCall,
  onStartRecording,
  onStopRecording,
}: CallControlsProps) {

  const canStartCall =
    status === "IDLE" ||
    status === "ENDED" ||
    status === "ERROR";

  const canRecord =
    status === "LISTENING" &&
    isConnected;

  const canEndCall =
    status !== "IDLE" &&
    status !== "ENDED";

  return (
    <div className="flex flex-wrap gap-3 justify-center">

      {/* START CALL */}
      {canStartCall && (
        <button
          onClick={onStartCall}
          className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          Start Call
        </button>
      )}

      {/* START / STOP SPEAKING */}
      {canRecord && (
        <button
          onClick={
            isRecording
              ? onStopRecording
              : onStartRecording
          }
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            isRecording
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isRecording
            ? "Stop Speaking"
            : "Start Speaking"}
        </button>
      )}

      {/* END CALL */}
      {canEndCall && !isRecording && (
        <button
          onClick={onEndCall}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
        >
          End Call
        </button>
      )}

      {/* While recording */}
      {isRecording && (
        <div className="px-4 py-3 text-red-600 font-semibold">
          🎙️ Recording...
        </div>
      )}

    </div>
  );
}