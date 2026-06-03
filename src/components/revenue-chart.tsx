"use client";

import React, { useState } from 'react';
import { formatINR } from '@/lib/conversions';

interface DataPoint {
  month: string;
  amount: number;
}

export function RevenueChart({ data }: { data: DataPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    // Fallback data if DB has no orders yet
    data = [
      { month: 'Jan', amount: 35000 },
      { month: 'Feb', amount: 28000 },
      { month: 'Mar', amount: 42000 },
      { month: 'Apr', amount: 55000 },
      { month: 'May', amount: 48000 },
      { month: 'Jun', amount: 62000 },
      { month: 'Jul', amount: 70000 },
      { month: 'Aug', amount: 68000 },
      { month: 'Sep', amount: 80000 },
      { month: 'Oct', amount: 92000 },
      { month: 'Nov', amount: 85000 },
      { month: 'Dec', amount: 105000 }
    ];
  }

  const maxVal = Math.max(...data.map(d => d.amount), 1000);
  const width = 500;
  const height = 180;
  const padding = 20;

  // Calculate points
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - (d.amount / maxVal) * (height - padding * 2);
    return { x, y, data: d, index: i };
  });

  // SVG path string
  const pathD = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  // Area path string (fills under the line)
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    : '';

  return (
    <div className="relative w-full select-none">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-extrabold text-white">Revenue Overview</h3>
          <p className="text-[10px] text-zinc-500 mt-0.5">Real-time revenue tracking across months</p>
        </div>
        
        {/* Metric Label */}
        {hoverIndex !== null ? (
          <div className="text-right">
            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">
              {data[hoverIndex].month} Revenue
            </span>
            <span className="text-sm font-black text-white">
              {formatINR(data[hoverIndex].amount)}
            </span>
          </div>
        ) : (
          <div className="text-[10px] font-bold text-zinc-500 italic">
            Hover points to inspect
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="relative h-48 w-full">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-full text-zinc-400 overflow-visible"
        >
          <defs>
            <linearGradient id="monochromeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08"/>
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
            </linearGradient>
          </defs>
          
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding + ratio * (height - padding * 2);
            return (
              <line 
                key={ratio} 
                x1={padding} 
                y1={y} 
                x2={width - padding} 
                y2={y} 
                stroke="#1f1f23" 
                strokeWidth="1" 
                strokeDasharray="4 4" 
              />
            );
          })}

          {/* Area Fill */}
          <path d={areaD} fill="url(#monochromeGradient)" />

          {/* Solid line path */}
          <path 
            d={pathD} 
            fill="none" 
            stroke="white" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* Interactive node points */}
          {points.map((p) => {
            const isHovered = hoverIndex === p.index;
            return (
              <g 
                key={p.index}
                onMouseEnter={() => setHoverIndex(p.index)}
                onMouseLeave={() => setHoverIndex(null)}
                className="cursor-pointer"
              >
                {/* Large transparent hit target for easy hovering */}
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="12" 
                  fill="transparent" 
                />
                {/* Visible dot node */}
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r={isHovered ? "5" : "3"} 
                  fill={isHovered ? "white" : "#1f1f23"} 
                  stroke="white" 
                  strokeWidth="2" 
                  className="transition-all duration-150"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Month Labels */}
      <div className="flex justify-between text-[9px] font-bold text-zinc-500 pt-2 px-3 border-t border-[#1f1f23]/30">
        {data.map((d) => (
          <span key={d.month}>{d.month}</span>
        ))}
      </div>
    </div>
  );
}
