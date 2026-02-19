'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Share2, Globe, Lock, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { Recipe } from '@/types'

export default function SharedPage() {
  const [sharedWithMe, setSharedWithMe] = useState<Recipe[]>([])
  const [publicRecipes, setPublicRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'shared' | 'public'>('public')

  useEffect(() => {
    const fetchShared = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Shared with me
      const { data: shares } = await supabase
        .from('recipe_shares')
        .select('recipe_id, recipes(*)')
        .eq('shared_with', user.id)
      setSharedWithMe((shares || []).map((s: { recipes: unknown }) => s.recipes as Recipe).filter(Boolean))

      // Public recipes (not mine)
      const { data: pub } = await supabase
        .from('recipes')
        .select('*, profiles(username, full_name)')
        .eq('is_public', true)
        .neq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      setPublicRecipes(pub || [])
      setLoading(false)
    }
    fetchShared()
  }, [])

  const recipes = activeTab === 'shared' ? sharedWithMe : publicRecipes

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Share2 className="h-6 w-6 text-emerald-600" />
          Community Recipes
        </h1>
        <p className="text-gray-500 text-sm mt-1">Discover and explore recipes from the community</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('public')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'public' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Globe className="h-4 w-4" /> Public Recipes ({publicRecipes.length})
        </button>
        <button
          onClick={() => setActiveTab('shared')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'shared' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Lock className="h-4 w-4" /> Shared With Me ({sharedWithMe.length})
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Share2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{activeTab === 'public' ? 'No public recipes yet. Be the first to share!' : 'No recipes have been shared with you yet.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map(recipe => (
            <Card key={recipe.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base line-clamp-2">{recipe.title}</CardTitle>
                {recipe.profiles && (
                  <p className="text-xs text-gray-400">by @{(recipe.profiles as { username?: string }).username || 'anonymous'}</p>
                )}
              </CardHeader>
              <CardContent>
                {recipe.description && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{recipe.description}</p>}
                <div className="flex flex-wrap gap-2 mb-3">
                  {recipe.cuisine_type && <Badge variant="default">{recipe.cuisine_type}</Badge>}
                  {recipe.difficulty && <Badge variant="secondary" className="capitalize">{recipe.difficulty}</Badge>}
                  {(recipe.prep_time || recipe.cook_time) && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {(recipe.prep_time || 0) + (recipe.cook_time || 0)}min
                    </span>
                  )}
                </div>
                <Link href={`/recipes/${recipe.id}`}>
                  <Button variant="outline" size="sm" className="w-full">View Recipe</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
