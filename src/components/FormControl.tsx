"use client"

import React from 'react'

type Props = {
    children: React.ReactNode
    error?: string | null
    help?: React.ReactNode | null
    className?: string
}

export default function FormControl({ children, error = null, help = null, className = '' }: Props) {
    return (
        <div className={`mb-1 ${className}`}>
            <div>{children}</div>
            {help ? <div className="text-xs text-gray-500 mt-1">{help}</div> : null}
            {error ? <div className="text-sm text-red-600 mt-1">{error}</div> : null}
        </div>
    )
}
