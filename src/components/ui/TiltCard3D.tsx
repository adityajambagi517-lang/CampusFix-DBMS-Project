'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface TiltCard3DProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  onClick?: () => void;
}

export const TiltCard3D: React.FC<TiltCard3DProps> = ({
  children,
  className = '',
  glowColor = 'rgba(56, 189, 248, 0.25)',
  onClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Normalize coordinates from -1 to 1
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const normalX = (x - centerX) / centerX;
    const normalY = (y - centerY) / centerY;

    // Subtle 3D tilt: max 8 deg
    setRotateX(-normalY * 7);
    setRotateY(normalX * 7);
    setMousePos({ x, y });
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{
        rotateX,
        rotateY,
        scale: isHovered ? 1.015 : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      className={`relative overflow-hidden rounded-2xl glass-card transition-colors duration-300 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Vengeance UI dynamic spotlight radial highlight */}
      {isHovered && (
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300"
          style={{
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, ${glowColor}, transparent 80%)`,
          }}
        />
      )}

      {/* Surface content */}
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </motion.div>
  );
};

