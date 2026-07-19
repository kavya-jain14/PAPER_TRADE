import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import styles from './LogoMorph.module.css';

// ── Path Definitions ────────────────────────────────────────────────────────
// All paths share the exact same command structure (M followed by 16 L's for frame, etc)
// to ensure perfect vector interpolation in Framer Motion.

const paths = {
  frame: {
    logo: "M 29 15 L 71 15 L 78 18 L 82 22 L 85 29 L 85 71 L 82 78 L 78 82 L 71 85 L 29 85 L 22 82 L 18 78 L 15 71 L 15 29 L 18 22 L 22 18 L 29 15",
    // Retracing S-curve
    dollar: "M 75 25 L 55 25 L 35 35 L 35 45 L 50 55 L 65 65 L 65 75 L 45 85 L 25 85 L 45 85 L 65 75 L 65 65 L 50 55 L 35 45 L 35 35 L 55 25 L 75 25",
    // Retracing L-axis
    graph: "M 15 15 L 15 35 L 15 55 L 15 75 L 15 85 L 35 85 L 55 85 L 75 85 L 85 85 L 75 85 L 55 85 L 35 85 L 15 85 L 15 75 L 15 55 L 15 35 L 15 15"
  },
  bar: {
    logo: "M 30 35 L 40 35 L 50 35 L 60 35 L 70 35",
    // Vertical line through S
    dollar: "M 50 12 L 50 30 L 50 50 L 50 70 L 50 88",
    // First segment of rising line
    graph: "M 15 85 L 25 70 L 35 75 L 45 55 L 45 55"
  },
  stem: {
    logo: "M 42 35 L 42 43 L 42 51 L 42 59 L 42 68",
    // Merges into the vertical line
    dollar: "M 50 12 L 50 30 L 50 50 L 50 70 L 50 88",
    // Second segment of rising line
    graph: "M 45 55 L 55 65 L 65 40 L 65 40 L 65 40"
  },
  bowl: {
    logo: "M 42 35 L 50 35 L 55 38 L 57 46 L 55 54 L 50 57 L 42 57",
    // Merges into the vertical line
    dollar: "M 50 12 L 50 30 L 50 50 L 50 70 L 50 88 L 50 50 L 50 12",
    // Third segment of rising line
    graph: "M 65 40 L 75 45 L 85 20 L 85 20 L 85 20 L 85 20 L 85 20"
  }
};

const miniCandles = [
  { path: "M 25 54 L 25 66", color: "var(--color-positive)" },
  { path: "M 50 60 L 50 70", color: "var(--color-negative)" },
  { path: "M 75 26 L 75 38", color: "var(--color-positive)" }
];

// ─────────────────────────────────────────────────────────────────────────────

export default function LogoMorph({ decorative = false }) {
  const prefersReducedMotion = useReducedMotion();
  const [activeVariant, setActiveVariant] = useState('logo');
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;

    let isMounted = true;

    const runSequence = async () => {
      while (isMounted) {
        // Logo hold (1.20s)
        await new Promise(r => setTimeout(r, 1200));
        
        // Logo -> Dollar (0.65s)
        if (!isMounted) break;
        setDuration(0.65);
        setActiveVariant('dollar');
        await new Promise(r => setTimeout(r, 650));

        // Dollar hold (0.55s)
        await new Promise(r => setTimeout(r, 550));

        // Dollar -> Graph (0.85s)
        if (!isMounted) break;
        setDuration(0.85);
        setActiveVariant('graph');
        await new Promise(r => setTimeout(r, 850));

        // Graph hold (0.60s)
        await new Promise(r => setTimeout(r, 600));

        // Graph -> Logo (0.85s)
        if (!isMounted) break;
        setDuration(0.85);
        setActiveVariant('logo');
        await new Promise(r => setTimeout(r, 850));

        // Logo rest (4.80s)
        await new Promise(r => setTimeout(r, 4800));
      }
    };

    runSequence();

    return () => { isMounted = false; };
  }, [prefersReducedMotion]);

  // Transition definition
  const baseTransition = {
    duration: duration,
    ease: [0.4, 0, 0.2, 1]
  };

  const ghost1Transition = {
    ...baseTransition,
    delay: duration > 0 ? 0.05 : 0
  };

  const ghost2Transition = {
    ...baseTransition,
    delay: duration > 0 ? 0.09 : 0
  };

  // Helper to render the 4 core paths of the mark
  const renderPaths = (transitionObj, opacity = 1) => (
    <motion.g 
      opacity={opacity} 
      stroke="var(--color-accent)" 
      strokeWidth="5.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      fill="none"
    >
      {Object.entries(paths).map(([key, variants]) => (
        <motion.path
          key={key}
          initial={false}
          animate={{ d: variants[activeVariant] }}
          transition={transitionObj}
        />
      ))}
    </motion.g>
  );

  return (
    <div 
      className={styles.logoMorph}
      aria-hidden={decorative ? "true" : undefined}
      focusable={decorative ? "false" : undefined}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        
        {/* Ghost Traces (Disabled in reduced motion) */}
        {!prefersReducedMotion && renderPaths(ghost2Transition, 0.08)}
        {!prefersReducedMotion && renderPaths(ghost1Transition, 0.16)}

        {/* Primary Geometry */}
        {renderPaths(baseTransition, 1)}

        {/* Semantic Mini Candles for Graph Stage */}
        <g strokeWidth="3" strokeLinecap="round">
          {miniCandles.map((c, i) => (
            <motion.path
              key={i}
              d={c.path}
              stroke={c.color}
              initial={false}
              animate={{ opacity: activeVariant === 'graph' ? 1 : 0 }}
              transition={{ duration: duration > 0 ? duration * 0.8 : 0 }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
