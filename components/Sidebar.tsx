import React, { useState } from 'react';
import { Plus, Trash2, Map, Compass, X, Tent, Bike } from 'lucide-react';
import { TodoList, Category } from '../types';

interface SidebarProps {
  lists: TodoList[];
  categories: Category[];
  activeView: { type: 'list' | 'category', id: string };
  onSelectList: (id: string) => void;
  onSelectCategory: (id: string) => void;
  onAddList: (name: string) => void;
  onDeleteList: (id: string) => void;
  onAddCategory: (name: string) => void;
  onDeleteCategory: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  lists, 
  categories,
  activeView, 
  onSelectList, 
  onSelectCategory,
  onAddList, 
  onDeleteList,
  onAddCategory,
  onDeleteCategory
}) => {
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListName.trim()) {
      onAddList(newListName.trim());
      setNewListName('');
      setIsCreatingList(false);
    }
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim());
      setNewCategoryName('');
      setIsCreatingCategory(false);
    }
  };

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-white border border-slate-200 shadow-md rounded-xl text-slate-700"
        >
          <Compass size={24} />
        </button>
      </div>

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white text-slate-600 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-full flex flex-col border-r border-slate-200 shadow-lg md:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header Image */}
        <div className="h-32 w-full relative shrink-0">
            <img 
                src="https://images.unsplash.com/photo-1541625602330-2277a4c46182?q=80&w=1974&auto=format&fit=crop"
                className="w-full h-full object-cover opacity-90"
                alt="Gravel bike"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent"></div>
            <div className="absolute bottom-4 left-6">
                 <div className="flex items-center gap-2">
                    <div className="bg-amber-400 p-1.5 rounded-lg shadow-sm rotate-3">
                        <Bike className="text-white h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none">GRAVEL</h1>
                        <h1 className="text-sm font-bold text-amber-500 tracking-widest leading-none">VIBES</h1>
                    </div>
                 </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          
          {/* Lists Section */}
          <div className="px-6 mb-2 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Jouw Ritten</h2>
          </div>
          <nav className="px-4 space-y-1 mb-8">
            {lists.map((list) => {
              const isActive = activeView.type === 'list' && activeView.id === list.id;
              return (
                <div 
                  key={list.id} 
                  className="group flex items-center justify-between"
                >
                  <button
                    onClick={() => {
                      onSelectList(list.id);
                      setIsOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-amber-50 text-amber-700 shadow-sm border border-amber-100' 
                        : 'hover:bg-slate-50 text-slate-500 hover:text-slate-700 border border-transparent'
                    }`}
                  >
                    <Map size={18} className={isActive ? 'text-amber-500' : 'text-slate-400'} />
                    <span className="truncate">{list.name}</span>
                  </button>
                  
                  {!list.isDefault && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if(confirm(`Avontuur "${list.name}" verwijderen?`)) {
                          onDeleteList(list.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all absolute right-5"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}

            {isCreatingList ? (
              <form onSubmit={handleListSubmit} className="mt-2 px-2">
                <input
                  autoFocus
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Naam..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 text-sm mb-2"
                />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs rounded-lg shadow-sm transition-colors">MAAK</button>
                  <button type="button" onClick={() => setIsCreatingList(false)} className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs rounded-lg"><X size={14} /></button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsCreatingList(true)}
                className="flex items-center gap-2 w-full px-4 py-2 mt-2 text-slate-400 hover:text-amber-500 transition-colors text-xs uppercase font-bold tracking-wide border border-dashed border-transparent hover:border-amber-200 rounded-xl"
              >
                <Plus size={16} />
                <span>Nieuwe lijst</span>
              </button>
            )}
          </nav>

          {/* Categories Section */}
          <div className="px-6 mb-2 mt-6">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Labels</h2>
          </div>
          <nav className="px-4 space-y-1">
            {categories.map((cat) => {
              const isActive = activeView.type === 'category' && activeView.id === cat.id;
              return (
                <div key={cat.id} className="group relative flex items-center">
                   <button
                    onClick={() => {
                        onSelectCategory(cat.id);
                        setIsOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                        isActive 
                        ? 'bg-slate-100 text-slate-800 shadow-inner' 
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: cat.color }}></div>
                    <span>{cat.name}</span>
                  </button>
                  
                  {cat.id !== 'default' && (
                     <button
                     onClick={(e) => {
                       e.stopPropagation();
                       if(confirm(`Tag "${cat.name}" verwijderen?`)) onDeleteCategory(cat.id);
                     }}
                     className="opacity-0 group-hover:opacity-100 absolute right-2 p-1.5 hover:text-red-400 hover:bg-red-50 rounded-md transition-all"
                   >
                     <Trash2 size={12} />
                   </button>
                  )}
                </div>
              );
            })}

             {isCreatingCategory ? (
              <form onSubmit={handleCategorySubmit} className="mt-2 px-2">
                <input
                  autoFocus
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nieuw label..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 text-sm mb-2"
                />
                 <div className="flex gap-2">
                  <button type="submit" className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs rounded-lg shadow-sm">OK</button>
                  <button type="button" onClick={() => setIsCreatingCategory(false)} className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs rounded-lg"><X size={14} /></button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsCreatingCategory(true)}
                className="flex items-center gap-2 w-full px-4 py-2 mt-2 text-slate-400 hover:text-amber-500 transition-colors text-xs uppercase font-bold tracking-wide border border-dashed border-transparent hover:border-amber-200 rounded-xl"
              >
                <Plus size={16} />
                <span>Nieuw label</span>
              </button>
            )}
          </nav>

        </div>
        
        <div className="p-6 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-center gap-2 font-medium shrink-0">
            <Tent size={14} className="text-emerald-500" />
            <span>Geniet van de buitenlucht</span>
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};