import React from "react";
import { motion } from "motion/react";

interface SmoothTransitionProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
}

export const SmoothTransition: React.FC<SmoothTransitionProps> = ({
  children,
  id,
  className
}) => {
  return (
    <motion.div
      id={id}
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} // Elegant, swift bezier curve
    >
      {children}
    </motion.div>
  );
};
