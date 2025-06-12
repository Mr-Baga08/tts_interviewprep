// frontend/src/hooks/use-challenges-list.ts
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface ChallengeFilters {
  difficulty?: string
  category?: string
  search?: string
  solved?: boolean
  skip?: number
  limit?: number
}

interface ChallengeListItem {
  id: string
  title: string
  difficulty: string
  category: string
  points: number
  is_solved?: boolean
  user_best_score?: number
  user_attempts?: number
}

interface ChallengesList {
  challenges: ChallengeListItem[]
  total: number
  skip: number
  limit: number
}

export function useChallengesList(filters: ChallengeFilters = {}) {
  const { data: session } = useSession()
  const [data, setData] = useState<ChallengesList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.accessToken) return

    const fetchChallenges = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, value.toString())
          }
        })

        const response = await fetch(`/api/challenges?${params}`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch challenges')
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        console.error('Error fetching challenges:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchChallenges()
  }, [session, JSON.stringify(filters)])

  return { data, loading, error }
}