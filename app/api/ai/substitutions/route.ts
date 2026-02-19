import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'

export async function POST(req: Request) {
  const { ingredient, recipe } = await req.json()

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Suggest 2-3 substitutes for "${ingredient}" in a recipe called "${recipe}".
      Be concise. Format: "Use X (ratio), or Y (ratio). Note: brief tip."`,
    }],
  })

  const substitution = (message.content[0] as { type: string; text: string }).text
  return NextResponse.json({ substitution })
}
