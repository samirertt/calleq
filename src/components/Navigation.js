"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();
  return (
    <nav className="relative z-10 flex items-center justify-between px-8 py-6 w-full">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <Image src="/images/logo.png" alt="Logo" width={60} height={60} />
          <span className="text-2xl font-bold text-blackText">CallEQ</span>
        </Link>
      </div>
      <div className="flex items-center gap-4">
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
