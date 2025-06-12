import { useState } from 'react'
import { useSession } from 'next-auth/react'

interface CodeExecutionRequest {
  challenge_id: string
  source_code: string
  language: string
  language_id: number
}

interface CodeExecutionResponse {
  challenge_id: string
  test_results: TestResult[]
  execution_time: number
  memory_used: number
  overall_status: string
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

export function useCodeExecution() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<CodeExecutionResponse | null>(null)

  const executeCode = async (request: CodeExecutionRequest): Promise<CodeExecutionResponse> => {
    setLoading(true)

    try {
      const response = await fetch('/api/challenges/execute-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error('Failed to execute code')
      }

      const result = await response.json()
      setResults(result)
      return result
    } catch (error) {
      console.error('Error executing code:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => {
    setResults(null)
  }

  return {
    loading,
    results,
    executeCode,
    clearResults
  }
}