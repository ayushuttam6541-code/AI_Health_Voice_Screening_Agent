import { useVoiceCall } from "./hooks/useVoiceCall";
import { CallScreen } from "./components/CallScreen";

function App() {
  const {
    status,
    transcript,
    assistantMessage,
    error,
    callDuration,
    formatDuration,
    report,
    isConnected,
    isRecording,
    startCall,
    startRecording,
    stopRecording,
    endCall,
  } = useVoiceCall();

  return (
    <CallScreen
      status={status}
      transcript={transcript}
      assistantMessage={assistantMessage}
      error={error}
      callDuration={callDuration}
      formatDuration={formatDuration}
      report={report}
      isConnected={isConnected}
      isRecording={isRecording}
      onStartCall={startCall}
      onEndCall={endCall}
      onStartRecording={startRecording}
      onStopRecording={stopRecording}
      onDismissError={() => {}}
    />
  );
}

export default App;