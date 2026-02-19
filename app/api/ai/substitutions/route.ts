import { NextResponse } from 'next/server'
import { groq, MODELS } from '@/lib/groq'

export async function POST(req: Request) {
  try {
    const { ingredient, recipe } = await req.json()

    const completion = await groq.chat.completions.create({
      model: MODELS.fast,
      messages: [{
        role: 'user',
        content: `Suggest 2-3 substitutes for "${ingredient}" in "${recipe}". Be concise: "Use X (ratio), or Y (ratio). Note: tip."`,
      }],
      temperature: 0.5,
      max_tokens: 150,
    })

    const substitution = completion.choices[0]?.message?.content || 'No substitution found.'
    return NextResponse.json({ substitution })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('substitutions error:', message)
    return NextResponse.json({ substitution: 'Could not get substitution.' }, { status: 500 })
  }
}
