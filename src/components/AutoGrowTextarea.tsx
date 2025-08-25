"use client"

import { useEffect, useRef } from 'react'

type Props = {
    value: string
    onChange: (v: string) => void
    placeholder?: string
    className?: string
    disabled?: boolean
    style?: React.CSSProperties
}

export default function AutoGrowTextarea({ value, onChange, placeholder, className, disabled, style }: Props) {
    const ref = useRef<HTMLTextAreaElement | null>(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        // reset height so scrollHeight is accurate
        el.style.height = '0px'
        el.style.height = `${Math.max(el.scrollHeight, 30)}px`
    }, [value])

    return (
        <textarea
            ref={ref}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={className}
            rows={1}
            style={{ ...style, resize: 'none', overflow: 'hidden' }}
            disabled={Boolean(disabled)}
        />
    )
}
