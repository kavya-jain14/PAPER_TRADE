import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import styles from './LogoMorph.module.css';

// ── Strict Geometry Definitions ───────────────────────────────────────────────
// viewBox="0 0 120 120"
// Clean SVG groups, drawn with pathLength rather than distorted path interpolation.

const states = {
  logo: [
    "M 39 25 L 81 25 L 88 28 L 92 32 L 95 39 L 95 81 L 92 88 L 88 92 L 81 95 L 39 95 L 32 92 L 28 88 L 25 81 L 25 39 L 28 32 L 32 28 Z", // frame
    "M 40 45 L 80 45", // top bar
    "M 52 45 L 52 78", // vertical stem
    "M 52 45 L 60 45 L 65 48 L 67 56 L 65 64 L 60 67 L 52 67" // bowl
  ],
  dollar: [
    "M 60 18 L 60 102", // central vertical stem
    "M 82 36 C 82 18, 38 18, 38 36 C 38 60, 82 60, 82 84 C 82 102, 38 102, 38 84" // single perfect S-curve
  ],
  graph: [
    "M 30 95 L 90 95", // horizontal baseline
    "M 30 80 L 45 60 L 60 70 L 75 40 L 90 25" // rising market line
  ]
};

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

  const isVisible = (stateName) => prefersReducedMotion ? stateName === 'logo' : activeVariant === stateName;

  const getGroupProps = (stateName) => {
    const visible = isVisible(stateName);
    return {
      initial: false,
      animate: {
        opacity: visible ? 1 : 0,
        // Subtle directional translation down when hiding, up to 0 when appearing
        y: visible ? 0 : 3, 
      },
      transition: {
        // Short opacity overlap to avoid tangled silhouettes
        opacity: { 
          duration: duration > 0 ? duration * 0.25 : 0, 
          ease: "linear",
          delay: visible ? (duration > 0 ? duration * 0.1 : 0) : 0 
        },
        y: { duration: duration, ease: [0.4, 0, 0.2, 1] }
      }
    };
  };

  const getPathProps = (stateName) => {
    const visible = isVisible(stateName);
    return {
      initial: false,
      animate: {
        pathLength: visible ? 1 : 0,
      },
      transition: {
        pathLength: { duration: duration, ease: [0.4, 0, 0.2, 1] },
      }
    };
  };

  return (
    <div 
      className={styles.logoMorph}
      aria-hidden={decorative ? "true" : undefined}
      focusable={decorative ? "false" : undefined}
    >
      <svg viewBox="0 0 120 120" width="100%" height="100%">
        {Object.entries(states).map(([stateName, pathArray]) => (
          <motion.g 
            key={stateName}
            {...getGroupProps(stateName)}
            stroke="var(--color-accent)" 
            strokeWidth="7" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="none"
            style={{ vectorEffect: 'non-scaling-stroke' }}
          >
            {pathArray.map((d, i) => (
              <motion.path 
                key={i} 
                d={d}
                {...getPathProps(stateName)}
              />
            ))}
          </motion.g>
        ))}
      </svg>
    </div>
  );
}
