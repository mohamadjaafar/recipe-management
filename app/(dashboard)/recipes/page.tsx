'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, Clock, ChefHat, Heart, BookOpen, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { Recipe } from '@/types'

const statusConfig = {
  favorite: { label: 'Favorite', variant: 'favorite' as const, icon: Heart },
  to_try: { label: 'To Try', variant: 'to_try' as const, icon: BookOpen },
  made_before: { label: 'Made Before', variant: 'made_before' as const, icon: Star },
}

const difficultyColors = {
  easy: 'text-green-600 bg-green-50',
  medium: 'text-yellow-600 bg-yellow-50',
  hard: 'text-red-600 bg-red-50',
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [cuisineFilter, setCuisineFilter] = useState('all')
  const [cuisines, setCuisines] = useState<string[]>([])

  const fetchRecipes = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let query = supabase
      .from('recipes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    if (cuisineFilter !== 'all') query = query.eq('cuisine_type', cuisineFilter)
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,cuisine_type.ilike.%${search}%`)
    }

    const { data } = await query
    setRecipes(data || [])
    setLoading(false)

    // Extract unique cuisines
    const { data: allRecipes } = await supabase
      .from('recipes')
      .select('cuisine_type')
      .eq('user_id', user.id)
      .not('cuisine_type', 'is', null)
    const uniqueCuisines = [...new Set((allRecipes || []).map((r: { cuisine_type: string }) => r.cuisine_type).filter(Boolean))]
    setCuisines(uniqueCuisines)
  }, [search, statusFilter, cuisineFilter])

  useEffect(() => {
    fetchRecipes()
  }, [fetchRecipes])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recipe?')) return
    const supabase = createClient()
    await supabase.from('recipes').delete().eq('id', id)
    setRecipes(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Recipes</h1>
          <p className="text-gray-500 text-sm">{recipes.length} recipe{recipes.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/recipes/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Recipe
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search recipes, ingredients, cuisine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <Filter className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="favorite">Favorite</SelectItem>
              <SelectItem value="to_try">To Try</SelectItem>
              <SelectItem value="made_before">Made Before</SelectItem>
            </SelectContent>
          </Select>
          {cuisines.length > 0 && (
            <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Cuisine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cuisine</SelectItem>
                {cuisines.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Recipe Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-56 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-20">
          <ChefHat className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600">No recipes yet</h3>
          <p className="text-gray-400 text-sm mt-1">Add your first recipe or use the AI generator</p>
          <div className="flex gap-3 justify-center mt-6">
            <Link href="/recipes/new">
              <Button>Add Recipe</Button>
            </Link>
            <Link href="/ai-generator">
              <Button variant="outline">AI Generator</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe) => {
            const status = statusConfig[recipe.status]
            const StatusIcon = status.icon
            return (
              <Card key={recipe.id} className="hover:shadow-md transition-shadow group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight line-clamp-2">
                      {recipe.title}
                    </CardTitle>
                    <Badge variant={status.variant} className="flex-shrink-0 flex items-center gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>
                  {recipe.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{recipe.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {recipe.cuisine_type && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {recipe.cuisine_type}
                      </span>
                    )}
                    {recipe.difficulty && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColors[recipe.difficulty]}`}>
                        {recipe.difficulty}
                      </span>
                    )}
                    {(recipe.prep_time || recipe.cook_time) && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {(recipe.prep_time || 0) + (recipe.cook_time || 0)} min
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/recipes/${recipe.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">View</Button>
                    </Link>
                    <Link href={`/recipes/${recipe.id}/edit`} className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full">Edit</Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(recipe.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      Del
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
