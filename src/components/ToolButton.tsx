import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface ToolButtonProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  compact?: boolean;
  dark?: boolean;
}

export default function ToolButton({ 
  icon: Icon, 
  label, 
  isActive, 
  onClick, 
  variant = 'primary',
  compact = false,
  dark = false
}: ToolButtonProps) {
  const baseClasses = compact 
    ? "flex items-center justify-center p-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 group relative"
    : "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95";
  
  const getVariantClasses = () => {
    if (dark) {
      return {
        primary: isActive 
          ? "bg-blue-600 text-white" 
          : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white",
        secondary: isActive 
          ? "bg-purple-600 text-white" 
          : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
      };
    }
    return {
      primary: isActive 
        ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
        : "bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:bg-blue-50",
      secondary: isActive 
        ? "bg-purple-600 text-white shadow-lg shadow-purple-200" 
        : "bg-white text-gray-700 border border-gray-200 hover:border-purple-300 hover:bg-purple-50"
    };
  };

  const variantClasses = getVariantClasses();

  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={`${baseClasses} ${variantClasses[variant]}`}
        title={compact ? label : undefined}
      >
        <Icon size={compact ? 16 : 18} />
        {!compact && <span className="text-sm">{label}</span>}
      </button>
      {compact && (
        <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          {label}
        </div>
      )}
    </div>
  );
}