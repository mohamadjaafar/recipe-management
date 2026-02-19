'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { Recipe, Ingredient } from '@/types'

interface RecipeFormProps {
  recipe?: Recipe
  userId: string
}

export default function RecipeForm({ recipe, userId }: RecipeFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState(recipe?.title || '')
  const [description, setDescription] = useState(recipe?.description || '')
  const [instructions, setInstructions] = useState(recipe?.instructions || '')
  const [cuisineType, setCuisineType] = useState(recipe?.cuisine_type || '')
  const [prepTime, setPrepTime] = useState(recipe?.prep_time?.toString() || '')
  const [cookTime, setCookTime] = useState(recipe?.cook_time?.toString() || '')
  const [servings, setServings] = useState(recipe?.servings?.toString() || '')
  const [difficulty, setDifficulty] = useState<string>(recipe?.difficulty || '')
  const [status, setStatus] = useState<'favorite' | 'to_try' | 'made_before'>(recipe?.status || 'to_try')
  const [isPublic, setIsPublic] = useState(recipe?.is_public || false)
  const [tags, setTags] = useState(recipe?.tags?.join(', ') || '')
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipe?.ingredients?.length ? recipe.ingredients : [{ name: '', amount: '', unit: '' }]
  )

  const addIngredient = () => setIngredients([...ingredients, { name: '', amount: '', unit: '' }])
  const removeIngredient = (i: number) => setIngredients(ingredients.filter((_, idx) => idx !== i))
  const updateIngredient = (i: number, field: keyof Ingredient, value: string) => {
    setIngredients(ingredients.map((ing, idx) => idx === i ? { ...ing, [field]: value } : ing))
  }

  const generateNutrition = async () => {
    if (!ingredients.some(i => i.name)) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, servings: parseInt(servings) || 1 }),
      })
      const data = await res.json()
      return data.nutrition
    } catch {
      return null
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const nutrition = await generateNutrition()

    const supabase = createClient()
    const payload = {
      title,
      description: description || null,
      instructions,
      ingredients: ingredients.filter(i => i.name),
      cuisine_type: cuisineType || null,
      prep_time: prepTime ? parseInt(prepTime) : null,
      cook_time: cookTime ? parseInt(cookTime) : null,
      servings: servings ? parseInt(servings) : null,
      difficulty: difficulty || null,
      status,
      is_public: isPublic,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      nutritional_info: nutrition,
      updated_at: new Date().toISOString(),
    }

    if (recipe) {
      const { error } = await supabase.from('recipes').update(payload).eq('id', recipe.id)
      if (error) { setError(error.message); setLoading(false); return }
    } else {
      const { error } = await supabase.from('recipes').insert({ ...payload, user_id: userId })
      if (error) { setError(error.message); setLoading(false); return }
    }

    router.push('/recipes')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Basic Info */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Basic Information</h2>
        <div>
          <Label htmlFor="title">Recipe Title *</Label>
          <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1" placeholder="e.g. Classic Spaghetti Carbonara" />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className="mt-1" rows={2} placeholder="Brief description of the recipe" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <Label>Prep Time (min)</Label>
            <Input type="number" value={prepTime} onChange={e => setPrepTime(e.target.value)} className="mt-1" placeholder="15" />
          </div>
          <div>
            <Label>Cook Time (min)</Label>
            <Input type="number" value={cookTime} onChange={e => setCookTime(e.target.value)} className="mt-1" placeholder="30" />
          </div>
          <div>
            <Label>Servings</Label>
            <Input type="number" value={servings} onChange={e => setServings(e.target.value)} className="mt-1" placeholder="4" />
          </div>
          <div>
            <Label>Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Cuisine Type</Label>
            <Input value={cuisineType} onChange={e => setCuisineType(e.target.value)} className="mt-1" placeholder="e.g. Italian, Mexican" />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as 'favorite' | 'to_try' | 'made_before')}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="to_try">To Try</SelectItem>
                <SelectItem value="favorite">Favorite</SelectItem>
                <SelectItem value="made_before">Made Before</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Tags (comma-separated)</Label>
          <Input value={tags} onChange={e => setTags(e.target.value)} className="mt-1" placeholder="e.g. pasta, quick, vegetarian" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="isPublic" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="rounded" />
          <Label htmlFor="isPublic" className="cursor-pointer">Make this recipe public (visible to all users)</Label>
        </div>
      </div>

      {/* Ingredients */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Ingredients</h2>
          {aiLoading && <span className="flex items-center gap-1 text-sm text-emerald-600"><Loader2 className="h-3 w-3 animate-spin" /> Analyzing nutrition...</span>}
        </div>
        {ingredients.map((ing, i) => (
          <div key={i} className="flex gap-2 items-start">
            <Input placeholder="Amount" value={ing.amount} onChange={e => updateIngredient(i, 'amount', e.target.value)} className="w-20 flex-shrink-0" />
            <Input placeholder="Unit" value={ing.unit} onChange={e => updateIngredient(i, 'unit', e.target.value)} className="w-24 flex-shrink-0" />
            <Input placeholder="Ingredient name" value={ing.name} onChange={e => updateIngredient(i, 'name', e.target.value)} className="flex-1" />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeIngredient(i)} disabled={ingredients.length === 1}>
              <Trash2 className="h-4 w-4 text-red-400" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addIngredient} className="gap-1">
          <Plus className="h-4 w-4" /> Add Ingredient
        </Button>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Instructions</h2>
        <Textarea
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
          required
          rows={8}
          placeholder="Step 1: ...&#10;Step 2: ...&#10;Step 3: ..."
        />
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading} className="gap-2">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Sparkles className="h-4 w-4" /> {recipe ? 'Update Recipe' : 'Save Recipe'}</>}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
