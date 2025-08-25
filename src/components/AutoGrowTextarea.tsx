"use client"

import React, { useEffect, useRef, forwardRef } from 'react'

type Props = {
    value: string
    onChange: (v: string) => void
    placeholder?: string
    className?: string
    disabled?: boolean
    lang?: string
    style?: React.CSSProperties
    onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void
    onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void
}

// Forward the underlying textarea ref so parents can call focus() and set selection.
const AutoGrowTextarea = forwardRef<HTMLTextAreaElement, Props>(function AutoGrowTextarea(
    { value, onChange, placeholder, className, disabled, style, onFocus, onBlur, lang }: Props,
    ref,
) {
    const innerRef = useRef<HTMLTextAreaElement | null>(null)

    useEffect(() => {
        const el = innerRef.current
        if (!el) return
        // reset height so scrollHeight is accurate
        el.style.height = '0px'
        el.style.height = `${Math.max(el.scrollHeight, 30)}px`
    }, [value])

    return (
        <textarea
            ref={(el) => {
                innerRef.current = el
                // forward ref (support function or object refs)
                if (!ref) return
                if (typeof ref === 'function') ref(el)
                else (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el
            }}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            className={`${className ?? ''} outline-none`}
            rows={1}
            style={{ ...style, resize: 'none', overflow: 'hidden' }}
            disabled={Boolean(disabled)}
            lang={lang}
        />
    )
})

export default AutoGrowTextarea
