import React, { useState } from 'react';
import { Task, Priority, TaskStatus, Category, TodoList } from '../types';
import { Trash2, Tag, CheckCircle2, Clock, Circle, Plus, Check, X, Bike, Sun, FolderInput, ChevronDown } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  categories: Category[];
  lists: TodoList[];
  title: string;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onUpdatePriority: (id: string, priority: Priority) => void;
  onMoveTask: (id: string, listId: string) => void;
  onDeleteTask: (id: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
}

const PriorityBadge: React.FC<{ priority: Priority; onChange: (p: Priority) => void }> = ({ priority, onChange }) => {
  const colors = {
    [Priority.LOW]: 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200',
    [Priority.MEDIUM]: 'bg-sky-50 text-sky-600 border-sky-100 hover:bg-sky-100',
    [Priority.HIGH]: 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100',
  };

  return (
    <div className="relative group/priority">
        <select
            value={priority}
            onChange={(e) => onChange(e.target.value as Priority)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        >
            <option value={Priority.LOW}>{Priority.LOW}</option>
            <option value={Priority.MEDIUM}>{Priority.MEDIUM}</option>
            <option value={Priority.HIGH}>{Priority.HIGH}</option>
        </select>
        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border transition-colors cursor-pointer flex items-center gap-1 ${colors[priority]}`}>
        {priority}
        <ChevronDown size={8} className="opacity-50" />
        </span>
    </div>
  );
};

const TaskItem: React.FC<{
  task: Task;
  category?: Category;
  lists: TodoList[];
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onUpdatePriority: (id: string, priority: Priority) => void;
  onMoveTask: (id: string, listId: string) => void;
  onDeleteTask: (id: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
}> = ({ task, category, lists, onUpdateStatus, onUpdatePriority, onMoveTask, onDeleteTask, onAddSubtask, onToggleSubtask, onDeleteSubtask }) => {
  const [newSubtask, setNewSubtask] = useState('');

  const handleSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtask.trim()) {
      onAddSubtask(task.id, newSubtask.trim());
      setNewSubtask('');
    }
  };

  const completedSubtasks = task.subtasks.filter(st => st.isCompleted).length;
  const totalSubtasks = task.subtasks.length;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <div 
      className={`group flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300 ${
        task.status === 'done'
          ? 'bg-slate-50/80 border-slate-100 opacity-60' 
          : task.status === 'in_progress'
          ? 'bg-amber-50 border-amber-200 shadow-md shadow-amber-100/50 scale-[1.01]'
          : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300'
      }`}
    >
      {/* Status Selector */}
      <div className="mt-0.5 relative group/status shrink-0">
         <select 
            value={task.status}
            onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
         >
           <option value="todo">Te doen</option>
           <option value="in_progress">Bezig</option>
           <option value="done">Klaar!</option>
         </select>

         <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all border-2 
            ${task.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' 
            : task.status === 'in_progress' ? 'bg-amber-400 border-amber-400 text-white shadow-sm' 
            : 'border-slate-300 bg-white text-transparent group-hover/status:border-amber-400'}
         `}>
            {task.status === 'done' && <Check size={16} strokeWidth={3} />}
            {task.status === 'in_progress' && <Clock size={16} strokeWidth={3} />}
         </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className={`text-base font-semibold tracking-tight break-words transition-all ${
            task.status === 'done' ? 'text-slate-400 line-through decoration-2 decoration-slate-300' : 'text-slate-800'
          }`}>
          {task.title}
        </div>
        
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {task.status !== 'done' && (
             <PriorityBadge 
                priority={task.priority} 
                onChange={(p) => onUpdatePriority(task.id, p)}
             />
          )}

          {task.status === 'in_progress' && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border bg-amber-100 text-amber-600 border-amber-200">
              Lekker bezig!
            </span>
          )}
          
          {category && (
            <div 
              className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 rounded-full border"
              style={{ 
                backgroundColor: `${category.color}15`, 
                color: category.color,
                borderColor: `${category.color}30`
              }}
            >
              <Tag size={10} />
              <span>{category.name}</span>
            </div>
          )}

           {/* Move to List Selector */}
           <div className="relative group/move ml-1">
             <select
                 value={task.listId}
                 onChange={(e) => onMoveTask(task.id, e.target.value)}
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
             >
                 {lists.map(list => (
                     <option key={list.id} value={list.id}>Naar: {list.name}</option>
                 ))}
             </select>
             <button className="text-slate-300 hover:text-slate-500 hover:bg-slate-100 p-0.5 rounded transition-colors flex items-center gap-1" title="Verplaats naar andere lijst">
                 <FolderInput size={14} />
             </button>
           </div>

        </div>

        {/* Subtasks Section */}
        <div className="mt-4 space-y-2">
          {/* Subtask Progress Bar */}
          {totalSubtasks > 0 && (
            <div className="flex items-center gap-3 mb-2">
               <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-300"
                   style={{ width: `${subtaskProgress}%` }}
                 />
               </div>
               <span className="text-[10px] text-slate-400 font-bold">{completedSubtasks}/{totalSubtasks}</span>
            </div>
          )}

          {/* Subtasks List */}
          {task.subtasks.map(subtask => (
            <div key={subtask.id} className="flex items-center gap-3 group/subtask pl-1">
              <button 
                onClick={() => onToggleSubtask(task.id, subtask.id)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  subtask.isCompleted 
                    ? 'bg-slate-300 border-slate-300 text-white' 
                    : 'border-slate-300 hover:border-amber-400 bg-white'
                }`}
              >
                {subtask.isCompleted && <Check size={12} strokeWidth={3} />}
              </button>
              <span className={`text-sm flex-1 break-words font-medium ${subtask.isCompleted ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                {subtask.title}
              </span>
              <button 
                onClick={() => onDeleteSubtask(task.id, subtask.id)}
                className="opacity-0 group-hover/subtask:opacity-100 text-slate-300 hover:text-red-500 p-1"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {/* Add Subtask Input */}
          <form onSubmit={handleSubtaskSubmit} className="flex items-center gap-2 mt-2 opacity-60 hover:opacity-100 transition-opacity">
            <Plus size={16} className="text-slate-400" />
            <input
              type="text"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              placeholder="Stap toevoegen..."
              className="flex-1 bg-transparent text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none border-b border-transparent focus:border-slate-300 pb-0.5"
            />
          </form>
        </div>
      </div>

      <button
        onClick={() => onDeleteTask(task.id)}
        className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
        aria-label="Verwijder taak"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};

export const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  categories, 
  lists,
  title, 
  onUpdateStatus, 
  onUpdatePriority,
  onMoveTask,
  onDeleteTask,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask
}) => {
  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  
  const progressPercentage = totalTasks === 0 ? 0 : Math.round(((completedTasks + (inProgressTasks * 0.5)) / totalTasks) * 100);

  if (totalTasks === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center opacity-0 animate-fadeIn border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-amber-500 shadow-sm">
          <Sun size={40} />
        </div>
        <h3 className="text-xl font-bold text-slate-700">Lege lijst!</h3>
        <p className="text-slate-500 text-sm mt-2 max-w-xs font-medium leading-relaxed">
          Niets te doen? Tijd om de fiets te pakken en de zon in te rijden! ☀️
        </p>
      </div>
    );
  }

  const getCategory = (id: string) => categories.find(c => c.id === id);

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
    
    const pOrder = { [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
    return pOrder[b.priority] - pOrder[a.priority];
  });

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h2>
        <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-amber-600 bg-amber-100 px-3 py-1 rounded-full">{progressPercentage}% Ready</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden mb-8 border border-slate-200">
        <div 
          className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(251,191,36,0.5)]"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      {sortedTasks.map((task) => (
        <TaskItem 
          key={task.id} 
          task={task} 
          category={getCategory(task.categoryId)}
          lists={lists}
          onUpdateStatus={onUpdateStatus}
          onUpdatePriority={onUpdatePriority}
          onMoveTask={onMoveTask}
          onDeleteTask={onDeleteTask}
          onAddSubtask={onAddSubtask}
          onToggleSubtask={onToggleSubtask}
          onDeleteSubtask={onDeleteSubtask}
        />
      ))}
    </div>
  );
};