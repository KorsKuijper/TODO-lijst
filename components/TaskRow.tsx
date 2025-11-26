import React from 'react';
import { Task, Priority } from '../types';
import { format, isPast, isToday, parseISO, isValid } from 'date-fns';
import { Check, AlertCircle, Clock, Calendar, Tag, Trash2 } from 'lucide-react';

interface TaskRowProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
}

export const TaskRow: React.FC<TaskRowProps> = ({ task, onUpdate, onDelete }) => {
  
  const toggleComplete = () => {
    onUpdate({
      ...task,
      isCompleted: !task.isCompleted,
      completedAt: !task.isCompleted ? new Date().toISOString() : undefined
    });
  };

  const deadlineDate = task.deadline ? parseISO(task.deadline) : null;
  const isDeadlineValid = deadlineDate && isValid(deadlineDate);
  const isOverdue = isDeadlineValid && isPast(deadlineDate) && !isToday(deadlineDate);
  const isDueToday = isDeadlineValid && isToday(deadlineDate);

  const priorityColors = {
    [Priority.HIGH]: 'text-red-700 bg-red-50 border-red-200',
    [Priority.MEDIUM]: 'text-orange-700 bg-orange-50 border-orange-200',
    [Priority.LOW]: 'text-slate-600 bg-slate-100 border-slate-200'
  };

  return (
    <div className={`group flex flex-col md:flex-row md:items-center gap-3 p-4 border-b border-slate-100 hover:bg-slate-50 transition-all ${task.isCompleted ? 'opacity-50 bg-slate-50/50' : 'bg-white'}`}>
      
      {/* Checkbox */}
      <button 
        onClick={toggleComplete}
        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${
          task.isCompleted 
            ? 'bg-emerald-500 border-emerald-500 text-white' 
            : 'bg-white border-slate-300 hover:border-orange-500'
        }`}
      >
        {task.isCompleted && <Check size={14} strokeWidth={3} />}
      </button>

      {/* Title & Description */}
      <div className="flex-1 min-w-0">
        <div className={`text-base font-semibold truncate ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
          {task.title}
        </div>
      </div>

      {/* Meta Data Row */}
      <div className="flex items-center gap-2 md:gap-4 text-sm w-full md:w-auto overflow-x-auto no-scrollbar">
        
        {/* Label */}
        {task.label && (
           <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold whitespace-nowrap">
             <Tag size={10} className="opacity-50" />
             {task.label}
           </span>
        )}

        {/* Deadline */}
        {isDeadlineValid && (
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md font-medium whitespace-nowrap border ${
            isOverdue ? 'text-red-700 bg-red-50 border-red-100' : 
            isDueToday ? 'text-orange-700 bg-orange-50 border-orange-100' : 'text-slate-500 border-transparent'
          }`}>
            {isOverdue ? <AlertCircle size={14} /> : <Calendar size={14} />}
            <span>{format(deadlineDate, 'MMM d')}</span>
          </div>
        )}

        {/* Priority Badge */}
        <div className={`px-2.5 py-1 rounded-md text-xs font-bold border whitespace-nowrap ${priorityColors[task.priority]}`}>
          {task.priority}
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"
        >
            <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};