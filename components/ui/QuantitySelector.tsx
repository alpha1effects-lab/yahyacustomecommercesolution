'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({ quantity, onIncrease, onDecrease }) => {
  return (
    <div className="flex items-center border border-border-gray dark:border-gray-700 w-[140px] h-[52px]">
      <button 
        onClick={onDecrease}
        className="flex-1 h-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors"
        aria-label="Decrease quantity"
      >
        <Minus size={16} className="text-black dark:text-gray-400" />
      </button>
      <div className="flex-1 h-full flex items-center justify-center text-black dark:text-white font-medium">
        {quantity}
      </div>
      <button 
        onClick={onIncrease}
        className="flex-1 h-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors"
        aria-label="Increase quantity"
      >
        <Plus size={16} className="text-black dark:text-gray-400" />
      </button>
    </div>
  );
};
