from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    PARENT = "parent"
    TEACHER = "teacher"
    ADMIN = "admin"


class DifficultyLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class QuestionType(str, Enum):
    MCQ = "mcq"
    TRUE_FALSE = "true_false"
    FILL_IN_BLANK = "fill_in_blank"
    SCENARIO = "scenario"
    SEQUENCING = "sequencing"


class MasteryLevel(str, Enum):
    NOT_STARTED = "not_started"
    LEARNING = "learning"
    PARTIAL = "partial"
    MASTERED = "mastered"


class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: UserRole = UserRole.PARENT


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None


class ChildBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    age: int = Field(..., ge=6, le=12)
    grade: Optional[int] = Field(None, ge=1, le=6)


class ChildCreate(ChildBase):
    pass


class ChildUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    age: Optional[int] = Field(None, ge=6, le=12)
    grade: Optional[int] = Field(None, ge=1, le=6)


class ChildResponse(ChildBase):
    id: int
    parent_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class StoryRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=200)
    age: int = Field(..., ge=6, le=12)
    subject: Optional[str] = Field(None, max_length=100)
    difficulty: DifficultyLevel = DifficultyLevel.BEGINNER
    language: str = "English"
    child_id: int


class LearningObjectiveSchema(BaseModel):
    objective: str
    order_index: int = 0


class QuestionSchema(BaseModel):
    question: str
    type: QuestionType
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: Optional[str] = None
    objective: str
    order_index: int = 0


class StoryResponse(BaseModel):
    id: int
    child_id: int
    topic: str
    subject: Optional[str]
    title: str
    content: str
    characters: Optional[List[Dict[str, Any]]]
    difficulty: DifficultyLevel
    language: str
    learning_objectives: List[LearningObjectiveSchema]
    questions: List[QuestionSchema]
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class StoryListItem(BaseModel):
    id: int
    topic: str
    subject: Optional[str]
    title: str
    difficulty: DifficultyLevel
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class AnswerSubmit(BaseModel):
    question_id: int
    answer: str


class AssessmentSubmit(BaseModel):
    answers: List[AnswerSubmit]


class AnswerResult(BaseModel):
    question_id: int
    question: str
    type: QuestionType
    user_answer: str
    correct_answer: str
    is_correct: bool
    explanation: Optional[str]
    objective: Optional[str]


class AssessmentResult(BaseModel):
    assessment_id: int
    story_id: int
    score: int
    total_questions: int
    percentage: float
    understanding_level: str
    results: List[AnswerResult]
    strong_objectives: List[str]
    weak_objectives: List[str]
    recommendation: str
    next_activity: Optional[Dict[str, Any]]


class LearningProgressResponse(BaseModel):
    objective: str
    mastery_level: MasteryLevel
    attempts: int
    last_score: float

    class Config:
        from_attributes = True


class ChildProgressReport(BaseModel):
    child_id: int
    child_name: str
    age: int
    stories_completed: int
    average_understanding: float
    strong_concepts: List[str]
    weak_concepts: List[str]
    recent_topics: List[Dict[str, Any]]
    recommended_next: List[Dict[str, Any]]
    progress_over_time: List[Dict[str, Any]]


class TeacherDashboardResponse(BaseModel):
    students: List[Dict[str, Any]]
    topic_performance: List[Dict[str, Any]]
    students_needing_practice: List[Dict[str, Any]]


class StoryAssignmentCreate(BaseModel):
    child_id: int
    topic: str
    due_date: Optional[datetime] = None


class StoryAssignmentResponse(BaseModel):
    id: int
    teacher_id: int
    child_id: int
    topic: str
    assigned_at: datetime
    due_date: Optional[datetime]
    completed: bool

    class Config:
        from_attributes = True