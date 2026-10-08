from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum, Float, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import enum


class UserRole(str, enum.Enum):
    PARENT = "parent"
    TEACHER = "teacher"
    ADMIN = "admin"


class DifficultyLevel(str, enum.Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class QuestionType(str, enum.Enum):
    MCQ = "mcq"
    TRUE_FALSE = "true_false"
    FILL_IN_BLANK = "fill_in_blank"
    SCENARIO = "scenario"
    SEQUENCING = "sequencing"


class MasteryLevel(str, enum.Enum):
    NOT_STARTED = "not_started"
    LEARNING = "learning"
    PARTIAL = "partial"
    MASTERED = "mastered"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.PARENT, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    children = relationship("Child", back_populates="parent", cascade="all, delete-orphan")
    assigned_stories = relationship("StoryAssignment", back_populates="teacher")


class Child(Base):
    __tablename__ = "children"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    grade = Column(Integer, nullable=True)
    parent_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    parent = relationship("User", back_populates="children")
    stories = relationship("Story", back_populates="child", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="child", cascade="all, delete-orphan")
    learning_progress = relationship("LearningProgress", back_populates="child", cascade="all, delete-orphan")


class Story(Base):
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False)
    topic = Column(String(200), nullable=False)
    subject = Column(String(100), nullable=True)
    title = Column(String(300), nullable=False)
    content = Column(Text, nullable=False)
    characters = Column(JSON, nullable=True)
    difficulty = Column(Enum(DifficultyLevel), default=DifficultyLevel.BEGINNER)
    language = Column(String(10), default="English")
    learning_objectives = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    child = relationship("Child", back_populates="stories")
    objectives = relationship("LearningObjective", back_populates="story", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="story", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="story", cascade="all, delete-orphan")


class LearningObjective(Base):
    __tablename__ = "learning_objectives"

    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer, ForeignKey("stories.id"), nullable=False)
    objective = Column(Text, nullable=False)
    order_index = Column(Integer, default=0)

    story = relationship("Story", back_populates="objectives")
    questions = relationship("Question", back_populates="objective")
    progress = relationship("LearningProgress", back_populates="objective")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer, ForeignKey("stories.id"), nullable=False)
    objective_id = Column(Integer, ForeignKey("learning_objectives.id"), nullable=True)
    question = Column(Text, nullable=False)
    type = Column(Enum(QuestionType), nullable=False)
    options = Column(JSON, nullable=True)
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)

    story = relationship("Story", back_populates="questions")
    objective = relationship("LearningObjective", back_populates="questions")
    answers = relationship("Answer", back_populates="question")


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer, ForeignKey("stories.id"), nullable=False)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False)
    score = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    percentage = Column(Float, default=0.0)
    understanding_level = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    story = relationship("Story", back_populates="assessments")
    child = relationship("Child", back_populates="assessments")
    answers = relationship("Answer", back_populates="assessment", cascade="all, delete-orphan")


class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    answer = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)

    assessment = relationship("Assessment", back_populates="answers")
    question = relationship("Question", back_populates="answers")


class LearningProgress(Base):
    __tablename__ = "learning_progress"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False)
    objective_id = Column(Integer, ForeignKey("learning_objectives.id"), nullable=False)
    mastery_level = Column(Enum(MasteryLevel), default=MasteryLevel.NOT_STARTED)
    attempts = Column(Integer, default=0)
    last_score = Column(Float, default=0.0)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    child = relationship("Child", back_populates="learning_progress")
    objective = relationship("LearningObjective", back_populates="progress")


class StoryAssignment(Base):
    __tablename__ = "story_assignments"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False)
    topic = Column(String(200), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    due_date = Column(DateTime(timezone=True), nullable=True)
    completed = Column(Boolean, default=False)

    teacher = relationship("User", back_populates="assigned_stories")