export interface User {
  id: number;
  email: string;
  name: string;
  role: 'parent' | 'teacher' | 'admin';
  created_at: string;
}

export interface Child {
  id: number;
  name: string;
  age: number;
  grade?: number;
  parent_id: number;
  created_at: string;
}

export interface LearningObjective {
  objective: string;
  order_index: number;
}

export interface Question {
  id: number;
  question: string;
  type: 'mcq' | 'true_false' | 'fill_in_blank' | 'scenario' | 'sequencing';
  options?: string[];
  correct_answer: string;
  explanation?: string;
  objective?: string;
  order_index: number;
}

export interface Story {
  id: number;
  child_id: number;
  topic: string;
  subject?: string;
  title: string;
  content: string;
  characters: Character[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  learning_objectives: LearningObjective[];
  questions: Question[];
  created_at: string;
  completed_at?: string;
}

export interface Character {
  name: string;
  description: string;
  role: 'protagonist' | 'guide' | 'friend';
}

export interface StoryListItem {
  id: number;
  topic: string;
  subject?: string;
  title: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  created_at: string;
  completed_at?: string;
}

export interface AnswerSubmit {
  question_id: number;
  answer: string;
}

export interface AssessmentSubmit {
  answers: AnswerSubmit[];
}

export interface AnswerResult {
  question_id: number;
  question: string;
  type: 'mcq' | 'true_false' | 'fill_in_blank' | 'scenario' | 'sequencing';
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  explanation?: string;
  objective?: string;
}

export interface AssessmentResult {
  assessment_id: number;
  story_id: number;
  score: number;
  total_questions: number;
  percentage: number;
  understanding_level: string;
  results: AnswerResult[];
  strong_objectives: string[];
  weak_objectives: string[];
  recommendation: string;
  next_activity?: {
    type: 'story' | 'practice' | 'explanation';
    topic: string;
    reason: string;
  };
}

export interface StoryRequest {
  topic: string;
  age: number;
  subject?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  child_id: number;
}

export interface ChildProgressReport {
  child_id: number;
  child_name: string;
  age: number;
  stories_completed: number;
  average_understanding: number;
  strong_concepts: string[];
  weak_concepts: string[];
  recent_topics: RecentTopic[];
  recommended_next: RecommendedActivity[];
  progress_over_time: ProgressPoint[];
}

export interface RecentTopic {
  topic: string;
  title: string;
  score: number;
  date?: string;
}

export interface RecommendedActivity {
  topic: string;
  type: 'story' | 'practice' | 'explanation';
  reason: string;
}

export interface ProgressPoint {
  date: string;
  percentage: number;
  topic: string;
}

export interface TeacherDashboardResponse {
  students: StudentSummary[];
  topic_performance: TopicPerformance[];
  students_needing_practice: StudentSummary[];
}

export interface StudentSummary {
  id: number;
  name: string;
  age: number;
  stories_completed: number;
  average_score: number;
  needs_practice: boolean;
}

export interface TopicPerformance {
  topic: string;
  average_score: number;
  students_completed: number;
}

export interface StoryAssignment {
  id: number;
  teacher_id: number;
  child_id: number;
  topic: string;
  assigned_at: string;
  due_date?: string;
  completed: boolean;
}

export interface StoryAssignmentCreate {
  child_id: number;
  topic: string;
  due_date?: string;
}