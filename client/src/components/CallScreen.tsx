import { CallStatus } from "../types/health";
import { StatusIndicator } from "./StatusIndicator";
import { ErrorBanner } from "./ErrorBanner";
import { CallControls } from "./CallControls";
import { Transcript } from "./Transcript";
import { HealthReport } from "./HealthReport";

interface CallScreenProps {
  status: CallStatus;
  transcript: string;
  assistantMessage: string;
  error: string;
  callDuration: number;
  formatDuration: (seconds: number) => string;
  report: any;
  isConnected: boolean;
  isRecording: boolean;

  onStartCall: () => void;
  onEndCall: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onDismissError: () => void;
}

export function CallScreen({
  status,
  transcript,
  assistantMessage,
  error,
  callDuration,
  formatDuration,
  report,
  isConnected,
  isRecording,

  onStartCall,
  onEndCall,
  onStartRecording,
  onStopRecording,
  onDismissError,
}: CallScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Health Screening Assistant
          </h1>

          <p className="text-gray-600">
            Have a short conversational health screening with an AI assistant.
          </p>
        </div>

        {/* Status */}
        <div className="flex justify-between items-center mb-6 bg-white rounded-lg shadow-sm p-4">
          <StatusIndicator status={status} />

          {callDuration > 0 && (
            <div className="text-sm font-medium text-gray-700">
              Duration: {formatDuration(callDuration)}
            </div>
          )}
        </div>

        {/* Error */}
        <ErrorBanner
          error={error}
          onDismiss={onDismissError}
        />

        {/* Controls */}
        <div className="mb-6">
          <CallControls
            status={status}
            isConnected={isConnected}
            isRecording={isRecording}
            onStartCall={onStartCall}
            onEndCall={onEndCall}
            onStartRecording={onStartRecording}
            onStopRecording={onStopRecording}
          />
        </div>

        {/* Transcript */}
        {(transcript || assistantMessage) && (
          <div className="mb-6">
            <Transcript
              userTranscript={transcript}
              assistantMessage={assistantMessage}
            />
          </div>
        )}

        {/* Report */}
        {report && (
          <div className="mt-8">
            <HealthReport report={report} />
          </div>
        )}

        {/* Connection Status */}
        {!isConnected && status === "IDLE" && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Server not connected
          </div>
        )}

        {status === "PROCESSING" && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Processing your health information...
          </div>
        )}

      </div>
    </div>
  );
}