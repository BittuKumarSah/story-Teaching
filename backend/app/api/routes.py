from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import List

from app.core.config import settings
from app.db.session import get_db
from app.models import User, Child, StoryAssignment
from app.schemas import (
    UserCreate, UserLogin, UserResponse, Token, TokenData,
    ChildCreate, ChildUpdate, ChildResponse,
    StoryRequest, StoryResponse, StoryListItem,
    AssessmentSubmit, AssessmentResult,
    StoryAssignmentCreate, StoryAssignmentResponse,
    ChildProgressReport, TeacherDashboardResponse
)
from app.services.story_service import StoryService, AssessmentService, ReportService
from app.services.ai_service import ai_service
from passlib.context import CryptContext

router = APIRouter()
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user


@router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        hashed_password=hashed_password
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/auth/login", response_model=Token)
async def login(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == login_data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/children", response_model=ChildResponse)
async def create_child(child_data: ChildCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    child = Child(**child_data.model_dump(), parent_id=current_user.id)
    db.add(child)
    await db.commit()
    await db.refresh(child)
    return child


@router.get("/children", response_model=List[ChildResponse])
async def get_children(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Child).where(Child.parent_id == current_user.id))
    return list(result.scalars().all())


@router.get("/children/{child_id}", response_model=ChildResponse)
async def get_child(child_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Child).where(Child.id == child_id, Child.parent_id == current_user.id))
    child = result.scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    return child


@router.patch("/children/{child_id}", response_model=ChildResponse)
async def update_child(child_id: int, child_data: ChildUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Child).where(Child.id == child_id, Child.parent_id == current_user.id))
    child = result.scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    for field, value in child_data.model_dump(exclude_unset=True).items():
        setattr(child, field, value)
    
    await db.commit()
    await db.refresh(child)
    return child


@router.delete("/children/{child_id}")
async def delete_child(child_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Child).where(Child.id == child_id, Child.parent_id == current_user.id))
    child = result.scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    await db.delete(child)
    await db.commit()
    return {"message": "Child deleted"}


@router.post("/stories/generate", response_model=StoryResponse)
async def generate_story(request: StoryRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    child_result = await db.execute(select(Child).where(Child.id == request.child_id, Child.parent_id == current_user.id))
    child = child_result.scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    story_service = StoryService(db)
    story = await story_service.create_story(request)
    
    await db.refresh(story, attribute_names=["objectives", "questions"])
    
    # Build response with objective strings instead of objects
    questions_data = []
    for q in story.questions:
        questions_data.append({
            "id": q.id,
            "question": q.question,
            "type": q.type,
            "options": q.options,
            "correct_answer": q.correct_answer,
            "explanation": q.explanation,
            "objective": q.objective.objective if q.objective else None,
            "order_index": q.order_index
        })
    
    objectives_data = [
        {"objective": obj.objective, "order_index": obj.order_index}
        for obj in story.objectives
    ]
    
    return {
        "id": story.id,
        "child_id": story.child_id,
        "topic": story.topic,
        "subject": story.subject,
        "title": story.title,
        "content": story.content,
        "characters": story.characters,
        "difficulty": story.difficulty,
        "language": story.language,
        "learning_objectives": objectives_data,
        "questions": questions_data,
        "created_at": story.created_at,
        "completed_at": story.completed_at
    }


@router.get("/stories", response_model=List[StoryListItem])
async def get_stories(child_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    child_result = await db.execute(select(Child).where(Child.id == child_id, Child.parent_id == current_user.id))
    if not child_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Child not found")
    
    story_service = StoryService(db)
    stories = await story_service.get_stories_for_child(child_id)
    return stories


@router.get("/stories/{story_id}", response_model=StoryResponse)
async def get_story(story_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    story_service = StoryService(db)
    story = await story_service.get_story(story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    child_result = await db.execute(select(Child).where(Child.id == story.child_id, Child.parent_id == current_user.id))
    if not child_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Build response with objective strings instead of objects
    questions_data = []
    for q in story.questions:
        questions_data.append({
            "id": q.id,
            "question": q.question,
            "type": q.type,
            "options": q.options,
            "correct_answer": q.correct_answer,
            "explanation": q.explanation,
            "objective": q.objective.objective if q.objective else None,
            "order_index": q.order_index
        })
    
    objectives_data = [
        {"objective": obj.objective, "order_index": obj.order_index}
        for obj in story.objectives
    ]
    
    return {
        "id": story.id,
        "child_id": story.child_id,
        "topic": story.topic,
        "subject": story.subject,
        "title": story.title,
        "content": story.content,
        "characters": story.characters,
        "difficulty": story.difficulty,
        "language": story.language,
        "learning_objectives": objectives_data,
        "questions": questions_data,
        "created_at": story.created_at,
        "completed_at": story.completed_at
    }


@router.post("/stories/{story_id}/complete")
async def complete_story(story_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    story_service = StoryService(db)
    story = await story_service.get_story(story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    child_result = await db.execute(select(Child).where(Child.id == story.child_id, Child.parent_id == current_user.id))
    if not child_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await story_service.mark_completed(story_id)
    return {"message": "Story marked as completed"}


@router.get("/stories/{story_id}/questions")
async def get_story_questions(story_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    story_service = StoryService(db)
    story = await story_service.get_story(story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    child_result = await db.execute(select(Child).where(Child.id == story.child_id, Child.parent_id == current_user.id))
    if not child_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not authorized")
    
    assessment_service = AssessmentService(db)
    questions = await assessment_service.get_questions_for_story(story_id)
    return questions


@router.post("/stories/{story_id}/assess", response_model=AssessmentResult)
async def submit_assessment(story_id: int, submit: AssessmentSubmit, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    story_service = StoryService(db)
    story = await story_service.get_story(story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    child_result = await db.execute(select(Child).where(Child.id == story.child_id, Child.parent_id == current_user.id))
    child = child_result.scalar_one_or_none()
    if not child:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    assessment_service = AssessmentService(db)
    result = await assessment_service.submit_assessment(story_id, child.id, submit)
    return result


@router.get("/reports/child/{child_id}", response_model=ChildProgressReport)
async def get_child_report(child_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    child_result = await db.execute(select(Child).where(Child.id == child_id, Child.parent_id == current_user.id))
    if not child_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Child not found")
    
    report_service = ReportService(db)
    return await report_service.get_child_report(child_id)


@router.get("/reports/teacher/dashboard", response_model=TeacherDashboardResponse)
async def get_teacher_dashboard(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    report_service = ReportService(db)
    return await report_service.get_teacher_dashboard(current_user.id)


@router.post("/assignments", response_model=StoryAssignmentResponse)
async def create_assignment(assignment_data: StoryAssignmentCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    assignment = StoryAssignment(
        teacher_id=current_user.id,
        **assignment_data.model_dump()
    )
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)
    return assignment


@router.get("/assignments", response_model=List[StoryAssignmentResponse])
async def get_assignments(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Teacher access required")
    
    result = await db.execute(select(StoryAssignment).where(StoryAssignment.teacher_id == current_user.id))
    return list(result.scalars().all())