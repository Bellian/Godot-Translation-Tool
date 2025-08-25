"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function BackButton({ label = 'Back', href }: { label?: string; href?: string }) {
    const router = useRouter()
    if (href) {
        return (
            <Link
                href={href}
                className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline cursor-pointer"
            >
                ← {label}
            </Link>
        )
    }

    return (
        <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline cursor-pointer"
        >
            ← {label}
        </button>
    )
}
