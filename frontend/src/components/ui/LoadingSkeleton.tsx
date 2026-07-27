"use client";

import React from "react";

interface LoadingSkeletonProps {
  rows?: number;
  cols?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ rows = 5, cols = 4 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx}>
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx}>
              <div 
                className="skeleton-row" 
                style={{ 
                  width: cIdx === 0 ? "70%" : cIdx === 1 ? "40%" : "85%",
                  height: "16px" 
                }} 
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};
