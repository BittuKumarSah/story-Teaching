import json
import os
from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
from app.core.config import settings
from app.schemas import (
    StoryRequest, LearningObjectiveSchema, QuestionSchema,
    DifficultyLevel, QuestionType
)


class AIService:
    def __init__(self):
        self.provider = settings.AI_PROVIDER
        if self.provider == "openai" and settings.OPENAI_API_KEY:
            self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        elif self.provider == "anthropic" and settings.ANTHROPIC_API_KEY:
            self.anthropic_client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        else:
            self.openai_client = None
            self.anthropic_client = None

    def _get_age_characteristics(self, age: int) -> Dict[str, Any]:
        if age <= 7:
            return {
                "vocabulary": "very simple, common words only",
                "sentence_length": "short (5-8 words)",
                "story_complexity": "simple linear plot, familiar objects, visual storytelling",
                "characters": "1-2 friendly characters, animals or toys",
                "examples": "everyday objects like apples, toys, blocks",
                "question_difficulty": "simple recognition, matching, basic MCQs, one-step questions"
            }
        elif age <= 9:
            return {
                "vocabulary": "moderate, age-appropriate words",
                "sentence_length": "medium (8-12 words)",
                "story_complexity": "dialogue, simple problems, 2-3 characters, more explanation",
                "characters": "2-3 relatable characters with simple personalities",
                "examples": "school situations, playground, home activities",
                "question_difficulty": "MCQs, fill-in-the-blank, basic application and sequencing"
            }
        else:
            return {
                "vocabulary": "richer vocabulary, some challenging words",
                "sentence_length": "varied (10-15 words)",
                "story_complexity": "deeper reasoning, richer plot, real-world applications",
                "characters": "multiple characters with distinct traits, real-world roles",
                "examples": "real-world scenarios, science experiments, math in daily life",
                "question_difficulty": "application, scenario-based, multi-step and reasoning questions"
            }

    def _build_story_prompt(self, request: StoryRequest) -> str:
        age_chars = self._get_age_characteristics(request.age)
        
        return f"""You are an expert educational storyteller for children aged {request.age}. Create an engaging, age-appropriate story that naturally teaches the concept of "{request.topic}" ({request.subject or 'General'}). 

CHILD PROFILE:
- Age: {request.age}
- Difficulty: {request.difficulty.value}
- Language: {request.language}

AGE-APPROPRIATE GUIDELINES:
- Vocabulary: {age_chars['vocabulary']}
- Sentence length: {age_chars['sentence_length']}
- Story complexity: {age_chars['story_complexity']}
- Characters: {age_chars['characters']}
- Examples: {age_chars['examples']}
- Question difficulty: {age_chars['question_difficulty']}

STORY STRUCTURE (follow this arc):
1. Introduction - Introduce main character(s) and setting
2. Problem - Character encounters a relatable problem
3. Concept Introduction - Educational concept appears naturally as part of solving the problem
4. Application - Character uses the concept to make progress
5. Reinforcement - Concept is reinforced through another example or reflection
6. Resolution - Problem is solved using the concept
7. Learning Takeaway - Clear summary of what was learned

REQUIREMENTS:
- Story must be engaging and complete (not a summary)
- Educational concept must be woven naturally into the narrative
- Include 3-5 explicit learning objectives
- Generate 5-8 questions linked to specific learning objectives
- Questions must test understanding/application, not just recall
- Include correct answers and explanations for each question
- Suggest a relevant next learning activity

OUTPUT FORMAT (JSON only):
{{
  "title": "Story Title",
  "characters": [{{"name": "Character Name", "description": "Brief description", "role": "protagonist/guide/friend"}}],
  "content": "Full story text with paragraphs separated by \\n\\n",
  "learning_objectives": [
    {{"objective": "Understand what X is", "order_index": 0}},
    {{"objective": "Identify X in examples", "order_index": 1}},
    {{"objective": "Apply X to solve a problem", "order_index": 2}}
  ],
  "questions": [
    {{
      "question": "Question text?",
      "type": "mcq|true_false|fill_in_blank|scenario|sequencing",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Correct option text",
      "explanation": "Why this is correct and others aren't",
      "objective": "Learning objective this question tests",
      "order_index": 0
    }}
  ],
  "next_activity": {{
    "type": "story|practice|explanation",
    "topic": "Specific concept to focus on",
    "reason": "Why this is recommended"
  }}
}}"""

    def _build_assessment_prompt(self, story_content: str, objectives: List[str], age: int) -> str:
        age_chars = self._get_age_characteristics(age)
        
        return f"""Generate assessment questions for a {age}-year-old child based on this story and learning objectives.

STORY:
{story_content}

LEARNING OBJECTIVES:
{json.dumps(objectives, indent=2)}

AGE-APPROPRIATE QUESTION GUIDELINES:
- Question difficulty: {age_chars['question_difficulty']}
- Vocabulary: {age_chars['vocabulary']}

REQUIREMENTS:
- Create 5-8 questions total
- Each question must map to a specific learning objective
- Mix question types: mcq, true_false, fill_in_blank, scenario, sequencing
- Questions must test UNDERSTANDING and APPLICATION, not mere recall
- Include clear explanations for correct answers
- Avoid trick questions

OUTPUT FORMAT (JSON only):
{{
  "questions": [
    {{
      "question": "Question text?",
      "type": "mcq|true_false|fill_in_blank|scenario|sequencing",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Correct answer text",
      "explanation": "Explanation",
      "objective": "Learning objective this tests",
      "order_index": 0
    }}
  ]
}}"""

    async def generate_story(self, request: StoryRequest) -> Dict[str, Any]:
        if not self.openai_client and not self.anthropic_client:
            return self._mock_story_response(request)

        prompt = self._build_story_prompt(request)
        
        try:
            if self.provider == "openai" and self.openai_client:
                response = await self.openai_client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[
                        {"role": "system", "content": "You are an expert educational storyteller. Always respond with valid JSON only."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=4000,
                    response_format={"type": "json_object"}
                )
                result = json.loads(response.choices[0].message.content)
            elif self.provider == "anthropic" and self.anthropic_client:
                response = await self.anthropic_client.messages.create(
                    model="claude-3-sonnet-20240229",
                    max_tokens=4000,
                    temperature=0.7,
                    system="You are an expert educational storyteller. Always respond with valid JSON only.",
                    messages=[{"role": "user", "content": prompt}]
                )
                result = json.loads(response.content[0].text)
            else:
                return self._mock_story_response(request)
            
            return self._validate_story_response(result, request)
        except Exception as e:
            print(f"AI generation error: {e}")
            return self._mock_story_response(request)

    async def generate_assessment(self, story_content: str, objectives: List[str], age: int) -> List[Dict[str, Any]]:
        if not self.openai_client and not self.anthropic_client:
            return self._mock_questions(objectives, age)

        prompt = self._build_assessment_prompt(story_content, objectives, age)
        
        try:
            if self.provider == "openai" and self.openai_client:
                response = await self.openai_client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[
                        {"role": "system", "content": "You are an expert educational assessment designer. Always respond with valid JSON only."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.5,
                    max_tokens=3000,
                    response_format={"type": "json_object"}
                )
                result = json.loads(response.choices[0].message.content)
            elif self.provider == "anthropic" and self.anthropic_client:
                response = await self.anthropic_client.messages.create(
                    model="claude-3-sonnet-20240229",
                    max_tokens=3000,
                    temperature=0.5,
                    system="You are an expert educational assessment designer. Always respond with valid JSON only.",
                    messages=[{"role": "user", "content": prompt}]
                )
                result = json.loads(response.content[0].text)
            else:
                return self._mock_questions(objectives, age)
            
            return result.get("questions", [])
        except Exception as e:
            print(f"Assessment generation error: {e}")
            return self._mock_questions(objectives, age)

    def _validate_story_response(self, result: Dict, request: StoryRequest) -> Dict[str, Any]:
        required_keys = ["title", "characters", "content", "learning_objectives", "questions", "next_activity"]
        for key in required_keys:
            if key not in result:
                if key == "next_activity":
                    result[key] = {"type": "story", "topic": request.topic, "reason": "Continue learning"}
                elif key == "characters":
                    result[key] = [{"name": "Alex", "description": "A curious learner", "role": "protagonist"}]
                elif key == "learning_objectives":
                    result[key] = [{"objective": f"Understand {request.topic}", "order_index": 0}]
                elif key == "questions":
                    result[key] = self._mock_questions([o["objective"] for o in result.get("learning_objectives", [])], request.age)
        
        return result

    def _mock_story_response(self, request: StoryRequest) -> Dict[str, Any]:
        age_chars = self._get_age_characteristics(request.age)
        
        return {
            "title": f"The Adventure of Learning {request.topic}",
            "characters": [
                {"name": "Sam", "description": "A curious explorer", "role": "protagonist"},
                {"name": "Professor Wise", "description": "A knowledgeable guide", "role": "guide"}
            ],
            "content": f"Sam was playing in the garden when Professor Wise appeared with a magical book about {request.topic}. "
                       f"Together they discovered how {request.topic} works in the world around them. "
                       f"Through fun examples and gentle guidance, Sam learned the key concepts and solved a puzzle using {request.topic}. "
                       f"At the end, Sam realized that {request.topic} is everywhere and can be fun to explore!",
            "learning_objectives": [
                {"objective": f"Understand the basic concept of {request.topic}", "order_index": 0},
                {"objective": f"Identify examples of {request.topic} in daily life", "order_index": 1},
                {"objective": f"Apply {request.topic} to solve simple problems", "order_index": 2}
            ],
            "questions": self._mock_questions([
                f"Understand the basic concept of {request.topic}",
                f"Identify examples of {request.topic} in daily life",
                f"Apply {request.topic} to solve simple problems"
            ], request.age),
            "next_activity": {
                "type": "story",
                "topic": f"Advanced {request.topic}",
                "reason": "Build on the foundation learned today"
            }
        }

    def _mock_questions(self, objectives: List[str], age: int) -> List[Dict[str, Any]]:
        questions = []
        question_types = [QuestionType.MCQ, QuestionType.TRUE_FALSE, QuestionType.FILL_IN_BLANK, QuestionType.SCENARIO]
        
        for i, obj in enumerate(objectives[:3]):
            q_type = question_types[i % len(question_types)]
            
            if q_type == QuestionType.MCQ:
                questions.append({
                    "question": f"What is the main idea of {obj.lower()}?",
                    "type": q_type.value,
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct_answer": "Option A",
                    "explanation": "This is the correct answer because it captures the core concept.",
                    "objective": obj,
                    "order_index": i
                })
            elif q_type == QuestionType.TRUE_FALSE:
                questions.append({
                    "question": f"True or False: {obj}.",
                    "type": q_type.value,
                    "options": ["True", "False"],
                    "correct_answer": "True",
                    "explanation": "This statement correctly describes the concept.",
                    "objective": obj,
                    "order_index": i
                })
            elif q_type == QuestionType.FILL_IN_BLANK:
                questions.append({
                    "question": f"The key concept we learned is _____.",
                    "type": q_type.value,
                    "options": None,
                    "correct_answer": obj.split(" ")[-1],
                    "explanation": "This word completes the concept we explored in the story.",
                    "objective": obj,
                    "order_index": i
                })
            else:
                questions.append({
                    "question": f"Imagine you need to use {obj.lower()}. What would you do first?",
                    "type": q_type.value,
                    "options": ["Step 1", "Step 2", "Step 3", "Step 4"],
                    "correct_answer": "Step 1",
                    "explanation": "The first step is to understand the problem before applying the concept.",
                    "objective": obj,
                    "order_index": i
                })
        
        return questions


ai_service = AIService()