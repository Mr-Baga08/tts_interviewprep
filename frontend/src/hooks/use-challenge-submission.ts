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