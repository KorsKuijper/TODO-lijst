import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Sidebar } from './components/Sidebar';
import { TaskInput } from './components/TaskInput';
import { TaskList } from './components/TaskList';
import { SyncModal } from './components/SyncModal';
import { parseNaturalLanguageInput } from './services/geminiService';
import { loadLocal, saveLocal, getSyncId, setSyncId, clearSyncId, createCloudStore, fetchCloudStore, updateCloudStore } from './services/storageService';
import { Task, TodoList, Priority, Category, TaskStatus, AppData } from './types';
import { Sun, Moon } from 'lucide-react';

// Cheerful Default Data
const DEFAULT_LISTS: TodoList[] = [
  { id: 'basecamp', name: 'Mijn Basecamp', isDefault: true },
  { id: 'weekend-sun', name: 'Zonnige Ritjes', isDefault: false },
  { id: 'dream-trips', name: 'Droomreizen', isDefault: false },
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'default', name: 'Algemeen', color: '#94a3b8' }, // slate-400
  { id: 'tech', name: 'Fiets', color: '#f59e0b' }, // amber-500
  { id: 'fun', name: 'Fun', color: '#ec4899' }, // pink-500
  { id: 'food', name: 'Snacks', color: '#f97316' }, // orange-500
  { id: 'route', name: 'Routes', color: '#10b981' }, // emerald-500
];

const getRandomColor = () => {
  const colors = ['#f472b6', '#34d399', '#60a5fa', '#fbbf24', '#a78bfa', '#fb7185'];
  return colors[Math.floor(Math.random() * colors.length)];
};

type ViewMode = { type: 'list', id: string } | { type: 'category', id: string };

const App: React.FC = () => {
  // Central State
  const [data, setData] = useState<AppData>(() => loadLocal(DEFAULT_LISTS, DEFAULT_CATEGORIES));
  const [syncId, setSyncIdState] = useState<string | null>(getSyncId());

  const [activeView, setActiveView] = useState<ViewMode>({ type: 'list', id: 'basecamp' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Destructure for easier usage
  const { lists, categories, tasks } = data;

  // Save to local storage on change
  useEffect(() => {
    saveLocal(data);
  }, [data]);

  // Sync Polling
  const POLL_INTERVAL = 5000;
  const lastPulledRef = useRef<number>(0);

  // Debounced push to cloud
  useEffect(() => {
    if (!syncId) return;

    // Only push if our version is newer than what we last pulled/pushed
    // We can't really know perfectly without a revision ID, but we check if we just pulled
    if (data.updatedAt <= lastPulledRef.current) return;

    const timeout = setTimeout(async () => {
      try {
        setIsSyncing(true);
        await updateCloudStore(syncId, data);
        setIsSyncing(false);
      } catch (e) {
        console.error("Auto-save failed", e);
        setIsSyncing(false);
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [data, syncId]);

  // Poll for changes
  useEffect(() => {
    if (!syncId) return;

    const poll = async () => {
      try {
        const cloudData = await fetchCloudStore(syncId);
        if (cloudData.updatedAt > data.updatedAt) {
          setData(cloudData);
          lastPulledRef.current = cloudData.updatedAt;
          showToast("Data gesynchroniseerd ☁️");
        }
      } catch (e) {
        // Silent fail on poll
      }
    };

    poll(); // Initial check
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [syncId, data.updatedAt]); // Dependency on updatedAt ensures we check against latest

  // Cross-tab sync
  useEffect(() => {
    const handleStorageChange = () => {
       const newData = loadLocal(DEFAULT_LISTS, DEFAULT_CATEGORIES);
       if (newData.updatedAt > data.updatedAt) {
         setData(newData);
       }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [data.updatedAt]);

  // Greeting Logic
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Goedemorgen", icon: <Sun className="text-amber-400" size={32} /> };
    if (hour < 18) return { text: "Goedemiddag", icon: <Sun className="text-orange-400" size={32} /> };
    return { text: "Goedenavond", icon: <Moon className="text-indigo-400" size={32} /> };
  };

  const greeting = getGreeting();

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper to update state
  const updateData = (fn: (prev: AppData) => Partial<AppData>) => {
    setData(prev => ({
      ...prev,
      ...fn(prev),
      updatedAt: Date.now()
    }));
  };

  // --- Sync Handlers ---
  const handleEnableSync = async () => {
    const id = await createCloudStore(data);
    setSyncId(id);
    setSyncIdState(id);
    showToast("Synchronisatie gestart!");
  };

  const handleJoinSync = async (id: string) => {
    const cloudData = await fetchCloudStore(id);
    setData(cloudData); // Join means we accept the cloud state usually
    setSyncId(id);
    setSyncIdState(id);
    showToast("Gekoppeld met apparaat!");
  };

  const handleDisconnectSync = () => {
    clearSyncId();
    setSyncIdState(null);
    showToast("Synchronisatie gestopt.");
  };

  // --- List Handlers ---

  const handleAddList = (name: string) => {
    const newList: TodoList = { id: uuidv4(), name };
    updateData(prev => ({ lists: [...prev.lists, newList] }));
    setActiveView({ type: 'list', id: newList.id });
    showToast(`Nieuwe lijst "${name}" gemaakt! 🚴`);
  };

  const handleDeleteList = (id: string) => {
    updateData(prev => ({
      lists: prev.lists.filter(l => l.id !== id),
      tasks: prev.tasks.filter(t => t.listId !== id)
    }));
    if (activeView.type === 'list' && activeView.id === id) {
        setActiveView({ type: 'list', id: 'basecamp' });
    }
    showToast("Lijst verwijderd");
  };

  // --- Category Handlers ---
  const handleAddCategory = (name: string) => {
    const newCat: Category = { id: uuidv4(), name, color: getRandomColor() };
    updateData(prev => ({ categories: [...prev.categories, newCat] }));
    showToast(`Categorie "${name}" toegevoegd ✨`);
  };

  const handleDeleteCategory = (id: string) => {
    if (id === 'default') return;
    updateData(prev => ({
      categories: prev.categories.filter(c => c.id !== id),
      tasks: prev.tasks.map(t => t.categoryId === id ? { ...t, categoryId: 'default' } : t)
    }));
    if (activeView.type === 'category' && activeView.id === id) {
        setActiveView({ type: 'list', id: 'basecamp' });
    }
    showToast("Categorie verwijderd");
  };

  // --- Task Handlers ---

  const handleAddTask = async (text: string, useAI: boolean, manualCategoryId?: string) => {
    setIsProcessing(true);
    try {
      if (useAI) {
        const listNames = lists.map(l => l.name);
        const categoryNames = categories.map(c => c.name);
        
        const result = await parseNaturalLanguageInput(text, listNames, categoryNames);
        
        // Determine target List ID
        let targetListId = activeView.type === 'list' ? activeView.id : 'basecamp';
        let newLists = [...lists];
        
        const matchingList = lists.find(l => l.name.toLowerCase() === result.suggestedListName.toLowerCase());
        
        if (matchingList) {
          targetListId = matchingList.id;
        } else if (result.suggestedListName && result.suggestedListName.toLowerCase() !== 'basecamp') {
          const newList: TodoList = { id: uuidv4(), name: result.suggestedListName };
          newLists.push(newList);
          targetListId = newList.id;
        }

        let newCategories = [...categories];
        const newTasks: Task[] = result.tasks.map(t => {
          let catId = 'default';
          const existingCat = newCategories.find(c => c.name.toLowerCase() === t.categoryName.toLowerCase());
          
          if (existingCat) {
            catId = existingCat.id;
          } else if (t.categoryName) {
            const newCat: Category = { id: uuidv4(), name: t.categoryName, color: getRandomColor() };
            newCategories.push(newCat);
            catId = newCat.id;
          }

          return {
            id: uuidv4(),
            title: t.title,
            categoryId: catId,
            priority: t.priority,
            status: 'todo',
            listId: targetListId,
            createdAt: Date.now(),
            subtasks: []
          };
        });

        // Batch update
        updateData(prev => ({
          lists: newLists, // Might include new list from AI
          categories: newCategories, // Might include new cats
          tasks: [...prev.tasks, ...newTasks]
        }));
        
        if (activeView.type === 'list' && targetListId !== activeView.id) {
          showToast(`${newTasks.length} taken in "${result.suggestedListName}"`);
          setActiveView({ type: 'list', id: targetListId });
        } else {
          showToast(`${newTasks.length} taken toegevoegd 🚀`);
        }

      } else {
        // Manual Entry
        let targetListId = 'basecamp';
        if (activeView.type === 'list') {
            targetListId = activeView.id;
        } else {
            const defaultList = lists.find(l => l.isDefault);
            if (defaultList) targetListId = defaultList.id;
        }

        const newTask: Task = {
          id: uuidv4(),
          title: text,
          status: 'todo',
          listId: targetListId,
          categoryId: manualCategoryId || 'default',
          priority: Priority.MEDIUM,
          createdAt: Date.now(),
          subtasks: []
        };
        updateData(prev => ({ tasks: [...prev.tasks, newTask] }));
      }
    } catch (error) {
      console.error(error);
      showToast("Oeps, even geen verbinding.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateStatus = (id: string, status: TaskStatus) => {
    updateData(prev => ({
      tasks: prev.tasks.map(t => t.id === id ? { ...t, status } : t)
    }));
  };

  const handleUpdatePriority = (id: string, priority: Priority) => {
    updateData(prev => ({
      tasks: prev.tasks.map(t => t.id === id ? { ...t, priority } : t)
    }));
  };

  const handleMoveTask = (id: string, listId: string) => {
    updateData(prev => ({
      tasks: prev.tasks.map(t => t.id === id ? { ...t, listId } : t)
    }));
    const listName = lists.find(l => l.id === listId)?.name;
    if (listName) showToast(`Verplaatst naar "${listName}"`);
  };

  const handleDeleteTask = (id: string) => {
    updateData(prev => ({
      tasks: prev.tasks.filter(t => t.id !== id)
    }));
  };

  const handleAddSubtask = (taskId: string, title: string) => {
    updateData(prev => ({
      tasks: prev.tasks.map(t => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: [...t.subtasks, { id: uuidv4(), title, isCompleted: false }]
        };
      })
    }));
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    updateData(prev => ({
      tasks: prev.tasks.map(t => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: t.subtasks.map(st => st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st)
        };
      })
    }));
  };

  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    updateData(prev => ({
      tasks: prev.tasks.map(t => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: t.subtasks.filter(st => st.id !== subtaskId)
        };
      })
    }));
  };

  // Determine what tasks to show
  let displayedTasks = tasks;
  let viewTitle = '';
  
  if (activeView.type === 'list') {
      displayedTasks = tasks.filter(t => t.listId === activeView.id);
      const currentList = lists.find(l => l.id === activeView.id);
      viewTitle = currentList ? currentList.name : 'Lijst';
  } else {
      displayedTasks = tasks.filter(t => t.categoryId === activeView.id);
      const currentCategory = categories.find(c => c.id === activeView.id);
      viewTitle = currentCategory ? `${currentCategory.name}` : 'Categorie';
  }

  const openTaskCount = tasks.filter(t => t.status !== 'done').length;

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar 
        lists={lists} 
        categories={categories}
        activeView={activeView} 
        onSelectList={(id) => setActiveView({ type: 'list', id })}
        onSelectCategory={(id) => setActiveView({ type: 'category', id })}
        onAddList={handleAddList}
        onDeleteList={handleDeleteList}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
        onOpenSync={() => setIsSyncModalOpen(true)}
        isSynced={!!syncId}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Decorative Background Header */}
        <div className="h-48 w-full relative shrink-0">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 to-transparent z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop" 
            className="w-full h-full object-cover object-center opacity-90"
            alt="Mountain landscape"
          />
          <div className="absolute bottom-4 left-6 md:left-12 z-20 flex items-center gap-4">
             <div className="bg-white/90 backdrop-blur p-3 rounded-2xl shadow-lg border border-white/50 hidden md:block">
               {greeting.icon}
             </div>
             <div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight drop-shadow-sm flex items-center gap-2">
                  <span className="md:hidden">{greeting.icon}</span>
                  {greeting.text}
                  {isSyncing && <span className="text-xs bg-white/50 px-2 py-1 rounded text-slate-600 font-normal">Sync...</span>}
                </h1>
                <p className="text-slate-600 font-medium text-lg drop-shadow-sm bg-white/60 inline-block px-2 rounded-md backdrop-blur-sm mt-1">
                  Klaar voor <span className="text-amber-600 font-bold">{openTaskCount}</span> avonturen vandaag?
                </p>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <TaskInput 
              categories={categories}
              initialCategoryId={activeView.type === 'category' ? activeView.id : undefined}
              onAddTask={handleAddTask} 
              isProcessing={isProcessing} 
            />
            
            <TaskList 
              tasks={displayedTasks}
              categories={categories}
              lists={lists}
              title={viewTitle}
              onUpdateStatus={handleUpdateStatus}
              onUpdatePriority={handleUpdatePriority}
              onMoveTask={handleMoveTask}
              onDeleteTask={handleDeleteTask}
              onAddSubtask={handleAddSubtask}
              onToggleSubtask={handleToggleSubtask}
              onDeleteSubtask={handleDeleteSubtask}
            />
          </div>
        </div>
      </main>

      <SyncModal 
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        syncId={syncId}
        onEnableSync={handleEnableSync}
        onJoinSync={handleJoinSync}
        onDisconnect={handleDisconnectSync}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-2xl shadow-amber-500/20 text-sm font-bold tracking-wide animate-bounce-in z-50 flex items-center gap-3 border-l-4 border-amber-400">
           {toastMessage}
        </div>
      )}
    </div>
  );
};

export default App;
