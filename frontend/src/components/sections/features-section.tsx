// frontend/src/components/sections/features-section.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BrainCircuit, 
  Code, 
  FileText, 
  MessageSquare, 
  BarChart3, 
  Zap 
} from 'lucide-react'

const features = [
  {
    icon: MessageSquare,
    title: 'AI Mock Interviews',
    description: 'Practice with our AI interviewer that adapts to your experience level and provides real-time feedback.',
    badge: 'AI-Powered',
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    icon: Code,
    title: 'Coding Challenges',
    description: 'Solve LeetCode-style problems with instant feedback and detailed explanations.',
    badge: 'Interactive',
    color: 'bg-green-500/10 text-green-500',
  },
  {
    icon: FileText,
    title: 'Resume Review',
    description: 'Get AI-powered resume analysis with ATS optimization and improvement suggestions.',
    badge: 'ATS-Ready',
    color: 'bg-purple-500/10 text-purple-500',
  },
  {
    icon: BrainCircuit,
    title: 'Mock Tests',
    description: 'Take comprehensive assessments covering technical and behavioral topics.',
    badge: 'Comprehensive',
    color: 'bg-orange-500/10 text-orange-500',
  },
  {
    icon: BarChart3,
    title: 'Progress Analytics',
    description: 'Track your improvement with detailed analytics and personalized insights.',
    badge: 'Data-Driven',
    color: 'bg-pink-500/10 text-pink-500',
  },
  {
    icon: Zap,
    title: 'Real-time Feedback',
    description: 'Get instant feedback on your performance with actionable improvement tips.',
    badge: 'Instant',
    color: 'bg-yellow-500/10 text-yellow-500',
  },
]

export function FeaturesSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to Ace Your Interview
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our comprehensive platform combines AI technology with proven interview preparation methods.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ) 
          })}
        </div>
      </div>
    </section>
  )
}