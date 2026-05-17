import React from "react";

/**
 * Pulsing Skeleton Card Component (Ideal for Events, Blog Posts, and Reviews)
 */
export const SkeletonCard = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="glass-panel overflow-hidden rounded-3xl border border-white/5 bg-[#0d1527]/50 p-6 shadow-soft"
          aria-hidden="true"
        >
          {/* Image/Media Placeholder */}
          <div className="h-48 w-full animate-pulse rounded-2xl bg-white/5" />
          
          <div className="mt-5 space-y-3">
            {/* Tag/Category Line */}
            <div className="h-4 w-1/4 animate-pulse rounded bg-[#8ce5db]/10" />
            
            {/* Title Line */}
            <div className="h-6 w-3/4 animate-pulse rounded bg-white/10" />
            
            {/* Description lines */}
            <div className="space-y-2">
              <div className="h-3.5 w-full animate-pulse rounded bg-white/5" />
              <div className="h-3.5 w-5/6 animate-pulse rounded bg-white/5" />
            </div>
            
            {/* Bottom Row / CTA */}
            <div className="flex items-center justify-between pt-4">
              <div className="h-4 w-1/3 animate-pulse rounded bg-white/5" />
              <div className="h-9 w-24 animate-pulse rounded-full bg-white/10" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

/**
 * Pulsing Skeleton Table Component (Ideal for Admin Data lists)
 */
export const SkeletonTable = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="w-full space-y-4" aria-hidden="true">
      {/* Header pulsing */}
      <div className="flex space-x-4 border-b border-white/5 pb-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-5 flex-1 animate-pulse rounded bg-white/10" />
        ))}
      </div>
      
      {/* Rows pulsing */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4 py-2">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div
              key={colIndex}
              className={`h-4 animate-pulse rounded bg-white/5 ${
                colIndex === 0 ? "flex-[1.5]" : "flex-1"
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Pulsing Skeleton Stats Component (Ideal for Analytics counters and overview metrics)
 */
export const SkeletonStats = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="glass-panel flex flex-col justify-between rounded-3xl border border-white/5 bg-[#0d1527]/50 p-6 shadow-soft"
        >
          <div className="space-y-2">
            <div className="h-4 w-1/3 animate-pulse rounded bg-white/5" />
            <div className="h-8 w-2/3 animate-pulse rounded bg-white/10" />
          </div>
          <div className="mt-4 h-3 w-1/2 animate-pulse rounded bg-[#8ce5db]/10" />
        </div>
      ))}
    </div>
  );
};

export default {
  Card: SkeletonCard,
  Table: SkeletonTable,
  Stats: SkeletonStats,
};
