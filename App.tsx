import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Sidebar } from './components/Sidebar';
import { TaskInput } from './components/TaskInput';
import { TaskList } from './components/TaskList';
import { parseNaturalLanguageInput } from './services/geminiService';
import { Task, TodoList, Priority, Category, TaskStatus } from './types';
import { Sun, Sunset, Moon } from 'lucide-react';

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

const App: React.FC = () => {
  const [lists, setLists] = useState<TodoList[]>(() => {
    const saved = localStorage.getItem('lists');
    return saved ? JSON.parse(saved) : DEFAULT_LISTS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tasks');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((t: any) => ({
        ...t,
        status: t.status ? t.status : (t.isCompleted ? 'done' : 'todo'),
        categoryId: t.categoryId || 'default',
        subtasks: t.subtasks || []
      }));
    }
    return [];
  });

  const [activeListId, setActiveListId] = useState<string>('basecamp');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Greeting Logic
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Goedemorgen", icon: <Sun className="text-amber-400" size={32} /> };
    if (hour < 18) return { text: "Goedemiddag", icon: <Sun className="text-orange-400" size={32} /> };
    return { text: "Goedenavond", icon: <Moon className="text-indigo-400" size={32} /> };
  };

  const greeting = getGreeting();

  useEffect(() => {
    localStorage.setItem('lists', JSON.stringify(lists));
  }, [lists]);

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // --- List Handlers ---

  const handleAddList = (name: string) => {
    const newList: TodoList = { id: uuidv4(), name };
    setLists([...lists, newList]);
    setActiveListId(newList.id);
    showToast(`Nieuwe lijst "${name}" gemaakt! 🚴`);
  };

  const handleDeleteList = (id: string) => {
    setLists(lists.filter(l => l.id !== id));
    setTasks(tasks.filter(t => t.listId !== id)); 
    if (activeListId === id) setActiveListId('basecamp');
    showToast("Lijst verwijderd");
  };

  // --- Category Handlers ---
  const handleAddCategory = (name: string) => {
    const newCat: Category = { id: uuidv4(), name, color: getRandomColor() };
    setCategories([...categories, newCat]);
    showToast(`Categorie "${name}" toegevoegd ✨`);
  };

  const handleDeleteCategory = (id: string) => {
    if (id === 'default') return;
    setCategories(categories.filter(c => c.id !== id));
    setTasks(tasks.map(t => t.categoryId === id ? { ...t, categoryId: 'default' } : t));
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
        
        let targetListId = activeListId;
        const matchingList = lists.find(l => l.name.toLowerCase() === result.suggestedListName.toLowerCase());
        
        if (matchingList) {
          targetListId = matchingList.id;
        } else if (result.suggestedListName && result.suggestedListName.toLowerCase() !== 'basecamp') {
          const newList: TodoList = { id: uuidv4(), name: result.suggestedListName };
          setLists(prev => [...prev, newList]);
          targetListId = newList.id;
        } else {
           targetListId = 'basecamp';
        }

        const newTasks: Task[] = result.tasks.map(t => {
          let catId = 'default';
          const existingCat = categories.find(c => c.name.toLowerCase() === t.categoryName.toLowerCase());
          
          if (existingCat) {
            catId = existingCat.id;
          } else if (t.categoryName) {
            const newCat: Category = { id: uuidv4(), name: t.categoryName, color: getRandomColor() };
            setCategories(prev => [...prev, newCat]); 
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

        setTasks(prev => [...prev, ...newTasks]);
        
        if (targetListId !== activeListId) {
          showToast(`${newTasks.length} taken in "${result.suggestedListName}"`);
          setActiveListId(targetListId);
        } else {
          showToast(`${newTasks.length} taken toegevoegd 🚀`);
        }

      } else {
        const newTask: Task = {
          id: uuidv4(),
          title: text,
          status: 'todo',
          listId: activeListId,
          categoryId: manualCategoryId || 'default',
          priority: Priority.MEDIUM,
          createdAt: Date.now(),
          subtasks: []
        };
        setTasks(prev => [...prev, newTask]);
      }
    } catch (error) {
      console.error(error);
      showToast("Oeps, even geen verbinding.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateStatus = (id: string, status: TaskStatus) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status } : t));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleAddSubtask = (taskId: string, title: string) => {
    setTasks(tasks.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: [...t.subtasks, { id: uuidv4(), title, isCompleted: false }]
      };
    }));
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(tasks.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: t.subtasks.map(st => st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st)
      };
    }));
  };

  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks(tasks.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: t.subtasks.filter(st => st.id !== subtaskId)
      };
    }));
  };

  const activeList = lists.find(l => l.id === activeListId) || lists[0];
  const activeTasks = tasks.filter(t => t.listId === activeListId);
  const openTaskCount = tasks.filter(t => t.status !== 'done').length;

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar 
        lists={lists} 
        categories={categories}
        activeListId={activeListId} 
        onSelectList={setActiveListId}
        onAddList={handleAddList}
        onDeleteList={handleDeleteList}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
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
              onAddTask={handleAddTask} 
              isProcessing={isProcessing} 
            />
            
            <TaskList 
              tasks={activeTasks}
              categories={categories}
              title={activeList.name}
              onUpdateStatus={handleUpdateStatus}
              onDeleteTask={handleDeleteTask}
              onAddSubtask={handleAddSubtask}
              onToggleSubtask={handleToggleSubtask}
              onDeleteSubtask={handleDeleteSubtask}
            />
          </div>
        </div>
      </main>

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