import React from 'react';

interface ButtonProps {
  text: string;
  href: string;
  variant?: 'solid' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
}

export default function Button({ text, href, variant = 'solid', size = 'md', icon, className = '' }: ButtonProps) {
  const baseClasses = "group relative inline-flex items-center justify-center rounded-[2px] transition-all duration-300 font-medium tracking-wider uppercase font-mono border";
  
  const sizeClasses = {
    sm: "px-5 py-2 text-[10px]",
    md: "px-8 py-4 text-xs",
    lg: "px-10 py-5 text-sm"
  };

  const variantClasses = {
    solid: "bg-white text-black hover:bg-[#E5E5E5] border-transparent",
    outline: "bg-transparent text-white border-[#2A2D34] hover:border-white hover:bg-[#2A2D34]"
  };

  return (
    <a 
      href={href} 
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      <span className="relative z-10 flex items-center gap-3">
        {text}
        {icon && <span className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300">{icon}</span>}
      </span>
    </a>
  );
}