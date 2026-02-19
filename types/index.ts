export interface Recipe {
  id: string
  user_id: string
  title: string
  description: string | null
  ingredients: Ingredient[]
  instructions: string
  cuisine_type: string | null
  prep_time: number | null
  cook_time: number | null
  servings: number | null
  difficulty: 'easy' | 'medium' | 'hard' | null
  status: 'favorite' | 'to_try' | 'made_before'
  tags: string[]
  image_url: string | null
  is_public: boolean
  nutritional_info: NutritionalInfo | null
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface Ingredient {
  name: string
  amount: string
  unit: string
}

export interface NutritionalInfo {
  calories: number
  protein: string
  carbs: string
  fat: string
  fiber: string
}

export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export interface RecipeShare {
  id: string
  recipe_id: string
  shared_by: string
  shared_with: string
  created_at: string
  recipes?: Recipe
  profiles?: Profile
}

export interface MealPlan {
  id: string
  user_id: string
  name: string
  week_start: string
  meals: MealPlanMeals
  created_at: string
}

export interface MealPlanMeals {
  [day: string]: {
    breakfast?: string
    lunch?: string
    dinner?: string
    snack?: string
  }
}
