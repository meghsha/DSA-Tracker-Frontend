import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { fetchChapters, fetchTopics, fetchProblems } from '../services/sheetService';
import type { Chapter, Topic, Problem } from '../types/sheet';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';

const Planner: React.FC = () => {
  const navigate = useNavigate();

  // State for problems data (chapters -> topics -> problems)
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topicsMap, setTopicsMap] = useState<Map<string, Topic[]>>(new Map());
  const [problemsMap, setProblemsMap] = useState<Map<string, Problem[]>>(new Map());
  const [allProblems, setAllProblems] = useState<Problem[]>([]);

  // State for study plans
  const [studyPlans, setStudyPlans] = useState<any[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editSubmitError, setEditSubmitError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [planToDeleteId, setPlanToDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Helper to format date as YYYY-MM-DD (local date) - FIXED TIMEZONE ISSUE
  // This creates a date string based on the local date without timezone conversion issues
  const formatDateLocal = (date: Date): string => {
    // Pad month and day with leading zeros
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to parse YYYY-MM-DD string to Date object (local date)
  const parseDateLocal = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    // Create date at 12:00 PM to avoid timezone issues during parsing
    return new Date(year, month - 1, day, 12, 0, 0);
  };

  // Load all problems from backend (chapters -> topics -> problems)
  const loadAllProblems = async () => {
    try {
      setLoading(true);
      setError(null);

      const chaptersData = await fetchChapters();
      setChapters(chaptersData);

      const allProblemsArray: Problem[] = [];
      for (const chap of chaptersData) {
        const topicsData = await fetchTopics(chap._id);
        topicsMap.set(chap._id, topicsData);
        setTopicsMap(new Map(topicsMap)); // trigger update

        for (const topic of topicsData) {
          const problemsData = await fetchProblems(topic._id);
          problemsMap.set(topic._id, problemsData);
          setProblemsMap(new Map(problemsMap)); // trigger update
          allProblemsArray.push(...problemsData);
        }
      }

      // Sort problems alphabetically by title
      setAllProblems(allProblemsArray.sort((a, b) => a.title.localeCompare(b.title)));
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load problems');
    } finally {
      setLoading(false);
    }
  };

  // Load study plans for a given month
  const loadStudyPlansForMonth = async (date: Date) => {
    try {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const startDateStr = formatDateLocal(start);
      const endDateStr = formatDateLocal(end);

      const res = await api.get(`/api/study-plans?startDate=${startDateStr}&endDate=${endDateStr}`);
      setStudyPlans(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load study plans');
    }
  };

  // Effect to load initial data
  useEffect(() => {
    loadAllProblems();
    loadStudyPlansForMonth(currentMonth);
  }, []);

  // Effect to reload plans when month changes
  useEffect(() => {
    loadStudyPlansForMonth(currentMonth);
  }, [currentMonth]);

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  // Get plans for a specific date - FIXED to depend ONLY on the passed date
  const getPlansForDate = (date: Date) => {
    if (!date) return [];
    const dateStr = formatDateLocal(date);
    return studyPlans.filter(plan => {
      // Handle both string and Date objects for scheduledDate
      const scheduledDate = plan.scheduledDate;
      if (typeof scheduledDate === 'string') {
        return scheduledDate.startsWith(dateStr);
      } else if (scheduledDate instanceof Date) {
        return formatDateLocal(scheduledDate) === dateStr;
      }
      return false;
    });
  };

  // Date selection handler
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Reset form states when date changes
    setSelectedProblemId(null);
    setNotes('');
    setSubmitError(null);
  };

  // Open add modal handler
  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  // Close add modal handler
  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setSelectedProblemId(null);
    setNotes('');
    setSubmitError(null);
  };

  // Add study plan handler
  const handleAddStudyPlan = async () => {
    if (!selectedDate || !selectedProblemId) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await api.post('/api/study-plans', {
        problemId: selectedProblemId,
        scheduledDate: formatDateLocal(selectedDate),
        notes: notes.trim(),
      });

      // Close modal and reload plans
      setIsAddModalOpen(false);
      setSelectedProblemId(null);
      setNotes('');
      await loadStudyPlansForMonth(currentMonth);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message ?? 'Failed to add study plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete study plan handler
  const handleDeleteStudyPlan = async (id: string) => {
    setDeleteError(null);
    try {
      await api.delete(`/api/study-plans/${id}`);
      setDeleteConfirmOpen(false);
      setPlanToDeleteId(null);
      await loadStudyPlansForMonth(currentMonth);
    } catch (err: any) {
      setDeleteError(err.response?.data?.message ?? 'Failed to delete study plan');
    }
  };

  // Edit study plan handler
  const handleEditStudyPlan = (plan: any) => {
    setEditingPlanId(plan._id);
    setSelectedProblemId(plan.problemId._id);
    setNotes(plan.notes || '');
    // Set selected date to the plan's date for editing
    const planDate = plan.scheduledDate instanceof Date
      ? plan.scheduledDate
      : parseDateLocal(plan.scheduledDate);
    setSelectedDate(planDate);
    setEditSubmitError(null);
    setEditModalOpen(true);
  };

  // Update study plan handler
  const handleUpdateStudyPlan = async () => {
    if (!editingPlanId) return;
    setIsSubmitting(true);
    setEditSubmitError(null);

    try {
      await api.patch(`/api/study-plans/${editingPlanId}`, {
        problemId: selectedProblemId,
        scheduledDate: selectedDate ? formatDateLocal(selectedDate) : undefined,
        notes: notes.trim(),
      });

      setEditModalOpen(false);
      setEditingPlanId(null);
      setSelectedProblemId(null);
      setSelectedDate(null);
      setNotes('');
      await loadStudyPlansForMonth(currentMonth);
    } catch (err: any) {
      setEditSubmitError(err.response?.data?.message ?? 'Failed to update study plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full border-4 border-indigo-600 border-t-transparent w-12 h-12"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-md mx-auto mt-10 bg-red-50 border-l-4 border-red-500 text-red-700">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-md flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-3">
          <span className="text-xl font-semibold text-indigo-600">DSA Tracker</span>
        </div>
        <div className="flex space-x-4">
          <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600 font-medium">
            Dashboard
          </Link>
          <Link to="/planner" className="text-indigo-600 hover:text-indigo-500 font-medium">
            Study Planner
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem('accessToken');
              navigate('/login', { replace: true });
            }}
            className="text-gray-600 hover:text-red-600 font-medium"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Study Planner</h1>
            <p className="text-lg text-gray-600 mt-2">
              Plan what to solve and stay consistent with your DSA preparation.
            </p>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Calendar */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200">
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handlePrevMonth}
                      className="p-2 rounded hover:bg-gray-100"
                    >
                      ‹
                    </button>
                    <span className="text-xl font-medium">
                      {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      onClick={handleNextMonth}
                      className="p-2 rounded hover:bg-gray-100"
                    >
                      ›
                    </button>
                  </div>
                </div>
                <DayPicker
                  month={currentMonth}
                  selected={selectedDate}
                  onDayClick={handleDateSelect}
                  numberOfMonths={1}
                  classNames={{
                    root: 'w-full',
                    table: 'w-full',
                    caption: 'mb-4',
                    weekday: 'text-center font-medium text-gray-600',
                    weekday__weekend: 'text-center font-medium text-gray-600',
                    body: 'space-y-0',
                    row: 'flex',
                    cell: 'relative h-[60px] cursor-pointer rounded-lg transition-colors hover:bg-gray-50',
                    cell__today: 'border-2 border-indigo-300',
                    cell__selected: 'bg-indigo-600 text-white',
                    cell__outside: 'text-gray-300',
                  }}
                  modifiers={{
                    hasPlans: (day: Date) => {
                      if (!day) return false;
                      const dateStr = formatDateLocal(day);
                      return studyPlans.some(plan => {
                        const scheduledDate = plan.scheduledDate;
                        if (typeof scheduledDate === 'string') {
                          return scheduledDate.startsWith(dateStr);
                        } else if (scheduledDate instanceof Date) {
                          return formatDateLocal(scheduledDate) === dateStr;
                        }
                        return false;
                      });
                    },
                  }}
                  modifiersStyles={{
                    hasPlans: {
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: '4px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: 'currentColor',
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Right: Selected Date Panel */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200">
              {selectedDate ? (
                <>
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      {selectedDate.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </h2>
                    {getPlansForDate(selectedDate).length > 0 ? (
                      <>
                        <p className="text-sm text-gray-600 mb-4">
                          {getPlansForDate(selectedDate).length} problem{
                            getPlansForDate(selectedDate).length !== 1 ? 's' : ''
                          } planned
                        </p>
                        <div className="space-y-4">
                          {getPlansForDate(selectedDate).map((plan) => (
                            <div
                              key={plan._id}
                              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => handleEditStudyPlan(plan)}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-gray-900">
                                  {plan.problemId.title}
                                </h3>
                                <span className={`px-2 py-0.5 text-xs rounded ${
                                  plan.problemId.difficulty === 'Easy'
                                    ? 'bg-green-100 text-green-800'
                                    : plan.problemId.difficulty === 'Medium'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                }`}
                                >
                                  {plan.problemId.difficulty}
                                </span>
                              </div>
                              {plan.problemId.description && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {plan.problemId.description}
                                </p>
                              )}
                              {plan.notes && (
                                <div className="mb-4">
                                  <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
                                  <p className="text-gray-600">{plan.notes}</p>
                                </div>
                              )}
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditStudyPlan(plan);
                                  }}
                                  className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPlanToDeleteId(plan._id);
                                    setDeleteConfirmOpen(true);
                                  }}
                                  className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-500"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600 mb-4">
                          No problems planned for this day.
                        </p>
                        <button
                          onClick={handleOpenAddModal}
                          className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          + Add problem
                        </button>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-gray-500">
                  <p className="mb-4">Select a date to see planned problems</p>
                  <button
                    onClick={handleOpenAddModal}
                    disabled
                    className="w-full flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-400 rounded cursor-not-allowed"
                  >
                    + Add problem
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add Study Plan Modal */}
      {isAddModalOpen && selectedDate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-96 max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Schedule Problem</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddStudyPlan();
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formatDateLocal(selectedDate)}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Problem
                </label>
                <select
                  value={selectedProblemId}
                  onChange={(e) => setSelectedProblemId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select a problem</option>
                  {allProblems.map((prob) => (
                    <option key={prob._id} value={prob._id}>
                      [{prob.difficulty}] {prob.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {submitError && (
                  <p className="mt-2 text-sm text-red-600">{submitError}</p>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setSelectedProblemId(null);
                    setNotes('');
                    setSubmitError(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !selectedProblemId ||
                    isSubmitting
                  }
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add to planner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Study Plan Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-96 max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Study Plan</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateStudyPlan();
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate ? formatDateLocal(selectedDate) : ''}
                  onChange={(e) => {
                    const date = new Date(e.target.value);
                    setSelectedDate(date);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Problem
                </label>
                <select
                  value={selectedProblemId}
                  onChange={(e) => setSelectedProblemId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select a problem</option>
                  {allProblems.map((prob) => (
                    <option key={prob._id} value={prob._id}>
                      [{prob.difficulty}] {prob.title}
                    </option>
                  ))}
                </select>
                {/* Show current problem as read-only if we don't allow changing it */}
                {/* For now, we allow changing it since the backend might support it */}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {editSubmitError && (
                  <p className="mt-2 text-sm text-red-600">{editSubmitError}</p>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingPlanId(null);
                    setSelectedProblemId(null);
                    setSelectedDate(null);
                    setNotes('');
                    setEditSubmitError(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !selectedProblemId ||
                    isSubmitting
                  }
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Update'}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteStudyPlan}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 ml-2"
                >
                  Delete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && planToDeleteId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-96 max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Deletion</h2>
            <p className="mb-6">
              Remove this problem from your study plan?
            </p>
            {deleteError && (
              <p className="mb-4 text-sm text-red-600">{deleteError}</p>
            )}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setPlanToDeleteId(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              <button
                type="button"
                onClick={() => handleDeleteStudyPlan(planToDeleteId!)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planner;