import React, { useState, useEffect } from 'react';
import { Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { Category } from '../types';

interface TaskInputProps {
  categories: Category[];
  initialCategoryId?: string;
  onAddTask: (text: string, useAI: boolean, categoryId?: string) => Promise<void>;
  isProcessing: boolean;
}

export const TaskInput: React.FC<TaskInputProps> = ({ categories, initialCategoryId, onAddTask, isProcessing }) => {
  const [inputValue, setInputValue] = useState('');
  const [mode, setMode] = useState<'simple' | 'ai'>('simple');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('default');

  // Update selected category when the initialCategoryId prop changes (e.g. switching views)
  useEffect(() => {
    if (initialCategoryId) {
        setSelectedCategoryId(initialCategoryId);
    } else {
        setSelectedCategoryId(categories[0]?.id || 'default');
    }
  }, [initialCategoryId, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    await onAddTask(inputValue, mode === 'ai', selectedCategoryId);
    setInputValue('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-0 mb-10 overflow-hidden transform transition-all hover:shadow-2xl hover:shadow-slate-200/60">
      <div className="flex border-b border-slate-100 bg-slate-50/50">
        <button
          type="button"
          onClick={() => setMode('simple')}
          className={`flex-1 py-3 text-xs uppercase font-bold tracking-wider transition-all ${
            mode === 'simple' ? 'bg-white text-slate-800 border-b-2 border-amber-400' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
          }`}
        >
          Snel toevoegen
        </button>
        <button
          type="button"
          onClick={() => setMode('ai')}
          className={`flex-1 py-3 text-xs uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-2 ${
            mode === 'ai' 
              ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-orange-600 border-b-2 border-orange-500' 
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Sparkles size={14} className={mode === 'ai' ? "text-orange-500" : ""} />
          AI Co-Pilot
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="relative bg-white">
        <div className="flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={mode === 'ai' ? "Bijv: 'Plan een mooie rit over de Veluwe en maak een paklijst'" : "Nieuwe taak..."}
            className="flex-1 pl-6 pr-14 py-5 bg-transparent focus:outline-none text-slate-800 placeholder:text-slate-300 font-medium text-lg"
            disabled={isProcessing}
          />
          
          {mode === 'simple' && (
            <div className="hidden sm:block mr-16">
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-500 text-xs font-bold rounded-lg p-2 focus:outline-none focus:border-amber-400 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!inputValue.trim() || isProcessing}
          className={`absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all ${
            inputValue.trim() && !isProcessing
              ? 'bg-amber-500 text-white hover:bg-amber-400 shadow-md shadow-amber-200 transform hover:scale-105'
              : 'bg-slate-100 text-slate-300 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <Loader2 size={20} className="animate-spin" />
          ) : mode === 'ai' ? (
            <Sparkles size={20} />
          ) : (
            <ArrowRight size={20} />
          )}
        </button>
      </form>
      {mode === 'ai' && (
        <div className="px-6 pb-3 pt-2 bg-gradient-to-r from-amber-50 to-orange-50 text-orange-800/70 text-xs font-medium border-t border-orange-100/50">
          <span className="font-bold text-orange-600 mr-1">TIP:</span> 
          Vraag Gemini om routes te plannen, onderhoud te checken of leuke koffiestops te vinden! ☕️
        </div>
      )}
    </div>
  );
};