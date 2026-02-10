
import React from 'react'
import clsx from 'clsx'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'cta' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
    icon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => {

        const baseStyles = 'btn inline-flex items-center justify-center font-medium transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none'

        const variants = {
            primary: 'btn-primary', // CSS class defined in index.css
            secondary: 'btn-secondary',
            cta: 'btn-cta',
            ghost: 'btn-ghost',
            danger: 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40',
        }

        const sizes = {
            sm: 'h-8 px-3 text-xs',
            md: 'h-10 px-5 text-sm',
            lg: 'h-12 px-8 text-base',
        }

        return (
            <button
                ref={ref}
                className={clsx(
                    baseStyles,
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={disabled || loading}
                {...props}
            >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!loading && icon && <span className="mr-2">{icon}</span>}
                {children}
            </button>
        )
    }
)

Button.displayName = 'Button'
