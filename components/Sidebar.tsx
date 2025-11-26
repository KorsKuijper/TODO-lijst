import React, { useState } from 'react';
import { Plus, Trash2, Map, Mountain, Wrench, Menu, X, Database, Compass } from 'lucide-react';
import { List } from '../types';

interface SidebarProps {
  lists: List[];
  activeListId: string;
  onSelectList: (id: string) => void;
  onAddList: (title: string) => void;
  onDeleteList: (id: string) => void;
  isOnline: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  lists, 
  activeListId, 
  onSelectList, 
  onAddList, 
  onDeleteList,
  isOnline
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      onAddList(newTitle.trim());
      setNewTitle('');
      setIsCreating(false);
    }
  };

  const getIcon = (name: string) => {
    switch(name) {
      case 'Mountain': return <Mountain size={18} />;
      case 'Map': return <Map size={18} />;
      case 'Wrench': return <Wrench size={18} />;
      default: return <Compass size={18} />;
    }
  };

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 bg-slate-900 text-white shadow-lg rounded-xl"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-full flex flex-col border-r border-slate-800
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand */}
        <div className="p-6 border-b border-slate-800/50">
           <div className="flex items-center gap-3">
              <div className="bg-orange-500 p-2 rounded-lg text-white">
                <Mountain size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="font-bold text-white text-lg tracking-tight leading-none">GRAVEL</h1>
                <p className="text-orange-500 text-xs font-bold tracking-widest">GRINDER LOG</p>
              </div>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
          
          {/* Main Navigation */}
          <div>
            <h2 className="px-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Lists</h2>
            <nav className="space-y-1">
              {lists.map((list) => {
                const isActive = activeListId === list.id;
                return (
                  <div key={list.id} className="group relative">
                    <button
                      onClick={() => {
                        onSelectList(list.id);
                        setIsOpen(false);
                      }}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-slate-800 text-white shadow-inner' 
                          : 'hover:bg-slate-800/50 hover:text-white'
                      }`}
                    >
                      <span className={isActive ? 'text-orange-500' : 'text-slate-500'}>
                         {getIcon(list.icon_name)}
                      </span>
                      <span>{list.title}</span>
                    </button>
                    
                    {!list.isDefault && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteList(list.id); }}
                        className="absolute right-2 top-2.5 p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </nav>

            {isCreating ? (
              <form onSubmit={handleSubmit} className="mt-2 px-2">
                <input
                  autoFocus
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="List name..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm"
                />
              </form>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 w-full px-6 py-3 text-slate-500 hover:text-orange-400 transition-colors text-xs font-bold tracking-wide"
              >
                <Plus size={16} />
                <span>NEW LIST</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Footer / Status */}
        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-500">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
              {isOnline ? 'Database Connected' : 'Local Mode'}
           </div>
        </div>
      </div>
      
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};