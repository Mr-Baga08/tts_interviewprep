'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Clock,
  Target,
  Award,
  BookOpen,
  Code,
  MessageSquare,
  FileText,
  Brain,
  Calendar,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts'
import { format, subDays, subWeeks, subMonths } from 'date-fns'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { cn } from '@/lib/utils'

// Types for analytics data
interface OverviewStats {
  totalActivities: number
  completionRate: number
  averageScore: number
  timeSpent: number
  currentStreak: number
  weeklyGoalProgress: number
}

interface ProgressData {
  date: string
  codingChallenges: number
  mockInterviews: number
  mockTests: number
  resumeReviews: number
  totalScore: number
}

interface SkillProgress {
  skill: string
  currentLevel: number
  previousLevel: number
  improvement: number
  category: string
  activitiesCompleted: number
  timeSpent: number
  proficiencyLabel: string
  trend: 'improving' | 'stable' | 'declining' | 'new'
}

interface ActivityBreakdown {
  name: string
  value: number
  color: string
}

interface PerformanceMetrics {
  codingChallenges: {
    attempted: number
    solved: number
    successRate: number
    averageTime: number
    difficulty: { easy: number; medium: number; hard: number }
  }
  mockInterviews: {
    completed: number
    averageScore: number
    categories: Array<{ name: string; score: number }>
    improvementAreas: string[]
  }
  mockTests: {
    taken: number
    averageScore: number
    passRate: number
    topicPerformance: Array<{ topic: string; score: number }>
  }
  resumeReviews: {
    submitted: number
    averageRating: number
    improvements: string[]
    atsScore: number
  }
}

const TIME_PERIODS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 3 months' },
  { value: '1y', label: 'Last year' },
]

const COLORS = {
  primary: '#0ea5e9',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  accent: '#f97316'
}

const ACTIVITY_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.success,
  COLORS.warning,
  COLORS.info,
  COLORS.accent,
]

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timePeriod, setTimePeriod] = useState('30d')
  const [activeTab, setActiveTab] = useState('overview')
  
  // Analytics data state
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null)
  const [progressData, setProgressData] = useState<ProgressData[]>([])
  const [skillProgress, setSkillProgress] = useState<SkillProgress[]>([])
  const [activityBreakdown, setActivityBreakdown] = useState<ActivityBreakdown[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)

  // Fetch analytics data
  const fetchAnalyticsData = async (period: string = timePeriod) => {
    try {
      setRefreshing(true)
      
      const [overview, progress, skills, activities, performance] = await Promise.all([
        apiClient.get(`/analytics/overview?period=${period}`),
        apiClient.get(`/analytics/progress?period=${period}`),
        apiClient.get(`/analytics/skills?period=${period}`),
        apiClient.get(`/analytics/activities?period=${period}`),
        apiClient.get(`/analytics/performance?period=${period}`)
      ])

      setOverviewStats(overview.data)
      setProgressData(progress.data)
      setSkillProgress(skills.data)
      setActivityBreakdown(activities.data)
      setPerformanceMetrics(performance.data)
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAnalyticsData()
    }
  }, [status, timePeriod])

  const handleTimePeriodChange = (period: string) => {
    setTimePeriod(period)
    fetchAnalyticsData(period)
  }

  const handleRefresh = () => {
    fetchAnalyticsData()
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please sign in to view your analytics.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Track your progress and performance across all activities
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timePeriod} onValueChange={handleTimePeriodChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_PERIODS.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      {overviewStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overviewStats.totalActivities}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overviewStats.completionRate}%</div>
              <div className={cn(
                "text-xs flex items-center",
                overviewStats.completionRate >= 80 ? "text-green-600" : 
                overviewStats.completionRate >= 60 ? "text-yellow-600" : "text-red-600"
              )}>
                {overviewStats.completionRate >= 80 ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                {overviewStats.completionRate >= 80 ? 'Excellent' : 
                 overviewStats.completionRate >= 60 ? 'Good' : 'Needs improvement'}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overviewStats.averageScore}%</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(overviewStats.timeSpent / 60)}h</div>
              <p className="text-xs text-muted-foreground">
                {overviewStats.timeSpent % 60}m additional
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overviewStats.currentStreak}</div>
              <p className="text-xs text-muted-foreground">days</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Goal</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overviewStats.weeklyGoalProgress}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(100, overviewStats.weeklyGoalProgress)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Progress Over Time Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Over Time</CardTitle>
              <CardDescription>
                Your activity and performance trends over the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="totalScore" 
                    stroke={COLORS.primary} 
                    strokeWidth={2}
                    name="Total Score"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="codingChallenges" 
                    stroke={COLORS.success} 
                    strokeWidth={2}
                    name="Coding Challenges"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mockInterviews" 
                    stroke={COLORS.secondary} 
                    strokeWidth={2}
                    name="Mock Interviews"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Activity Breakdown */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Activity Breakdown</CardTitle>
                <CardDescription>
                  Distribution of your practice time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={activityBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {activityBreakdown.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={ACTIVITY_COLORS[index % ACTIVITY_COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Achievements</CardTitle>
                <CardDescription>
                  Your latest milestones and improvements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Award className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Completed 10 coding challenges</p>
                    <p className="text-xs text-muted-foreground">2 days ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Interview score improved 15%</p>
                    <p className="text-xs text-muted-foreground">5 days ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Brain className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">New skill: Advanced Python</p>
                    <p className="text-xs text-muted-foreground">1 week ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="skills" className="space-y-6">
          {/* Skills Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Skill Proficiency</CardTitle>
              <CardDescription>
                Your current skill levels across different areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={skillProgress.slice(0, 8)}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar
                    name="Current Level"
                    dataKey="currentLevel"
                    stroke={COLORS.primary}
                    fill={COLORS.primary}
                    fillOpacity={0.3}
                  />
                  {skillProgress.some(s => s.previousLevel !== undefined) && (
                    <Radar
                      name="Previous Level"
                      dataKey="previousLevel"
                      stroke={COLORS.secondary}
                      fill={COLORS.secondary}
                      fillOpacity={0.1}
                    />
                  )}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Skills List */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Skill Progress</CardTitle>
              <CardDescription>
                Track your improvement in specific skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {skillProgress.map((skill, index) => (
                  <div key={skill.skill} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{skill.skill}</h3>
                        <Badge variant="secondary">{skill.proficiencyLabel}</Badge>
                        {skill.trend === 'improving' && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Improving
                          </Badge>
                        )}
                      </div>
                      <span className="text-2xl font-bold">{skill.currentLevel}%</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${skill.currentLevel}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{skill.activitiesCompleted} activities completed</span>
                      <span>{Math.round(skill.timeSpent / 60)}h practiced</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-6">
          {performanceMetrics && (
            <>
              {/* Coding Challenges Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Code className="w-5 h-5 mr-2" />
                    Coding Challenges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {performanceMetrics.codingChallenges.solved}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        of {performanceMetrics.codingChallenges.attempted} solved
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {performanceMetrics.codingChallenges.successRate}%
                      </div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {Math.round(performanceMetrics.codingChallenges.averageTime)}m
                      </div>
                      <div className="text-sm text-muted-foreground">Average Time</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Difficulty Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Easy</span>
                        <span className="text-sm font-medium">
                          {performanceMetrics.codingChallenges.difficulty.easy}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Medium</span>
                        <span className="text-sm font-medium">
                          {performanceMetrics.codingChallenges.difficulty.medium}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Hard</span>
                        <span className="text-sm font-medium">
                          {performanceMetrics.codingChallenges.difficulty.hard}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mock Interviews Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Mock Interviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {performanceMetrics.mockInterviews.completed}
                      </div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {performanceMetrics.mockInterviews.averageScore}%
                      </div>
                      <div className="text-sm text-muted-foreground">Average Score</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Category Performance</h4>
                    {performanceMetrics.mockInterviews.categories.map((category, index) => (
                      <div key={category.name}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">{category.name}</span>
                          <span className="text-sm font-medium">{category.score}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${category.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Mock Tests Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Mock Tests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {performanceMetrics.mockTests.taken}
                      </div>
                      <div className="text-sm text-muted-foreground">Tests Taken</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {performanceMetrics.mockTests.averageScore}%
                      </div>
                      <div className="text-sm text-muted-foreground">Average Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {performanceMetrics.mockTests.passRate}%
                      </div>
                      <div className="text-sm text-muted-foreground">Pass Rate</div>
                    </div>
                  </div>
                  
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={performanceMetrics.mockTests.topicPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="topic" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="score" fill={COLORS.primary} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Resume Reviews Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Resume Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {performanceMetrics.resumeReviews.submitted}
                      </div>
                      <div className="text-sm text-muted-foreground">Submitted</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {performanceMetrics.resumeReviews.averageRating}/5
                      </div>
                      <div className="text-sm text-muted-foreground">Average Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {performanceMetrics.resumeReviews.atsScore}%
                      </div>
                      <div className="text-sm text-muted-foreground">ATS Score</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Key Improvement Areas</h4>
                    <div className="flex flex-wrap gap-2">
                      {performanceMetrics.resumeReviews.improvements.map((improvement, index) => (
                        <Badge key={index} variant="outline">
                          {improvement}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="activities" className="space-y-6">
          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>
                Your recent activity across all platform features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="codingChallenges"
                    stackId="1"
                    stroke={COLORS.success}
                    fill={COLORS.success}
                    name="Coding Challenges"
                  />
                  <Area
                    type="monotone"
                    dataKey="mockInterviews"
                    stackId="1"
                    stroke={COLORS.secondary}
                    fill={COLORS.secondary}
                    name="Mock Interviews"
                  />
                  <Area
                    type="monotone"
                    dataKey="mockTests"
                    stackId="1"
                    stroke={COLORS.warning}
                    fill={COLORS.warning}
                    name="Mock Tests"
                  />
                  <Area
                    type="monotone"
                    dataKey="resumeReviews"
                    stackId="1"
                    stroke={COLORS.info}
                    fill={COLORS.info}
                    name="Resume Reviews"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Activity Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Coding Challenges</CardTitle>
                <Code className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceMetrics?.codingChallenges.solved || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {performanceMetrics?.codingChallenges.successRate || 0}% success rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mock Interviews</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceMetrics?.mockInterviews.completed || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {performanceMetrics?.mockInterviews.averageScore || 0}% avg score
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mock Tests</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceMetrics?.mockTests.taken || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {performanceMetrics?.mockTests.passRate || 0}% pass rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resume Reviews</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceMetrics?.resumeReviews.submitted || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {performanceMetrics?.resumeReviews.averageRating || 0}/5 avg rating
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Activity Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity Pattern</CardTitle>
              <CardDescription>
                Your activity distribution throughout the week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium">
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                  <div>Sun</div>
                </div>
                
                {/* Simplified activity heatmap - would need real data */}
                {[...Array(4)].map((_, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 gap-2">
                    {[...Array(7)].map((_, dayIndex) => {
                      const intensity = Math.random() * 100
                      return (
                        <div
                          key={dayIndex}
                          className={cn(
                            "h-8 rounded border flex items-center justify-center text-xs",
                            intensity > 75 ? "bg-green-500 text-white" :
                            intensity > 50 ? "bg-green-300" :
                            intensity > 25 ? "bg-green-100" :
                            "bg-gray-100"
                          )}
                          title={`${Math.round(intensity)}% activity`}
                        >
                          {Math.round(intensity)}
                        </div>
                      )
                    })}
                  </div>
                ))}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Less active</span>
                  <div className="flex space-x-1">
                    <div className="w-3 h-3 bg-gray-100 rounded"></div>
                    <div className="w-3 h-3 bg-green-100 rounded"></div>
                    <div className="w-3 h-3 bg-green-300 rounded"></div>
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                  </div>
                  <span>More active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}