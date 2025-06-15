"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navigation() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <nav className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 w-full">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
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
      </div>
      {/* Desktop Nav */}
      <div className="hidden sm:flex items-center gap-4">
        <NavLink href="/about-us" active={pathname === "/about-us"}>
          About Us
        </NavLink>
        <NavLink href="/contact" active={pathname === "/contact"}>
          Contact
        </NavLink>
        <Link href="/call-agent">
          <span className="px-4 py-4 rounded-lg bg-primary text-white font-semibold uppercase tracking-wide shadow-md hover:bg-[#8436c9] transition-all text-sm cursor-pointer inline-block">
            Get Started
          </span>
        </Link>
      </div>
      {/* Mobile Hamburger */}
      <div className="sm:hidden flex items-center gap-2">
        <Link href="/call-agent">
          <span className="px-3 py-2 rounded-lg bg-primary text-white font-semibold uppercase tracking-wide shadow-md hover:bg-[#8436c9] transition-all text-xs cursor-pointer inline-block">
            Get Started
          </span>
        </Link>
        <button
          className="ml-2 flex flex-col justify-center items-center w-10 h-10 rounded focus:outline-none"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          <span
            className={`block w-6 h-0.5 bg-blackText mb-1 transition-all ${
              menuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          ></span>
          <span
            className={`block w-6 h-0.5 bg-blackText mb-1 transition-all ${
              menuOpen ? "opacity-0" : ""
            }`}
          ></span>
          <span
            className={`block w-6 h-0.5 bg-blackText transition-all ${
              menuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          ></span>
        </button>
      </div>
      {/* Mobile Menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 w-full bg-white shadow-lg flex flex-col items-center py-4 gap-2 sm:hidden animate-fade-in z-20">
          <NavLink href="/about-us" active={pathname === "/about-us"}>
            About Us
          </NavLink>
          <NavLink href="/contact" active={pathname === "/contact"}>
            Contact
          </NavLink>
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, active, children }) {
  return (
    <Link
      href={href}
      className={`text-blackText font-semibold transition-colors text-base px-3 py-2 rounded-lg underline-offset-8 ${
        active ? "underline text-primary" : "hover:underline hover:text-primary"
      }`}
    >
      {children}
    </Link>
  );
}
