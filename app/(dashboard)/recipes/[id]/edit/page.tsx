import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import RecipeForm from '@/components/recipes/RecipeForm'

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: recipe } = await supabase.from('recipes').select('*').eq('id', id).eq('user_id', user.id).single()
  if (!recipe) notFound()

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Recipe</h1>
        <p className="text-gray-500 text-sm">Update your recipe details</p>
      </div>
      <RecipeForm recipe={recipe} userId={user.id} />
    </div>
  )
}
