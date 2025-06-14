import Navigation from "@/components/Navigation";
import Image from "next/image";

export default function Contact() {
  return (
    <div className="min-h-screen bg-hero-gradient font-sans flex flex-col items-center px-4">
      <Navigation />
      <div className="flex flex-col items-center mb-12 mt-8">
        <h1 className="text-4xl font-extrabold text-blackText mt-4 mb-2">
          Contact Us
        </h1>
        <p className="max-w-2xl text-lg text-grayText text-center">
          Have questions or want to get in touch? Fill out the form below and
          our team will get back to you as soon as possible.
        </p>
      </div>
      <form className="w-full max-w-lg bg-white/80 rounded-2xl shadow-2xl border border-gray-200 p-5 px-8 -mt-8 scale-95 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="block text-grayText font-semibold">Name</label>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary transition"
            placeholder="Your Name"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="block text-grayText font-semibold">Email</label>
          <input
            type="email"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary transition"
            placeholder="you@email.com"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="block text-grayText font-semibold">Message</label>
          <textarea
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary transition"
            rows={5}
            placeholder="How can we help you?"
          />
        </div>
        <button
          type="submit"
          className="mt-2 px-6 py-3 rounded-lg bg-primary text-white font-semibold shadow-lg hover:bg-[#8436c9] transition-all text-base"
        >
          Send Message
        </button>
      </form>
    </div>
  );
}
