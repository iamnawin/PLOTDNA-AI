import type { ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'

type RainbowBordersButtonProps = HTMLMotionProps<'button'> & {
  children: ReactNode
}

export function RainbowBordersButton({
  children,
  className = '',
  type = 'button',
  ...props
}: RainbowBordersButtonProps) {
  return (
    <>
      <motion.button
        type={type}
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className={`plotdna-rainbow-border group relative isolate overflow-visible border-2 border-transparent text-slate-50 shadow-[0_0_28px_rgba(16,185,129,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_44px_rgba(16,185,129,0.34)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300 ${className}`}
        {...props}
      >
        <motion.span
          aria-hidden="true"
          className="cta-reflection-sheen pointer-events-none absolute inset-y-0 -left-1/2 z-0 w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/24 to-transparent"
          animate={{ x: ['-120%', '360%'], opacity: [0, 1, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
        <span className="relative z-10 block w-full">{children}</span>
      </motion.button>
      <style>{`
        .plotdna-rainbow-border {
          background:
            linear-gradient(#020617, #020617) padding-box,
            linear-gradient(45deg, #10b981, #22d3ee, #a78bfa, #f59e0b, #ef4444, #10b981, #22d3ee, #a78bfa, #f59e0b, #ef4444) border-box;
          background-size: 100% 100%, 400% 100%;
          animation: plotdna-rainbow-border 20s linear infinite;
        }

        .plotdna-rainbow-border::after {
          content: '';
          position: absolute;
          left: -2px;
          top: -2px;
          border-radius: inherit;
          background: linear-gradient(45deg, #10b981, #22d3ee, #a78bfa, #f59e0b, #ef4444, #10b981, #22d3ee, #a78bfa, #f59e0b, #ef4444);
          background-size: 400%;
          width: calc(100% + 4px);
          height: calc(100% + 4px);
          z-index: -1;
          animation: plotdna-rainbow-border 20s linear infinite;
        }

        .plotdna-rainbow-border::after {
          filter: blur(34px);
          opacity: 0.72;
        }

        @keyframes plotdna-rainbow-border {
          0% { background-position: 0 0; }
          50% { background-position: 400% 0; }
          100% { background-position: 0 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .plotdna-rainbow-border,
          .plotdna-rainbow-border::after {
            animation-duration: 1ms;
            animation-iteration-count: 1;
          }
        }
      `}</style>
    </>
  )
}

export const Button = RainbowBordersButton
