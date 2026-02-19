'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clock, Users, ChefHat, ArrowLeft, Edit, Share2, Sparkles, Loader2, Heart, Star, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import type { Recipe } from '@/types'

const statusConfig = {
  favorite: { label: 'Favorite', icon: Heart, variant: 'favorite' as const },
  to_try: { label: 'To Try', icon: BookOpen, variant: 'to_try' as const },
  made_before: { label: 'Made Before', icon: Star, variant: 'made_before' as const },
}

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [substituting, setSubstituting] = useState<string | null>(null)
  const [substitutions, setSubstitutions] = useState<Record<string, string>>({})
  const [shareEmail, setShareEmail] = useState('')
  const [shareLoading, setShareLoading] = useState(false)
  const [shareMsg, setShareMsg] = useState('')

  useEffect(() => {
    const fetchRecipe = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('recipes').select('*').eq('id', id).single()
      setRecipe(data)
      setLoading(false)
    }
    fetchRecipe()
  }, [id])

  const getSubstitution = async (ingredientName: string) => {
    setSubstituting(ingredientName)
    try {
      const res = await fetch('/api/ai/substitutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredient: ingredientName, recipe: recipe?.title }),
      })
      const data = await res.json()
      setSubstitutions(prev => ({ ...prev, [ingredientName]: data.substitution }))
    } catch {
      setSubstitutions(prev => ({ ...prev, [ingredientName]: 'Could not get suggestion.' }))
    } finally {
      setSubstituting(null)
    }
  }

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault()
    setShareLoading(true)
    setShareMsg('')
    try {
      const res = await fetch('/api/recipes/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId: id, shareEmail }),
      })
      const data = await res.json()
      setShareMsg(data.message || data.error)
      setShareEmail('')
    } catch {
      setShareMsg('Failed to share recipe')
    } finally {
      setShareLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
  if (!recipe) return <div className="text-center py-20 text-gray-500">Recipe not found</div>

  const status = statusConfig[recipe.status]
  const StatusIcon = status.icon
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{recipe.title}</h1>
              <Badge variant={status.variant} className="flex items-center gap-1">
                <StatusIcon className="h-3 w-3" />{status.label}
              </Badge>
            </div>
            {recipe.description && <p className="text-gray-600 text-lg">{recipe.description}</p>}
          </div>
          <Link href={`/recipes/${id}/edit`}>
            <Button variant="outline" size="sm" className="gap-1"><Edit className="h-4 w-4" /> Edit</Button>
          </Link>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
          {totalTime > 0 && (
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4 text-emerald-600" />
              <span className="text-sm"><strong>{totalTime} min</strong> total</span>
            </div>
          )}
          {recipe.servings && (
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-4 w-4 text-emerald-600" />
              <span className="text-sm"><strong>{recipe.servings}</strong> servings</span>
            </div>
          )}
          {recipe.difficulty && (
            <div className="flex items-center gap-2 text-gray-600">
              <ChefHat className="h-4 w-4 text-emerald-600" />
              <span className="text-sm capitalize"><strong>{recipe.difficulty}</strong></span>
            </div>
          )}
          {recipe.cuisine_type && (
            <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
              {recipe.cuisine_type}
            </span>
          )}
        </div>

        {recipe.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {recipe.tags.map(tag => (
              <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingredients */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" /> Ingredients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recipe.ingredients?.map((ing, i) => (
                  <li key={i} className="group">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        <span className="font-medium text-emerald-700">{ing.amount} {ing.unit}</span>{' '}
                        {ing.name}
                      </span>
                      <button
                        onClick={() => getSubstitution(ing.name)}
                        disabled={substituting === ing.name}
                        className="opacity-0 group-hover:opacity-100 text-xs text-emerald-600 hover:underline flex-shrink-0 ml-2"
                        title="Get AI substitution"
                      >
                        {substituting === ing.name ? <Loader2 className="h-3 w-3 animate-spin" /> : 'sub?'}
                      </button>
                    </div>
                    {substitutions[ing.name] && (
                      <div className="mt-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                        {substitutions[ing.name]}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-400 mt-3">Hover an ingredient to get AI substitutions</p>
            </CardContent>
          </Card>

          {/* Nutrition */}
          {recipe.nutritional_info && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Nutrition (per serving)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(recipe.nutritional_info).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-500 capitalize">{key}</span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Instructions */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                {recipe.instructions.split('\n').filter(Boolean).map((step, i) => (
                  <div key={i} className="flex gap-3 mb-4">
                    <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <p className="text-gray-700 text-sm leading-relaxed">{step.replace(/^Step \d+:\s*/i, '')}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Share */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Share2 className="h-4 w-4" /> Share Recipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleShare} className="flex gap-2">
            <input
              type="email"
              value={shareEmail}
              onChange={e => setShareEmail(e.target.value)}
              placeholder="Enter email to share with..."
              required
              className="flex-1 h-9 rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <Button type="submit" size="sm" disabled={shareLoading}>
              {shareLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Share'}
            </Button>
          </form>
          {shareMsg && <p className="text-sm mt-2 text-emerald-600">{shareMsg}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
