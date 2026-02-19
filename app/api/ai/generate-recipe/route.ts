import { NextResponse } from 'next/server'
import { groq, MODELS } from '@/lib/groq'

export async function POST(req: Request) {
  try {
    const { ingredients, cuisine, dietary, servings, difficulty } = await req.json()

    const completion = await groq.chat.completions.create({
      model: MODELS.smart,
      messages: [{
        role: 'user',
        content: `Create a recipe using these available ingredients: ${ingredients}.
${cuisine ? `Cuisine style: ${cuisine}.` : ''}
${dietary ? `Dietary requirements: ${dietary}.` : ''}
${servings ? `Servings: ${servings}.` : ''}
${difficulty ? `Difficulty level: ${difficulty}.` : ''}

Return ONLY a valid JSON object with no markdown or code blocks:
{"title":"Recipe Name","description":"Brief description","cuisine_type":"Cuisine","prep_time":15,"cook_time":30,"servings":4,"difficulty":"easy","ingredients":[{"name":"ingredient","amount":"2","unit":"cups"}],"instructions":"Step 1: ...\nStep 2: ...","tags":["tag1","tag2"]}

Only use the provided ingredients plus basic pantry staples (salt, pepper, oil, water).`,
      }],
      temperature: 0.7,
      max_tokens: 1500,
    })

    const text = completion.choices[0]?.message?.content || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const recipe = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    return NextResponse.json({ recipe })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('generate-recipe error:', message)
    return NextResponse.json({ recipe: null, error: message }, { status: 500 })
  }
}
