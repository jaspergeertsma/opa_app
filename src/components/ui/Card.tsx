import React from 'react'
import clsx from 'clsx'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    hover?: boolean
    glass?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, hover, glass, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={clsx(
                    'card',
                    hover && 'card-hover cursor-pointer',
                    glass && 'glass',
                    className
                )}
                {...props}
            >
                {children}
            </div>
        )
    }
)

Card.displayName = 'Card'

export const CardHeader = ({ className, children }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={clsx('mb-4', className)}>
        {children}
    </div>
)

export const CardTitle = ({ className, children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={clsx('text-xl font-bold text-[var(--color-text-primary)]', className)}>
        {children}
    </h3>
)

export const CardDescription = ({ className, children }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={clsx('text-sm text-[var(--color-text-secondary)]', className)}>
        {children}
    </p>
)

export const CardContent = ({ className, children }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={clsx('', className)}>
        {children}
    </div>
)
