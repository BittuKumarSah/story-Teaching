from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any
from datetime import datetime
import json

from app.models import Story, LearningObjective, Question, Child, Assessment, Answer, LearningProgress, StoryAssignment
from app.schemas import StoryRequest, StoryResponse, AssessmentSubmit, AssessmentResult, AnswerResult
from app.services.ai_service import ai_service
from app.schemas import DifficultyLevel, QuestionType, MasteryLevel


class StoryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_story(self, request: StoryRequest) -> Story:
        ai_result = await ai_service.generate_story(request)
        
        story = Story(
            child_id=request.child_id,
            topic=request.topic,
            subject=request.subject,
            title=ai_result["title"],
            content=ai_result["content"],
            characters=ai_result["characters"],
            difficulty=request.difficulty,
            language=request.language,
            learning_objectives=ai_result["learning_objectives"],
        )
        self.db.add(story)
        await self.db.flush()
        
        for obj_data in ai_result["learning_objectives"]:
            objective = LearningObjective(
                story_id=story.id,
                objective=obj_data["objective"],
                order_index=obj_data.get("order_index", 0)
            )
            self.db.add(objective)
        await self.db.flush()
        
        objectives = await self._get_story_objectives(story.id)
        obj_map = {obj.objective: obj.id for obj in objectives}
        
        for q_data in ai_result["questions"]:
            objective_id = obj_map.get(q_data["objective"])
            question = Question(
                story_id=story.id,
                objective_id=objective_id,
                question=q_data["question"],
                type=QuestionType(q_data["type"]),
                options=q_data.get("options"),
                correct_answer=q_data["correct_answer"],
                explanation=q_data.get("explanation"),
                order_index=q_data.get("order_index", 0)
            )
            self.db.add(question)
        
        await self.db.commit()
        await self.db.refresh(story)
        return story

    async def get_story(self, story_id: int) -> Optional[Story]:
        result = await self.db.execute(
            select(Story)
            .options(
                selectinload(Story.objectives),
                selectinload(Story.questions)
            )
            .where(Story.id == story_id)
        )
        return result.scalar_one_or_none()

    async def get_stories_for_child(self, child_id: int) -> List[Story]:
        result = await self.db.execute(
            select(Story)
            .where(Story.child_id == child_id)
            .order_by(Story.created_at.desc())
        )
        return list(result.scalars().all())

    async def _get_story_objectives(self, story_id: int) -> List[LearningObjective]:
        result = await self.db.execute(
            select(LearningObjective).where(LearningObjective.story_id == story_id)
        )
        return list(result.scalars().all())

    async def mark_completed(self, story_id: int) -> Optional[Story]:
        story = await self.get_story(story_id)
        if story:
            story.completed_at = datetime.utcnow()
            await self.db.commit()
            await self.db.refresh(story)
        return story


class AssessmentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_questions_for_story(self, story_id: int) -> List[Question]:
        result = await self.db.execute(
            select(Question)
            .where(Question.story_id == story_id)
            .order_by(Question.order_index)
        )
        return list(result.scalars().all())

    async def submit_assessment(self, story_id: int, child_id: int, submit: AssessmentSubmit) -> AssessmentResult:
        story = await self.db.get(Story, story_id)
        if not story:
            raise ValueError("Story not found")
        
        questions = await self.get_questions_for_story(story_id)
        question_map = {q.id: q for q in questions}
        
        assessment = Assessment(
            story_id=story_id,
            child_id=child_id,
            total_questions=len(questions)
        )
        self.db.add(assessment)
        await self.db.flush()
        
        results = []
        correct_count = 0
        objective_scores = {}
        
        for answer_submit in submit.answers:
            question = question_map.get(answer_submit.question_id)
            if not question:
                continue
            
            is_correct = self._evaluate_answer(question, answer_submit.answer)
            if is_correct:
                correct_count += 1
            
            answer = Answer(
                assessment_id=assessment.id,
                question_id=question.id,
                answer=answer_submit.answer,
                is_correct=is_correct
            )
            self.db.add(answer)
            
            obj_name = question.objective.objective if question.objective else "Unknown"
            if obj_name not in objective_scores:
                objective_scores[obj_name] = {"correct": 0, "total": 0}
            objective_scores[obj_name]["total"] += 1
            if is_correct:
                objective_scores[obj_name]["correct"] += 1
            
            results.append(AnswerResult(
                question_id=question.id,
                question=question.question,
                type=question.type,
                user_answer=answer_submit.answer,
                correct_answer=question.correct_answer,
                is_correct=is_correct,
                explanation=question.explanation,
                objective=obj_name
            ))
        
        percentage = (correct_count / len(questions) * 100) if questions else 0
        assessment.score = correct_count
        assessment.percentage = percentage
        assessment.understanding_level = self._get_understanding_level(percentage)
        assessment.completed_at = datetime.utcnow()
        
        await self.db.flush()
        
        await self._update_learning_progress(child_id, story.id, objective_scores)
        
        strong_objectives = [obj for obj, scores in objective_scores.items() if scores["correct"] / scores["total"] >= 0.75]
        weak_objectives = [obj for obj, scores in objective_scores.items() if scores["correct"] / scores["total"] < 0.5]
        
        recommendation = self._generate_recommendation(percentage, weak_objectives, story.topic)
        next_activity = self._suggest_next_activity(weak_objectives, story.topic)
        
        await self.db.commit()
        
        return AssessmentResult(
            assessment_id=assessment.id,
            story_id=story_id,
            score=correct_count,
            total_questions=len(questions),
            percentage=percentage,
            understanding_level=assessment.understanding_level,
            results=results,
            strong_objectives=strong_objectives,
            weak_objectives=weak_objectives,
            recommendation=recommendation,
            next_activity=next_activity
        )

    def _evaluate_answer(self, question: Question, user_answer: str) -> bool:
        user_answer = user_answer.strip().lower()
        correct = question.correct_answer.strip().lower()
        
        if question.type in [QuestionType.MCQ, QuestionType.TRUE_FALSE]:
            return user_answer == correct
        elif question.type == QuestionType.FILL_IN_BLANK:
            return user_answer == correct
        elif question.type == QuestionType.SEQUENCING:
            return user_answer == correct
        else:
            return user_answer == correct

    def _get_understanding_level(self, percentage: float) -> str:
        if percentage >= 90:
            return "Excellent understanding"
        elif percentage >= 75:
            return "Good understanding"
        elif percentage >= 50:
            return "Partial understanding"
        else:
            return "Needs additional teaching"

    def _generate_recommendation(self, percentage: float, weak_objectives: List[str], topic: str) -> str:
        if percentage >= 90:
            return f"Amazing! You've mastered {topic}. Ready for a more advanced concept?"
        elif percentage >= 75:
            return f"Great progress on {topic}! Let's continue with the next topic."
        elif percentage >= 50:
            weak_str = ", ".join(weak_objectives[:2])
            return f"Good effort! Let's practice {weak_str} a bit more to strengthen your understanding."
        else:
            return f"Let's practice {topic} one more time with a simpler story. You'll get it!"

    def _suggest_next_activity(self, weak_objectives: List[str], topic: str) -> Optional[Dict[str, Any]]:
        if weak_objectives:
            return {
                "type": "story",
                "topic": weak_objectives[0],
                "reason": f"Focus on {weak_objectives[0]} to strengthen understanding"
            }
        return {
            "type": "story",
            "topic": f"Advanced {topic}",
            "reason": "Continue building on your strong foundation"
        }

    async def _update_learning_progress(self, child_id: int, story_id: int, objective_scores: Dict[str, Dict[str, int]]):
        for obj_name, scores in objective_scores.items():
            result = await self.db.execute(
                select(LearningProgress)
                .join(LearningObjective)
                .where(
                    LearningProgress.child_id == child_id,
                    LearningObjective.objective == obj_name,
                    LearningObjective.story_id == story_id
                )
            )
            progress = result.scalar_one_or_none()
            
            mastery = MasteryLevel.LEARNING
            score_pct = (scores["correct"] / scores["total"] * 100) if scores["total"] > 0 else 0
            
            if score_pct >= 90:
                mastery = MasteryLevel.MASTERED
            elif score_pct >= 75:
                mastery = MasteryLevel.PARTIAL
            elif score_pct >= 50:
                mastery = MasteryLevel.LEARNING
            else:
                mastery = MasteryLevel.NOT_STARTED
            
            if progress:
                progress.mastery_level = mastery
                progress.attempts += 1
                progress.last_score = score_pct
                progress.updated_at = datetime.utcnow()
            else:
                obj_result = await self.db.execute(
                    select(LearningObjective).where(
                        LearningObjective.objective == obj_name,
                        LearningObjective.story_id == story_id
                    )
                )
                objective = obj_result.scalar_one_or_none()
                if objective:
                    progress = LearningProgress(
                        child_id=child_id,
                        objective_id=objective.id,
                        mastery_level=mastery,
                        attempts=1,
                        last_score=score_pct
                    )
                    self.db.add(progress)


class ReportService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_child_report(self, child_id: int) -> Dict[str, Any]:
        child = await self.db.get(Child, child_id)
        if not child:
            raise ValueError("Child not found")
        
        stories = await self.db.execute(
            select(Story).where(Story.child_id == child_id, Story.completed_at.isnot(None))
        )
        completed_stories = list(stories.scalars().all())
        
        assessments = await self.db.execute(
            select(Assessment).where(Assessment.child_id == child_id)
        )
        all_assessments = list(assessments.scalars().all())
        
        avg_score = sum(a.percentage for a in all_assessments) / len(all_assessments) if all_assessments else 0
        
        progress_result = await self.db.execute(
            select(LearningProgress)
            .join(LearningObjective)
            .where(LearningProgress.child_id == child_id)
        )
        progress_list = list(progress_result.scalars().all())
        
        strong = [p.objective.objective for p in progress_list if p.mastery_level == MasteryLevel.MASTERED]
        weak = [p.objective.objective for p in progress_list if p.mastery_level in [MasteryLevel.NOT_STARTED, MasteryLevel.LEARNING]]
        
        recent_topics = [
            {
                "topic": s.topic,
                "title": s.title,
                "score": next((a.percentage for a in all_assessments if a.story_id == s.id), 0),
                "date": s.completed_at.isoformat() if s.completed_at else None
            }
            for s in completed_stories[-5:]
        ]
        
        progress_over_time = [
            {
                "date": a.created_at.isoformat(),
                "percentage": a.percentage,
                "topic": a.story.topic if a.story else "Unknown"
            }
            for a in sorted(all_assessments, key=lambda x: x.created_at)
        ]
        
        return {
            "child_id": child.id,
            "child_name": child.name,
            "age": child.age,
            "stories_completed": len(completed_stories),
            "average_understanding": round(avg_score, 1),
            "strong_concepts": strong[:5],
            "weak_concepts": weak[:5],
            "recent_topics": recent_topics,
            "recommended_next": [
                {"topic": w, "type": "practice", "reason": f"Needs more practice with {w}"}
                for w in weak[:3]
            ],
            "progress_over_time": progress_over_time
        }

    async def get_teacher_dashboard(self, teacher_id: int) -> Dict[str, Any]:
        assignments = await self.db.execute(
            select(StoryAssignment).where(StoryAssignment.teacher_id == teacher_id)
        )
        assignment_list = list(assignments.scalars().all())
        
        child_ids = [a.child_id for a in assignment_list]
        
        students = []
        for child_id in set(child_ids):
            child = await self.db.get(Child, child_id)
            if child:
                report = await self.get_child_report(child_id)
                students.append({
                    "id": child.id,
                    "name": child.name,
                    "age": child.age,
                    "stories_completed": report["stories_completed"],
                    "average_score": report["average_understanding"],
                    "needs_practice": len(report["weak_concepts"]) > 0
                })
        
        return {
            "students": students,
            "topic_performance": [],
            "students_needing_practice": [s for s in students if s["needs_practice"]]
        }