// frontend/src/hooks/use-quiz.ts
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Quiz {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  time_limit_minutes?: number
  total_questions: number
  passing_score: number
  max_attempts?: number
  questions: Question[]
}

interface Question {
  id: string
  question_text: string
  question_type: 'multiple_choice' | 'multiple_select' | 'true_false' | 'short_answer' | 'essay'
  points: number
  options?: QuestionOption[]
  explanation?: string
}

interface QuestionOption {
  text: string
  is_correct?: boolean
}

export function useQuiz(quizId: string) {
  const { data: session } = useSession()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!quizId || !session?.accessToken) return

    const fetchQuiz = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/quizzes/${quizId}`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch quiz')
        }

        const data = await response.json()
        setQuiz(data)
      } catch (err) {
        console.error('Error fetching quiz:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchQuiz()
  }, [quizId, session])

  return { quiz, loading, error }
}