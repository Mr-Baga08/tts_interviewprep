// frontend/src/app/challenges/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Play, 
  Send, 
  Clock, 
  Memory, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Code,
  FileText,
  Lightbulb
} from 'lucide-react'
import { toast } from 'sonner'

import { CodeEditor } from '@/components/code/code-editor'
import { TestResults } from '@/components/code/test-results'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useChallenge } from '@/hooks/use-challenge'
import { useChallengeSubmission } from '@/hooks/use-challenge-submission'

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

interface ExecutionResponse {
  challenge_id: string
  test_results: TestResult[]
  execution_time: number
  memory_used: number
  overall_status: string
}

const LANGUAGE_OPTIONS = [
  { id: 71, name: 'python', label: 'Python 3.8' },
  { id: 63, name: 'javascript', label: 'JavaScript (Node.js)' },
  { id: 62, name: 'java', label: 'Java 11' },
  { id: 54, name: 'cpp', label: 'C++ (GCC 9.2)' },
  { id: 50, name: 'c', label: 'C (GCC 9.2)' },
  { id: 51, name: 'csharp', label: 'C# (Mono)' },
  { id: 60, name: 'go', label: 'Go 1.13' },
  { id: 73, name: 'rust', label: 'Rust 1.40' },
  { id: 74, name: 'typescript', label: 'TypeScript 3.7' },
]

const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  hard: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  expert: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
}

export default function ChallengePage() {
  const params = useParams()
  const challengeId = params.id as string

  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGE_OPTIONS[0])
  const [code, setCode] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [executionResults, setExecutionResults] = useState<ExecutionResponse | null>(null)

  const { challenge, loading, error } = useChallenge(challengeId)
  const { submitCode, submissionHistory } = useChallengeSubmission(challengeId)

  // Initialize code when challenge loads or language changes
  useEffect(() => {
    if (challenge?.boilerplate_code && selectedLanguage) {
      const boilerplate = challenge.boilerplate_code[selectedLanguage.name]
      if (boilerplate && !code) {
        setCode(boilerplate)
      }
    }
  }, [challenge, selectedLanguage, code])

  const handleLanguageChange = (languageId: string) => {
    const language = LANGUAGE_OPTIONS.find(l => l.id.toString() === languageId)
    if (language) {
      setSelectedLanguage(language)
      // Set boilerplate code for new language
      if (challenge?.boilerplate_code) {
        const boilerplate = challenge.boilerplate_code[language.name]
        setCode(boilerplate || '')
      }
    }
  }

  const runCode = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first')
      return
    }

    setIsRunning(true)
    setTestResults([])
    setExecutionResults(null)

    try {
      const response = await fetch('/api/challenges/execute-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challenge_id: challengeId,
          source_code: code,
          language: selectedLanguage.name,
          language_id: selectedLanguage.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to execute code')
      }

      const result: ExecutionResponse = await response.json()
      setExecutionResults(result)
      setTestResults(result.test_results)

      const passedTests = result.test_results.filter(t => t.passed).length
      const totalTests = result.test_results.length

      if (result.overall_status === 'passed') {
        toast.success(`All test cases passed! (${passedTests}/${totalTests})`)
      } else {
        toast.error(`${passedTests}/${totalTests} test cases passed`)
      }

    } catch (error) {
      console.error('Code execution error:', error)
      toast.error('Failed to execute code. Please try again.')
    } finally {
      setIsRunning(false)
    }
  }

  const submitSolution = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first')
      return
    }

    setIsSubmitting(true)

    try {
      const submission = await submitCode({
        source_code: code,
        language: selectedLanguage.name,
        language_id: selectedLanguage.id
      })

      toast.success('Solution submitted successfully!')
      // You can redirect to submission details or show results
      
    } catch (error) {
      console.error('Submission error:', error)
      toast.error('Failed to submit solution. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !challenge) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Challenge not found'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
        {/* Problem Description */}
        <div className="flex flex-col">
          <Card className="flex-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{challenge.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={DIFFICULTY_COLORS[challenge.difficulty]}>
                    {challenge.difficulty.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">{challenge.points} pts</Badge>
                  {challenge.is_solved && (
                    <Badge className="bg-green-500 text-white">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Solved
                    </Badge>
                  )}
                </div>
              </div>
              <CardDescription>
                {challenge.category} • {challenge.user_attempts || 0} attempts
                {challenge.user_best_score && (
                  <span> • Best Score: {challenge.user_best_score}%</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="problem" className="h-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="problem">Problem</TabsTrigger>
                  <TabsTrigger value="examples">Examples</TabsTrigger>
                  <TabsTrigger value="hints">Hints</TabsTrigger>
                  <TabsTrigger value="submissions">Submissions</TabsTrigger>
                </TabsList>

                <TabsContent value="problem" className="mt-4">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">Problem Statement</h3>
                        <div 
                          className="prose prose-sm dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: challenge.problem_statement }}
                        />
                      </div>

                      {challenge.input_format && (
                        <div>
                          <h3 className="font-semibold mb-2">Input Format</h3>
                          <p className="text-sm text-muted-foreground">
                            {challenge.input_format}
                          </p>
                        </div>
                      )}

                      {challenge.output_format && (
                        <div>
                          <h3 className="font-semibold mb-2">Output Format</h3>
                          <p className="text-sm text-muted-foreground">
                            {challenge.output_format}
                          </p>
                        </div>
                      )}

                      {challenge.constraints && (
                        <div>
                          <h3 className="font-semibold mb-2">Constraints</h3>
                          <p className="text-sm text-muted-foreground">
                            {challenge.constraints}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {challenge.time_limit && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Time Limit: {challenge.time_limit}s
                          </div>
                        )}
                        {challenge.memory_limit && (
                          <div className="flex items-center gap-1">
                            <Memory className="w-4 h-4" />
                            Memory Limit: {Math.round(challenge.memory_limit / 1024)}MB
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="examples" className="mt-4">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {challenge.example_test_cases.map((testCase, index) => (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle className="text-sm">Example {index + 1}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div>
                              <h4 className="font-medium text-sm">Input:</h4>
                              <pre className="bg-muted p-2 rounded text-sm">
                                {testCase.input}
                              </pre>
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">Output:</h4>
                              <pre className="bg-muted p-2 rounded text-sm">
                                {testCase.expected_output}
                              </pre>
                            </div>
                            {testCase.explanation && (
                              <div>
                                <h4 className="font-medium text-sm">Explanation:</h4>
                                <p className="text-sm text-muted-foreground">
                                  {testCase.explanation}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="hints" className="mt-4">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {challenge.hints.length > 0 ? (
                        challenge.hints.map((hint, index) => (
                          <Alert key={index}>
                            <Lightbulb className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Hint {index + 1}:</strong> {hint}
                            </AlertDescription>
                          </Alert>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          No hints available for this challenge.
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="submissions" className="mt-4">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {submissionHistory.length > 0 ? (
                        submissionHistory.map((submission, index) => (
                          <Card key={submission.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {submission.status === 'accepted' ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  )}
                                  <span className="font-medium">
                                    {submission.language.toUpperCase()}
                                  </span>
                                  <Badge variant="outline">
                                    {submission.score}%
                                  </Badge>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(submission.submitted_at).toLocaleString()}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          No submissions yet.
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Code Editor and Results */}
        <div className="flex flex-col">
          <Card className="flex-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Solution</CardTitle>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedLanguage.id.toString()}
                    onValueChange={handleLanguageChange}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <SelectItem key={lang.id} value={lang.id.toString()}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="h-[400px] mb-4">
                <CodeEditor
                  language={selectedLanguage.name}
                  value={code}
                  onChange={setCode}
                  theme="vs-dark"
                />
              </div>

              <div className="flex gap-2 mb-4">
                <Button
                  onClick={runCode}
                  disabled={isRunning || !code.trim()}
                  className="flex-1"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isRunning ? 'Running...' : 'Run Code'}
                </Button>
                <Button
                  onClick={submitSolution}
                  disabled={isSubmitting || !code.trim()}
                  variant="default"
                  className="flex-1"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              </div>

              {/* Test Results */}
              {testResults.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Test Results</h3>
                  <TestResults results={testResults} />
                </div>
              )}

              {/* Execution Summary */}
              {executionResults && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      Status: {' '}
                      <span className={
                        executionResults.overall_status === 'passed' 
                          ? 'text-green-600 font-medium' 
                          : 'text-red-600 font-medium'
                      }>
                        {executionResults.overall_status.toUpperCase()}
                      </span>
                    </span>
                    <div className="flex gap-4">
                      <span>Time: {executionResults.execution_time.toFixed(2)}s</span>
                      <span>Memory: {Math.round(executionResults.memory_used / 1024)}MB</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}