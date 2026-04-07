"use client";

import { motion, Variants, Transition } from "framer-motion";
import React from "react";

// Easing curves - properly typed
export const easeSmooth: [number, number, number, number] = [0.4, 0, 0.2, 1];
export const easeBounce: [number, number, number, number] = [0.68, -0.55, 0.265, 1.55];

// Fade in animation
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3, ease: easeSmooth }
  },
};

// Fade in up animation
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: easeSmooth }
  },
};

// Scale in animation
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.2, ease: easeSmooth }
  },
};

// Slide in from right
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3, ease: easeSmooth }
  },
};

// Stagger container
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

// Stagger item
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: easeSmooth },
  },
};

// Card hover effect - use these values directly in components
export const cardHoverTransition: Transition = {
  duration: 0.2,
  ease: easeSmooth
};

// Button tap effect values
export const buttonTapScale = 0.98;

// Pulse animation values
export const pulseScale = [1, 1.1, 1];

// Animated number counter component
export function AnimatedNumber({ value }: { value: number }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      key={value}
      transition={{ duration: 0.3 }}
    >
      {value}
    </motion.span>
  );
}

// Animated container wrapper
interface AnimatedContainerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedContainer({ 
  children, 
  className,
  delay = 0 
}: AnimatedContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: 1,
        transition: { duration: 0.3, delay, ease: easeSmooth }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger list wrapper
interface StaggerListProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggerList({ 
  children, 
  className 
}: StaggerListProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Hover scale wrapper
interface HoverScaleProps {
  children: React.ReactNode;
  className?: string;
  scale?: number;
}

export function HoverScale({ 
  children, 
  className,
  scale = 1.02
}: HoverScaleProps) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: easeSmooth }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
