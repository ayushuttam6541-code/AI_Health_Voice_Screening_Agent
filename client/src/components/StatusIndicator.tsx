import { CallStatus } from "../types/health";

interface StatusIndicatorProps {
  status: CallStatus;
}

const statusConfig = {
  IDLE: { text: "Ready to start", color: "bg-gray-500" },
  LISTENING: { text: "Listening...", color: "bg-green-500 animate-pulse" },
  PROCESSING: { text: "Thinking...", color: "bg-blue-500 animate-pulse" },
  AI_SPEAKING: { text: "AI is speaking...", color: "bg-purple-500 animate-pulse" },
  ERROR: { text: "Error", color: "bg-red-500" },
  ENDED: { text: "Call completed", color: "bg-gray-400" },
};

export function StatusIndicator({ status }: StatusIndicatorProps) {
  const config = statusConfig[status];
  
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${config.color}`} />
      <span className="text-sm font-medium text-gray-700">{config.text}</span>
    </div>
  );
}
