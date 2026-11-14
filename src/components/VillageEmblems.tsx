import React from 'react';

interface EmblemProps {
  className?: string;
}

/**
 * Konohagakure spiral-leaf vector emblem.
 */
export const KonohaEmblem: React.FC<EmblemProps> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M5 17c1.5-5 5.5-9 11.5-10.5C15.5 13 12 17 7 18.5" />
    <path d="M12.5 11.5a2.2 2.2 0 1 1-3 3 3.8 3.8 0 0 1 5.2-5.2" />
    <path d="M4.5 18.5 7 18.5" />
  </svg>
);

/**
 * Sunagakure hourglass-crescent vector emblem.
 */
export const SunaEmblem: React.FC<EmblemProps> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M7 4h10" />
    <path d="M7 20h10" />
    <path d="M8 4c0 4.5 4 6.5 4 8s-4 3.5-4 8" />
    <path d="M16 4c0 4.5-4 6.5-4 8s4 3.5 4 8" />
  </svg>
);

/**
 * Dual-village crossed blades vector emblem.
 */
export const AllVillagesEmblem: React.FC<EmblemProps> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M5 19 19 5" />
    <path d="M14 5h5v5" />
    <path d="M5 5l14 14" />
    <path d="M5 10V5h5" />
  </svg>
);

export const VillageEmblem: React.FC<{
  village: 'konoha' | 'suna' | 'all' | 'diger';
  className?: string;
}> = ({ village, className }) => {
  if (village === 'konoha') return <KonohaEmblem className={className} />;
  if (village === 'suna') return <SunaEmblem className={className} />;
  return <AllVillagesEmblem className={className} />;
};
