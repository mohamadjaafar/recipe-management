import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'

export async function POST(req: Request) {
  const { recipes, preferences, days } = await req.json()

  const recipeList = recipes.map((r: { title: string; cuisine_type: string; difficulty: string }) =>
    `- ${r.title} (${r.cuisine_type || 'various'}, ${r.difficulty || 'any'} difficulty)`
  ).join('\n')

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `Create a ${days}-day meal plan using these recipes:
${recipeList}

${preferences ? `Preferences/restrictions: ${preferences}` : ''}

Return ONLY a valid JSON object with this structure:
{
  "Monday": {"breakfast": "recipe or suggestion", "lunch": "recipe name from list", "dinner": "recipe name from list"},
  "Tuesday": {...},
  ...
}

Use the recipe names from the list for lunch and dinner when possible. For breakfast suggest simple options.
Plan for ${days} days starting Monday. Include variety and balance.`,
    }],
  })

  try {
    const text = (message.content[0] as { type: string; text: string }).text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const plan = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    return NextResponse.json({ plan })
  } catch {
    return NextResponse.json({ plan: null, error: 'Failed to generate plan' })
  }
}
