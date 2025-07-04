"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  FaUserPlus,
  FaTh,
  FaPhoneSlash,
  FaMicrophone,
  FaTimes,
  FaMicrophoneSlash,
} from "react-icons/fa";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });
import answerAnimation from "../../../public/lottie/answer.json";

export default function CallAgent() {
  const [micOn, setMicOn] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [recognizing, setRecognizing] = useState(false);
  const recognitionRef = useRef(null);
  const [supported, setSupported] = useState(true);
  const speakingTimeoutRef = useRef();
  const [sessionId, setSessionId] = useState(null);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [userListening, setUserListening] = useState(true);
  const [agentResponse, setAgentResponse] = useState("");
  const wsRef = useRef(null);
  const audioRef = useRef(null);
  const [callTimer, setCallTimer] = useState(0);
  const [voices, setVoices] = useState([]);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [pendingSpeech, setPendingSpeech] = useState(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;
  const sendTranscriptTimeoutRef = useRef();
  const recognitionBlocked = useRef(false);
  const hasGreetedRef = useRef(false);

  // Initialize speech synthesis
  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      setError("Text-to-speech not supported in this browser.");
      return;
    }
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      setVoices(allVoices);
      setVoicesLoaded(allVoices.length > 0);
      // Prefer Google/Natural en-US voice
      const preferred = allVoices.find(
        (v) => v.lang === "en-US" && /Google|Natural/i.test(v.name)
      );
      setSelectedVoice(
        preferred || allVoices.find((v) => v.lang === "en-US") || allVoices[0]
      );
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Speak any pending speech when voices are loaded
  useEffect(() => {
    if (voicesLoaded && pendingSpeech) {
      speakText(pendingSpeech);
      setPendingSpeech(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voicesLoaded]);

  // Use browser's TTS to speak the agent's response
  const speakText = (text) => {
    if (!("speechSynthesis" in window)) {
      setError("Text-to-speech not supported in this browser.");
      return;
    }
    if (!voicesLoaded) {
      setTimeout(() => speakText(text), 300); // Wait and retry
      return;
    }
    if (!text || !text.trim()) return;
    // Stop recognition if running
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    // Only cancel if something is speaking
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    const utter = new SpeechSynthesisUtterance(text);
    if (selectedVoice) utter.voice = selectedVoice;
    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.volume = 1.0;
    utter.onstart = () => {
      setIsAgentSpeaking(true);
      retryCountRef.current = 0;
    };
    utter.onend = () => {
      setIsAgentSpeaking(false);
      // Resume recognition if mic is on
      if (recognitionRef.current && micOn) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
    };
    utter.onerror = (event) => {
      console.error("Speech synthesis error:", event, event.error);
      setIsAgentSpeaking(false);
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        setTimeout(() => speakText(text), 2000);
      } else {
        if (recognitionRef.current && micOn) {
          try {
            recognitionRef.current.start();
          } catch (e) {}
        }
      }
    };
    try {
      window.speechSynthesis.speak(utter);
    } catch (error) {
      console.error("Error speaking text:", error);
      if (recognitionRef.current && micOn) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
    }
  };

  // Stop speaking
  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsAgentSpeaking(false);
      console.log("Speech stopped");
      // Resume speech recognition if mic is on
      if (recognitionRef.current && micOn) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.log("Error restarting recognition:", e);
        }
      }
    }
  };

  // End button handler: stop agent speaking, stop audio, stop Lottie animation
  const handleEndCall = () => {
    stopSpeaking();
    setAgentResponse("");
  };

  // Simulate a conversation
  const simulateConversation = () => {
    const userQuestions = [
      "How can I help you today?",
      "What's on your mind?",
      "Tell me more about that.",
      "I'm listening.",
      "Go ahead.",
    ];
    const agentResponses = [
      "I'm here to assist you with any questions.",
      "Let me check that for you.",
      "I'm processing your request.",
      "Thank you for your patience.",
      "I understand. How can I help further?",
    ];
    const randomQuestion =
      userQuestions[Math.floor(Math.random() * userQuestions.length)];
    const randomResponse =
      agentResponses[Math.floor(Math.random() * agentResponses.length)];
    setTranscript(randomQuestion);
    setAgentResponse(randomResponse);
    speakText(randomResponse);
  };

  // Helper to safely start recognition only if allowed
  const startRecognitionIfAllowed = () => {
    if (
      recognitionRef.current &&
      !recognitionBlocked.current &&
      !isAgentSpeaking &&
      micOn
    ) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.log("Error starting recognition:", e);
      }
    }
  };

  // Robust helper to play base64 audio from backend
  const playBase64Audio = (base64Audio, mimeType = "audio/wav") => {
    if (!base64Audio || !audioRef.current) return;
    
    // Convert base64 to binary
    const binary = atob(base64Audio);
    const len = binary.length;
    const buffer = new Uint8Array(len);
    for (let i = 0; i < len; i++) buffer[i] = binary.charCodeAt(i);
    
    const blob = new Blob([buffer], { type: mimeType });
    const url = URL.createObjectURL(blob);

    // Stop recognition before playing audio
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    // Set states for audio playback
    recognitionBlocked.current = true;
    setIsAgentSpeaking(true);
    setUserListening(false);
    setIsSpeaking(false);

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    if (audioRef.current.src) URL.revokeObjectURL(audioRef.current.src);
    audioRef.current.src = url;

    audioRef.current.onended = () => {
      setIsAgentSpeaking(false);
      setUserListening(true);
      recognitionBlocked.current = false;
      // Resume recognition after audio ends
      if (micOn && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
      URL.revokeObjectURL(url);
    };

    audioRef.current.onerror = (e) => {
      console.error("Audio playback error:", e);
      setIsAgentSpeaking(false);
      setUserListening(true);
      recognitionBlocked.current = false;
      // Resume recognition after error
      if (micOn && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
      URL.revokeObjectURL(url);
      setError("Failed to play agent audio. Please try again.");
    };

    audioRef.current.play().catch((e) => {
      console.error("Audio play error:", e);
      setIsAgentSpeaking(false);
      setUserListening(true);
      recognitionBlocked.current = false;
      // Resume recognition after error
      if (micOn && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
      URL.revokeObjectURL(url);
      setError("Failed to play agent audio. Please try again.");
    });
  };

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeCall = async () => {
      try {
        const response = await fetch(
          "https://major-narwhal-picked.ngrok-free.app/call/start",
          {
            method: "POST",
          }
        );
        const data = await response.json();
        setSessionId(data.session_id);

        // Handle greeting from backend
        if (data.greeting_text) {
          setAgentResponse(data.greeting_text);
          if (data.greeting_audio) {
            playBase64Audio(data.greeting_audio, "audio/wav");
          } else {
            speakText(data.greeting_text);
          }
        }

        wsRef.current = new WebSocket(
          `wss://major-narwhal-picked.ngrok-free.app/call/text/${data.session_id}`
        );

        wsRef.current.onmessage = async (event) => {
          let response;
          try {
            response = JSON.parse(event.data);
          } catch (e) {
            console.error("Failed to parse WebSocket message as JSON:", event.data);
            return;
          }

          if (response && response.text) {
            // Handle greeting only once
            if (response.is_greeting && !hasGreetedRef.current) {
              setAgentResponse(response.text);
              if (response.audio) {
                playBase64Audio(response.audio, "audio/wav");
              }
              hasGreetedRef.current = true;
              return;
            }

            // Handle regular responses
            if (!response.is_greeting) {
              setAgentResponse(response.text);
              if (response.audio) {
                playBase64Audio(response.audio, "audio/wav");
              }
            }
          }
        };

        wsRef.current.onerror = (error) => {
          console.error("WebSocket error:", error);
          setError("Connection error. Please try again.");
        };

        wsRef.current.onclose = () => {
          console.log("WebSocket connection closed");
        };
      } catch (error) {
        console.error("Error initializing call:", error);
        setError("Failed to start call. Please try again.");
      }
    };

    initializeCall();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Real-time timer
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setCallTimer((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
      setSupported(false);
      setError(
        "Speech recognition is not supported in this browser. Please use Chrome or Edge."
      );
      return;
    }
    setSupported(true);
    setError("");

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setRecognizing(true);
        setError("");
        console.log("Recognition started");
      };
      recognition.onend = () => {
        setRecognizing(false);
        setIsSpeaking(false);
        console.log("Recognition ended");
        // Only restart recognition if not blocked
        startRecognitionIfAllowed();
      };
      recognition.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        // Animate user speaking as soon as any speech is detected (interim or final)
        if ((interimTranscript || finalTranscript) && !isAgentSpeaking) {
          setIsSpeaking(true);
          clearTimeout(speakingTimeoutRef.current);
          speakingTimeoutRef.current = setTimeout(
            () => setIsSpeaking(false),
            1200 // shorter timeout for more responsive animation
          );
        }
        setTranscript(finalTranscript);
        if (finalTranscript && !isAgentSpeaking && userListening) {
          // Debounce sending: only send after user stops speaking for 1s
          clearTimeout(sendTranscriptTimeoutRef.current);
          sendTranscriptTimeoutRef.current = setTimeout(() => {
            if (
              wsRef.current &&
              wsRef.current.readyState === WebSocket.OPEN &&
              finalTranscript &&
              userListening &&
              !isAgentSpeaking
            ) {
              wsRef.current.send(
                JSON.stringify({
                  text: finalTranscript,
                  session_id: sessionId,
                })
              );
              setTranscript(""); // Clear transcript after sending
            }
          }, 1000);
        }
      };
      recognition.onerror = (e) => {
        setIsSpeaking(false);
        setRecognizing(false);
        if (e.error === "not-allowed" || e.error === "denied") {
          setError(
            "Microphone access denied. Please allow mic access in your browser settings."
          );
        } else {
          setError("Speech recognition error: " + e.error);
        }
        console.log("Recognition error", e);
      };
    }

    // Start recognition if mic is on
    if (micOn && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.log("Error starting recognition:", e);
      }
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current.onstart = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
      }
      clearTimeout(speakingTimeoutRef.current);
      clearTimeout(sendTranscriptTimeoutRef.current);
    };
  }, [micOn]);

  const toggleMic = () => {
    if (micOn) {
      // Always allow turning mic off
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setMicOn(false);
    } else {
      // Only allow turning mic on if agent is not speaking
      if (userListening && !isAgentSpeaking && !recognitionBlocked.current) {
        startRecognitionIfAllowed();
        setMicOn(true);
      }
    }
  };

  // Play agent audio and animate Lottie when agent is speaking
  useEffect(() => {
    if (isAgentSpeaking && audioRef.current) {
      audioRef.current.play().catch(() => {});
    } else if (!isAgentSpeaking && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isAgentSpeaking]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-hero-gradient font-sans p-4 relative">
      {/* Audio element for playing responses */}
      <audio ref={audioRef} className="hidden" />
      {error && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-100 text-red-700 px-4 py-2 rounded shadow z-50 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Logo in top left */}
      <Link
        href="/"
        className="fixed top-4 sm:top-6 left-4 sm:left-12 z-20 flex items-center gap-2 cursor-pointer"
      >
        <Image
          src="/images/logo.png"
          alt="Logo"
          width={40}
          height={40}
          className="w-10 h-10 sm:w-[60px] sm:h-[60px]"
        />
        <span className="text-xl sm:text-2xl font-bold text-blackText">
          CallEQ
        </span>
      </Link>
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-12 px-4 sm:px-0">
        {/* User Speaking Animation */}
        <div className="flex flex-col items-center gap-4 sm:gap-6 flex-1 w-full max-w-[300px] sm:max-w-none">
          {error && (
            <div className="text-red-500 font-semibold text-center mb-2 sm:mb-4 text-sm sm:text-base">
              {error}
            </div>
          )}
          <motion.div
            className="rounded-full bg-primary/10 p-6 sm:p-8 shadow-lg"
            animate={isSpeaking ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={{
              repeat: isSpeaking ? Infinity : 0,
              duration: 1.2,
              ease: "easeInOut",
            }}
          >
            <motion.div
              className="bg-primary rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center"
              animate={isSpeaking ? { scale: [1, 1.1, 1] } : { scale: 1 }}
              transition={{
                repeat: isSpeaking ? Infinity : 0,
                duration: 0.8,
                ease: "easeInOut",
              }}
            >
              <svg
                width="28"
                height="28"
                fill="none"
                viewBox="0 0 24 24"
                className="sm:w-9 sm:h-9"
              >
                <path
                  fill="#fff"
                  d="M12 16a4 4 0 0 0 4-4V8a4 4 0 1 0-8 0v4a4 4 0 0 0 4 4Zm6-4a6 6 0 1 1-12 0V8a6 6 0 1 1 12 0v4Zm-6 7a7.978 7.978 0 0 1-6.32-3.16A1 1 0 0 1 6.1 14.1a1 1 0 0 1 1.4.2A5.978 5.978 0 0 0 12 19a5.978 5.978 0 0 0 4.5-2.7a1 1 0 0 1 1.6 1.2A7.978 7.978 0 0 1 12 19Z"
                />
              </svg>
            </motion.div>
          </motion.div>
          <motion.div
            className="mt-0 text-base sm:text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-blackText flex items-center justify-center gap-2"
            animate={{ opacity: isSpeaking ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.span
              initial={{ scale: 1 }}
              animate={isSpeaking ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={{
                repeat: isSpeaking ? Infinity : 0,
                duration: 1.2,
                ease: "easeInOut",
              }}
              className="inline-flex"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="sm:w-6 sm:h-6"
              >
                <rect
                  x="3"
                  y="10"
                  width="3"
                  height="4"
                  rx="1.5"
                  fill="#A259FF"
                />
                <rect
                  x="8"
                  y="7"
                  width="3"
                  height="10"
                  rx="1.5"
                  fill="#A259FF"
                />
                <rect
                  x="13"
                  y="9"
                  width="3"
                  height="6"
                  rx="1.5"
                  fill="#A259FF"
                />
                <rect
                  x="18"
                  y="11"
                  width="3"
                  height="2"
                  rx="1"
                  fill="#A259FF"
                />
              </svg>
            </motion.span>
            User Speaking...
          </motion.div>
          {/* Mic and Cancel Icons BELOW */}
          <div className="flex items-center justify-between w-full max-w-[160px] sm:max-w-[180px] mt-2 mb-2">
            <button
              className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow transition text-xl sm:text-2xl ${
                micOn
                  ? "bg-primary/20 text-primary"
                  : "bg-red-200/30 text-red-500"
              }`}
              onClick={toggleMic}
              aria-label={micOn ? "Turn microphone off" : "Turn microphone on"}
              title={micOn ? "Turn microphone off" : "Turn microphone on"}
              disabled={!userListening || isAgentSpeaking}
            >
              {micOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
            </button>
            <span className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-300/60 text-gray-600 text-xl sm:text-2xl shadow">
              <FaTimes />
            </span>
          </div>
          {/* Transcript at the bottom */}
          <div className="min-h-[32px] text-sm sm:text-base text-blackText font-mono text-center mt-2 px-2">
            {transcript}
          </div>
        </div>

        {/* iPhone Mockup with Agent Call UI */}
        <div className="flex-1 flex flex-col items-center">
          <div className="relative w-[280px] h-[560px] sm:w-[360px] sm:h-[700px] rounded-[2rem] sm:rounded-[3rem] scale-90 bg-gradient-to-br from-[#ece8fe] via-[#f8e1ff] to-[#f3efff] shadow-2xl border-[6px] sm:border-[8px] border-white flex flex-col items-center justify-end overflow-hidden">
            {/* iPhone Notch (pill) */}
            <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 w-24 sm:w-32 h-6 sm:h-7 bg-black/40 rounded-full z-20 flex items-center justify-center">
              <div className="w-2 sm:w-3 h-2 sm:h-3 bg-white/80 rounded-full mx-1" />
              <div className="w-4 sm:w-6 h-1.5 sm:h-2 bg-white/40 rounded-full mx-1" />
            </div>
            {/* Status Bar */}
            <div className="absolute top-4 sm:top-5 left-4 sm:left-6 text-[14px] sm:text-[16px] text-gray-400 z-10">
              6:00
            </div>
            <div className="absolute top-4 sm:top-5 right-4 sm:right-6 text-[10px] sm:text-xs text-gray-400 z-10 flex items-center gap-1">
              {/* Signal Bars */}
              <svg
                width="14"
                height="10"
                viewBox="0 0 18 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="sm:w-[18px] sm:h-[12px]"
              >
                <rect
                  x="0"
                  y="8"
                  width="2"
                  height="4"
                  rx="1"
                  fill="#fff"
                  fillOpacity="0.8"
                />
                <rect
                  x="4"
                  y="6"
                  width="2"
                  height="6"
                  rx="1"
                  fill="#fff"
                  fillOpacity="0.8"
                />
                <rect
                  x="8"
                  y="4"
                  width="2"
                  height="8"
                  rx="1"
                  fill="#fff"
                  fillOpacity="0.8"
                />
                <rect
                  x="12"
                  y="2"
                  width="2"
                  height="10"
                  rx="1"
                  fill="#fff"
                  fillOpacity="0.8"
                />
              </svg>
              {/* WiFi Icon */}
              <svg
                width="12"
                height="10"
                viewBox="0 0 16 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="sm:w-[16px] sm:h-[12px]"
              >
                <path
                  d="M8 10C8.55228 10 9 10.4477 9 11C9 11.5523 8.55228 12 8 12C7.44772 12 7 11.5523 7 11C7 10.4477 7.44772 10 8 10Z"
                  fill="#fff"
                  fillOpacity="0.8"
                />
                <path
                  d="M3.3934 7.3934C5.20914 5.57766 8.09086 5.57766 9.9066 7.3934"
                  stroke="#fff"
                  strokeOpacity="0.8"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <path
                  d="M1.22183 5.22183C4.47772 1.96594 9.52228 1.96594 12.7782 5.22183"
                  stroke="#fff"
                  strokeOpacity="0.8"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
              {/* Battery Toggle */}
              <svg
                width="18"
                height="10"
                viewBox="0 0 22 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="sm:w-[22px] sm:h-[12px]"
              >
                <rect
                  x="0.75"
                  y="1.25"
                  width="16.5"
                  height="9.5"
                  rx="4.75"
                  fill="#fff"
                  fillOpacity="0.1"
                  stroke="#fff"
                  strokeWidth="1.5"
                />
                <rect
                  x="12"
                  y="3"
                  width="5"
                  height="6"
                  rx="3"
                  fill="#fff"
                  fillOpacity="0.8"
                />
                <rect
                  x="18"
                  y="4.5"
                  width="2.5"
                  height="3"
                  rx="1.5"
                  fill="#fff"
                  fillOpacity="0.8"
                />
              </svg>
            </div>
            {/* Call Timer */}
            <div className="absolute top-12 sm:top-16 left-0 w-full flex flex-col items-center z-10">
              <span className="text-gray-700 font-semibold text-base sm:text-lg tracking-widest">
                {String(Math.floor(callTimer / 60)).padStart(2, "0")}:
                {String(callTimer % 60).padStart(2, "0")}
              </span>
            </div>
            {/* Lottie Animation Centered */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <motion.div
                animate={
                  isAgentSpeaking
                    ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }
                    : { scale: 1, rotate: 0 }
                }
                transition={{
                  repeat: isAgentSpeaking ? Infinity : 0,
                  duration: 1.2,
                  ease: "easeInOut",
                }}
                className="w-[120px] h-[120px] sm:w-[150px] sm:h-[150px]"
              >
                <Lottie
                  autoplay
                  loop={isAgentSpeaking}
                  animationData={answerAnimation}
                  className="w-[120px] h-[120px] sm:w-[150px] sm:h-[150px]"
                />
              </motion.div>
            </div>
            {/* Agent Response Text */}
            <div className="absolute bottom-24 sm:bottom-32 left-0 w-full px-4 sm:px-6 text-center">
              <p className="text-gray-700 text-sm sm:text-base font-medium bg-white/30 backdrop-blur-sm rounded-lg p-3 sm:p-4 shadow-sm max-w-[90%] mx-auto mb-2 sm:mb-4">
                {agentResponse}
              </p>
            </div>
            {/* Call Controls (bottom) */}
            <div className="w-full absolute bottom-6 sm:bottom-10 left-0 flex items-center justify-center gap-8 sm:gap-12 z-10">
              <div className="flex flex-col items-center">
                <button className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-400/30 flex items-center justify-center text-white text-xl sm:text-2xl shadow">
                  <FaUserPlus />
                </button>
                <span className="text-[10px] sm:text-xs text-gray-700 mt-1 sm:mt-2">
                  Add
                </span>
              </div>
              <div className="flex flex-col items-center">
                <button
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-500 flex items-center justify-center text-white text-xl sm:text-2xl shadow"
                  onClick={handleEndCall}
                >
                  <FaPhoneSlash />
                </button>
                <span className="text-[10px] sm:text-xs text-gray-700 mt-1 sm:mt-2">
                  End
                </span>
              </div>
              <div className="flex flex-col items-center">
                <button className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-400/30 flex items-center justify-center text-white text-xl sm:text-2xl shadow">
                  <FaTh />
                </button>
                <span className="text-[10px] sm:text-xs text-gray-700 mt-1 sm:mt-2">
                  Keypad
                </span>
              </div>
            </div>
          </div>
          <div className="-mt-4 sm:-mt-5 text-base sm:text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-blackText flex items-center justify-center gap-2">
            <motion.span
              initial={{ scale: 1 }}
              animate={isAgentSpeaking ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={{
                repeat: isAgentSpeaking ? Infinity : 0,
                duration: 1.2,
                ease: "easeInOut",
              }}
              className="inline-flex"
            >
              {/* Speaking wave icon */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="sm:w-6 sm:h-6"
              >
                <rect
                  x="3"
                  y="10"
                  width="3"
                  height="4"
                  rx="1.5"
                  fill="#A259FF"
                />
                <rect
                  x="8"
                  y="7"
                  width="3"
                  height="10"
                  rx="1.5"
                  fill="#A259FF"
                />
                <rect
                  x="13"
                  y="9"
                  width="3"
                  height="6"
                  rx="1.5"
                  fill="#A259FF"
                />
                <rect
                  x="18"
                  y="11"
                  width="3"
                  height="2"
                  rx="1"
                  fill="#A259FF"
                />
              </svg>
            </motion.span>
            {isAgentSpeaking ? "Agent Speaking..." : "Agent Listening..."}
          </div>
        </div>
      </div>
    </div>
  );
}
