import React from 'react'
import clsx from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    helperText?: string
    icon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, helperText, icon, id, ...props }, ref) => {
        const inputId = id || React.useId()

        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={inputId} className="block text-sm font-medium mb-1.5 text-[var(--color-text-secondary)]">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none">
                            {icon}
                        </div>
                    )}
                    <input
                        id={inputId}
                        ref={ref}
                        className={clsx(
                            'w-full bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] border rounded-xl py-2.5 transition-all outline-none',
                            icon ? 'pl-10 pr-4' : 'px-4',
                            'focus:ring-2 focus:ring-[var(--color-primary-start)]/50 focus:border-[var(--color-primary-end)]',
                            error
                                ? 'border-red-500/50 focus:ring-red-500/20'
                                : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]',
                            className
                        )}
                        {...props}
                    />
                </div>
                {helperText && !error && (
                    <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">{helperText}</p>
                )}
                {error && (
                    <p className="mt-1.5 text-xs text-red-400">{error}</p>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'
