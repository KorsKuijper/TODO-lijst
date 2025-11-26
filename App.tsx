import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Sidebar } from './components/Sidebar';
import { TaskRow } from './components/TaskRow';
import { parseNaturalLanguageInput } from './services/geminiService';
import { 
  loadLocal, saveLocal, fetchCloudData, saveToCloud, subscribeToChanges
} from './services/storageService';
import { Task, List, Priority, AppData, Category } from './types';
import { Plus, Filter, Download, Mountain, Sparkles, X, Layout, List as ListIcon } from 'lucide-react';
import { format, isPast, isToday, parseISO } from 'date-fns';

const DEFAULT_LISTS: List[] = [
  { id: 'basecamp', title: 'Basecamp', color: '#f97316', icon_name: 'Mountain', isDefault: true },
  { id: 'expeditions', title: 'Expeditions', color: '#10b981', icon_name: 'Map' },
  { id: 'maintenance', title: 'Gear Maintenance', color: '#64748b', icon_name: 'Wrench' },
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'default', name: 'Algemeen', color: '#94a3b8' },
  { id: 'urgent', name: 'Urgent', color: '#ef4444' },
  { id: 'trip', name: 'Trip', color: '#3b82f6' }
];

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(() => {
    // Initial load from local storage to be instant
    const local = loadLocal(DEFAULT_LISTS, DEFAULT_CATEGORIES);
    return local;
  });

  const [view, setView] = useState<'focus' | 'all'>('focus');
  const [activeListId, setActiveListId] = useState<string>('basecamp');
  
  // Quick Capture State
  const [quickInput, setQuickInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [useAI, setUseAI] = useState(false);

  // Sync State
  const [isOnline, setIsOnline] = useState(false);
  const [briefingOpen, setBriefingOpen] = useState(false);
  
  // Ref to track if the update comes from remote or local to avoid loops
  const isRemoteUpdate = useRef(false);

  // --- Initialization & Realtime ---
  useEffect(() => {
    const initData = async () => {
      // 1. Fetch latest from Supabase
      const result = await fetchCloudData();
      
      if (result.success) {
        // Connection worked
        if (result.data) {
           // We have remote data
           setIsOnline(true);
           isRemoteUpdate.current = true;
           setData(result.data);
           saveLocal(result.data);
           setTimeout(() => { isRemoteUpdate.current = false; }, 100);
        } else {
           // Connection worked, but DB is empty. Initialize it.
           const saved = await saveToCloud(data);
           if (saved) setIsOnline(true);
        }
      } else {
         // Connection failed
         setIsOnline(false);
      }
    };

    initData();
    checkDailyBriefing();

    // 2. Subscribe to Realtime Changes
    const unsubscribe = subscribeToChanges((newData) => {
       // When we receive data from other devices
       console.log("Received remote update");
       isRemoteUpdate.current = true;
       setData(newData);
       saveLocal(newData);
       setTimeout(() => { isRemoteUpdate.current = false; }, 100);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // --- Auto-Save to Cloud ---
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    // Only save if this change didn't come from a remote update
    if (!isRemoteUpdate.current && isOnline) {
      saveLocal(data);
      
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      saveTimeoutRef.current = setTimeout(async () => {
        await saveToCloud(data);
      }, 1000); // Debounce saves to 1 second
    } else if (!isOnline) {
      // Just local save if offline
      saveLocal(data);
    }
  }, [data, isOnline]);

  const checkDailyBriefing = () => {
    const last = localStorage.getItem('lastBriefingDate');
    const today = new Date().toISOString().split('T')[0];
    if (last !== today) {
      setBriefingOpen(true);
      localStorage.setItem('lastBriefingDate', today);
    }
  };

  // --- Logic ---
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    setIsProcessing(true);

    try {
      if (useAI) {
        const result = await parseNaturalLanguageInput(quickInput, data.lists.map(l => l.title));
        
        let targetListId = activeListId;
        const matchingList = data.lists.find(l => l.title.toLowerCase() === result.suggestedListName.toLowerCase());
        if (matchingList) targetListId = matchingList.id;

        const newTasks: Task[] = result.tasks.map(t => ({
          id: uuidv4(),
          listId: targetListId,
          title: t.title,
          label: t.label,
          priority: t.priority,
          deadline: t.deadline,
          isCompleted: false,
          status: 'todo',
          subtasks: [],
          categoryId: 'default',
          createdAt: Date.now()
        }));

        setData(prev => ({ ...prev, tasks: [...newTasks, ...prev.tasks], updatedAt: Date.now() }));
      } else {
        // Manual Quick Capture
        const newTask: Task = {
          id: uuidv4(),
          listId: activeListId,
          title: quickInput,
          priority: Priority.MEDIUM,
          isCompleted: false,
          status: 'todo',
          subtasks: [],
          categoryId: 'default',
          createdAt: Date.now()
        };
        setData(prev => ({ ...prev, tasks: [newTask, ...prev.tasks], updatedAt: Date.now() }));
      }
      setQuickInput('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateTask = (updatedTask: Task) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === updatedTask.id ? updatedTask : t),
      updatedAt: Date.now()
    }));
  };

  const deleteTask = (id: string) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id),
      updatedAt: Date.now()
    }));
  };

  const handleExport = () => {
    const headers = ['Created At', 'Title', 'Label', 'Priority', 'Deadline', 'Status'];
    const rows = data.tasks.map(t => [
      new Date(t.createdAt).toISOString(),
      t.title,
      t.label || '',
      t.priority,
      t.deadline || '',
      t.isCompleted ? 'Done' : 'Pending'
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `gravel_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Filtering ---
  const filteredTasks = data.tasks.filter(t => {
    if (view === 'all' && t.listId !== activeListId) return false;

    if (view === 'focus') {
      if (t.isCompleted) return false;
      if (t.priority === Priority.HIGH) return true;
      if (t.deadline) {
        const d = parseISO(t.deadline);
        return isPast(d) || isToday(d);
      }
      return false;
    }
    return true;
  });

  filteredTasks.sort((a, b) => {
    const prioOrder = { [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
    if (prioOrder[a.priority] !== prioOrder[b.priority]) return prioOrder[b.priority] - prioOrder[a.priority];
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    return 0;
  });

  const overdueCount = data.tasks.filter(t => !t.isCompleted && t.deadline && isPast(parseISO(t.deadline)) && !isToday(parseISO(t.deadline))).length;
  const todayCount = data.tasks.filter(t => !t.isCompleted && t.deadline && isToday(parseISO(t.deadline))).length;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar 
        lists={data.lists} 
        activeListId={activeListId}
        onSelectList={(id) => { setActiveListId(id); setView('all'); }}
        onAddList={(title) => setData(prev => ({ ...prev, lists: [...prev.lists, { id: uuidv4(), title, color: '#64748b', icon_name: 'List' }] }))}
        onDeleteList={(id) => setData(prev => ({ ...prev, lists: prev.lists.filter(l => l.id !== id), tasks: prev.tasks.filter(t => t.listId !== id) }))}
        isOnline={isOnline}
      />

      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-8 py-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
             <h2 className="text-2xl font-bold tracking-tight text-slate-800">
               {view === 'focus' ? 'Cockpit' : data.lists.find(l => l.id === activeListId)?.title || 'List'}
             </h2>
             {view === 'focus' && (
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wide">
                   Focus Mode
                </span>
             )}
          </div>

          <div className="flex items-center gap-3">
             <button 
               onClick={() => setView(view === 'focus' ? 'all' : 'focus')}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'focus' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-white text-slate-600 border border-slate-200'}`}
             >
                {view === 'focus' ? <Layout size={18} /> : <ListIcon size={18} />}
                <span>{view === 'focus' ? 'Dashboard' : 'List View'}</span>
             </button>
             <button onClick={handleExport} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                <Download size={20} />
             </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50">
           <div className="max-w-5xl mx-auto px-8 py-8">
              
              {/* Stats Row */}
              {view === 'focus' && (
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white border border-red-100 p-5 rounded-xl shadow-sm border-l-4 border-l-red-500">
                        <div className="text-xs font-bold uppercase text-red-600 mb-1">Overdue Tasks</div>
                        <div className="text-3xl font-black text-slate-800">{overdueCount}</div>
                    </div>
                    <div className="bg-white border border-orange-100 p-5 rounded-xl shadow-sm border-l-4 border-l-orange-500">
                        <div className="text-xs font-bold uppercase text-orange-600 mb-1">Due Today</div>
                        <div className="text-3xl font-black text-slate-800">{todayCount}</div>
                    </div>
                </div>
              )}

              {/* Quick Capture */}
              <div className="mb-8 relative z-0">
                  <div className={`absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-400 rounded-2xl blur opacity-20 transition-opacity ${isProcessing ? 'opacity-50' : ''}`}></div>
                  <form onSubmit={handleAddTask} className="relative bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden flex flex-col md:flex-row">
                      <div className="flex-1 relative">
                          <input 
                              type="text" 
                              value={quickInput}
                              onChange={(e) => setQuickInput(e.target.value)}
                              placeholder={useAI ? "Describe your plan (e.g., 'Buy sealant for tubeless setup tomorrow')..." : "Quick add task..."}
                              className="w-full h-16 pl-6 pr-4 text-lg font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
                              disabled={isProcessing}
                          />
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-100">
                          <button 
                            type="button" 
                            onClick={() => setUseAI(!useAI)}
                            className={`p-3 rounded-xl transition-all flex items-center gap-2 text-sm font-bold ${useAI ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:bg-slate-200'}`}
                          >
                             <Sparkles size={18} />
                             {useAI && <span className="hidden md:inline">AI ON</span>}
                          </button>
                          <button 
                             type="submit" 
                             disabled={!quickInput.trim() || isProcessing}
                             className="bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors"
                          >
                             <Plus size={20} />
                          </button>
                      </div>
                  </form>
              </div>

              {/* Task List */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                 {filteredTasks.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mountain className="text-slate-300" />
                        </div>
                        <h3 className="text-slate-900 font-bold mb-1">All Clear</h3>
                        <p className="text-slate-500 text-sm">No tasks found. Time to ride!</p>
                    </div>
                 ) : (
                    <div>
                        {filteredTasks.map(task => (
                            <TaskRow 
                                key={task.id} 
                                task={task} 
                                onUpdate={updateTask}
                                onDelete={deleteTask}
                            />
                        ))}
                    </div>
                 )}
              </div>
           </div>
        </div>
      </main>

      {/* Daily Briefing Modal */}
      {briefingOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-orange-100 p-3 rounded-full">
                       <Mountain className="text-orange-600 w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Morning Briefing</h2>
                </div>
                
                <div className="space-y-4 mb-8">
                    <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                        <div className="text-red-800 font-bold text-lg mb-1">{overdueCount} Overdue</div>
                        <p className="text-red-600/80 text-sm">Critical maintenance required.</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                        <div className="text-orange-800 font-bold text-lg mb-1">{todayCount} Due Today</div>
                        <p className="text-orange-600/80 text-sm">Focus on these before your next ride.</p>
                    </div>
                    <p className="italic text-slate-500 text-center mt-4">
                        "It's not the mountain we conquer, but ourselves."
                    </p>
                </div>

                <button 
                  onClick={() => setBriefingOpen(false)}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800"
                >
                    Let's Go
                </button>
            </div>
         </div>
      )}
    </div>
  );
};

export default App;