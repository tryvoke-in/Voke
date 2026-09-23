import React from "react";
import { Link } from "react-router-dom";

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer aria-label="Footer Navigation" className="relative bg-[#090a0f] text-white border-t border-white/[0.08] overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-16 sm:pt-20 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-12 lg:gap-16">
          
          {/* Left Column: Brand & Copyright */}
          <div className="flex flex-col space-y-6 max-w-xs">
            {/* Logo + Brand Name */}
            <Link to="/" className="inline-flex items-center gap-3 group w-fit">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-md group-hover:scale-105 transition-transform duration-200">
                <img 
                  src="/images/voke_logo_nav.png" 
                  alt="Voke Logo" 
                  width={24}
                  height={24}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/voke_logo.png";
                  }}
                />
              </div>
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                Voke
              </span>
            </Link>

            {/* Copyright */}
            <p className="text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed">
              &copy; copyright Voke AI {currentYear}. All rights reserved.
            </p>
          </div>

          {/* Right Columns: 4 Navigation Groups */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12 lg:gap-14 xl:gap-20">
            {/* 1. Pages */}
            <div>
              <h4 className="font-semibold text-white text-sm tracking-tight mb-4">Pages</h4>
              <ul className="space-y-3 text-xs sm:text-sm text-zinc-400 font-normal">
                <li>
                  <Link to="/#features" className="hover:text-white transition-colors duration-150">
                    All Products
                  </Link>
                </li>
                <li>
                  <Link to="/voice-assistant" className="hover:text-white transition-colors duration-150">
                    Studio
                  </Link>
                </li>
                <li>
                  <Link to="/companies" className="hover:text-white transition-colors duration-150">
                    Clients
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-white transition-colors duration-150">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/blogs" className="hover:text-white transition-colors duration-150">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            {/* 2. Socials */}
            <div>
              <h4 className="font-semibold text-white text-sm tracking-tight mb-4">Socials</h4>
              <ul className="space-y-3 text-xs sm:text-sm text-zinc-400 font-normal">
                <li>
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-150">
                    Facebook
                  </a>
                </li>
                <li>
                  <a href="https://www.instagram.com/tryvoke.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-150">
                    Instagram
                  </a>
                </li>
                <li>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-150">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="https://www.linkedin.com/company/vokeaii/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-150">
                    LinkedIn
                  </a>
                </li>
              </ul>
            </div>

            {/* 3. Legal */}
            <div>
              <h4 className="font-semibold text-white text-sm tracking-tight mb-4">Legal</h4>
              <ul className="space-y-3 text-xs sm:text-sm text-zinc-400 font-normal">
                <li>
                  <Link to="/privacy" className="hover:text-white transition-colors duration-150">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-white transition-colors duration-150">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-white transition-colors duration-150">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* 4. Register */}
            <div>
              <h4 className="font-semibold text-white text-sm tracking-tight mb-4">Register</h4>
              <ul className="space-y-3 text-xs sm:text-sm text-zinc-400 font-normal">
                <li>
                  <Link to="/auth?tab=signup" className="hover:text-white transition-colors duration-150">
                    Sign Up
                  </Link>
                </li>
                <li>
                  <Link to="/auth" className="hover:text-white transition-colors duration-150">
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/auth?tab=forgot" className="hover:text-white transition-colors duration-150">
                    Forgot Password
                  </Link>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>

      {/* Architectural Typography Watermark across bottom — centered in the middle of the footer */}
      <div className="w-full overflow-hidden select-none pointer-events-none mt-16 sm:mt-20 lg:mt-24 -mb-4 sm:-mb-6 md:-mb-8 flex justify-center">
        <div className="w-full flex justify-center text-center">
          <h2 className="text-[18vw] sm:text-[20vw] lg:text-[21vw] font-black tracking-tight text-white/[0.07] leading-[0.75] select-none whitespace-nowrap text-center">
            Voke
          </h2>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
