import { NextResponse } from 'next/server'
import { getModel } from '@/lib/gemini'

export async function POST(req: Request) {
  try {
    const { ingredients, servings } = await req.json()

    const ingredientList = ingredients
      .filter((i: { name: string }) => i.name)
      .map((i: { amount: string; unit: string; name: string }) => `${i.amount} ${i.unit} ${i.name}`.trim())
      .join(', ')

    const model = getModel('gemini-2.0-flash')
    const prompt = `Estimate the nutritional info per serving for a recipe with ${servings} servings containing: ${ingredientList}.
      Return ONLY a valid JSON object (no markdown, no code blocks) with these exact keys:
      {"calories": 350, "protein": "25g", "carbs": "30g", "fat": "10g", "fiber": "5g"}`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const nutrition = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    return NextResponse.json({ nutrition })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('nutrition error:', message)
    return NextResponse.json({ nutrition: null })
  }
}
