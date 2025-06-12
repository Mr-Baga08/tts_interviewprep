// frontend/src/components/dashboard/ResumeDashboard.tsx
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Upload, 
  FileText, 
  Brain, 
  Download, 
  Eye, 
  Star, 
  MessageCircle,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Types
interface Resume {
  id: string
  title: string
  original_filename: string
  file_type: 'pdf' | 'docx' | 'doc' | 'txt'
  file_size: number
  status: 'uploaded' | 'parsing' | 'parsed' | 'reviewing' | 'reviewed' | 'error'
  is_primary: boolean
  view_count: number
  download_count: number
  review_count: number
  created_at: string
  updated_at: string
  parsed_at?: string
  last_reviewed_at?: string
}

interface ResumeReview {
  id: string
  resume_id: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  review_type: 'general' | 'ats_optimization' | 'role_specific' | 'industry_specific'
  overall_score?: number
  ats_score?: number
  clarity_score?: number
  impact_score?: number
  strengths?: string[]
  weaknesses?: string[]
  improvement_suggestions?: string[]
  ats_recommendations?: string[]
  created_at: string
  completed_at?: string
}

interface AIFeedback {
  resume_id: string
  review_id: string
  overall_score: number
  ats_score: number
  clarity_score: number
  impact_score: number
  strengths: string[]
  weaknesses: string[]
  improvement_suggestions: string[]
  ats_recommendations: string[]
  keyword_analysis: {
    present_keywords: string[]
    missing_keywords: string[]
    keyword_density: number
  }
  formatting_feedback: {
    readability_score: number
    structure_score: number
    suggestions: string[]
  }
}

const ResumeDashboard: React.FC = () => {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null)
  const [feedback, setFeedback] = useState<AIFeedback | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    isPrimary: false,
    file: null as File | null
  })

  // Review form state
  const [reviewForm, setReviewForm] = useState({
    reviewType: 'general' as const,
    targetRole: '',
    targetCompany: '',
    targetIndustry: '',
    jobDescription: ''
  })

  // Fetch resumes on component mount
  useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    try {
      const response = await fetch('/api/resumes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setResumes(data)
      }
    } catch (error) {
      toast.error('Failed to fetch resumes')
    }
  }

  // File drop handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setUploadForm(prev => ({
        ...prev,
        // Fix 1: Ensure the file is either a File object or null.
        file: file || null,
        // Fix 2: Safely access file.name only if the file exists.
        title: prev.title || (file ? `Resume - ${file.name}` : '')
      }))
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  })

  const handleUpload = async () => {
    if (!uploadForm.file) {
      toast.error('Please select a file')
      return
    }

    setLoading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', uploadForm.file)
      formData.append('title', uploadForm.title)
      formData.append('description', uploadForm.description)
      formData.append('is_primary', uploadForm.isPrimary.toString())

      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (response.ok) {
        const newResume = await response.json()
        setResumes(prev => [newResume, ...prev])
        setUploadDialogOpen(false)
        setUploadForm({
          title: '',
          description: '',
          isPrimary: false,
          file: null
        })
        toast.success('Resume uploaded successfully!')
      } else {
        const error = await response.json()
        toast.error(error.detail || 'Upload failed')
      }
    } catch (error) {
      toast.error('Upload failed')
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  const handleRequestReview = async () => {
    if (!selectedResume) return

    setLoading(true)

    try {
      const response = await fetch(`/api/resumes/${selectedResume.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(reviewForm)
      })

      if (response.ok) {
        setReviewDialogOpen(false)
        toast.success('Review requested! AI analysis in progress...')
        
        // Refresh resumes to update review status
        setTimeout(fetchResumes, 1000)
      } else {
        const error = await response.json()
        toast.error(error.detail || 'Review request failed')
      }
    } catch (error) {
      toast.error('Review request failed')
    } finally {
      setLoading(false)
    }
  }

  const fetchFeedback = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/resumes/${resumeId}/feedback`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const feedbackData = await response.json()
        setFeedback(feedbackData)
      }
    } catch (error) {
      toast.error('Failed to fetch feedback')
    }
  }

  const generateInterviewQuestions = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/resumes/${resumeId}/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          target_role: reviewForm.targetRole || null,
          question_count: 10,
          difficulty_level: 'medium'
        })
      })

      if (response.ok) {
        const questions = await response.json()
        // Handle the generated questions (could open a new dialog or navigate to interview page)
        toast.success(`Generated ${questions.questions.length} interview questions!`)
      }
    } catch (error) {
      toast.error('Failed to generate interview questions')
    }
  }

  const getStatusIcon = (status: Resume['status']) => {
    switch (status) {
      case 'uploaded':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'parsing':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />
      case 'parsed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'reviewing':
        return <Brain className="w-4 h-4 text-purple-500 animate-pulse" />
      case 'reviewed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getStatusBadge = (status: Resume['status']) => {
    const statusConfig = {
      uploaded: { label: 'Uploaded', variant: 'secondary' as const },
      parsing: { label: 'Parsing', variant: 'default' as const },
      parsed: { label: 'Ready', variant: 'success' as const },
      reviewing: { label: 'Reviewing', variant: 'default' as const },
      reviewed: { label: 'Reviewed', variant: 'success' as const },
      error: { label: 'Error', variant: 'destructive' as const }
    }

    const config = statusConfig[status]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Resume Management</h1>
          <p className="text-muted-foreground">Upload, review, and optimize your resumes with AI-powered feedback</p>
        </div>
        
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Upload Resume</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Resume</DialogTitle>
              <DialogDescription>
                Upload your resume for AI-powered analysis and feedback
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* File Upload Area */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}`}
              >
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                {uploadForm.file ? (
                  <div>
                    <p className="font-medium">{uploadForm.file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(uploadForm.file.size)}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p>Drop your resume here or click to browse</p>
                    <p className="text-sm text-muted-foreground">
                      Supports PDF, DOCX, DOC, TXT (max 10MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Software Engineer Resume"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={uploadForm.description}
                    onChange={(e: { target: { value: any } }) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this resume version"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-primary"
                    checked={uploadForm.isPrimary}
                    onCheckedChange={(checked: any) => setUploadForm(prev => ({ ...prev, isPrimary: checked }))}
                  />
                  <Label htmlFor="is-primary">Set as primary resume</Label>
                </div>
              </div>

              {/* Upload Progress */}
              {loading && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setUploadDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!uploadForm.file || loading}
                >
                  {loading ? 'Uploading...' : 'Upload Resume'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resume List */}
      {resumes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No resumes uploaded</h3>
            <p className="text-muted-foreground text-center mb-6">
              Upload your first resume to get started with AI-powered feedback and optimization
            </p>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Resume
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => (
            <Card key={resume.id} className="relative">
              {resume.is_primary && (
                <div className="absolute top-2 right-2">
                  <Badge variant="default" className="flex items-center space-x-1">
                    <Star className="w-3 h-3" />
                    <span>Primary</span>
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(resume.status)}
                    <div>
                      <CardTitle className="text-lg">{resume.title}</CardTitle>
                      <CardDescription>{resume.original_filename}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Status and Metadata */}
                  <div className="flex justify-between items-center">
                    {getStatusBadge(resume.status)}
                    <span className="text-sm text-muted-foreground">
                      {formatFileSize(resume.file_size)}
                    </span>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-semibold">{resume.view_count}</div>
                      <div className="text-xs text-muted-foreground">Views</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{resume.download_count}</div>
                      <div className="text-xs text-muted-foreground">Downloads</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{resume.review_count}</div>
                      <div className="text-xs text-muted-foreground">Reviews</div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Uploaded: {formatDate(resume.created_at)}</div>
                    {resume.parsed_at && (
                      <div>Parsed: {formatDate(resume.parsed_at)}</div>
                    )}
                    {resume.last_reviewed_at && (
                      <div>Last Review: {formatDate(resume.last_reviewed_at)}</div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {resume.status === 'parsed' || resume.status === 'reviewed' ? (
                      <>
                        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              className="w-full"
                              onClick={() => setSelectedResume(resume)}
                            >
                              <Brain className="w-4 h-4 mr-2" />
                              AI Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Request AI Review</DialogTitle>
                              <DialogDescription>
                                Get detailed AI-powered feedback on your resume
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="review-type">Review Type</Label>
                                <Select
                                  value={reviewForm.reviewType}
                                  onValueChange={(value: any) => 
                                    setReviewForm(prev => ({ ...prev, reviewType: value }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="general">General Review</SelectItem>
                                    <SelectItem value="ats_optimization">ATS Optimization</SelectItem>
                                    <SelectItem value="role_specific">Role-Specific</SelectItem>
                                    <SelectItem value="industry_specific">Industry-Specific</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label htmlFor="target-role">Target Role (Optional)</Label>
                                <Input
                                  id="target-role"
                                  value={reviewForm.targetRole}
                                  onChange={(e) => setReviewForm(prev => ({ ...prev, targetRole: e.target.value }))}
                                  placeholder="e.g., Senior Software Engineer"
                                />
                              </div>

                              <div>
                                <Label htmlFor="target-company">Target Company (Optional)</Label>
                                <Input
                                  id="target-company"
                                  value={reviewForm.targetCompany}
                                  onChange={(e) => setReviewForm(prev => ({ ...prev, targetCompany: e.target.value }))}
                                  placeholder="e.g., Google, Microsoft"
                                />
                              </div>

                              <div>
                                <Label htmlFor="job-description">Job Description (Optional)</Label>
                                <Textarea
                                  id="job-description"
                                  value={reviewForm.jobDescription}
                                  onChange={(e: { target: { value: any } }) => setReviewForm(prev => ({ ...prev, jobDescription: e.target.value }))}
                                  placeholder="Paste the job description to get targeted feedback"
                                  rows={4}
                                />
                              </div>

                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setReviewDialogOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleRequestReview}
                                  disabled={loading}
                                >
                                  {loading ? 'Processing...' : 'Start Review'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchFeedback(resume.id)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Feedback
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateInterviewQuestions(resume.id)}
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Questions
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {resume.status === 'parsing' ? 'Resume is being parsed...' : 
                           resume.status === 'error' ? 'Failed to parse resume' :
                           'Upload in progress...'}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AI Feedback Display */}
      {feedback && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5" />
              <span>AI Feedback</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="strengths">Strengths</TabsTrigger>
                <TabsTrigger value="improvements">Improvements</TabsTrigger>
                <TabsTrigger value="ats">ATS Optimization</TabsTrigger>
                <TabsTrigger value="keywords">Keywords</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{feedback.overall_score}</div>
                    <div className="text-sm text-muted-foreground">Overall Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{feedback.ats_score}</div>
                    <div className="text-sm text-muted-foreground">ATS Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{feedback.clarity_score}</div>
                    <div className="text-sm text-muted-foreground">Clarity</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{feedback.impact_score}</div>
                    <div className="text-sm text-muted-foreground">Impact</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="strengths">
                <ul className="space-y-2">
                  {feedback.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </TabsContent>

              <TabsContent value="improvements">
                <ul className="space-y-2">
                  {feedback.improvement_suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Zap className="w-4 h-4 text-yellow-500 mt-1 flex-shrink-0" />
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </TabsContent>

              <TabsContent value="ats">
                <ul className="space-y-2">
                  {feedback.ats_recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <BarChart3 className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </TabsContent>

              <TabsContent value="keywords">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Present Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {feedback.keyword_analysis.present_keywords.map((keyword, index) => (
                        <Badge key={index} variant="success">{keyword}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Missing Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {feedback.keyword_analysis.missing_keywords.map((keyword, index) => (
                        <Badge key={index} variant="destructive">{keyword}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Keyword Density</h4>
                    <div className="flex items-center space-x-2">
                      <Progress value={feedback.keyword_analysis.keyword_density * 100} className="flex-1" />
                      <span className="text-sm font-medium">
                        {(feedback.keyword_analysis.keyword_density * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ResumeDashboard