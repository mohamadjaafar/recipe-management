'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2, ChefHat, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import type { Recipe } from '@/types'

export default function AIGeneratorPage() {
  const router = useRouter()
  const [ingredients, setIngredients] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [dietary, setDietary] = useState('')
  const [servings, setServings] = useState('4')
  const [difficulty, setDifficulty] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatedRecipe, setGeneratedRecipe] = useState<Partial<Recipe> | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ingredients.trim()) return
    setLoading(true)
    setError('')
    setGeneratedRecipe(null)

    try {
      const res = await fetch('/api/ai/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, cuisine, dietary, servings: parseInt(servings), difficulty }),
      })
      const data = await res.json()
      if (data.recipe) {
        setGeneratedRecipe(data.recipe)
      } else {
        setError('Failed to generate recipe. Please try again.')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!generatedRecipe) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase.from('recipes').insert({
      ...generatedRecipe,
      user_id: user.id,
      status: 'to_try',
    }).select().single()

    if (!error && data) {
      router.push(`/recipes/${data.id}`)
    }
    setSaving(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-emerald-600" />
          AI Recipe Generator
        </h1>
        <p className="text-gray-500 text-sm mt-1">Tell Claude what ingredients you have and get a custom recipe</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What do you have?</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <Label htmlFor="ingredients">Available Ingredients *</Label>
                <Textarea
                  id="ingredients"
                  value={ingredients}
                  onChange={e => setIngredients(e.target.value)}
                  placeholder="e.g. chicken breast, garlic, lemon, rosemary, olive oil, potatoes..."
                  rows={4}
                  required
                  className="mt-1"
                />
                <p className="text-xs text-gray-400 mt-1">List ingredients you want to use, separated by commas</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Cuisine Style</Label>
                  <Input value={cuisine} onChange={e => setCuisine(e.target.value)} placeholder="Italian, Asian..." className="mt-1" />
                </div>
                <div>
                  <Label>Servings</Label>
                  <Input type="number" value={servings} onChange={e => setServings(e.target.value)} className="mt-1" min="1" max="20" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Dietary Needs</Label>
                  <Input value={dietary} onChange={e => setDietary(e.target.value)} placeholder="vegan, gluten-free..." className="mt-1" />
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</div>}

              <Button type="submit" disabled={loading} className="w-full gap-2">
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating with Claude AI...</>
                  : <><Sparkles className="h-4 w-4" /> Generate Recipe</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Generated Recipe */}
        {loading && (
          <Card className="flex items-center justify-center h-full min-h-64">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Claude is crafting your recipe...</p>
              <p className="text-gray-400 text-sm mt-1">This takes a few seconds</p>
            </div>
          </Card>
        )}

        {!loading && generatedRecipe && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{generatedRecipe.title}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">{generatedRecipe.description}</p>
                </div>
                <ChefHat className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Meta */}
              <div className="flex flex-wrap gap-2">
                {generatedRecipe.cuisine_type && <Badge>{generatedRecipe.cuisine_type}</Badge>}
                {generatedRecipe.difficulty && <Badge variant="secondary" className="capitalize">{generatedRecipe.difficulty}</Badge>}
                {generatedRecipe.prep_time && <span className="text-xs text-gray-500">Prep: {generatedRecipe.prep_time}min</span>}
                {generatedRecipe.cook_time && <span className="text-xs text-gray-500">Cook: {generatedRecipe.cook_time}min</span>}
                {generatedRecipe.servings && <span className="text-xs text-gray-500">{generatedRecipe.servings} servings</span>}
              </div>

              {/* Ingredients */}
              <div>
                <h4 className="font-medium text-sm mb-2">Ingredients:</h4>
                <ul className="space-y-1">
                  {generatedRecipe.ingredients?.map((ing, i) => (
                    <li key={i} className="text-sm text-gray-600">
                      • <span className="font-medium">{ing.amount} {ing.unit}</span> {ing.name}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions preview */}
              <div>
                <h4 className="font-medium text-sm mb-2">Instructions:</h4>
                <div className="text-sm text-gray-600 max-h-40 overflow-y-auto">
                  {generatedRecipe.instructions?.split('\n').filter(Boolean).map((step, i) => (
                    <p key={i} className="mb-2">{step}</p>
                  ))}
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {saving ? 'Saving...' : 'Save to My Recipes'}
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !generatedRecipe && (
          <div className="flex items-center justify-center h-full min-h-64 rounded-xl border-2 border-dashed border-gray-200">
            <div className="text-center p-8">
              <Sparkles className="h-12 w-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400">Your AI-generated recipe will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
