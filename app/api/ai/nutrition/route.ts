import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'

export async function POST(req: Request) {
  try {
    const { ingredients, servings } = await req.json()

    const ingredientList = ingredients
      .filter((i: { name: string }) => i.name)
      .map((i: { amount: string; unit: string; name: string }) => `${i.amount} ${i.unit} ${i.name}`.trim())
      .join(', ')

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Estimate the nutritional info per serving for a recipe with ${servings} servings containing: ${ingredientList}.

      Return ONLY a valid JSON object with these exact keys: calories (number), protein (string like "25g"), carbs (string like "30g"), fat (string like "10g"), fiber (string like "5g").
      No explanation, just the JSON.`,
      }],
    })

    const text = (message.content[0] as { type: string; text: string }).text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const nutrition = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    return NextResponse.json({ nutrition })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('nutrition error:', message)
    return NextResponse.json({ nutrition: null })
  }
}
