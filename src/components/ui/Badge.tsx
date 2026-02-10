import React from 'react'
import clsx from 'clsx'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'error' | 'outline'
}

export const Badge = ({ className, variant = 'default', children, ...props }: BadgeProps) => {
    const variants = {
        default: 'bg-[var(--color-primary-start)]/10 text-[var(--color-primary-end)] border border-[var(--color-primary-end)]/20',
        success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        error: 'bg-red-500/10 text-red-400 border border-red-500/20',
        outline: 'bg-transparent border border-[var(--color-border)] text-[var(--color-text-secondary)]',
    }

    return (
        <span
            className={clsx(
                'badge inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </span>
    )
}
