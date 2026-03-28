import { useInView } from 'react-intersection-observer';
import React from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
  delay?: number; // milliseconds
}

export const AnimatedSection = ({ children, className = '', delay = 0 }: Props) => {
  const { ref, inView } = useInView({
    threshold: 0.15,
    triggerOnce: true
  });

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};
