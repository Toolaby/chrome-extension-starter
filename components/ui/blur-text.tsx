import { motion, useReducedMotion } from 'motion/react';

/** Words that come into focus one after another: from blurred and low to sharp and set. */
export function BlurText({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <span className={className}>
      {text.split(' ').map((word, i) => (
        <motion.span
          key={i}
          className="inline-block whitespace-pre"
          initial={reduce ? false : { opacity: 0, y: 12, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: delay + i * 0.07, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {word}{' '}
        </motion.span>
      ))}
    </span>
  );
}
