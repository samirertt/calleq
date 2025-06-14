/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-montserrat)", "Montserrat", "sans-serif"],
      },
      colors: {
        primary: "#A259FF",
        lightPurple: "#F3EFFF",
        lightPink: "#F8E1FF",
        white: "#FFFFFF",
        grayText: "#6B7280",
        blackText: "#111827",
        blackTextDark: "#020003",
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(120deg, #f8f7fc 0%, #ac83ee 100%)",
      },
    },
  },
  plugins: [],
};
