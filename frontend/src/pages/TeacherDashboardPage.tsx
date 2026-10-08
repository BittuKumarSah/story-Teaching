import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { reportsApi, assignmentsApi } from '../services/api';
import { Link } from 'react-router-dom';
import { 
  User, Users, BookOpen, TrendingUp, Target, AlertCircle, 
  Plus, Clock, CheckCircle, ArrowRight, Search, X 
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { cn, formatDate, getUnderstandingColor } from '../utils/helpers';

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignForm, setAssignForm] = useState({ child_id: '', topic: '', due_date: '' });
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (user?.role === 'teacher') {
      fetchDashboard();
      fetchAssignments();
    }
  }, [user]);

  const fetchDashboard = async () => {
    try {
      const response = await reportsApi.teacherDashboard();
      setDashboard(response.data);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await assignmentsApi.list();
      setAssignments(response.data);
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAssigning(true);
    try {
      await assignmentsApi.create({
        child_id: parseInt(assignForm.child_id),
        topic: assignForm.topic,
        due_date: assignForm.due_date || undefined,
      });
      setShowAssignForm(false);
      setAssignForm({ child_id: '', topic: '', due_date: '' });
      fetchAssignments();
    } catch (err) {
      console.error('Failed to create assignment:', err);
    } finally {
      setIsAssigning(false);
    }
  };

  if (user?.role !== 'teacher') {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Teacher Access Required</h2>
        <p className="text-gray-600">This page is only accessible to teacher accounts</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" message="Loading classroom..." />
      </div>
    );
  }

  const students = dashboard?.students || [];
  const studentsNeedingPractice = dashboard?.students_needing_practice || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Classroom Dashboard</h1>
          <p className="text-gray-600">Monitor student progress and assign learning activities</p>
        </div>
        <button
          onClick={() => setShowAssignForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Assign Story
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              <p className="text-sm text-gray-500">Students</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {students.length > 0 
                  ? (students.reduce((sum: number, s: any) => sum + s.average_score, 0) / students.length).toFixed(1)
                  : '0'
                }%
              </p>
              <p className="text-sm text-gray-500">Class Average</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Target className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{studentsNeedingPractice.length}</p>
              <p className="text-sm text-gray-500">Need Practice</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
              <p className="text-sm text-gray-500">Active Assignments</p>
            </div>
          </div>
        </div>
      </div>

      {showAssignForm && (
        <div className="card p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Assign New Story</h2>
            <button
              onClick={() => setShowAssignForm(false)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAssign} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label">Student</label>
                <select
                  value={assignForm.child_id}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, child_id: e.target.value }))}
                  className="input"
                  required
                >
                  <option value="">Select student</option>
                  {students.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} (Age {s.age})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Topic</label>
                <input
                  type="text"
                  value={assignForm.topic}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, topic: e.target.value }))}
                  className="input"
                  placeholder="e.g., Fractions, Water Cycle"
                  required
                />
              </div>
              <div>
                <label className="label">Due Date (optional)</label>
                <input
                  type="date"
                  value={assignForm.due_date}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, due_date: e.target.value }))}
                  className="input"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isAssigning || !assignForm.child_id || !assignForm.topic}
                className="btn-primary"
              >
                {isAssigning ? 'Assigning...' : 'Create Assignment'}
              </button>
              <button
                type="button"
                onClick={() => setShowAssignForm(false)}
                className="btn-outline"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <Users className="w-5 h-5 text-primary-600" />
            Student Progress
          </h2>
          {students.length > 0 ? (
            <div className="space-y-4">
              {students.map((student: any) => (
                <Link
                  key={student.id}
                  to={`/reports/child/${student.id}`}
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-500">Age {student.age} • {student.stories_completed} stories</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn('font-semibold', getUnderstandingColor(student.average_score))}>
                      {student.average_score.toFixed(1)}%
                    </p>
                    {student.needs_practice && (
                      <p className="text-xs text-yellow-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Needs practice
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No students assigned yet</p>
          )}
        </div>

        <div className="card p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Recent Assignments
          </h2>
          {assignments.length > 0 ? (
            <div className="space-y-3">
              {assignments.slice(0, 10).map((assignment: any) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center',
                      assignment.completed ? 'bg-green-100' : 'bg-yellow-100'
                    )}>
                      {assignment.completed ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{assignment.topic}</p>
                      <p className="text-sm text-gray-500">Assigned {formatDate(assignment.assigned_at)}</p>
                    </div>
                  </div>
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    assignment.completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  )}>
                    {assignment.completed ? 'Completed' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No assignments created yet</p>
          )}
        </div>
      </div>

      {studentsNeedingPractice.length > 0 && (
        <div className="card p-6 border-l-4 border-yellow-500">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-yellow-800 mb-4">
            <AlertCircle className="w-5 h-5" />
            Students Needing Attention
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {studentsNeedingPractice.map((student: any) => (
              <Link
                key={student.id}
                to={`/reports/child/${student.id}`}
                className="p-4 rounded-xl bg-yellow-50 hover:bg-yellow-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-600">Average: {student.average_score.toFixed(1)}%</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-yellow-600" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}