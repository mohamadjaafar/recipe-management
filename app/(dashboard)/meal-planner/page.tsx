'use client'

import { useState, useEffect } from 'react'
import { CalendarDays, Sparkles, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import type { Recipe } from '@/types'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEALS = ['breakfast', 'lunch', 'dinner']

export default function MealPlannerPage() {
  const [recipes, setRecipes] = useState<Pick<Recipe, 'id' | 'title' | 'cuisine_type' | 'difficulty'>[]>([])
  const [preferences, setPreferences] = useState('')
  const [days, setDays] = useState('7')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mealPlan, setMealPlan] = useState<Record<string, Record<string, string>> | null>(null)
  const [planName, setPlanName] = useState('')
  const [savedMsg, setSavedMsg] = useState('')

  useEffect(() => {
    const fetchRecipes = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('recipes').select('id, title, cuisine_type, difficulty').eq('user_id', user.id)
      setRecipes(data || [])
    }
    fetchRecipes()
  }, [])

  const handleGenerate = async () => {
    if (!recipes.length) return
    setLoading(true)
    setMealPlan(null)
    try {
      const res = await fetch('/api/ai/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipes, preferences, days: parseInt(days) }),
      })
      const data = await res.json()
      if (data.plan) setMealPlan(data.plan)
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!mealPlan || !planName) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)

    await supabase.from('meal_plans').insert({
      user_id: user.id,
      name: planName,
      week_start: weekStart.toISOString().split('T')[0],
      meals: mealPlan,
    })

    setSavedMsg('Meal plan saved!')
    setSaving(false)
    setTimeout(() => setSavedMsg(''), 3000)
  }

  const displayDays = DAYS.slice(0, parseInt(days))

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-emerald-600" />
          AI Meal Planner
        </h1>
        <p className="text-gray-500 text-sm mt-1">Let Claude plan your meals using your saved recipes</p>
      </div>

      {recipes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">You need at least a few recipes saved before generating a meal plan.</p>
            <Button className="mt-4" onClick={() => window.location.href = '/recipes/new'}>Add Recipes First</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Controls */}
          <Card>
            <CardHeader><CardTitle className="text-base">Plan Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Duration</Label>
                  <Select value={days} onValueChange={setDays}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Days</SelectItem>
                      <SelectItem value="5">5 Days</SelectItem>
                      <SelectItem value="7">7 Days (Full Week)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label>Preferences / Restrictions</Label>
                  <Input
                    value={preferences}
                    onChange={e => setPreferences(e.target.value)}
                    placeholder="e.g. no repeat dinners, light breakfasts, vegetarian weekdays..."
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{recipes.length} recipes available</span>
              </div>
              <Button onClick={handleGenerate} disabled={loading} className="gap-2">
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating plan...</>
                  : <><Sparkles className="h-4 w-4" /> Generate Meal Plan</>}
              </Button>
            </CardContent>
          </Card>

          {/* Meal Plan Grid */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mx-auto mb-3" />
                <p className="text-gray-600">Claude is planning your meals...</p>
              </div>
            </div>
          )}

          {!loading && mealPlan && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 pr-4 font-semibold text-gray-700 w-24">Day</th>
                      {MEALS.map(meal => (
                        <th key={meal} className="text-left py-3 px-2 font-semibold text-gray-700 capitalize">{meal}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayDays.map(day => (
                      <tr key={day} className="border-b hover:bg-gray-50">
                        <td className="py-3 pr-4 font-medium text-gray-900">{day}</td>
                        {MEALS.map(meal => (
                          <td key={meal} className="py-3 px-2">
                            <div className="bg-emerald-50 text-emerald-800 rounded-lg px-3 py-2 text-xs leading-relaxed min-h-10 flex items-center">
                              {mealPlan[day]?.[meal] || '-'}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Save */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Label>Plan Name</Label>
                      <Input
                        value={planName}
                        onChange={e => setPlanName(e.target.value)}
                        placeholder="e.g. Week of Feb 24"
                        className="mt-1"
                      />
                    </div>
                    <Button onClick={handleSave} disabled={saving || !planName} className="gap-2">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Plan
                    </Button>
                  </div>
                  {savedMsg && <p className="text-emerald-600 text-sm mt-2">{savedMsg}</p>}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}
