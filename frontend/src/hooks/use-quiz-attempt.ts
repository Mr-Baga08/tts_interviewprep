// frontend/src/hooks/use-quiz-attempt.ts
import { useState } from 'react'
import { useSession } from 'next-auth/react'

interface QuizAttempt {
  id: string
  quiz_id: string
  started_at: string
  submitted_at?: string
  score?: number
  time_remaining?: number
  answers: Answer[]
}

interface Answer {
  question_id: string
  answer_text?: string
  selected_options?: string[]
}

interface SubmissionRequest {
  attempt_id: string
  answers: Answer[]
}

interface QuizResult {
  attempt_id: string
  quiz_id: string
  score: number
  total_questions: number
  correct_answers: number
  time_taken: number
  passed: boolean
  question_results: QuestionResult[]
  feedback?: string
}

interface QuestionResult {
  question_id: string
  question_text: string
  question_type: string
  points: number
  correct: boolean
  user_answer: any
  correct_answer: any
  explanation?: string
  points_earned: number
}

export function useQuizAttempt(quizId: string) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)

  const startAttempt = async (): Promise<QuizAttempt> => {
    setLoading(true)

    try {
      const response = await fetch(`/api/quizzes/${quizId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to start quiz attempt')
      }

      return response.json()
    } catch (error) {
      console.error('Error starting quiz attempt:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const submitQuiz = async (submission: SubmissionRequest): Promise<QuizResult> => {
    setLoading(true)

    try {
      const response = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(submission)
      })

      if (!response.ok) {
        throw new Error('Failed to submit quiz')
      }

      return response.json()
    } catch (error) {
      console.error('Error submitting quiz:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getAttempt = async (attemptId: string): Promise<QuizAttempt> => {
    const response = await fetch(`/api/quizzes/attempts/${attemptId}`, {
      headers: {
        'Authorization': `Bearer ${session?.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch quiz attempt')
    }

    return response.json()
  }

  return {
    loading,
    startAttempt,
    submitQuiz,
    getAttempt
  }
}