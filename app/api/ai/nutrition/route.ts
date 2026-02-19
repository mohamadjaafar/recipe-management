import { NextResponse } from 'next/server'
import { groq, MODELS } from '@/lib/groq'

export async function POST(req: Request) {
  try {
    const { ingredients, servings } = await req.json()

    const ingredientList = ingredients
      .filter((i: { name: string }) => i.name)
      .map((i: { amount: string; unit: string; name: string }) => `${i.amount} ${i.unit} ${i.name}`.trim())
      .join(', ')

    const completion = await groq.chat.completions.create({
      model: MODELS.fast,
      messages: [{
        role: 'user',
        content: `Estimate nutrition per serving for a recipe with ${servings} servings: ${ingredientList}.
Return ONLY this JSON with no markdown: {"calories":350,"protein":"25g","carbs":"30g","fat":"10g","fiber":"5g"}`,
      }],
      temperature: 0.1,
      max_tokens: 150,
    })

    const text = completion.choices[0]?.message?.content || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const nutrition = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    return NextResponse.json({ nutrition })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('nutrition error:', message)
    return NextResponse.json({ nutrition: null })
  }
}
