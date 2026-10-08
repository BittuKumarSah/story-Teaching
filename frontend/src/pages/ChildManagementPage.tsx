import { useState } from 'react';
import { useChildren } from '../contexts/ChildContext';
import { Plus, Edit, Trash2, User, Calendar, Check, X } from 'lucide-react';
import { cn } from '../utils/helpers';

export default function ChildManagementPage() {
  const { children, selectedChild, setSelectedChild, createChild, updateChild, deleteChild, fetchChildren } = useChildren();
  const [showForm, setShowForm] = useState(false);
  const [editingChild, setEditingChild] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', age: 8, grade: 3 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingChild) {
        await updateChild(editingChild.id, formData);
      } else {
        await createChild(formData);
      }
      setShowForm(false);
      setEditingChild(null);
      setFormData({ name: '', age: 8, grade: 3 });
    } catch (err) {
      console.error('Failed to save child:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (child: any) => {
    setEditingChild(child);
    setFormData({ name: child.name, age: child.age, grade: child.grade || 3 });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this child? This will also delete all their stories and progress.')) {
      try {
        await deleteChild(id);
      } catch (err) {
        console.error('Failed to delete child:', err);
      }
    }
  };

  const handleSelect = (child: any) => {
    setSelectedChild(child);
  };

  const resetForm = () => {
    setEditingChild(null);
    setFormData({ name: '', age: 8, grade: 3 });
    setShowForm(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Manage Children</h1>
          <p className="text-gray-600">Add and manage child profiles for personalized learning</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Child
        </button>
      </div>

      {showForm && (
        <div className="card p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingChild ? 'Edit Child' : 'Add New Child'}
            </h2>
            <button
              onClick={resetForm}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="label">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input"
                  placeholder="Child's name"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="age" className="label">Age</label>
                <select
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                  className="input"
                  required
                >
                  {[6,7,8,9,10,11,12].map(age => (
                    <option key={age} value={age}>{age} years old</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="grade" className="label">Grade (optional)</label>
                <select
                  id="grade"
                  name="grade"
                  value={formData.grade}
                  onChange={(e) => setFormData(prev => ({ ...prev, grade: parseInt(e.target.value) }))}
                  className="input"
                >
                  <option value="">Select grade</option>
                  {[1,2,3,4,5,6].map(grade => (
                    <option key={grade} value={grade}>Grade {grade}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
                className="btn-primary flex-1"
              >
                {isSubmitting ? 'Saving...' : editingChild ? 'Update' : 'Add Child'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {children.length === 0 && !showForm && (
        <div className="card p-12 text-center">
          <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No children added yet</h2>
          <p className="text-gray-600 mb-6">Add your first child to start creating personalized learning stories</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            Add Your First Child
          </button>
        </div>
      )}

      {children.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {children.map((child) => (
            <div
              key={child.id}
              className={cn(
                'card p-6 relative transition-all',
                selectedChild?.id === child.id
                  ? 'ring-2 ring-primary-500 bg-primary-50'
                  : 'card-hover'
              )}
            >
              {selectedChild?.id === child.id && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{child.name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Age {child.age}
                    </span>
                    {child.grade && (
                      <span className="flex items-center gap-1">
                        Grade {child.grade}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleSelect(child)}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    selectedChild?.id === child.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {selectedChild?.id === child.id ? 'Selected' : 'Select'}
                </button>
                <button
                  onClick={() => handleEdit(child)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(child.id)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}