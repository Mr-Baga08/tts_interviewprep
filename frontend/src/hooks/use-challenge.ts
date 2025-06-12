// frontend/src/hooks/use-challenge.ts
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Challenge {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  category: string
  points: number
  problem_statement: string
  input_format?: string
  output_format?: string
  constraints?: string
  example_test_cases: TestCase[]
  boilerplate_code: Record<string, string>
  hints: string[]
  time_limit?: number
  memory_limit?: number
  is_solved?: boolean
  user_best_score?: number
  user_attempts?: number
}

interface TestCase {
  input: string
  expected_output: string
  explanation?: string
}

export function useChallenge(challengeId: string) {
  const { data: session } = useSession()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!challengeId || !session?.accessToken) return

    const fetchChallenge = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/challenges/${challengeId}`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch challenge')
        }

        const data = await response.json()
        setChallenge(data)
      } catch (err) {
        console.error('Error fetching challenge:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchChallenge()
  }, [challengeId, session])

  return { challenge, loading, error, refetch: () => {} }
}

// frontend/src/hooks/use-challenge-submission.ts
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Submission {
  id: string
  challenge_id: string
  source_code: string
  language: string
  language_id: number
  status: string
  score?: number
  submitted_at: string
  test_results?: TestResult[]
}

interface TestResult {
  test_case_index: number
  input: string
  expected_output: string
  actual_output: string
  status: string
  error_message?: string
  time: number
  memory: number
  passed: boolean
}

interface SubmissionRequest {
  source_code: string
  language: string
  language_id: number
}

export function useChallengeSubmission(challengeId: string) {
  const { data: session } = useSession()
  const [submissionHistory, setSubmissionHistory] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!challengeId || !session?.accessToken) return

    fetchSubmissionHistory()
  }, [challengeId, session])

  const fetchSubmissionHistory = async () => {
    try {
      const response = await fetch(`/api/challenges/users/${session?.user?.id}/submissions?challenge_id=${challengeId}`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSubmissionHistory(data)
      }
    } catch (error) {
      console.error('Error fetching submission history:', error)
    }
  }

  const submitCode = async (request: SubmissionRequest): Promise<Submission> => {
    setLoading(true)

    try {
      const response = await fetch('/api/challenges/submit-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          challenge_id: challengeId,
          ...request
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit code')
      }

      const submission = await response.json()
      
      // Refresh submission history
      await fetchSubmissionHistory()
      
      return submission
    } catch (error) {
      console.error('Error submitting code:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getSubmission = async (submissionId: string): Promise<Submission> => {
    const response = await fetch(`/api/challenges/submissions/${submissionId}`, {
      headers: {
        'Authorization': `Bearer ${session?.accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch submission')
    }

    return response.json()
  }

  return {
    submissionHistory,
    loading,
    submitCode,
    getSubmission,
    refetchHistory: fetchSubmissionHistory
  }
}

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