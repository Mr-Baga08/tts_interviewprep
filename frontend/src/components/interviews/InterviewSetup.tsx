'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { 
  Clock, 
  User, 
  Briefcase, 
  Target, 
  Settings,
  Play,
  FileText,
  Mic,
  Video,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { interviewsApi, type InterviewConfig } from '@/lib/api/interviews';

const INTERVIEW_TYPES = [
  {
    id: 'behavioral',
    name: 'Behavioral',
    description: 'Focus on past experiences and soft skills',
    icon: User,
    duration: 30,
    questions: 'Situational and experience-based questions',
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'Technical knowledge and problem-solving',
    icon: Settings,
    duration: 45,
    questions: 'Technology concepts and implementation',
  },
  {
    id: 'system_design',
    name: 'System Design',
    description: 'Architecture and design questions',
    icon: Target,
    duration: 60,
    questions: 'Large-scale system architecture',
  },
  {
    id: 'resume_based',
    name: 'Resume-Based',
    description: 'Questions tailored to your resume',
    icon: FileText,
    duration: 30,
    questions: 'Your specific experiences and projects',
  },
  {
    id: 'mixed',
    name: 'Mixed',
    description: 'Combination of behavioral and technical',
    icon: Briefcase,
    duration: 45,
    questions: 'Balanced mix of question types',
  },
];

const INTERVIEW_MODES = [
  {
    id: 'video',
    name: 'Video Call',
    description: 'Full video interview experience',
    icon: Video,
    features: ['Face-to-face interaction', 'Non-verbal communication', 'Most realistic'],
  },
  {
    id: 'voice',
    name: 'Voice Only',
    description: 'Audio-only interview',
    icon: Mic,
    features: ['Audio communication', 'Focus on verbal skills', 'Less pressure'],
  },
  {
    id: 'text',
    name: 'Text Chat',
    description: 'Text-based interview',
    icon: MessageSquare,
    features: ['Written responses', 'Time to think', 'Structured format'],
  },
];

const TECH_STACKS = [
  'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular',
  'Node.js', 'Python', 'Django', 'Flask', 'Java',
  'Spring Boot', 'C#', '.NET', 'Go', 'Rust',
  'PostgreSQL', 'MongoDB', 'Redis', 'AWS', 'GCP',
  'Docker', 'Kubernetes', 'GraphQL', 'REST APIs'
];

const FOCUS_AREAS = [
  'Problem Solving', 'System Architecture', 'Database Design',
  'API Development', 'Frontend Development', 'Backend Development',
  'DevOps', 'Security', 'Performance Optimization',
  'Team Leadership', 'Project Management', 'Communication'
];

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level (0-1 years)', description: 'New to the field' },
  { value: 'junior', label: 'Junior (1-3 years)', description: 'Some experience' },
  { value: 'mid', label: 'Mid-level (3-5 years)', description: 'Experienced professional' },
  { value: 'senior', label: 'Senior (5-8 years)', description: 'Senior individual contributor' },
  { value: 'lead', label: 'Lead/Principal (8+ years)', description: 'Leadership and mentoring' },
];

export function InterviewSetup() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [config, setConfig] = useState<InterviewConfig>({
    title: '',
    type: 'behavioral',
    mode: 'video',
    duration: 30,
    target_role: '',
    target_company: '',
    experience_level: 'mid',
    tech_stack: [],
    focus_areas: [],
    use_resume_context: false,
    custom_instructions: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const selectedType = INTERVIEW_TYPES.find(t => t.id === config.type);
  const selectedMode = INTERVIEW_MODES.find(m => m.id === config.mode);
  const selectedExperience = EXPERIENCE_LEVELS.find(e => e.value === config.experience_level);

  const handleTypeChange = (type: string) => {
    const selectedType = INTERVIEW_TYPES.find(t => t.id === type);
    setConfig(prev => ({
      ...prev,
      type: type as InterviewConfig['type'],
      duration: selectedType?.duration || 30,
      title: `${selectedType?.name} Interview${prev.target_role ? ` - ${prev.target_role}` : ''}`
    }));
  };

  const handleModeChange = (mode: string) => {
    setConfig(prev => ({
      ...prev,
      mode: mode as InterviewConfig['mode']
    }));
  };

  const handleTechStackChange = (tech: string) => {
    setConfig(prev => ({
      ...prev,
      tech_stack: prev.tech_stack?.includes(tech)
        ? prev.tech_stack.filter(t => t !== tech)
        : [...(prev.tech_stack || []), tech]
    }));
  };

  const handleFocusAreaChange = (area: string) => {
    setConfig(prev => ({
      ...prev,
      focus_areas: prev.focus_areas?.includes(area)
        ? prev.focus_areas.filter(a => a !== area)
        : [...(prev.focus_areas || []), area]
    }));
  };

  const validateConfig = (): boolean => {
    const errors: string[] = [];

    if (!config.title?.trim()) {
      errors.push('Interview title is required');
    }

    if (!config.target_role?.trim()) {
      errors.push('Target role is required');
    }

    if (config.duration < 15 || config.duration > 120) {
      errors.push('Duration must be between 15 and 120 minutes');
    }

    if ((config.type === 'technical' || config.type === 'mixed') && 
        (!config.tech_stack || config.tech_stack.length === 0)) {
      errors.push('Please select at least one technology for technical interviews');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const startInterview = async () => {
    if (!validateConfig()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before starting the interview.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Create interview session
      const session = await interviewsApi.createSession(config);
      
      toast({
        title: "Interview Created",
        description: "Your mock interview session has been created successfully!",
      });
      
      // Redirect to interview room
      router.push(`/interviews/${session.session_id}`);
    } catch (error: any) {
      console.error('Error starting interview:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create interview session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Setup Your Mock Interview</h1>
        <p className="text-muted-foreground">
          Configure your interview preferences for a personalized AI-powered experience
        </p>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Please fix the following issues:
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm text-destructive flex items-center">
                  <span className="w-1 h-1 bg-destructive rounded-full mr-2" />
                  {error}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Interview Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Interview Type</CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose the type of interview that matches your preparation goals
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {INTERVIEW_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <div
                  key={type.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    config.type === type.id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleTypeChange(type.id)}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{type.name}</span>
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {type.duration}m
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{type.description}</p>
                  <p className="text-xs text-muted-foreground">{type.questions}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Interview Mode */}
      <Card>
        <CardHeader>
          <CardTitle>Interview Mode</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select how you want to interact with the AI interviewer
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {INTERVIEW_MODES.map((mode) => {
              const Icon = mode.icon;
              return (
                <div
                  key={mode.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    config.mode === mode.id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleModeChange(mode.id)}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{mode.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{mode.description}</p>
                  <ul className="space-y-1">
                    {mode.features.map((feature, index) => (
                      <li key={index} className="text-xs text-muted-foreground flex items-center">
                        <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Interview Title *</Label>
              <Input
                id="title"
                value={config.title}
                onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Frontend Developer Interview"
                className={validationErrors.some(e => e.includes('title')) ? 'border-destructive' : ''}
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={config.duration}
                onChange={(e) => setConfig(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                min="15"
                max="120"
                className={validationErrors.some(e => e.includes('Duration')) ? 'border-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Recommended: {selectedType?.duration} minutes for {selectedType?.name} interviews
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Target Role *</Label>
              <Input
                id="role"
                value={config.target_role}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  target_role: e.target.value,
                  title: `${selectedType?.name} Interview - ${e.target.value}`
                }))}
                placeholder="e.g., Senior Frontend Developer"
                className={validationErrors.some(e => e.includes('role')) ? 'border-destructive' : ''}
              />
            </div>
            <div>
              <Label htmlFor="company">Target Company (Optional)</Label>
              <Input
                id="company"
                value={config.target_company}
                onChange={(e) => setConfig(prev => ({ ...prev, target_company: e.target.value }))}
                placeholder="e.g., Google, Microsoft"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="experience">Experience Level</Label>
            <Select 
              value={config.experience_level} 
              onValueChange={(value: any) => setConfig(prev => ({ ...prev, experience_level: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPERIENCE_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    <div>
                      <div>{level.label}</div>
                      <div className="text-xs text-muted-foreground">{level.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedExperience && (
              <p className="text-xs text-muted-foreground mt-1">
                {selectedExperience.description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Technical Configuration */}
      {(config.type === 'technical' || config.type === 'mixed' || config.type === 'system_design') && (
        <Card>
          <CardHeader>
            <CardTitle>Technical Focus</CardTitle>
            <p className="text-sm text-muted-foreground">
              Select technologies and areas you want to focus on during the interview
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Technology Stack {(config.type === 'technical' || config.type === 'mixed') && '*'}</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {TECH_STACKS.map((tech) => (
                  <Badge
                    key={tech}
                    variant={config.tech_stack?.includes(tech) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/80"
                    onClick={() => handleTechStackChange(tech)}
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
              {(config.type === 'technical' || config.type === 'mixed') && (
                <p className="text-xs text-muted-foreground mt-1">
                  * Select at least one technology for technical interviews
                </p>
              )}
            </div>

            <div>
              <Label>Focus Areas</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {FOCUS_AREAS.map((area) => (
                  <Badge
                    key={area}
                    variant={config.focus_areas?.includes(area) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/80"
                    onClick={() => handleFocusAreaChange(area)}
                  >
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resume Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Resume Integration</CardTitle>
          <p className="text-sm text-muted-foreground">
            Allow the AI to personalize questions based on your resume
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              checked={config.use_resume_context}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, use_resume_context: checked }))}
            />
            <Label>Use my resume to personalize questions</Label>
          </div>
          {config.use_resume_context && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Resume-based personalization enabled</p>
                  <p>The AI will ask specific questions about your experiences, projects, and skills mentioned in your resume. Make sure you have uploaded a recent resume to get the best experience.</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Instructions (Optional)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Provide any specific topics, scenarios, or focus areas you'd like to emphasize
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            value={config.custom_instructions}
            onChange={(e) => setConfig(prev => ({ ...prev, custom_instructions: e.target.value }))}
            placeholder="e.g., Focus on leadership scenarios, ask about microservices architecture, emphasize team management experience..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Summary and Start */}
      <Card>
        <CardHeader>
          <CardTitle>Interview Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span>{selectedType?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode:</span>
                <span>{selectedMode?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span>{config.duration} minutes</span>
              </div>
              {config.target_role && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role:</span>
                  <span>{config.target_role}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Experience:</span>
                <span>{selectedExperience?.label.split(' (')[0]}</span>
              </div>
              {config.tech_stack && config.tech_stack.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Technologies:</span>
                  <span>{config.tech_stack.length} selected</span>
                </div>
              )}
              {config.use_resume_context && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resume Context:</span>
                  <span className="text-green-600">Enabled</span>
                </div>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          <Button 
            onClick={startInterview} 
            disabled={isLoading || !config.title || !config.target_role}
            className="w-full"
            size="lg"
          >
            <Play className="h-5 w-5 mr-2" />
            {isLoading ? 'Creating Interview...' : 'Start Interview'}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center mt-2">
            Your interview will begin immediately after creation. Make sure you're in a quiet environment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}