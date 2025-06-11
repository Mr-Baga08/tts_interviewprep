import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { HeroSection } from '@/components/sections/hero-section'
import { FeaturesSection } from '@/components/sections/features-section'
import { TestimonialsSection } from '@/components/sections/testimonials-section'
import { CTASection } from '@/components/sections/cta-section'
import { 
  BrainCircuit, 
  Code, 
  FileText, 
  MessageSquare, 
  BarChart3, 
  Zap,
  CheckCircle,
  Star,
  ArrowRight,
  Play,
  TrendingUp,
  Users,
  Award,
  Target
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      {/* Features Overview */}
      <FeaturesSection />

      {/* Statistics Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold mb-4">
              Trusted by Thousands of Job Seekers
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered platform has helped thousands land their dream jobs
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">10K+</div>
              <div className="text-sm text-muted-foreground">Interviews Completed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">50K+</div>
              <div className="text-sm text-muted-foreground">Coding Challenges Solved</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">5K+</div>
              <div className="text-sm text-muted-foreground">Resumes Reviewed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">92%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              How It Works
            </Badge>
            <h2 className="text-4xl font-heading font-bold mb-4">
              Your Path to Success in 4 Simple Steps
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our comprehensive platform guides you through every aspect of job preparation
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                title: 'Create Your Profile',
                description: 'Tell us about your career goals, skills, and target roles',
                icon: Target,
                color: 'bg-blue-500',
              },
              {
                step: '2',
                title: 'Practice & Learn',
                description: 'Take AI-powered mock interviews, solve coding challenges, and get resume feedback',
                icon: BrainCircuit,
                color: 'bg-green-500',
              },
              {
                step: '3',
                title: 'Get Feedback',
                description: 'Receive detailed, personalized feedback on all your activities',
                icon: MessageSquare,
                color: 'bg-purple-500',
              },
              {
                step: '4',
                title: 'Land Your Job',
                description: 'Apply your improved skills and confidence to ace real interviews',
                icon: Award,
                color: 'bg-orange-500',
              },
            ].map((item, index) => (
              <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 ${item.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute top-4 right-4 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                    {item.step}
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {item.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Pricing Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              Pricing
            </Badge>
            <h2 className="text-4xl font-heading font-bold mb-4">
              Choose Your Path to Success
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Start free and upgrade when you&apos;re ready for advanced features
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Free',
                price: '$0',
                period: 'forever',
                description: 'Perfect for getting started',
                features: [
                  '5 mock interviews per month',
                  '10 coding challenges',
                  'Basic resume review',
                  'Community support',
                  'Basic analytics',
                ],
                cta: 'Get Started Free',
                popular: false,
              },
              {
                name: 'Pro',
                price: '$19',
                period: 'per month',
                description: 'Best for serious job seekers',
                features: [
                  'Unlimited mock interviews',
                  'All coding challenges',
                  'AI-powered resume optimization',
                  'Personalized feedback',
                  'Advanced analytics',
                  'Live coding sessions',
                  'Priority support',
                ],
                cta: 'Start Pro Trial',
                popular: true,
              },
              {
                name: 'Enterprise',
                price: '$49',
                period: 'per month',
                description: 'For teams and organizations',
                features: [
                  'Everything in Pro',
                  'Team management',
                  'Custom challenges',
                  'Bulk user management',
                  'API access',
                  'Custom integrations',
                  'Dedicated support',
                ],
                cta: 'Contact Sales',
                popular: false,
              },
            ].map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold">
                    {plan.price}
                    <span className="text-lg font-normal text-muted-foreground">
                      /{plan.period}
                    </span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? 'default' : 'outline'}
                    asChild
                  >
                    <Link href="/auth/register">
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  )
}