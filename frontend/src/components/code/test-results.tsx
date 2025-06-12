// frontend/src/components/code/test-results.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Memory, 
  ChevronDown, 
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react'

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

interface TestResultsProps {
  results: TestResult[]
  showDetails?: boolean
}

const STATUS_ICONS = {
  accepted: CheckCircle,
  wrong_answer: XCircle,
  time_limit_exceeded: Clock,
  memory_limit_exceeded: Memory,
  runtime_error: AlertCircle,
  compilation_error: AlertCircle,
  error: AlertCircle
}

const STATUS_COLORS = {
  accepted: 'text-green-500',
  wrong_answer: 'text-red-500',
  time_limit_exceeded: 'text-yellow-500',
  memory_limit_exceeded: 'text-orange-500',
  runtime_error: 'text-red-500',
  compilation_error: 'text-red-500',
  error: 'text-red-500'
}

const STATUS_BACKGROUNDS = {
  accepted: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
  wrong_answer: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
  time_limit_exceeded: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
  memory_limit_exceeded: 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800',
  runtime_error: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
  compilation_error: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
  error: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
}

export function TestResults({ results, showDetails = true }: TestResultsProps) {
  const [expandedTests, setExpandedTests] = useState<Set<number>>(new Set())
  const [showInputOutput, setShowInputOutput] = useState(true)

  const toggleTestExpansion = (index: number) => {
    const newExpanded = new Set(expandedTests)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedTests(newExpanded)
  }

  const passedTests = results.filter(r => r.passed).length
  const totalTests = results.length
  const overallPassed = passedTests === totalTests

  // Calculate summary stats
  const totalTime = results.reduce((sum, r) => sum + r.time, 0)
  const maxMemory = Math.max(...results.map(r => r.memory))
  const avgTime = totalTime / totalTests

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className={`${overallPassed ? STATUS_BACKGROUNDS.accepted : STATUS_BACKGROUNDS.wrong_answer}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              {overallPassed ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Test Results
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInputOutput(!showInputOutput)}
                className="text-xs"
              >
                {showInputOutput ? (
                  <>
                    <EyeOff className="h-3 w-3 mr-1" />
                    Hide I/O
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Show I/O
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-lg">
                {passedTests}/{totalTests}
              </div>
              <div className="text-muted-foreground">Tests Passed</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">
                {(avgTime * 1000).toFixed(0)}ms
              </div>
              <div className="text-muted-foreground">Avg Time</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">
                {Math.round(maxMemory / 1024)}MB
              </div>
              <div className="text-muted-foreground">Max Memory</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">
                {Math.round((passedTests / totalTests) * 100)}%
              </div>
              <div className="text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Test Results */}
      <div className="space-y-2">
        {results.map((result, index) => {
          const StatusIcon = STATUS_ICONS[result.status as keyof typeof STATUS_ICONS] || AlertCircle
          const isExpanded = expandedTests.has(index)

          return (
            <Card 
              key={index} 
              className={`${STATUS_BACKGROUNDS[result.status as keyof typeof STATUS_BACKGROUNDS] || STATUS_BACKGROUNDS.error}`}
            >
              <Collapsible open={isExpanded} onOpenChange={() => toggleTestExpansion(index)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <StatusIcon className={`h-4 w-4 ${STATUS_COLORS[result.status as keyof typeof STATUS_COLORS]}`} />
                        <span className="font-medium">Test Case {index + 1}</span>
                        <Badge 
                          variant={result.passed ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {result.status.replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {(result.time * 1000).toFixed(0)}ms
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Memory className="h-3 w-3" />
                          {Math.round(result.memory / 1024)}MB
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Error Message */}
                      {result.error_message && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-950 dark:border-red-800">
                          <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">Error:</h4>
                          <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
                            {result.error_message}
                          </pre>
                        </div>
                      )}

                      {/* Input/Output Comparison */}
                      {showInputOutput && (
                        <div className="grid gap-4">
                          {/* Input */}
                          <div>
                            <h4 className="font-medium text-sm mb-2">Input:</h4>
                            <ScrollArea className="max-h-32">
                              <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                                {result.input || '(empty)'}
                              </pre>
                            </ScrollArea>
                          </div>

                          {/* Expected vs Actual Output */}
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-sm mb-2">Expected Output:</h4>
                              <ScrollArea className="max-h-32">
                                <pre className="bg-green-50 border border-green-200 p-3 rounded text-sm dark:bg-green-950 dark:border-green-800">
                                  {result.expected_output || '(empty)'}
                                </pre>
                              </ScrollArea>
                            </div>

                            <div>
                              <h4 className="font-medium text-sm mb-2">Your Output:</h4>
                              <ScrollArea className="max-h-32">
                                <pre className={`p-3 rounded text-sm border ${
                                  result.passed 
                                    ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                                    : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                                }`}>
                                  {result.actual_output || '(empty)'}
                                </pre>
                              </ScrollArea>
                            </div>
                          </div>

                          {/* Diff Visualization for Wrong Answer */}
                          {!result.passed && result.status === 'wrong_answer' && (
                            <div>
                              <h4 className="font-medium text-sm mb-2">Difference:</h4>
                              <DiffViewer 
                                expected={result.expected_output}
                                actual={result.actual_output}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Performance Details */}
                      <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Execution Time: {(result.time * 1000).toFixed(2)}ms</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Memory className="h-3 w-3" />
                            <span>Memory Used: {(result.memory / 1024).toFixed(2)}MB</span>
                          </div>
                        </div>
                        <Badge variant={result.passed ? "default" : "secondary"}>
                          {result.passed ? 'Passed' : 'Failed'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// Diff viewer component for comparing expected vs actual output
function DiffViewer({ expected, actual }: { expected: string, actual: string }) {
  const expectedLines = expected.split('\n')
  const actualLines = actual.split('\n')
  const maxLines = Math.max(expectedLines.length, actualLines.length)

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="bg-muted px-3 py-1 text-xs font-medium border-b">
        <span className="text-green-600">Expected</span> vs <span className="text-red-600">Actual</span>
      </div>
      <ScrollArea className="max-h-48">
        <div className="grid grid-cols-2 text-sm">
          <div className="border-r">
            {Array.from({ length: maxLines }, (_, i) => (
              <div key={i} className="px-3 py-1 border-b last:border-b-0 bg-green-50 dark:bg-green-950">
                <span className="text-green-700 dark:text-green-300">
                  {expectedLines[i] || ''}
                </span>
              </div>
            ))}
          </div>
          <div>
            {Array.from({ length: maxLines }, (_, i) => (
              <div key={i} className="px-3 py-1 border-b last:border-b-0 bg-red-50 dark:bg-red-950">
                <span className="text-red-700 dark:text-red-300">
                  {actualLines[i] || ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

// Quick stats component
export function TestResultsQuickStats({ results }: { results: TestResult[] }) {
  const passedTests = results.filter(r => r.passed).length
  const totalTests = results.length
  const successRate = Math.round((passedTests / totalTests) * 100)

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1">
        {passedTests === totalTests ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
        <span>{passedTests}/{totalTests} passed</span>
      </div>
      <Badge variant={successRate === 100 ? "default" : "secondary"}>
        {successRate}%
      </Badge>
    </div>
  )
}

// Compact test results for submission history
export function CompactTestResults({ results }: { results: TestResult[] }) {
  const passedTests = results.filter(r => r.passed).length
  const totalTests = results.length
  const overallPassed = passedTests === totalTests

  return (
    <div className="flex items-center gap-2">
      {overallPassed ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      <span className="text-sm">{passedTests}/{totalTests} tests passed</span>
      <Badge variant={overallPassed ? "default" : "secondary"} className="text-xs">
        {Math.round((passedTests / totalTests) * 100)}%
      </Badge>
    </div>
  )
}