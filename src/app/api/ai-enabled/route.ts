import { NextResponse } from 'next/server'

export function GET() {
  const AI_HOST = process.env.AI_HOST ?? ''
  const AI_API_KEY = process.env.AI_API_KEY ?? ''
  const AI_MODEL_ID = process.env.AI_MODEL_ID ?? ''

  const enabled = Boolean(AI_HOST && AI_API_KEY && AI_MODEL_ID)
  return NextResponse.json({ enabled })
}
