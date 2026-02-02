
import React from 'react'

interface PageHeaderProps {
    title: string
    subtitle?: string
    actions?: React.ReactNode
    icon?: React.ReactNode // Icon to display next to title
}

export default function PageHeader({ title, subtitle, actions, icon }: PageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
                <div className="flex items-center gap-3">
                    {icon && (
                        <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-500">
                            {icon}
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                        {subtitle && <p className="text-slate-500 mt-1 text-sm">{subtitle}</p>}
                    </div>
                </div>
            </div>
            {actions && (
                <div className="flex items-center gap-3">
                    {actions}
                </div>
            )}
        </div>
    )
}
