import { NextResponse } from 'next/server'
import { getModel } from '@/lib/gemini'

export async function POST(req: Request) {
  try {
    const { ingredient, recipe } = await req.json()

    const model = getModel('gemini-2.0-flash')
    const prompt = `Suggest 2-3 substitutes for "${ingredient}" in a recipe called "${recipe}".
      Be concise. Format: "Use X (ratio), or Y (ratio). Note: brief tip."`

    const result = await model.generateContent(prompt)
    const substitution = result.response.text()
    return NextResponse.json({ substitution })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('substitutions error:', message)
    return NextResponse.json({ substitution: 'Could not get substitution.' }, { status: 500 })
  }
}
