// frontend/src/hooks/use-quizzes-list.ts
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface QuizFilters {
  difficulty?: string
  category?: string
  search?: string
  available_only?: boolean
  skip?: number
  limit?: number
}

interface QuizListItem {
  id: string
  title: string
  description: string
  difficulty: string
  category: string
  total_questions: number
  time_limit_minutes?: number
  passing_score: number
  user_attempts?: number
  user_best_score?: number
}

interface QuizzesList {
  quizzes: QuizListItem[]
  total: number
  skip: number
  limit: number
}

export function useQuizzesList(filters: QuizFilters = {}) {
  const { data: session } = useSession()
  const [data, setData] = useState<QuizzesList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.accessToken) return

    const fetchQuizzes = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, value.toString())
          }
        })

        const response = await fetch(`/api/quizzes?${params}`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch quizzes')
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        console.error('Error fetching quizzes:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchQuizzes()
  }, [session, JSON.stringify(filters)])

  return { data, loading, error }
}