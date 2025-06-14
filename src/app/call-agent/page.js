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
  const [agentResponse, setAgentResponse] = useState("");
  const wsRef = useRef(null);
  const audioRef = useRef(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeCall = async () => {
      try {
        const response = await fetch('https://f536-2a09-bac5-58c2-252d-00-3b4-6.ngrok-free.app/call/start', {
          method: 'POST',
        });
        const data = await response.json();
        setSessionId(data.session_id);
        
        // Initialize WebSocket connection
        wsRef.current = new WebSocket(`https://f536-2a09-bac5-58c2-252d-00-3b4-6.ngrok-free.app/call/text/${data.session_id}`);
        
        wsRef.current.onmessage = async (event) => {
          if (event.data instanceof Blob) {
            // Handle audio data
            const audioBlob = event.data;
            const audioUrl = URL.createObjectURL(audioBlob);
            if (audioRef.current) {
              audioRef.current.src = audioUrl;
              audioRef.current.play();
              setIsAgentSpeaking(true);
              audioRef.current.onended = () => {
                setIsAgentSpeaking(false);
              };
            }
          } else {
            // Handle text response
            const response = JSON.parse(event.data);
            setAgentResponse(response.text);
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setError('Connection error. Please try again.');
        };

        wsRef.current.onclose = () => {
          console.log('WebSocket connection closed');
        };
      } catch (error) {
        console.error('Error initializing call:', error);
        setError('Failed to start call. Please try again.');
      }
    };

    initializeCall();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Send transcript to backend when it changes
  useEffect(() => {
    if (transcript && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        text: transcript,
        session_id: sessionId
      }));
    }
  }, [transcript, sessionId]);

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
        // Restart recognition if mic is still on
        if (micOn) {
          try {
            recognition.start();
          } catch (e) {
            console.log("Error restarting recognition:", e);
          }
        }
      };
      recognition.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript(finalTranscript + interimTranscript);
        if (interimTranscript || finalTranscript) {
          setIsSpeaking(true);
          clearTimeout(speakingTimeoutRef.current);
          speakingTimeoutRef.current = setTimeout(
            () => setIsSpeaking(false),
            3000
          );
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
    };
  }, [micOn]);

  const toggleMic = () => {
    if (recognitionRef.current) {
      if (micOn) {
        recognitionRef.current.stop();
      } else {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.log("Error starting recognition:", e);
        }
      }
    }
    setMicOn(!micOn);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-hero-gradient font-sans p-4 relative">
      {/* Audio element for playing responses */}
      <audio ref={audioRef} className="hidden" />
      
      {/* Logo in top left */}
      <Link
        href="/"
        className="fixed top-6 left-12 z-20 flex items-center gap-2 cursor-pointer"
      >
        <Image src="/images/logo.png" alt="Logo" width={60} height={60} />
        <span className="text-2xl font-bold text-blackText">CallEQ</span>
      </Link>
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-center gap-12">
        {/* User Speaking Animation */}
        <div className="flex flex-col items-center gap-6 flex-1">
          {error && (
            <div className="text-red-500 font-semibold text-center mb-4">
              {error}
            </div>
          )}
          <motion.div
            className="rounded-full bg-primary/10 p-8 shadow-lg"
            animate={isSpeaking ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={{
              repeat: isSpeaking ? Infinity : 0,
              duration: 1.2,
              ease: "easeInOut",
            }}
          >
            <motion.div
              className="bg-primary rounded-full w-20 h-20 flex items-center justify-center"
              animate={isSpeaking ? { scale: [1, 1.1, 1] } : { scale: 1 }}
              transition={{
                repeat: isSpeaking ? Infinity : 0,
                duration: 0.8,
                ease: "easeInOut",
              }}
            >
              <svg width="36" height="36" fill="none" viewBox="0 0 24 24">
                <path
                  fill="#fff"
                  d="M12 16a4 4 0 0 0 4-4V8a4 4 0 1 0-8 0v4a4 4 0 0 0 4 4Zm6-4a6 6 0 1 1-12 0V8a6 6 0 1 1 12 0v4Zm-6 7a7.978 7.978 0 0 1-6.32-3.16A1 1 0 0 1 6.1 14.1a1 1 0 0 1 1.4.2A5.978 5.978 0 0 0 12 19a5.978 5.978 0 0 0 4.5-2.7 1 1 0 0 1 1.6 1.2A7.978 7.978 0 0 1 12 19Z"
                />
              </svg>
            </motion.div>
          </motion.div>
          <motion.div
            className="mt-0 text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-blackText flex items-center justify-center gap-2"
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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
          <div className="flex items-center justify-between w-full max-w-[180px] mt-2 mb-2">
            <button
              className={`flex items-center justify-center w-12 h-12 rounded-full shadow transition text-2xl ${
                micOn
                  ? "bg-primary/20 text-primary"
                  : "bg-red-200/30 text-red-500"
              }`}
              onClick={toggleMic}
              aria-label={micOn ? "Turn microphone off" : "Turn microphone on"}
              title={micOn ? "Turn microphone off" : "Turn microphone on"}
            >
              {micOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
            </button>
            <span className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-300/60 text-gray-600 text-2xl shadow">
              <FaTimes />
            </span>
          </div>
          {/* Transcript at the bottom */}
          <div className="min-h-[32px] text-base text-blackText font-mono text-center mt-2 px-2">
            {transcript}
          </div>
        </div>

        {/* iPhone Mockup with Agent Call UI */}
        <div className="flex-1 flex flex-col items-center">
          <div className="relative w-[360px] h-[700px] rounded-[3rem] scale-90 bg-gradient-to-br from-[#ece8fe] via-[#f8e1ff] to-[#f3efff] shadow-2xl border-[8px] border-white flex flex-col items-center justify-end overflow-hidden">
            {/* iPhone Notch (pill) */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-7 bg-black/40 rounded-full z-20 flex items-center justify-center">
              <div className="w-3 h-3 bg-white/80 rounded-full mx-1" />
              <div className="w-6 h-2 bg-white/40 rounded-full mx-1" />
            </div>
            {/* Status Bar */}
            <div className="absolute top-5 left-6 text-[16px] text-gray-400 z-10">
              6:00
            </div>
            <div className="absolute top-5 right-6 text-xs text-gray-400 z-10 flex items-center gap-1">
              {/* Signal Bars */}
              <svg
                width="18"
                height="12"
                viewBox="0 0 18 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
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
                width="16"
                height="12"
                viewBox="0 0 16 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
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
                width="22"
                height="12"
                viewBox="0 0 22 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
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
            <div className="absolute top-16 left-0 w-full flex flex-col items-center z-10">
              <span className="text-gray-700 font-semibold text-lg tracking-widest">
                00:04
              </span>
            </div>
            {/* Lottie Animation Centered */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <Lottie
                autoplay
                loop={true}
                animationData={answerAnimation}
                className="w-[150px] h-[150px]"
              />
            </div>
            {/* Agent Response Text */}
            <div className="absolute bottom-32 left-0 w-full px-6 text-center">
              <p className="text-gray-700 text-sm">{agentResponse}</p>
            </div>
            {/* Call Controls (bottom) */}
            <div className="w-full absolute bottom-10 left-0 flex items-center justify-center gap-12 z-10">
              <div className="flex flex-col items-center">
                <button className="w-16 h-16 rounded-full bg-gray-400/30 flex items-center justify-center text-white text-2xl shadow">
                  <FaUserPlus />
                </button>
                <span className="text-xs text-gray-700 mt-2">Add</span>
              </div>
              <div className="flex flex-col items-center">
                <button className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white text-2xl shadow">
                  <FaPhoneSlash />
                </button>
                <span className="text-xs text-gray-700 mt-2">End</span>
              </div>
              <div className="flex flex-col items-center">
                <button className="w-16 h-16 rounded-full bg-gray-400/30 flex items-center justify-center text-white text-2xl shadow">
                  <FaTh />
                </button>
                <span className="text-xs text-gray-700 mt-2">Keypad</span>
              </div>
            </div>
          </div>
          <div className="-mt-5 text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-blackText flex items-center justify-center gap-2">
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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
            {isAgentSpeaking ? "Agent Speaking..." : "Agent Ready"}
          </div>
        </div>
      </div>
    </div>
  );
}
