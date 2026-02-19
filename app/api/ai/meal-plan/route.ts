import { NextResponse } from 'next/server'
import { groq, MODELS } from '@/lib/groq'

export async function POST(req: Request) {
  try {
    const { recipes, preferences, days } = await req.json()

    const recipeList = recipes.map((r: { title: string; cuisine_type: string; difficulty: string }) =>
      `- ${r.title} (${r.cuisine_type || 'various'}, ${r.difficulty || 'any'} difficulty)`
    ).join('\n')

    const completion = await groq.chat.completions.create({
      model: MODELS.smart,
      messages: [{
        role: 'user',
        content: `Create a ${days}-day meal plan using these recipes:
${recipeList}
${preferences ? `Preferences: ${preferences}` : ''}

Return ONLY valid JSON with no markdown:
{"Monday":{"breakfast":"suggestion","lunch":"recipe from list","dinner":"recipe from list"},"Tuesday":{...}}

Plan for exactly ${days} days starting Monday. Use recipe names from the list for lunch/dinner.`,
      }],
      temperature: 0.6,
      max_tokens: 1000,
    })

    const text = completion.choices[0]?.message?.content || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const plan = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    return NextResponse.json({ plan })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('meal-plan error:', message)
    return NextResponse.json({ plan: null, error: message }, { status: 500 })
  }
}
