// frontend/src/app/quizzes/[id]/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight,
  Flag,
  RotateCcw,
  Send,
  Timer
} from 'lucide-react'
import { toast } from 'sonner'

import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useQuiz } from '@/hooks/use-quiz'
import { useQuizAttempt } from '@/hooks/use-quiz-attempt'

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
  is_correct?: boolean // Only visible after submission
}

interface Answer {
  question_id: string
  answer_text?: string
  selected_options?: string[]
}

interface QuizAttempt {
  id: string
  quiz_id: string
  started_at: string
  submitted_at?: string
  time_remaining?: number
  answers: Answer[]
}

const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
}

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.id as string

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set())
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)

  const { quiz, loading, error } = useQuiz(quizId)
  const { startAttempt, submitQuiz } = useQuizAttempt(quizId)

  // Initialize quiz attempt
  useEffect(() => {
    if (quiz && !attempt) {
      initializeAttempt()
    }
  }, [quiz])

  // Timer countdown
  useEffect(() => {
    if (timeRemaining && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev && prev <= 1) {
            // Auto-submit when time runs out
            handleSubmitQuiz()
            return 0
          }
          return prev ? prev - 1 : 0
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [timeRemaining])

  const initializeAttempt = async () => {
    try {
      const newAttempt = await startAttempt()
      setAttempt(newAttempt)
      
      // Initialize answers array
      if (quiz) {
        const initialAnswers: Answer[] = quiz.questions.map(q => ({
          question_id: q.id,
          answer_text: '',
          selected_options: []
        }))
        setAnswers(initialAnswers)
        
        // Set timer if quiz has time limit
        if (quiz.time_limit_minutes) {
          const startTime = new Date(newAttempt.started_at).getTime()
          const currentTime = Date.now()
          const elapsedSeconds = Math.floor((currentTime - startTime) / 1000)
          const totalSeconds = quiz.time_limit_minutes * 60
          const remaining = Math.max(0, totalSeconds - elapsedSeconds)
          setTimeRemaining(remaining)
        }
      }
    } catch (error) {
      console.error('Failed to start quiz attempt:', error)
      toast.error('Failed to start quiz. Please try again.')
    }
  }

  const updateAnswer = useCallback((questionId: string, answer: Partial<Answer>) => {
    setAnswers(prev => prev.map(a => 
      a.question_id === questionId 
        ? { ...a, ...answer }
        : a
    ))
  }, [])

  const getCurrentAnswer = useCallback((questionId: string): Answer | undefined => {
    return answers.find(a => a.question_id === questionId)
  }, [answers])

  const isQuestionAnswered = useCallback((questionIndex: number): boolean => {
    const question = quiz?.questions[questionIndex]
    if (!question) return false
    
    const answer = getCurrentAnswer(question.id)
    if (!answer) return false
    
    if (question.question_type === 'multiple_choice') {
      return !!(answer.selected_options && answer.selected_options.length > 0)
    } else if (question.question_type === 'multiple_select') {
      return !!(answer.selected_options && answer.selected_options.length > 0)
    } else if (question.question_type === 'true_false') {
      return !!(answer.answer_text && answer.answer_text.trim())
    } else {
      return !!(answer.answer_text && answer.answer_text.trim())
    }
  }, [quiz, getCurrentAnswer])

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleNextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index)
  }

  const toggleFlag = (questionIndex: number) => {
    const newFlagged = new Set(flaggedQuestions)
    if (newFlagged.has(questionIndex)) {
      newFlagged.delete(questionIndex)
    } else {
      newFlagged.add(questionIndex)
    }
    setFlaggedQuestions(newFlagged)
  }

  const handleSubmitQuiz = async () => {
    if (!attempt || !quiz) return

    setIsSubmitting(true)

    try {
      const result = await submitQuiz({
        attempt_id: attempt.id,
        answers: answers
      })

      toast.success('Quiz submitted successfully!')
      router.push(`/quizzes/${quizId}/results/${attempt.id}`)
      
    } catch (error) {
      console.error('Failed to submit quiz:', error)
      toast.error('Failed to submit quiz. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getAnsweredCount = (): number => {
    return quiz?.questions.filter((_, index) => isQuestionAnswered(index)).length || 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Quiz not found'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const currentAnswer = getCurrentAnswer(currentQuestion.id)
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100
  const answeredCount = getAnsweredCount()

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">{quiz.title}</h1>
              <p className="text-muted-foreground">{quiz.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={DIFFICULTY_COLORS[quiz.difficulty]}>
                {quiz.difficulty.toUpperCase()}
              </Badge>
              <Badge variant="outline">{quiz.category}</Badge>
            </div>
          </div>

          {/* Progress and Timer */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Progress: {currentQuestionIndex + 1} of {quiz.questions.length}</span>
                <span>{answeredCount} answered</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            {timeRemaining !== null && (
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                <Timer className="h-4 w-4" />
                <span className={`font-mono font-semibold ${
                  timeRemaining < 300 ? 'text-red-500' : ''
                }`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </div>

          {/* Question Navigation */}
          <div className="flex flex-wrap gap-2 mb-4">
            {quiz.questions.map((_, index) => (
              <Button
                key={index}
                variant={index === currentQuestionIndex ? "default" : "outline"}
                size="sm"
                className={`relative ${
                  isQuestionAnswered(index) ? 'bg-green-50 border-green-200' : ''
                } ${
                  flaggedQuestions.has(index) ? 'border-yellow-400' : ''
                }`}
                onClick={() => handleJumpToQuestion(index)}
              >
                {index + 1}
                {isQuestionAnswered(index) && (
                  <CheckCircle className="h-3 w-3 absolute -top-1 -right-1 text-green-500" />
                )}
                {flaggedQuestions.has(index) && (
                  <Flag className="h-3 w-3 absolute -top-1 -right-1 text-yellow-500" />
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Question Content */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Question {currentQuestionIndex + 1}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'})
                </span>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleFlag(currentQuestionIndex)}
                className={flaggedQuestions.has(currentQuestionIndex) ? 'text-yellow-600' : ''}
              >
                <Flag className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Question Text */}
              <div 
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: currentQuestion.question_text }}
              />

              {/* Answer Input */}
              <div>
                {currentQuestion.question_type === 'multiple_choice' && (
                  <RadioGroup
                    value={currentAnswer?.selected_options?.[0] || ''}
                    onValueChange={(value) => updateAnswer(currentQuestion.id, { selected_options: [value] })}
                  >
                    {currentQuestion.options?.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.text} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          {option.text}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {currentQuestion.question_type === 'multiple_select' && (
                  <div className="space-y-2">
                    {currentQuestion.options?.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          id={`option-${index}`}
                          checked={currentAnswer?.selected_options?.includes(option.text) || false}
                          onCheckedChange={(checked) => {
                            const currentSelected = currentAnswer?.selected_options || []
                            const newSelected = checked
                              ? [...currentSelected, option.text]
                              : currentSelected.filter(s => s !== option.text)
                            updateAnswer(currentQuestion.id, { selected_options: newSelected })
                          }}
                        />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          {option.text}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}

                {currentQuestion.question_type === 'true_false' && (
                  <RadioGroup
                    value={currentAnswer?.answer_text || ''}
                    onValueChange={(value) => updateAnswer(currentQuestion.id, { answer_text: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="true" />
                      <Label htmlFor="true" className="cursor-pointer">True</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="false" />
                      <Label htmlFor="false" className="cursor-pointer">False</Label>
                    </div>
                  </RadioGroup>
                )}

                {(currentQuestion.question_type === 'short_answer' || currentQuestion.question_type === 'essay') && (
                  <Textarea
                    placeholder="Enter your answer here..."
                    value={currentAnswer?.answer_text || ''}
                    onChange={(e) => updateAnswer(currentQuestion.id, { answer_text: e.target.value })}
                    className={currentQuestion.question_type === 'essay' ? 'min-h-32' : 'min-h-20'}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {answeredCount} of {quiz.questions.length} answered
            </span>
            
            {currentQuestionIndex === quiz.questions.length - 1 ? (
              <Button
                onClick={handleSubmitQuiz}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              </Button>
            ) : (
              <Button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === quiz.questions.length - 1}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Submit Warning */}
        {answeredCount < quiz.questions.length && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have {quiz.questions.length - answeredCount} unanswered questions. 
              You can submit the quiz anytime, but unanswered questions will be marked as incorrect.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}