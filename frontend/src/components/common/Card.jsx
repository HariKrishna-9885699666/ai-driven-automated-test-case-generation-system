import { clsx } from 'clsx'

export default function Card({ children, className, gradient, glow, ...props }) {
  return (
    <div
      className={clsx(
        'glass-card',
        glow && 'shadow-lg shadow-primary-500/10',
        gradient && 'gradient-border',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
