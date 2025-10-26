/**
 * PlayerHeatmap Component
 * Interactive canvas-based heatmap visualization of player movement on a soccer field
 */

import React, { useEffect, useRef, useState } from 'react';
import type { HeatmapData } from '../types/heatmap';

interface PlayerHeatmapProps {
  data: HeatmapData;
  width?: number;
  height?: number;
}

export const PlayerHeatmap: React.FC<PlayerHeatmapProps> = ({
  data,
  width = 800,
  height = 520,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });

  // Field dimensions in meters (standard soccer field: 105m x 68m)
  const FIELD_LENGTH = 105;
  const FIELD_WIDTH = 68;
  
  // Bright, vibrant color scheme for better visibility
  const HEATMAP_COLORS = {
    low: { r: 13, g: 110, b: 253 },      // Bright blue
    medium: { r: 0, g: 221, b: 255 },    // Cyan
    high: { r: 255, g: 215, b: 0 },      // Gold
    max: { r: 255, g: 69, b: 58 }        // Vibrant red
  };

  // Responsive sizing
  useEffect(() => {
    const updateDimensions = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        const maxWidth = Math.min(width, container.clientWidth);
        const aspectRatio = FIELD_LENGTH / FIELD_WIDTH;
        setDimensions({
          width: maxWidth,
          height: maxWidth / aspectRatio,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [width]);

  useEffect(() => {
    if (!canvasRef.current || !data || data.positions.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const scaleX = dimensions.width / FIELD_LENGTH;
    const scaleY = dimensions.height / FIELD_WIDTH;

    // Helper function to convert field coordinates to canvas coordinates
    const toCanvasX = (fieldX: number) => (fieldX * scaleX);
    const toCanvasY = (fieldY: number) => dimensions.height - (fieldY * scaleY);

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Draw field background
    drawField(ctx, dimensions, FIELD_LENGTH, FIELD_WIDTH);

    // Create density grid for heatmap
    const gridSize = 30;
    const gridWidth = Math.ceil(FIELD_LENGTH / gridSize);
    const gridHeight = Math.ceil(FIELD_WIDTH / gridSize);
    const densityGrid: number[][] = Array(gridWidth).fill(0).map(() => Array(gridHeight).fill(0));

    // Fill density grid with position weights
    data.positions.forEach((pos) => {
      const gridX = Math.floor(pos.x / gridSize);
      const gridY = Math.floor(pos.y / gridSize);
      if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
        densityGrid[gridX][gridY] += 1;
      }
    });

    // Find max density for normalization
    let maxDensity = 0;
    densityGrid.forEach((row) => {
      row.forEach((density) => {
        if (density > maxDensity) maxDensity = density;
      });
    });

    // Draw heatmap with gradient colors and smooth gradients
    if (maxDensity > 0) {
      for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < gridHeight; y++) {
          const density = densityGrid[x][y];
          if (density > 0) {
            const normalizedDensity = density / maxDensity;
            const color = getDensityColor(normalizedDensity);

            const canvasX = x * (dimensions.width / gridWidth);
            const canvasY = dimensions.height - (y * (dimensions.height / gridHeight));
            const cellWidth = dimensions.width / gridWidth;
            const cellHeight = dimensions.height / gridHeight;

            // Use radial gradient for smooth blending with better opacity
            const gradient = ctx.createRadialGradient(
              canvasX + cellWidth / 2,
              canvasY - cellHeight / 2,
              0,
              canvasX + cellWidth / 2,
              canvasY - cellHeight / 2,
              Math.max(cellWidth, cellHeight)
            );
            
            // Higher alpha at center for density - more vibrant
            const baseAlpha = Math.min(normalizedDensity * 3, 0.95);
            gradient.addColorStop(0, `rgba(${extractRGB(color)} ${baseAlpha})`);
            gradient.addColorStop(0.3, `rgba(${extractRGB(color)} ${baseAlpha * 0.7})`);
            gradient.addColorStop(0.7, `rgba(${extractRGB(color)} ${baseAlpha * 0.3})`);
            gradient.addColorStop(1, `rgba(${extractRGB(color)} 0)`);

            ctx.fillStyle = gradient;
            ctx.fillRect(canvasX, canvasY - cellHeight, cellWidth, cellHeight);
          }
        }
      }
    }

    // Draw position dots with better visibility
    const drawDot = (x: number, y: number, color: string, size: number) => {
      // Outer glow
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size * 2, 0, Math.PI * 2);
      ctx.fill();

      // Inner solid dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    };

    // Sample positions to reduce density - every 3rd position for better visibility
    const sampledPositions = data.positions.filter((_, index) => index % 3 === 0);
    sampledPositions.forEach((pos) => {
      const canvasX = toCanvasX(pos.x);
      const canvasY = toCanvasY(pos.y);
      const dotColor = pos.hasBall ? '#FF6B35' : '#1DA1F2'; // Brighter blue
      const dotSize = pos.hasBall ? 5 : 4;
      drawDot(canvasX, canvasY, dotColor, dotSize);
    });
  }, [data, dimensions]);

  return (
    <div className="relative flex justify-center">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ 
          maxWidth: '100%', 
          height: 'auto',
          border: '3px solid rgba(255, 255, 255, 0.8)',
          borderRadius: '12px',
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
          background: '#5A8B69',
        }}
      />
    </div>
  );
};

// Draw soccer field markings
function drawField(
  ctx: CanvasRenderingContext2D,
  dimensions: { width: number; height: number },
  fieldLength: number,
  fieldWidth: number,
) {
  const scaleX = dimensions.width / fieldLength;
  const scaleY = dimensions.height / fieldWidth;

  // Clean field background - smooth gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, dimensions.height);
  gradient.addColorStop(0, '#6B9B78');  // Light green
  gradient.addColorStop(0.5, '#5A8B69');
  gradient.addColorStop(1, '#4A7C59');  // Dark green
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, dimensions.width, dimensions.height);

  // Field outline (clean white)
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(2, 2, dimensions.width - 4, dimensions.height - 4);

  // Center line
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(dimensions.width / 2, 0);
  ctx.lineTo(dimensions.width / 2, dimensions.height);
  ctx.stroke();

  // Center circle
  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;
  const radius = 20 * scaleX;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Center spot
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
  ctx.fill();

  // Penalty boxes - simplified for cleaner look
  const penaltyDepth = 18 * scaleX;
  const penaltyWidth = (35 / fieldLength) * dimensions.width;

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  
  // Top penalty box
  ctx.strokeRect(0, dimensions.height / 2 - penaltyWidth / 2, penaltyDepth, penaltyWidth);

  // Bottom penalty box
  ctx.strokeRect(dimensions.width - penaltyDepth, dimensions.height / 2 - penaltyWidth / 2, penaltyDepth, penaltyWidth);

  // Goal areas - smaller
  const goalDepth = 6 * scaleX;
  const goalWidth = (18 / fieldLength) * dimensions.width;

  // Top goal box
  ctx.strokeRect(0, dimensions.height / 2 - goalWidth / 2, goalDepth, goalWidth);

  // Bottom goal box
  ctx.strokeRect(dimensions.width - goalDepth, dimensions.height / 2 - goalWidth / 2, goalDepth, goalWidth);

  // Goal posts
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, dimensions.height / 2 - goalWidth / 2);
  ctx.lineTo(0, dimensions.height / 2 + goalWidth / 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(dimensions.width, dimensions.height / 2 - goalWidth / 2);
  ctx.lineTo(dimensions.width, dimensions.height / 2 + goalWidth / 2);
  ctx.stroke();
}

// Convert density (0-1) to bright, vibrant color gradient
function getDensityColor(density: number): string {
  // Vibrant gradient: Bright Blue → Cyan → Gold → Vibrant Red
  if (density < 0.25) {
    // Bright Blue to Cyan
    const t = density / 0.25;
    return `rgb(${interpolate(13, 0)}, ${interpolate(110, 221)}, ${interpolate(253, 255)})`;
  } else if (density < 0.5) {
    // Cyan to Yellow/Gold
    const t = (density - 0.25) / 0.25;
    return `rgb(${interpolate(0, 255)}, ${interpolate(221, 215)}, ${interpolate(255, 0)})`;
  } else if (density < 0.75) {
    // Gold to Orange
    const t = (density - 0.5) / 0.25;
    return `rgb(${interpolate(255, 255)}, ${interpolate(215, 152)}, ${interpolate(0, 0)})`;
  } else {
    // Orange to Vibrant Red
    const t = (density - 0.75) / 0.25;
    return `rgb(${interpolate(255, 255)}, ${interpolate(152, 69)}, ${interpolate(0, 58)})`;
  }
}

function interpolate(start: number, end: number, t?: number): number {
  if (t === undefined) return start;
  return Math.round(start + (end - start) * t);
}

// Extract RGB from color string (format: "rgb(r, g, b)")
function extractRGB(colorStr: string): string {
  const match = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    return `${match[1]}, ${match[2]}, ${match[3]}`;
  }
  return '0, 0, 0';
}

