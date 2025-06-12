"""
AI Interview Agent for TheTruthSchool.

This module provides the main AI agent for conducting real-time mock interviews
using LiveKit agents framework with comprehensive AI integration.
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum

from livekit import agents, rtc
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    RunContext,
    WorkerOptions,
    cli,
    function_tool,
)
from livekit.plugins import openai, deepgram, elevenlabs, silero

from app.core.config import settings
from app.models.interview import InterviewType, InterviewMode
from app.agents.agent_utils import QuestionBank, ResponseEvaluator, FeedbackGenerator
from app.services.interview_service import InterviewService

logger = logging.getLogger(__name__)


class InterviewState(Enum):
    """Interview session states."""
    INITIALIZING = "initializing"
    GREETING = "greeting"
    QUESTIONING = "questioning"
    EVALUATING = "evaluating"
    CONCLUDING = "concluding"
    COMPLETED = "completed"
    ERROR = "error"


@dataclass
class InterviewProgress:
    """Track interview progress and metrics."""
    current_question_index: int = 0
    questions_asked: List[Dict[str, Any]] = None
    responses_received: List[Dict[str, Any]] = None
    start_time: Optional[datetime] = None
    last_activity: Optional[datetime] = None
    state: InterviewState = InterviewState.INITIALIZING
    
    def __post_init__(self):
        if self.questions_asked is None:
            self.questions_asked = []
        if self.responses_received is None:
            self.responses_received = []


class InterviewAgent:
    """
    Advanced AI Interview Agent for TheTruthSchool.
    
    Features:
    - Multi-modal interview support (voice, video, text)
    - Adaptive questioning based on interview type and responses
    - Real-time response evaluation and feedback
    - Resume-based personalized questioning
    - Comprehensive interview analytics
    """
    
    def __init__(
        self,
        session_id: str,
        interview_config: Dict[str, Any],
        user_resume: Optional[Dict[str, Any]] = None
    ):
        self.session_id = session_id
        self.config = interview_config
        self.user_resume = user_resume
        self.progress = InterviewProgress()
        
        # Initialize components
        self.question_bank = QuestionBank(
            interview_type=interview_config.get('type', 'behavioral'),
            experience_level=interview_config.get('experience_level', 'mid'),
            tech_stack=interview_config.get('tech_stack', []),
            focus_areas=interview_config.get('focus_areas', [])
        )
        
        self.evaluator = ResponseEvaluator()
        self.feedback_generator = FeedbackGenerator()
        self.interview_service = InterviewService()
        
        # Session tracking
        self.room_participants = set()
        self.current_question = None
        self.waiting_for_response = False
        
        logger.info(f"Interview agent initialized for session {session_id}")

    async def entrypoint(self, ctx: JobContext):
        """Main entrypoint for the AI interview agent."""
        try:
            logger.info(f"Agent starting for room: {ctx.room.name}")
            
            # Connect to room
            await ctx.connect()
            self.progress.start_time = datetime.utcnow()
            self.progress.state = InterviewState.GREETING
            
            # Initialize agent with dynamic instructions
            agent = Agent(
                instructions=self._get_agent_instructions(),
                tools=[
                    self._ask_next_question,
                    self._evaluate_response,
                    self._provide_hint,
                    self._conclude_interview,
                    self._handle_clarification,
                ],
            )
            
            # Configure session based on interview mode
            session_config = self._get_session_config()
            session = AgentSession(**session_config)
            
            # Set up event handlers
            await self._setup_event_handlers(ctx)
            
            # Start the interview
            await session.start(agent=agent, room=ctx.room)
            
            # Begin with greeting
            await session.generate_reply(
                instructions=self._get_greeting_instructions()
            )
            
            # Mark interview as started in database
            await self._update_interview_status("started")
            
            # Start interview monitoring
            await self._monitor_interview_progress(session)
            
        except Exception as e:
            logger.error(f"Error in interview agent: {e}", exc_info=True)
            self.progress.state = InterviewState.ERROR
            await self._handle_agent_error(e)
            raise

    def _get_agent_instructions(self) -> str:
        """Generate comprehensive agent instructions."""
        interview_type = self.config.get('type', 'behavioral')
        target_role = self.config.get('target_role', 'Software Developer')
        experience_level = self.config.get('experience_level', 'mid-level')
        duration = self.config.get('duration', 30)
        
        instructions = f"""
You are Alex, a professional and empathetic AI interviewer at TheTruthSchool. You're conducting a {interview_type} interview for a {target_role} position with a {experience_level} candidate.

## Core Responsibilities:
1. Conduct a structured, engaging {interview_type} interview
2. Ask relevant, progressive questions that build on previous responses
3. Provide constructive, encouraging feedback throughout
4. Adapt your questioning style based on candidate responses
5. Maintain professional yet warm demeanor
6. Evaluate responses for clarity, depth, and relevance

## Interview Guidelines:
- Duration: Approximately {duration} minutes
- Ask 1 question at a time and wait for complete responses
- Use follow-up questions to explore interesting points
- Provide specific, actionable feedback
- Encourage detailed examples using the STAR method (Situation, Task, Action, Result)
- Be patient and supportive, especially with nervous candidates

## Question Flow:
1. Start with easier questions to build confidence
2. Progress to more challenging scenarios
3. Ask behavioral questions that reveal problem-solving approaches
4. Conclude with candidate questions and next steps

## Response Evaluation Criteria:
- Clarity and structure of communication
- Specific examples and evidence
- Problem-solving approach and methodology
- Self-awareness and learning mindset
- Relevance to the role and experience level

## Feedback Style:
- Always start with positive observations
- Provide specific, actionable improvement suggestions
- Use encouraging language that builds confidence
- Reference specific parts of their responses
- Offer concrete tips for future interviews
"""

        # Add resume-specific instructions
        if self.user_resume:
            instructions += f"""

## Resume Context:
You have access to the candidate's resume. Use this information to:
- Ask specific questions about their listed experiences
- Reference their projects, achievements, and skills
- Explore discrepancies or interesting patterns
- Validate claims with detailed follow-up questions
- Connect their background to the target role

Key Resume Highlights:
- Experience: {self._extract_resume_summary()}
- Skills: {', '.join(self.user_resume.get('skills', [])[:5])}
- Recent Role: {self._get_most_recent_role()}
"""

        # Add technical focus for technical interviews
        if interview_type in ['technical', 'system_design', 'mixed']:
            tech_stack = ', '.join(self.config.get('tech_stack', []))
            instructions += f"""

## Technical Focus:
- Technology Stack: {tech_stack}
- Focus on practical experience and problem-solving
- Ask about specific implementations and challenges
- Explore system design thinking and trade-offs
- Assess understanding of best practices and patterns
"""

        return instructions

    def _get_session_config(self) -> Dict[str, Any]:
        """Configure LiveKit session based on interview mode."""
        interview_mode = self.config.get('mode', InterviewMode.VOICE)
        
        config = {
            'llm': openai.LLM(
                model=settings.OPENAI_MODEL,
                temperature=settings.OPENAI_TEMPERATURE,
            )
        }
        
        if interview_mode in [InterviewMode.VOICE, InterviewMode.VIDEO]:
            # Voice/Video mode configuration
            config.update({
                'vad': silero.VAD.load(
                    # Optimize for interview scenarios
                    min_silence_duration=1.0,  # Allow thinking pauses
                    min_speech_duration=0.3,
                ),
                'stt': deepgram.STT(
                    model=settings.DEEPGRAM_MODEL,
                    language="en",
                    interim_results=True,
                    punctuate=True,
                    smart_format=True,
                ),
                'tts': elevenlabs.TTS(
                    voice=settings.ELEVENLABS_VOICE_ID,
                    model=settings.ELEVENLABS_MODEL,
                    # Optimize for professional interview tone
                    stability=0.85,
                    similarity_boost=0.75,
                ),
            })
        
        return config

    def _get_greeting_instructions(self) -> str:
        """Generate personalized greeting instructions."""
        target_role = self.config.get('target_role', 'Software Developer')
        candidate_name = self.config.get('candidate_name', 'candidate')
        
        return f"""
Greet {candidate_name} warmly and professionally. Introduce yourself as Alex, their AI interviewer from TheTruthSchool. 

Brief them on the interview:
- This is a mock {self.config.get('type', 'behavioral')} interview for a {target_role} position
- Duration: approximately {self.config.get('duration', 30)} minutes
- Format: structured conversation with questions and feedback
- Encourage them to provide detailed examples and think out loud

Ask if they're comfortable and ready to begin. Set a positive, encouraging tone.
Keep the introduction concise but friendly.
"""

    async def _setup_event_handlers(self, ctx: JobContext):
        """Set up event handlers for room events."""
        
        @ctx.room.on("participant_connected")
        def on_participant_connected(participant: rtc.RemoteParticipant):
            logger.info(f"Participant connected: {participant.identity}")
            self.room_participants.add(participant.identity)
        
        @ctx.room.on("participant_disconnected")
        def on_participant_disconnected(participant: rtc.RemoteParticipant):
            logger.info(f"Participant disconnected: {participant.identity}")
            self.room_participants.discard(participant.identity)
            
            # Handle early disconnection
            if len(self.room_participants) == 0:
                asyncio.create_task(self._handle_early_exit())
        
        @ctx.room.on("data_received")
        async def on_data_received(data: rtc.DataPacket, participant: rtc.RemoteParticipant):
            try:
                message = json.loads(data.data.decode())
                await self._handle_data_message(message, participant)
            except Exception as e:
                logger.error(f"Error handling data message: {e}")

    @function_tool
    async def _ask_next_question(self, ctx: RunContext) -> str:
        """Generate and ask the next interview question."""
        try:
            # Check if interview should continue
            if not self._should_continue_interview():
                return await self._conclude_interview(ctx)
            
            # Get next question from question bank
            question_data = await self.question_bank.get_next_question(
                current_index=self.progress.current_question_index,
                previous_responses=self.progress.responses_received,
                user_resume=self.user_resume
            )
            
            if not question_data:
                return await self._conclude_interview(ctx)
            
            # Track the question
            question_record = {
                'question': question_data['question'],
                'type': question_data['type'],
                'difficulty': question_data.get('difficulty', 'medium'),
                'timestamp': datetime.utcnow().isoformat(),
                'index': self.progress.current_question_index
            }
            
            self.progress.questions_asked.append(question_record)
            self.current_question = question_record
            self.waiting_for_response = True
            self.progress.current_question_index += 1
            self.progress.state = InterviewState.QUESTIONING
            
            # Send question to frontend via data channel
            await self._send_data_message({
                'type': 'question',
                'data': question_record
            })
            
            # Save progress
            await self._save_interview_progress()
            
            logger.info(f"Asked question {self.progress.current_question_index}: {question_data['question'][:50]}...")
            
            return f"Here's your next question:\n\n{question_data['question']}\n\nTake your time to think through your response."
            
        except Exception as e:
            logger.error(f"Error asking next question: {e}")
            return "I apologize, let me think of an appropriate question for you."

    @function_tool
    async def _evaluate_response(self, ctx: RunContext, response: str) -> str:
        """Evaluate user response and provide feedback."""
        try:
            if not self.current_question or not response.strip():
                return "I didn't catch your response clearly. Could you please repeat that?"
            
            # Record the response
            response_record = {
                'response': response,
                'question_index': self.current_question['index'],
                'timestamp': datetime.utcnow().isoformat(),
                'question_type': self.current_question.get('type', 'general')
            }
            
            self.progress.responses_received.append(response_record)
            self.progress.last_activity = datetime.utcnow()
            self.progress.state = InterviewState.EVALUATING
            self.waiting_for_response = False
            
            # Evaluate the response
            evaluation = await self.evaluator.evaluate_response(
                question=self.current_question['question'],
                response=response,
                question_type=self.current_question.get('type', 'behavioral'),
                context={
                    'target_role': self.config.get('target_role'),
                    'experience_level': self.config.get('experience_level'),
                    'interview_progress': len(self.progress.responses_received)
                }
            )
            
            # Generate contextual feedback
            feedback = await self.feedback_generator.generate_response_feedback(
                evaluation=evaluation,
                is_early_interview=len(self.progress.responses_received) <= 2
            )
            
            # Send evaluation to frontend
            await self._send_data_message({
                'type': 'evaluation',
                'data': {
                    'response_index': len(self.progress.responses_received) - 1,
                    'evaluation': evaluation,
                    'feedback': feedback
                }
            })
            
            # Save progress
            await self._save_interview_progress()
            
            logger.info(f"Evaluated response {len(self.progress.responses_received)}")
            
            return feedback
            
        except Exception as e:
            logger.error(f"Error evaluating response: {e}")
            return "Thank you for that response. Let's continue with the next question."

    @function_tool
    async def _provide_hint(self, ctx: RunContext) -> str:
        """Provide a helpful hint for the current question."""
        if not self.current_question:
            return "I don't have a specific hint right now. Feel free to ask me to clarify the question."
        
        question_type = self.current_question.get('type', 'behavioral')
        
        hints = {
            'behavioral': "Think about a specific situation from your past. Use the STAR method: describe the Situation, your Task, the Actions you took, and the Results achieved.",
            'technical': "Break down the problem step by step. Explain your thought process, consider edge cases, and discuss any trade-offs in your approach.",
            'system_design': "Start with understanding the requirements. Think about scale, identify key components, and discuss how they interact. Don't forget about data storage and potential bottlenecks.",
            'problem_solving': "Walk me through your thinking process. What's your approach to breaking down complex problems? What factors would you consider?"
        }
        
        base_hint = hints.get(question_type, hints['behavioral'])
        
        return f"Here's a hint to help you structure your response: {base_hint}\n\nTake your time and provide specific examples where possible."

    @function_tool
    async def _handle_clarification(self, ctx: RunContext, request: str) -> str:
        """Handle clarification requests from the candidate."""
        if not self.current_question:
            return "What would you like me to clarify?"
        
        # Use AI to provide intelligent clarification
        clarification_prompt = f"""
The candidate asked for clarification: "{request}"

The current question is: "{self.current_question['question']}"

Provide a helpful clarification that:
1. Addresses their specific concern
2. Doesn't give away the answer
3. Helps them understand what you're looking for
4. Encourages them to provide a detailed response
"""
        
        try:
            # This would use the LLM to generate appropriate clarification
            # For now, provide a generic helpful response
            return f"Good question! Let me clarify: {self.current_question['question']}\n\nI'm looking for a specific example from your experience where you can walk me through your thought process and the outcome. Does that help?"
        except Exception as e:
            logger.error(f"Error providing clarification: {e}")
            return "Let me rephrase the question to make it clearer..."

    @function_tool
    async def _conclude_interview(self, ctx: RunContext) -> str:
        """Conclude the interview and provide comprehensive feedback."""
        try:
            self.progress.state = InterviewState.CONCLUDING
            
            # Generate comprehensive feedback
            final_feedback = await self.feedback_generator.generate_final_feedback(
                questions_asked=self.progress.questions_asked,
                responses_received=self.progress.responses_received,
                interview_config=self.config,
                duration_minutes=self._get_interview_duration()
            )
            
            # Send final feedback to frontend
            await self._send_data_message({
                'type': 'final_feedback',
                'data': final_feedback
            })
            
            # Mark interview as completed
            await self._update_interview_status("completed", final_feedback)
            
            self.progress.state = InterviewState.COMPLETED
            
            logger.info(f"Interview completed for session {self.session_id}")
            
            conclusion = f"""
Thank you for participating in this mock interview! You did a great job.

## Quick Summary:
- Questions covered: {len(self.progress.questions_asked)}
- Interview duration: {self._get_interview_duration()} minutes
- Overall performance: {final_feedback.get('overall_rating', 'Good')}

## Key Strengths:
{self._format_feedback_list(final_feedback.get('strengths', []))}

## Areas for Improvement:
{self._format_feedback_list(final_feedback.get('improvements', []))}

You'll receive a detailed written report with specific recommendations for your continued preparation. 

Best of luck with your job search! Remember, practice makes perfect, and you're on the right track.
"""
            
            return conclusion
            
        except Exception as e:
            logger.error(f"Error concluding interview: {e}")
            return "Thank you for the interview! You'll receive detailed feedback shortly."

    async def _monitor_interview_progress(self, session: AgentSession):
        """Monitor interview progress and handle timeouts."""
        max_duration = timedelta(minutes=self.config.get('duration', 30) + 5)  # 5min buffer
        start_time = self.progress.start_time
        
        while self.progress.state not in [InterviewState.COMPLETED, InterviewState.ERROR]:
            await asyncio.sleep(30)  # Check every 30 seconds
            
            current_time = datetime.utcnow()
            elapsed = current_time - start_time
            
            # Check for timeout
            if elapsed > max_duration:
                logger.warning(f"Interview timeout for session {self.session_id}")
                await session.generate_reply(
                    instructions="The interview time has been reached. Please conclude the interview gracefully and provide final feedback."
                )
                break
            
            # Check for inactivity (10 minutes without response)
            if (self.progress.last_activity and 
                current_time - self.progress.last_activity > timedelta(minutes=10)):
                logger.warning(f"Interview inactivity timeout for session {self.session_id}")
                await session.generate_reply(
                    instructions="The candidate seems to have become inactive. Check if they're still there and conclude if needed."
                )
                break

    def _should_continue_interview(self) -> bool:
        """Determine if the interview should continue."""
        max_questions = min(
            self.config.get('max_questions', settings.MAX_QUESTIONS_PER_INTERVIEW),
            self.question_bank.get_total_available_questions()
        )
        min_questions = max(
            self.config.get('min_questions', settings.MIN_QUESTIONS_PER_INTERVIEW),
            3
        )
        
        questions_asked = len(self.progress.questions_asked)
        
        # Continue if we haven't reached minimum questions
        if questions_asked < min_questions:
            return True
        
        # Stop if we've reached maximum questions
        if questions_asked >= max_questions:
            return False
        
        # Continue based on time and engagement
        duration_minutes = self._get_interview_duration()
        target_duration = self.config.get('duration', 30)
        
        return duration_minutes < target_duration * 1.2  # 20% buffer

    def _get_interview_duration(self) -> int:
        """Get current interview duration in minutes."""
        if not self.progress.start_time:
            return 0
        
        elapsed = datetime.utcnow() - self.progress.start_time
        return int(elapsed.total_seconds() / 60)

    def _format_feedback_list(self, items: List[str]) -> str:
        """Format feedback list for display."""
        if not items:
            return "• None identified"
        
        return '\n'.join(f"• {item}" for item in items[:3])  # Show top 3

    def _extract_resume_summary(self) -> str:
        """Extract key points from resume for context."""
        if not self.user_resume:
            return "No resume provided"
        
        experiences = self.user_resume.get('experiences', [])
        if experiences:
            recent = experiences[0]
            return f"{recent.get('title', 'Unknown')} at {recent.get('company', 'Unknown')}"
        
        return "Experience details not available"

    def _get_most_recent_role(self) -> str:
        """Get the most recent role from resume."""
        if not self.user_resume:
            return "Not specified"
        
        experiences = self.user_resume.get('experiences', [])
        if experiences:
            return f"{experiences[0].get('title', 'Unknown Role')}"
        
        return "Not specified"

    async def _send_data_message(self, message: Dict[str, Any]):
        """Send data message to frontend participants."""
        try:
            data = json.dumps(message).encode()
            # This would be implemented with the actual room context
            # For now, we'll log the message
            logger.info(f"Sending data message: {message.get('type')}")
        except Exception as e:
            logger.error(f"Error sending data message: {e}")

    async def _save_interview_progress(self):
        """Save current interview progress to database."""
        try:
            progress_data = {
                'current_question_index': self.progress.current_question_index,
                'questions_asked': self.progress.questions_asked,
                'responses_received': self.progress.responses_received,
                'state': self.progress.state.value,
                'start_time': self.progress.start_time.isoformat() if self.progress.start_time else None,
                'last_activity': self.progress.last_activity.isoformat() if self.progress.last_activity else None,
                'updated_at': datetime.utcnow().isoformat()
            }
            
            await self.interview_service.save_progress(
                self.session_id,
                progress_data
            )
        except Exception as e:
            logger.error(f"Error saving interview progress: {e}")

    async def _update_interview_status(self, status: str, data: Optional[Dict[str, Any]] = None):
        """Update interview status in database."""
        try:
            if status == "started":
                await self.interview_service.start_session(self.session_id)
            elif status == "completed":
                await self.interview_service.complete_session(
                    self.session_id,
                    data or {}
                )
        except Exception as e:
            logger.error(f"Error updating interview status: {e}")

    async def _handle_early_exit(self):
        """Handle when candidate leaves early."""
        logger.info(f"Handling early exit for session {self.session_id}")
        
        # Save partial progress
        await self._update_interview_status("incomplete", {
            'reason': 'early_exit',
            'questions_completed': len(self.progress.questions_asked),
            'responses_completed': len(self.progress.responses_received),
            'duration_minutes': self._get_interview_duration()
        })

    async def _handle_agent_error(self, error: Exception):
        """Handle agent errors gracefully."""
        logger.error(f"Agent error in session {self.session_id}: {error}")
        
        await self._update_interview_status("error", {
            'error_type': type(error).__name__,
            'error_message': str(error),
            'timestamp': datetime.utcnow().isoformat()
        })

    async def _handle_data_message(self, message: Dict[str, Any], participant):
        """Handle data messages from frontend."""
        message_type = message.get('type')
        
        if message_type == 'response_submitted':
            # Handle text-mode responses
            response_text = message.get('data', {}).get('response', '')
            if response_text and self.waiting_for_response:
                # Process the text response
                await self._evaluate_response(None, response_text)
        
        elif message_type == 'request_hint':
            # Handle hint requests
            await self._provide_hint(None)
        
        elif message_type == 'request_clarification':
            # Handle clarification requests
            clarification_text = message.get('data', {}).get('request', '')
            await self._handle_clarification(None, clarification_text)


# Agent Entry Point
async def interview_agent_entrypoint(ctx: JobContext):
    """
    Main entry point for interview agents.
    
    This function is called by the LiveKit agent worker when a new
    interview session is created.
    """
    try:
        logger.info(f"Starting interview agent for room: {ctx.room.name}")
        
        # Extract session configuration from room metadata
        room_metadata = ctx.room.metadata
        if not room_metadata:
            logger.error("No room metadata found")
            return
        
        try:
            session_config = json.loads(room_metadata)
        except json.JSONDecodeError:
            logger.error("Invalid room metadata JSON")
            return
        
        session_id = session_config.get('session_id')
        interview_config = session_config.get('interview_config', {})
        user_resume = session_config.get('user_resume')
        
        if not session_id:
            logger.error("No session_id found in room metadata")
            return
        
        logger.info(f"Creating interview agent for session {session_id}")
        
        # Create and start the interview agent
        agent = InterviewAgent(
            session_id=session_id,
            interview_config=interview_config,
            user_resume=user_resume
        )
        
        await agent.entrypoint(ctx)
        
    except Exception as e:
        logger.error(f"Error in interview agent entrypoint: {e}", exc_info=True)
        raise


# Worker Entry Point
if __name__ == "__main__":
    logging.basicConfig(
        level=getattr(logging, settings.AGENT_LOG_LEVEL),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Run the agent worker
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=interview_agent_entrypoint,
            host=settings.AGENT_WORKER_HOST,
            port=settings.AGENT_WORKER_PORT,
        )
    )