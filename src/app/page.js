"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import Navigation from "@/components/Navigation";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-hero-gradient flex flex-col font-sans overflow-hidden">
      {/* Animated Blurred Star Background */}
      <motion.div
        className="absolute left-[-140px] top-24 z-0"
        animate={{ rotate: [0, 10, -10, 0], y: [0, 20, -10, 0] }}
        transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
      >
        <svg
          width="340"
          height="340"
          viewBox="0 0 320 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="blur-2xl opacity-50"
        >
          <path
            d="M160 0L195.105 110.395H320L215.447 178.21L250.553 288.605L160 220.79L69.4472 288.605L104.553 178.21L0 110.395H124.895L160 0Z"
            fill="#A259FF"
          />
        </svg>
      </motion.div>

      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <motion.section
        className="relative z-10 flex flex-col items-center text-center flex-1 justify-center px-4 mt-10"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <span className="inline-block mb-8 px-5 py-2 rounded-lg bg-white text-primary font-medium text-sm shadow-md">
          <span className="inline-flex items-center gap-1">
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              className="inline-block"
            >
              <circle cx="10" cy="10" r="10" fill="#A259FF" />
              <path
                d="M10 5.5L11.7553 8.90983L15.5106 9.40983L12.7553 11.8402L13.5106 15.5902L10 13.5L6.48944 15.5902L7.24472 11.8402L4.48944 9.40983L8.24472 8.90983L10 5.5Z"
                fill="white"
              />
            </svg>
            Web-based, AI-powered voice support
          </span>
        </span>
        <motion.h1
          className="text-4xl sm:text-6xl font-extrabold text-blackText mb-6 leading-tight"
          style={{
            fontFamily: "Montserrat, var(--font-montserrat), sans-serif",
          }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
        >
          Real-Time Conversational
          <br />
          AI for Customer Support
        </motion.h1>
        <motion.p
          className="max-w-2xl text-lg text-grayText mb-8"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
        >
          <b>CallEQ</b> is an AI-powered call agent platform designed for
          seamless integration with call service companies. This web app is a
          simulation demo, a realistic AI voice—just like it would in a real
          customer call.
        </motion.p>
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
        >
          <Link href="/call-agent">
            <span className="px-8 py-3 rounded-lg bg-primary text-white font-semibold uppercase tracking-wide shadow-lg hover:bg-[#8436c9] transition-all text-base cursor-pointer inline-block">
              Try the Demo
            </span>
          </Link>
        </motion.div>
        {/* Dashboard Image with Glassmorphism */}
        <div className="w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border-5 border-white bg-white/60 backdrop-blur-xl mt-8">
          <div className="aspect-[16/7] relative w-full h-full -mt-[80px]">
            <Image
              src="/images/microphone.jpg"
              alt="Dashboard Preview"
              fill
              className="object-cover object-top w-[50%] h-full opacity-70"
              priority
            />
          </div>
        </div>
      </motion.section>
    </div>
  );
}
