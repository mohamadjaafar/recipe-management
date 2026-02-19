import { NextResponse } from 'next/server'
import { getModel } from '@/lib/gemini'

export async function POST(req: Request) {
  try {
    const { recipes, preferences, days } = await req.json()

    const recipeList = recipes.map((r: { title: string; cuisine_type: string; difficulty: string }) =>
      `- ${r.title} (${r.cuisine_type || 'various'}, ${r.difficulty || 'any'} difficulty)`
    ).join('\n')

    const model = getModel('gemini-2.0-flash')
    const prompt = `Create a ${days}-day meal plan using these recipes:
${recipeList}

${preferences ? `Preferences/restrictions: ${preferences}` : ''}

Return ONLY a valid JSON object (no markdown, no code blocks) with this structure:
{
  "Monday": {"breakfast": "simple suggestion", "lunch": "recipe name from list", "dinner": "recipe name from list"},
  "Tuesday": {"breakfast": "simple suggestion", "lunch": "recipe name from list", "dinner": "recipe name from list"}
}

Plan for ${days} days starting Monday. Use recipe names from the list for lunch/dinner. Include variety.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const plan = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    return NextResponse.json({ plan })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('meal-plan error:', message)
    return NextResponse.json({ plan: null, error: message }, { status: 500 })
  }
}
