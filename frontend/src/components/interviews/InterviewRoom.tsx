'use client';

import { useEffect, useState, useCallback, useRef, type SetStateAction } from 'react';
import { 
  LiveKitRoom, 
  VideoConference, 
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  useParticipants,
  useRoomContext,
  useLocalParticipant,
} from '@livekit/components-react';
import { 
    Track, 
    Room, 
    RoomEvent, 
    Participant,
    RemoteParticipant,
    ConnectionState,
  } from 'livekit-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  MessageSquare, 
  PhoneOff,
  Clock,
  User,
  Bot,
  Send,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import '@livekit/components-styles';

interface InterviewRoomProps {
  token: string;
  roomName: string;
  serverUrl: string;
  onLeave: () => void;
  interviewConfig: {
    title: string;
    type: string;
    mode: 'voice' | 'video' | 'text';
    duration: number;
  };
}

interface InterviewQuestion {
  question: string;
  type: string;
  difficulty: string;
  timestamp: string;
  index: number;
  time_estimate?: number;
}

interface InterviewMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: string;
  type: 'question' | 'response' | 'feedback' | 'hint' | 'system';
}

interface InterviewEvaluation {
  response_index: number;
  evaluation: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    specific_feedback: string;
    suggestions: string[];
  };
  feedback: string;
}

export function InterviewRoom({ 
  token, 
  roomName, 
  serverUrl, 
  onLeave, 
  interviewConfig 
}: InterviewRoomProps) {
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [showChat, setShowChat] = useState(interviewConfig.mode === 'text');
  const [textResponse, setTextResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [interviewProgress, setInterviewProgress] = useState(0);
  const [lastEvaluation, setLastEvaluation] = useState<InterviewEvaluation | null>(null);
  
  // Refs
  const roomRef = useRef<Room | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Timer effect
  useEffect(() => {
    if (!isConnected) return;
    
    const timer = setInterval(() => {
      setDuration(prev => {
        const newDuration = prev + 1;
        const targetDuration = interviewConfig.duration * 60;
        setInterviewProgress((newDuration / targetDuration) * 100);
        return newDuration;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isConnected, interviewConfig.duration]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  

  const getTimeRemaining = () => {
    const targetSeconds = interviewConfig.duration * 60;
    const remaining = Math.max(0, targetSeconds - duration);
    return formatDuration(remaining);
  };

  const onRoomConnected = useCallback((room: Room) => {
    console.log('Connected to interview room:', room.name);
    roomRef.current = room;
    setIsConnected(true);
    setConnectionStatus('connected');
    
    // Add welcome message
    addMessage({
      id: 'welcome',
      content: `Welcome to your ${interviewConfig.type} interview! The AI interviewer will join shortly and begin with a greeting.`,
      sender: 'ai',
      timestamp: new Date().toISOString(),
      type: 'system'
    });
    
    // Listen for data messages (questions, feedback, etc.)
    room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant) => {
      if (participant) {
        try {
          const message = JSON.parse(new TextDecoder().decode(payload));
          handleAIMessage(message);
        } catch (error) {
          console.error('Error parsing AI message:', error);
        }
      }
    });

    // Listen for connection state changes
    room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
      if (state === ConnectionState.Connected) {
        setConnectionStatus('connected');
      } else if (state === ConnectionState.Disconnected) {
        setConnectionStatus('disconnected');
      }
    });

    // Listen for participant events
    room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      if (participant.identity.includes('ai-agent')) {
        addMessage({
          id: `agent-joined-${Date.now()}`,
          content: 'AI Interviewer has joined the session.',
          sender: 'ai',
          timestamp: new Date().toISOString(),
          type: 'system'
        });
      }
    });

  }, [interviewConfig]);

  const onRoomDisconnected = useCallback(() => {
    console.log('Disconnected from interview room');
    setIsConnected(false);
    setConnectionStatus('disconnected');
    roomRef.current = null;
  }, []);

  const handleAIMessage = (message: any) => {
    const { type, data } = message;
    
    switch (type) {
      case 'question':
        const questionData = data as InterviewQuestion;
        setCurrentQuestion(questionData);
        addMessage({
          id: `q-${questionData.index}`,
          content: questionData.question,
          sender: 'ai',
          timestamp: questionData.timestamp,
          type: 'question'
        });
        break;
        
      case 'evaluation':
        const evalData = data as InterviewEvaluation;
        setLastEvaluation(evalData);
        addMessage({
          id: `eval-${evalData.response_index}`,
          content: evalData.feedback,
          sender: 'ai',
          timestamp: new Date().toISOString(),
          type: 'feedback'
        });
        break;
        
      case 'final_feedback':
        addMessage({
          id: `final-${Date.now()}`,
          content: 'Interview completed! You\'ll receive comprehensive feedback shortly.',
          sender: 'ai',
          timestamp: new Date().toISOString(),
          type: 'system'
        });
        break;
        
      case 'hint':
        addMessage({
          id: `hint-${Date.now()}`,
          content: data.hint || 'Here\'s a hint to help you with your response.',
          sender: 'ai',
          timestamp: new Date().toISOString(),
          type: 'hint'
        });
        break;
        
      default:
        console.log('Unknown message type:', type);
    }
  };

  const addMessage = (message: InterviewMessage) => {
    setMessages(prev => [...prev, message]);
  };

  const sendTextResponse = async () => {
    if (!textResponse.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Add user message to chat
      const userMessage: InterviewMessage = {
        id: `response-${Date.now()}`,
        content: textResponse.trim(),
        sender: 'user',
        timestamp: new Date().toISOString(),
        type: 'response'
      };
      
      addMessage(userMessage);
      
      // Send to AI agent via data channel
      if (roomRef.current) {
        const messageData = {
          type: 'response_submitted',
          data: {
            response: textResponse.trim(),
            question_index: currentQuestion?.index,
            timestamp: new Date().toISOString()
          }
        };
        
        await roomRef.current.localParticipant.publishData(
            new TextEncoder().encode(JSON.stringify(messageData)),
            { reliable: true }
          );
      }
      
      setTextResponse('');
    } catch (error) {
      console.error('Error sending response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestHint = async () => {
    if (!roomRef.current) return;
    
    try {
      const messageData = {
        type: 'request_hint',
        data: {
          question_index: currentQuestion?.index,
          timestamp: new Date().toISOString()
        }
      };
      
      await roomRef.current.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify(messageData)),
        { reliable: true }
      );
      
      addMessage({
        id: `hint-request-${Date.now()}`,
        content: 'Requested a hint from the interviewer...',
        sender: 'user',
        timestamp: new Date().toISOString(),
        type: 'system'
      });
    } catch (error) {
      console.error('Error requesting hint:', error);
    }
  };

  const requestClarification = async () => {
    if (!roomRef.current) return;
    
    try {
      const messageData = {
        type: 'request_clarification',
        data: {
          request: 'Could you please clarify this question?',
          question_index: currentQuestion?.index,
          timestamp: new Date().toISOString()
        }
      };
      
      await roomRef.current.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify(messageData)),
        { reliable: true }
      );
      
      addMessage({
        id: `clarification-request-${Date.now()}`,
        content: 'Requested clarification from the interviewer...',
        sender: 'user',
        timestamp: new Date().toISOString(),
        type: 'system'
      });
    } catch (error) {
      console.error('Error requesting clarification:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextResponse();
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-xl font-semibold">{interviewConfig.title}</h1>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Badge variant="outline">{interviewConfig.type}</Badge>
                <Badge variant="outline">{interviewConfig.mode}</Badge>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(duration)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>Remaining: {getTimeRemaining()}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs ${
              connectionStatus === 'connected' 
                ? 'bg-green-100 text-green-800' 
                : connectionStatus === 'connecting'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="capitalize">{connectionStatus}</span>
            </div>
            
            <Button 
              variant="destructive" 
              onClick={onLeave}
              className="flex items-center space-x-2"
            >
              <PhoneOff className="h-4 w-4" />
              <span>End Interview</span>
            </Button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <Progress value={Math.min(interviewProgress, 100)} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video/Audio Section */}
        {interviewConfig.mode !== 'text' && (
          <div className="flex-1">
            <LiveKitRoom
              token={token}
              serverUrl={serverUrl}
              connect={true}
              onConnected={onRoomConnected}
              onDisconnected={onRoomDisconnected}
              audio={true}
              video={interviewConfig.mode === 'video'}
              className="h-full"
            >
              <InterviewVideoLayout mode={interviewConfig.mode} />
              <RoomAudioRenderer />
            </LiveKitRoom>
          </div>
        )}

        {/* Sidebar for Questions and Chat */}
        <div className={`border-l bg-card ${interviewConfig.mode === 'text' ? 'flex-1' : 'w-96'}`}>
          <div className="h-full flex flex-col">
            {/* Current Question */}
            {currentQuestion && (
              <div className="p-4 border-b">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <div className="flex items-center">
                        <Bot className="h-4 w-4 mr-2" />
                        Current Question
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {currentQuestion.difficulty}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-3">{currentQuestion.question}</p>
                    
                    {currentQuestion.time_estimate && (
                      <div className="flex items-center text-xs text-muted-foreground mb-2">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Estimated time: {currentQuestion.time_estimate} minutes</span>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={requestHint}
                        className="flex items-center space-x-1"
                      >
                        <Lightbulb className="h-3 w-3" />
                        <span>Hint</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={requestClarification}
                        className="flex items-center space-x-1"
                      >
                        <HelpCircle className="h-3 w-3" />
                        <span>Clarify</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Latest Evaluation */}
            {lastEvaluation && (
              <div className="p-4 border-b">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Latest Feedback
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Score:</span>
                        <Badge variant={lastEvaluation.evaluation.score >= 75 ? "default" : "secondary"}>
                          {Math.round(lastEvaluation.evaluation.score)}/100
                        </Badge>
                      </div>
                      
                      {lastEvaluation.evaluation.strengths.length > 0 && (
                        <div>
                          <span className="font-medium text-green-700">Strengths:</span>
                          <p className="text-xs text-muted-foreground">
                            {lastEvaluation.evaluation.strengths[0]}
                          </p>
                        </div>
                      )}
                      
                      {lastEvaluation.evaluation.suggestions.length > 0 && (
                        <div>
                          <span className="font-medium text-blue-700">Suggestion:</span>
                          <p className="text-xs text-muted-foreground">
                            {lastEvaluation.evaluation.suggestions[0]}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Chat/Messages */}
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b">
                <h3 className="font-medium flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Interview Log
                </h3>
              </div>
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-lg ${
                        message.sender === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : message.type === 'system'
                          ? 'bg-muted border border-border'
                          : message.type === 'hint'
                          ? 'bg-blue-50 border border-blue-200'
                          : message.type === 'feedback'
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-muted'
                      }`}>
                        <div className="flex items-center space-x-2 mb-1">
                          {message.sender === 'ai' ? (
                            <Bot className="h-3 w-3" />
                          ) : (
                            <User className="h-3 w-3" />
                          )}
                          <span className="text-xs opacity-70">
                            {message.sender === 'ai' ? 'AI Interviewer' : 'You'}
                          </span>
                          <Badge variant="outline" size="sm" className="text-xs">
                            {message.type}
                          </Badge>
                          {message.type === 'feedback' && (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          )}
                          {message.type === 'hint' && (
                            <Lightbulb className="h-3 w-3 text-blue-500" />
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Text Input for Text Mode or Additional Comments */}
              <div className="p-4 border-t">
                <div className="space-y-2">
                  <Textarea
                    value={textResponse}
                    onChange={(e: { target: { value: SetStateAction<string>; }; }) => setTextResponse(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      interviewConfig.mode === 'text' 
                        ? "Type your response here..." 
                        : "Send a message or clarification..."
                    }
                    className="min-h-[80px] resize-none"
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      {interviewConfig.mode === 'text' ? 'Press Enter to send (Shift+Enter for new line)' : 'Optional text communication'}
                    </div>
                    <Button 
                      onClick={sendTextResponse} 
                      disabled={!textResponse.trim() || isSubmitting}
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <Send className="h-3 w-3" />
                      <span>{isSubmitting ? 'Sending...' : 'Send'}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Video Layout Component
function InterviewVideoLayout({ mode }: { mode: string }) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();

  if (mode === 'video') {
    return (
      <div className="h-full relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-full p-4">
          {/* Local participant */}
          <ParticipantTile
            participant={localParticipant}
            className="rounded-lg overflow-hidden"
          />
          
          {/* Remote participants (AI agent) */}
          {participants
            .filter((p: Participant) => p.identity !== localParticipant.identity)
            .map((participant: Participant) => (
              <ParticipantTile
                key={participant.identity}
                participant={participant}
                className="rounded-lg overflow-hidden"
              />
            ))}
        </div>
        
        {/* Controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <ControlBar
            controls={{
              microphone: true,
              camera: true,
              chat: false,
              screenShare: false,
              leave: false,
            }}
          />
        </div>
      </div>
    );
  } else {
    // Voice-only mode - show avatar/name
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center space-y-6">
          <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center mx-auto">
            <Bot className="h-16 w-16 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-medium">AI Interviewer</h3>
            <p className="text-sm text-muted-foreground">Voice Interview in Progress</p>
          </div>
          
          {/* Voice activity indicators */}
          <div className="flex justify-center space-x-4">
            {participants.map((participant: Participant) => (
              <div key={participant.identity} className="text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  participant.isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                }`}>
                  {participant.identity.includes('ai-agent') ? (
                    <Bot className="h-6 w-6 text-white" />
                  ) : (
                    <User className="h-6 w-6 text-white" />
                  )}
                </div>
                <p className="text-xs mt-1">
                  {participant.identity.includes('ai-agent') ? 'AI' : 'You'}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <ControlBar
            controls={{
              microphone: true,
              camera: false,
              chat: false,
              screenShare: false,
              leave: false,
            }}
          />
        </div>
      </div>
    );
  }
}