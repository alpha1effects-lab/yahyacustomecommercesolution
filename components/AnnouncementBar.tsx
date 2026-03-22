'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useUI } from '@/contexts/UIContext';

interface AnnouncementItem {
  _id: string;
  text: string;
}

export const AnnouncementBar: React.FC = () => {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const { isMobileMenuOpen } = useUI();

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const response = await fetch('/api/announcements');
        if (response.ok) {
          const data = await response.json();
          setAnnouncements(Array.isArray(data) ? data : []);
        }
      } catch {
        setAnnouncements([]);
      }
    };
    loadAnnouncements();
  }, []);

  const marqueeItems = useMemo(() => {
    if (announcements.length === 0) {
      return [
        'Free shipping on orders over $120',
        'New studio drops every Friday',
        'Handmade, small-batch craft goods',
      ];
    }
    return announcements.map(item => item.text);
  }, [announcements]);

  if (isMobileMenuOpen) return null;

  return (
    <div className="bg-black dark:bg-white text-white dark:text-black overflow-hidden py-2 relative z-[60] border-b border-gray-800 dark:border-gray-200">
      <style>{`
        @keyframes marquee-infinite {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-infinite {
           animation: marquee-infinite 40s linear infinite;
           display: flex;
           width: fit-content;
        }
      `}</style>
      <div className="flex animate-marquee-infinite hover:[animation-play-state:paused] whitespace-nowrap">
        {[1, 2].map(loop => (
          <div key={loop} className="flex items-center gap-16 px-8">
            {marqueeItems.map((text, index) => (
              <React.Fragment key={`${loop}-${index}`}>
                <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase">{text}</span>
                <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase"> • </span>
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
