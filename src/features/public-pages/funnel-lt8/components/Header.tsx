"use client"

import React, { useState, useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';
import Button from './Button';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-40 transition-all duration-500 border-b ${isScrolled ? 'py-4 bg-[#0F0F12]/90 backdrop-blur-md border-[#2A2D34]' : 'py-4 md:py-6 bg-transparent border-transparent'}`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
          {/* Logo */}
          <div className="z-50 flex-shrink-1 min-w-0 pr-4">
            <a href="/" className="block">
              <span className="font-serif font-medium text-sm sm:text-base md:text-2xl tracking-[0.15em] md:tracking-[0.25em] uppercase text-white leading-none whitespace-nowrap">
                Capital Hub
              </span>
            </a>
          </div>

          {/* Right Actions - Button Only */}
          <div className="flex items-center gap-6 z-50 flex-shrink-0">
             <Button text="EMPEZAR AHORA" href="#offer" variant="outline" size="sm" icon={<ArrowUpRight size={14} />} />
          </div>
      </div>
    </header>
  );
}
