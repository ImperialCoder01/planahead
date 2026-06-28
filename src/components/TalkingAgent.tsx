import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mic, MicOff, Volume2, VolumeX, Sparkles, AlertCircle, 
  HelpCircle, MessageSquare, Play, RefreshCw, Radio, Zap,
  Compass, ShieldCheck, Cpu, ArrowLeft
} from "lucide-react";
import { useStore } from "../store/use-store";
import { getTranslation } from "../lib/translations";

// Helper for Float32 to Int16 conversion for microphone input (16kHz)
function float32ToInt16(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16Array;
}

// Helper to convert Float32 to base64 PCM
function pcmToBase64(float32Array: Float32Array): string {
  const int16 = float32ToInt16(float32Array);
  const bytes = new Uint8Array(int16.buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
}

export const languages = [
  { code: "en-US", label: "🇺🇸 English", name: "English" },
  { code: "es-ES", label: "🇪🇸 Español", name: "Spanish" },
  { code: "fr-FR", label: "🇫🇷 Français", name: "French" },
  { code: "de-DE", label: "🇩🇪 Deutsch", name: "German" },
  { code: "hi-IN", label: "🇮🇳 हिन्दी", name: "Hindi" },
  { code: "ja-JP", label: "🇯🇵 日本語", name: "Japanese" },
  { code: "zh-CN", label: "🇨🇳 中文", name: "Chinese" },
  { code: "ar-AE", label: "🇦🇪 العربية", name: "Arabic" },
  { code: "pt-BR", label: "🇧🇷 Português", name: "Portuguese" }
];

export default function TalkingAgent() {
  const { theme, tasks, goals, momentum, voiceLanguageCode, setVoiceLanguageCode, setActiveTab, addVoiceHistoryLog } = useStore();
  const isDark = theme === "dark";
  const t = (key: string): string => {
    return getTranslation(key, voiceLanguageCode);
  };
  const [mode, setMode] = useState<"live" | "http">("http");
  const [status, setStatus] = useState<"idle" | "connecting" | "listening" | "thinking" | "speaking" | "error">("idle");
  const selectedLang = languages.find(l => l.code === voiceLanguageCode) || languages[0];
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(() => {
    const saved = localStorage.getItem("planahead_mic_permission");
    return saved === "true" ? true : null;
  });
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "agent",
      text: "Hello! I am your PlanAhead companion. Click the microphone to talk with me, or choose a quick prompt below!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Translate welcome message when language changes
  useEffect(() => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === "welcome") {
        return {
          ...msg,
          text: t("talk_to_companion")
        };
      }
      return msg;
    }));
  }, [voiceLanguageCode]);
  const [textInput, setTextInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isWakeWordActive, setIsWakeWordActive] = useState(true);

  // Audio refs
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Browser Speech Recognition & Synthesis Fallbacks
  const recognitionRef = useRef<any>(null);
  const wakeWordRecRef = useRef<any>(null);
  const speechUttRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle background wake-word activation
  useEffect(() => {
    if (isWakeWordActive && status === "idle" && hasMicPermission) {
      startWakeWordListener();
    } else {
      stopWakeWordListener();
    }
    return () => {
      stopWakeWordListener();
    };
  }, [isWakeWordActive, status, mode, hasMicPermission, selectedLang]);

  // Clean up audio & connections on unmount
  useEffect(() => {
    return () => {
      stopAllAudioAndConnections();
    };
  }, []);

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setHasMicPermission(true);
      localStorage.setItem("planahead_mic_permission", "true");
      setErrorMessage("");
      return true;
    } catch (err) {
      console.error("Microphone permission denied:", err);
      setHasMicPermission(false);
      localStorage.setItem("planahead_mic_permission", "false");
      setErrorMessage("Microphone access was denied. Please allow microphone access in your browser settings to enable voice features.");
      return false;
    }
  };

  const startWakeWordListener = () => {
    if (!hasMicPermission) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (wakeWordRecRef.current) {
        wakeWordRecRef.current.abort();
      }

      const rec = new SpeechRecognition();
      wakeWordRecRef.current = rec;
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = selectedLang.code;

      rec.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const text = event.results[i][0].transcript.toLowerCase();
          if (text.includes("plan ahead") || text.includes("companion") || text.includes("assist") || text.includes("hey plan ahead")) {
            console.log("Wake-word detected!");
            stopWakeWordListener();
            // Auto-trigger microphone session
            if (mode === "live") {
              startLiveSession();
            } else {
              startHttpRecording();
            }
            break;
          }
        }
      };

      rec.onerror = (e: any) => {
        if (e.error === "not-allowed") {
          setHasMicPermission(false);
          setIsWakeWordActive(false);
          stopWakeWordListener();
        } else if (e.error !== "no-speech" && e.error !== "aborted") {
          console.warn("Wake word SpeechRecognition error:", e.error);
        }
      };

      rec.onend = () => {
        // Continuous passive re-trigger if still idle and active
        if (isWakeWordActive && status === "idle" && hasMicPermission) {
          try {
            rec.start();
          } catch (err) {
            // Already started or busy
          }
        }
      };

      rec.start();
    } catch (e) {
      console.error("Failed to start background wake listener:", e);
    }
  };

  const stopWakeWordListener = () => {
    if (wakeWordRecRef.current) {
      try {
        wakeWordRecRef.current.onend = null;
        wakeWordRecRef.current.abort();
      } catch (e) {}
      wakeWordRecRef.current = null;
    }
  };

  const stopAllAudioAndConnections = () => {
    stopWakeWordListener();

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Stop mic stream
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }

    // Disconnect processors
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // Close AudioContexts
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }

    // Stop and clear output sources
    audioSourcesRef.current.forEach(src => {
      try {
        src.stop();
      } catch (e) {}
    });
    audioSourcesRef.current = [];
    nextStartTimeRef.current = 0;

    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }

    // Web Speech API cleanup
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isAudioMuted);
  };

  const setIsMuted = (muted: boolean) => {
    setIsAudioMuted(muted);
    if (muted) {
      // Stop ongoing voice output
      audioSourcesRef.current.forEach(src => {
        try {
          src.stop();
        } catch (e) {}
      });
      audioSourcesRef.current = [];
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  };

  // Queue and play 24kHz raw PCM chunk
  const playLiveAudioChunk = (base64PCM: string) => {
    if (isAudioMuted) return;

    try {
      if (!outputAudioCtxRef.current) {
        outputAudioCtxRef.current = new AudioContext({ sampleRate: 24000 });
      }
      const audioCtx = outputAudioCtxRef.current;

      const binaryString = atob(base64PCM);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const buffer = audioCtx.createBuffer(1, float32.length, 24000);
      buffer.copyToChannel(float32, 0);

      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);

      const currentTime = audioCtx.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime + 0.04;
      }

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += buffer.duration;

      audioSourcesRef.current.push(source);
      setStatus("speaking");

      source.onended = () => {
        // Simple filter to check if all started sounds are completed
        const active = audioSourcesRef.current.some(src => src.playbackState && src.playbackState !== "finished");
        if (!active) {
          setStatus("idle");
        }
      };
    } catch (e) {
      console.error("Failed to play live chunk:", e);
    }
  };

  // Connect & stream over WebSockets
  const startLiveSession = async () => {
    stopAllAudioAndConnections();
    setStatus("connecting");
    setErrorMessage("");

    try {
      // Get browser microphone access first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const loc = window.location;
      const protocol = loc.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${loc.host}/api/live-ws`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("listening");
        
        // Start streaming mic audio
        inputAudioCtxRef.current = new AudioContext({ sampleRate: 16000 });
        const source = inputAudioCtxRef.current.createMediaStreamSource(stream);
        const processor = inputAudioCtxRef.current.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        source.connect(processor);
        processor.connect(inputAudioCtxRef.current.destination);

        processor.onaudioprocess = (e) => {
          if (ws.readyState === WebSocket.OPEN && status !== "speaking") {
            const base64PCM = pcmToBase64(e.inputBuffer.getChannelData(0));
            ws.send(JSON.stringify({ audio: base64PCM }));
          }
        };
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.error) {
          setErrorMessage(msg.error);
          setStatus("error");
          stopAllAudioAndConnections();
        } else if (msg.info) {
          // Info message (e.g. running in offline mock mode)
          addMessage("agent", msg.info);
        } else if (msg.audio) {
          playLiveAudioChunk(msg.audio);
        } else if (msg.text) {
          // Text response/transcription
          addMessage("agent", msg.text);
        } else if (msg.interrupted) {
          // Reset voice output on interruption
          audioSourcesRef.current.forEach(src => {
            try {
              src.stop();
            } catch (e) {}
          });
          audioSourcesRef.current = [];
          nextStartTimeRef.current = 0;
        }
      };

      ws.onclose = () => {
        if (status === "connecting") {
          setErrorMessage("Failed to establish live connection. Verify your network.");
          setStatus("error");
        } else {
          setStatus("idle");
        }
        stopAllAudioAndConnections();
      };

      ws.onerror = (e) => {
        console.error("Live WebSocket error:", e);
        setErrorMessage("A live session error occurred.");
        setStatus("error");
        stopAllAudioAndConnections();
      };

    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || "Could not access microphone.");
      setStatus("error");
      stopAllAudioAndConnections();
    }
  };

  // HTTP Voice Chat & Speech synthesis fallback
  const startHttpRecording = () => {
    // Use Web Speech API for low-latency mic inputs and speech synthesis
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage("Speech recognition is not fully supported in this browser. Try typing instead!");
      setStatus("error");
      return;
    }

    try {
      stopAllAudioAndConnections();
      setStatus("listening");

      const rec = new SpeechRecognition();
      recognitionRef.current = rec;
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = selectedLang.code;

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          submitTextMessage(transcript);
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error:", e);
        if (e.error !== "no-speech") {
          setErrorMessage(`Mic error: ${e.error}`);
          setStatus("error");
        } else {
          setStatus("idle");
        }
      };

      rec.onend = () => {
        if (status === "listening") {
          setStatus("idle");
        }
      };

      rec.start();

    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || "Microphone access failed.");
      setStatus("error");
    }
  };

  const speakTextWithTts = async (text: string, rawAudioPCMBase64?: string | null) => {
    if (isAudioMuted) return;

    // Try playing server TTS PCM audio first (Gemini high quality voice)
    if (rawAudioPCMBase64) {
      playLiveAudioChunk(rawAudioPCMBase64);
      return;
    }

    // Fall back to native SpeechSynthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      speechUttRef.current = utt;
      utt.lang = selectedLang.code;
      utt.rate = 1.05;
      
      utt.onstart = () => setStatus("speaking");
      utt.onend = () => setStatus("idle");
      utt.onerror = () => setStatus("idle");

      window.speechSynthesis.speak(utt);
    }
  };

  const submitTextMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    addMessage("user", textToSend);
    setTextInput("");
    setStatus("thinking");

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: textToSend,
          language: selectedLang.name
        })
      });

      if (!response.ok) {
        throw new Error("Failed to contact talking agent backend.");
      }

      const data = await response.json();
      addMessage("agent", data.text);
      speakTextWithTts(data.text, data.audio);

    } catch (e: any) {
      console.error(e);
      addMessage("agent", "I'm having trouble connecting right now. Here's a brief productivity tip: Keep your high-priority items at the top and try completing them in a focused 25-minute Pomodoro slot!");
      setStatus("error");
    }
  };

  const addMessage = (sender: "user" | "agent", text: string) => {
    const newMessage: ChatMessage = {
      id: Math.random().toString(),
      sender,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMessage]);

    // Persist to voice agent history in reactive store
    addVoiceHistoryLog({
      type: "chat",
      sender: newMessage.sender,
      text: newMessage.text
    });
  };

  const handleToggleMic = async () => {
    if (status === "listening" || status === "speaking" || status === "connecting" || status === "thinking") {
      stopAllAudioAndConnections();
      setStatus("idle");
    } else {
      let permitted = hasMicPermission;
      if (!permitted) {
        permitted = await requestMicPermission();
      }
      if (permitted) {
        if (mode === "live") {
          startLiveSession();
        } else {
          startHttpRecording();
        }
      }
    }
  };

  // Pre-configured tags for quick interaction
  const quickPrompts = [
    { label: "⚡ Motivational Boost", prompt: "Give me an energetic motivational boost for my work today!" },
    { label: "📋 Check daily tasks", prompt: `I have ${tasks.filter(t => t.status !== "completed").length} pending tasks right now. Can you suggest how to structure my morning focus block?` },
    { label: "🔥 How is my streak?", prompt: `My current streak is ${momentum?.current_score || 0} momentum XP. Can you give me a coaching tip to keep it active?` },
    { label: "🚀 Propose a goal", prompt: "Give me an actionable 3-step goal structure to improve my creative coding skills this week." }
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-auto md:h-[calc(100vh-11rem)] md:min-h-[580px] relative px-2 md:px-0">
      
      {/* Upper Status Bar */}
      <div className={`p-3 md:p-4 rounded-2xl md:rounded-3xl border flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3 transition duration-200 ${
        isDark ? "bg-[#121214] border-slate-800" : "bg-white border-slate-200 shadow-sm"
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              stopAllAudioAndConnections();
              setActiveTab("dashboard");
            }}
            className={`p-2 rounded-xl border transition shrink-0 ${
              isDark 
                ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800" 
                : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-950 hover:bg-slate-100 shadow-2xs"
            }`}
            title="Go Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="relative">
            <span className="flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                status === "listening" ? "bg-red-400" : status === "speaking" ? "bg-emerald-400" : status === "thinking" ? "bg-amber-400" : "bg-indigo-400"
              }`} />
              <span className={`relative inline-flex rounded-full h-3 w-3 ${
                status === "listening" ? "bg-red-500" : status === "speaking" ? "bg-emerald-500" : status === "thinking" ? "bg-amber-500" : "bg-indigo-500"
              }`} />
            </span>
          </div>
          <div>
            <h3 className={`text-sm font-bold font-display ${isDark ? "text-white" : "text-slate-800"}`}>
              {t("agent")}
            </h3>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              {status === "idle" && (isWakeWordActive ? "Listening for 'Plan Ahead', 'Companion' or 'Assist'..." : t("companion_idle"))}
              {status === "connecting" && t("companion_connecting")}
              {status === "listening" && t("companion_listening")}
              {status === "thinking" && t("companion_thinking")}
              {status === "speaking" && t("companion_speaking")}
              {status === "error" && "Connection error"}
            </p>
          </div>
        </div>

        {/* Mode & Language Toggle Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Language Selector Dropdown */}
          <div className="relative shrink-0">
            <select
              value={voiceLanguageCode}
              onChange={(e) => {
                setVoiceLanguageCode(e.target.value);
                stopAllAudioAndConnections();
                setStatus("idle");
              }}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border focus:outline-none transition ${
                isDark 
                  ? "bg-slate-900 border-slate-800 text-slate-200 focus:border-indigo-500" 
                  : "bg-white border-slate-200 text-slate-700 focus:border-indigo-500 shadow-2xs"
              }`}
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Wake Word Toggle Badge */}
          <button
            onClick={() => setIsWakeWordActive(!isWakeWordActive)}
            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold font-mono tracking-wider uppercase transition flex items-center gap-1.5 border ${
              isWakeWordActive
                ? isDark 
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" 
                  : "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-2xs"
                : isDark 
                  ? "bg-slate-800/40 border-slate-700/30 text-slate-500" 
                  : "bg-slate-100 border-slate-200 text-slate-400"
            }`}
            title="Supported Wake Words: 'Plan Ahead', 'Hey Plan Ahead', 'Companion', 'Assist'"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isWakeWordActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
            <span>Wake Word</span>
          </button>

          {/* Mute Button */}
          <button 
            onClick={handleMuteToggle}
            className={`p-2 rounded-xl border transition duration-200 active:scale-95 ${
              isAudioMuted 
                ? "bg-red-500/10 border-red-500/20 text-red-500" 
                : isDark ? "bg-slate-800/50 border-slate-700/80 text-slate-400 hover:text-white" : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
            }`}
            title={isAudioMuted ? "Unmute Voice output" : "Mute Voice output"}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Mode Selector */}
          <div className={`p-1 rounded-xl border flex ${isDark ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"}`}>
            <button
              onClick={() => {
                stopAllAudioAndConnections();
                setMode("http");
                setStatus("idle");
              }}
              className={`px-2 md:px-3 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition ${
                mode === "http" 
                  ? "bg-indigo-600 text-white shadow-md" 
                  : "text-slate-500 hover:text-slate-700"
              }`}
              title="Standard voice messaging with Gemini TTS fallback"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Standard</span>
            </button>
            <button
              onClick={() => {
                stopAllAudioAndConnections();
                setMode("live");
                setStatus("idle");
              }}
              className={`px-2 md:px-3 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition ${
                mode === "live" 
                  ? "bg-indigo-600 text-white shadow-md" 
                  : "text-slate-500 hover:text-slate-700"
              }`}
              title="Bidirectional raw streaming over WebSockets"
            >
              <Radio className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Live API</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mic Permission Banner */}
      {hasMicPermission !== true && (
        <div className={`p-3 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs mb-3 transition duration-200 ${
          isDark 
            ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
            : "bg-amber-50 border-amber-200 text-amber-800 shadow-xs"
        }`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
            <span className="leading-snug">
              Microphone access is required to listen for the <strong>"Plan Ahead"</strong> voice wake-word or talk directly.
            </span>
          </div>
          <button
            onClick={requestMicPermission}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition active:scale-95 text-[11px] font-mono uppercase tracking-wider shrink-0"
          >
            Authorize Mic
          </button>
        </div>
      )}

      {/* Main Sandbox Interactive Area */}
      <div className={`flex-grow rounded-2xl md:rounded-3xl border flex flex-col overflow-hidden mb-3 md:mb-4 ${
        isDark ? "bg-[#0c0c0e] border-slate-800/80" : "bg-slate-50 border-slate-200"
      }`}>
        
        {/* Connection Warning Header */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center gap-2 text-xs text-red-500 font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Visualizer & Chat Logs */}
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative">
          
          {/* Glowing AI Orb (Visualizer Side) */}
          <div className="py-4 md:py-6 px-4 md:px-6 flex flex-col items-center justify-center gap-3 w-full md:w-2/5 border-b md:border-b-0 md:border-r border-slate-200/50 dark:border-slate-800/30 relative overflow-hidden shrink-0">
            {/* Background ambient lighting */}
            <div className={`absolute inset-0 opacity-15 blur-[40px] pointer-events-none transition-all duration-700 ${
              status === "listening" ? "bg-red-500" : status === "speaking" ? "bg-emerald-500" : status === "thinking" ? "bg-amber-500" : "bg-indigo-500"
            }`} />

            <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center shrink-0">
              {/* Outer wave ripple */}
              <AnimatePresence>
                {(status === "listening" || status === "speaking") && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className={`absolute inset-0 rounded-full blur-sm ${
                      status === "listening" ? "border-2 border-red-500/40" : "border-2 border-emerald-500/40"
                    }`}
                  />
                )}
              </AnimatePresence>

              {/* Secondary pulse */}
              <AnimatePresence>
                {status === "thinking" && (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="absolute inset-1.5 border border-dashed border-amber-500/40 rounded-full"
                  />
                )}
              </AnimatePresence>

              {/* Glowing Inner Core */}
              <motion.div 
                animate={{
                  scale: status === "speaking" ? [1, 1.12, 1] : status === "listening" ? [1, 1.05, 1] : [1, 1.02, 1],
                }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className={`w-24 h-24 md:w-28 md:h-28 rounded-full flex flex-col items-center justify-center relative shadow-2xl transition duration-500 z-10 ${
                  status === "listening" 
                    ? "bg-gradient-to-tr from-red-600 to-rose-400 shadow-rose-500/40" 
                    : status === "speaking" 
                      ? "bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-teal-500/40"
                      : status === "thinking"
                        ? "bg-gradient-to-tr from-amber-600 to-yellow-400 shadow-yellow-500/40"
                        : "bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-indigo-500/40"
                }`}
              >
                <motion.button
                  onClick={handleToggleMic}
                  className="w-full h-full rounded-full flex flex-col items-center justify-center text-white relative focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {status === "listening" ? (
                    <Mic className="w-8 h-8 md:w-10 md:h-10 animate-pulse" />
                  ) : status === "speaking" ? (
                    <Volume2 className="w-8 h-8 md:w-10 md:h-10" />
                  ) : status === "thinking" ? (
                    <RefreshCw className="w-8 h-8 md:w-10 md:h-10 animate-spin" />
                  ) : (
                    <Mic className="w-8 h-8 md:w-10 md:h-10" />
                  )}
                  
                  <span className="block text-[8px] md:text-[9px] font-mono tracking-widest font-extrabold uppercase mt-1 md:mt-2.5">
                    {status === "idle" && "Talk"}
                    {status === "connecting" && "SYNC"}
                    {status === "listening" && "LISTEN"}
                    {status === "thinking" && "THINK"}
                    {status === "speaking" && "SPEAK"}
                    {status === "error" && "ERROR"}
                  </span>
                </motion.button>
              </motion.div>
            </div>

            <div className="text-center z-10 px-2 mt-2">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                status === "listening" ? "text-red-500" : status === "speaking" ? "text-emerald-500" : "text-slate-400"
              }`}>
                {mode === "live" ? "Live Streaming API" : "Standard Voice API"}
              </span>
              <p className="text-[11px] md:text-xs text-slate-500 mt-0.5 max-w-[200px] leading-snug">
                {status === "listening" && "Listening to your speech..."}
                {status === "speaking" && "Responding..."}
                {status === "thinking" && "Processing inputs..."}
                {status === "idle" && (isWakeWordActive ? 'Say "Plan Ahead", "Hey Plan Ahead", "Companion", or "Assist" to talk!' : "Click mic to begin.")}
              </p>
            </div>
          </div>

          {/* Subtitles & Chat Log Column */}
          <div className="flex-grow flex flex-col min-h-[160px] md:min-h-0 overflow-hidden">
            <div className={`p-2.5 border-b flex items-center gap-2 shrink-0 ${
              isDark ? "bg-[#141416]/50 border-slate-800/50" : "bg-slate-100/50 border-slate-200"
            }`}>
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Interactive Transcript
              </span>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-3 max-h-[180px] md:max-h-none">
              {messages.map((m) => (
                <div 
                  key={m.id} 
                  className={`flex flex-col max-w-[85%] ${
                    m.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                  }`}
                >
                  <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                    m.sender === "user"
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : isDark
                        ? "bg-[#18181b] text-slate-200 border border-slate-800 rounded-bl-none"
                        : "bg-white text-slate-700 border border-slate-200 rounded-bl-none shadow-xs"
                  }`}>
                    {m.text}
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 mt-1 px-1">
                    {m.timestamp}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

        </div>

        {/* Text Input Panel & Prompt Action Area */}
        <div className={`p-3 md:p-4 border-t ${
          isDark ? "bg-[#121214] border-slate-800" : "bg-white border-slate-200"
        }`}>
          {/* Quick Prompts Container */}
          <div className="flex gap-2 overflow-x-auto pb-2.5 scrollbar-none shrink-0">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => submitTextMessage(q.prompt)}
                disabled={status === "thinking" || status === "connecting"}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all border ${
                  isDark 
                    ? "bg-[#18181b] border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white" 
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Text Input Row */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              submitTextMessage(textInput);
            }}
            className="flex items-center gap-2"
          >
            <input 
              type="text" 
              placeholder="Or type a message to the agent..." 
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              disabled={status === "thinking" || status === "connecting"}
              className={`flex-grow rounded-xl md:rounded-2xl border px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-all ${
                isDark 
                  ? "bg-[#18181b] border-slate-800 text-slate-200" 
                  : "bg-slate-100 border-slate-200 text-slate-800"
              }`}
            />
            <button
              type="submit"
              disabled={!textInput.trim() || status === "thinking" || status === "connecting"}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white px-3.5 py-2 rounded-xl md:rounded-2xl text-xs font-bold font-mono uppercase tracking-wider transition active:scale-95 shrink-0 flex items-center gap-1"
            >
              <span>Send</span>
              <Play className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>

      {/* Developer API Setup Context Banner */}
      <div className={`p-3 md:p-4 rounded-2xl md:rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
        isDark ? "bg-[#121214] border-slate-800/80" : "bg-white border-slate-200"
      }`}>
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <span className={`text-xs font-bold ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
              Production Ready Framework Active
            </span>
            <p className="text-[11px] text-slate-500 leading-normal max-w-xl">
              Connected directly to the server side container. Live API features and audio sync use low-latency background processors. Make sure your <strong className="text-slate-400">GEMINI_API_KEY</strong> secret is set in AI Studio Secrets to test bidirectional real-time audio.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase">Secure Core API</span>
        </div>
      </div>

    </div>
  );
}
