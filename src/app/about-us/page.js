import Navigation from "@/components/Navigation";
import Image from "next/image";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-hero-gradient font-sans flex flex-col items-center px-4">
      <Navigation />
      <div className="flex flex-col items-center mb-12 mt-8">
        <h1 className="text-4xl font-extrabold text-blackText mt-4 mb-2">
          About CallEQ
        </h1>
        <p className="max-w-2xl text-lg text-grayText text-center">
          CallEQ is an AI-powered, browser-based customer support assistant
          designed to simulate real-time web voice calls. Customers speak
          directly into the web app using their microphone. CallEQ transcribes
          the voice input, understands the question, detects emotional tone, and
          responds using realistic AI-generated speech — powered by LLMs and
          speech APIs.
        </p>
      </div>
      <div className="max-w-3xl w-full bg-white/70 rounded-2xl shadow-lg p-8 mb-10">
        <h2 className="text-2xl font-bold text-primary mb-4">Our Mission</h2>
        <p className="text-grayText mb-4">
          Our mission is to revolutionize customer support by providing
          always-on, empathetic, and intelligent voice-based assistance for
          businesses of all sizes. We believe in making advanced AI accessible
          and easy to use for everyone.
        </p>
        <h2 className="text-2xl font-bold text-primary mb-4 mt-8">The Team</h2>
        <p className="text-grayText">
          CallEQ was created by a passionate team of engineers, designers, and
          AI enthusiasts who are dedicated to building the future of customer
          interaction. We are committed to innovation, privacy, and delivering a
          delightful user experience.
        </p>
      </div>
    </div>
  );
}
