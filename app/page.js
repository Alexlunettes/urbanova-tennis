import { supabase } from '@/lib/supabase'

export default async function Home() {
  const { data: teams, error } = await supabase
    .from('teams')
    .select('*')

  return (
    <main className="min-h-screen flex items-center justify-center bg-green-100">
      <div className="text-center">
        <h1 className="text-5xl font-black text-gray-900 mb-4">
          Torneo Urbanova 2026
        </h1>
        <p className="text-gray-600 text-lg mb-4">Alicante · 6–9 de agosto</p>
        {error
          ? <p className="text-red-600 text-sm">DB error: {error.message}</p>
          : <p className="text-gray-500 text-sm">Teams in database: {teams.length}</p>
        }
      </div>
    </main>
  )
}