'use client'

import { useState, useEffect } from 'react'
import { User, BookOpen, Heart, Star, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Recipe } from '@/types'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState({ total: 0, favorites: 0, madeBefore: 0, toTry: 0 })
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (prof) {
        setProfile(prof)
        setFullName(prof.full_name || '')
        setUsername(prof.username || '')
        setBio(prof.bio || '')
      }

      const { data: recipes } = await supabase.from('recipes').select('status').eq('user_id', user.id)
      if (recipes) {
        setStats({
          total: recipes.length,
          favorites: recipes.filter((r: { status: string }) => r.status === 'favorite').length,
          madeBefore: recipes.filter((r: { status: string }) => r.status === 'made_before').length,
          toTry: recipes.filter((r: { status: string }) => r.status === 'to_try').length,
        })
      }
      setLoading(false)
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMsg('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName,
      username,
      bio,
      updated_at: new Date().toISOString(),
    })

    if (!error) {
      setMsg('Profile updated successfully!')
    } else {
      setMsg('Error: ' + error.message)
    }
    setSaving(false)
    setTimeout(() => setMsg(''), 3000)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <User className="h-6 w-6 text-emerald-600" />
          My Profile
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Recipes', value: stats.total, icon: BookOpen, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Favorites', value: stats.favorites, icon: Heart, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Made Before', value: stats.madeBefore, icon: Star, color: 'text-green-600 bg-green-50' },
          { label: 'To Try', value: stats.toTry, icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className={`inline-flex p-2 rounded-lg ${color} mb-2`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1" placeholder="Your full name" />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username} onChange={e => setUsername(e.target.value)} className="mt-1" placeholder="@username" />
            </div>
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} className="mt-1" rows={3} placeholder="Tell others about your cooking style..." />
          </div>

          {msg && (
            <div className={`text-sm px-3 py-2 rounded ${msg.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {msg}
            </div>
          )}

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
