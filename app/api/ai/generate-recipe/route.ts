import { NextResponse } from 'next/server'
import { getModel } from '@/lib/gemini'

export async function POST(req: Request) {
  try {
    const { ingredients, cuisine, dietary, servings, difficulty } = await req.json()

    const model = getModel('gemini-2.0-flash')
    const prompt = `Create a recipe using these available ingredients: ${ingredients}.
      ${cuisine ? `Cuisine style: ${cuisine}.` : ''}
      ${dietary ? `Dietary requirements: ${dietary}.` : ''}
      ${servings ? `Servings: ${servings}.` : ''}
      ${difficulty ? `Difficulty level: ${difficulty}.` : ''}

      Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):
      {
        "title": "Recipe Name",
        "description": "Brief appetizing description",
        "cuisine_type": "Cuisine type",
        "prep_time": 15,
        "cook_time": 30,
        "servings": 4,
        "difficulty": "easy",
        "ingredients": [{"name": "ingredient", "amount": "2", "unit": "cups"}],
        "instructions": "Step 1: ...\nStep 2: ...\nStep 3: ...",
        "tags": ["tag1", "tag2"]
      }

      Make it delicious and practical. Only include ingredients from the provided list plus basic pantry staples (salt, pepper, oil, water).`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const recipe = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    return NextResponse.json({ recipe })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('generate-recipe error:', message)
    return NextResponse.json({ recipe: null, error: message }, { status: 500 })
  }
}
