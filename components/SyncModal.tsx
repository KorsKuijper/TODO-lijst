import React, { useState } from 'react';
import { X, Cloud, Copy, Check, Smartphone, RefreshCw, AlertCircle } from 'lucide-react';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncId: string | null;
  onEnableSync: () => Promise<void>;
  onJoinSync: (id: string) => Promise<void>;
  onDisconnect: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({ 
  isOpen, 
  onClose, 
  syncId, 
  onEnableSync, 
  onJoinSync,
  onDisconnect 
}) => {
  const [inputCode, setInputCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (syncId) {
      navigator.clipboard.writeText(syncId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEnable = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onEnableSync();
    } catch (e) {
      setError("Kon geen verbinding maken. Probeer het later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inputCode.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      await onJoinSync(inputCode.trim());
      setInputCode('');
    } catch (e) {
      setError("Ongeldige code of netwerkfout.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-amber-400 p-6 flex items-center justify-between text-amber-900">
          <div className="flex items-center gap-3">
             <div className="bg-white/20 p-2 rounded-lg">
                <Cloud size={24} />
             </div>
             <div>
                <h3 className="font-bold text-lg leading-tight">Sync Avonturen</h3>
                <p className="text-amber-800/80 text-xs font-medium">Gebruik je lijst op meerdere apparaten</p>
             </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
               <AlertCircle size={16} />
               {error}
            </div>
          )}

          {!syncId ? (
            <div className="space-y-6">
               <div className="text-center">
                  <div className="inline-flex justify-center items-center gap-4 mb-4">
                     <Smartphone className="text-slate-300" size={32} />
                     <RefreshCw className="text-amber-400" size={20} />
                     <Smartphone className="text-slate-300" size={32} />
                  </div>
                  <p className="text-slate-600 text-sm mb-4">
                    Koppel apparaten om altijd je meest recente planning bij de hand te hebben.
                  </p>
                  <button 
                    onClick={handleEnable}
                    disabled={isLoading}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? <RefreshCw className="animate-spin" size={18} /> : <Cloud size={18} />}
                    Start Synchronisatie
                  </button>
               </div>
               
               <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-400 font-bold tracking-wider">Of koppel bestaande</span>
                  </div>
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Sync Code</label>
                 <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      placeholder="Plak code van ander apparaat..."
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 font-mono text-sm"
                    />
                    <button 
                      onClick={handleJoin}
                      disabled={!inputCode || isLoading}
                      className="px-4 py-2.5 bg-amber-100 text-amber-700 font-bold rounded-xl hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Koppel
                    </button>
                 </div>
               </div>
            </div>
          ) : (
            <div className="space-y-6">
               <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
                  <div className="bg-emerald-100 p-1.5 rounded-full mt-0.5">
                     <Check size={14} className="text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-800 text-sm">Synchronisatie Actief</h4>
                    <p className="text-emerald-600/80 text-xs mt-1">Je wijzigingen worden automatisch opgeslagen in de cloud.</p>
                  </div>
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Jouw Sync Code</label>
                 <div className="flex gap-2">
                    <div className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-mono text-xs break-all flex items-center">
                       {syncId}
                    </div>
                    <button 
                      onClick={handleCopy}
                      className="px-4 bg-slate-100 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center"
                      title="Kopieer code"
                    >
                      {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                    </button>
                 </div>
                 <p className="text-[10px] text-slate-400 mt-2">
                    Deel deze code niet met vreemden. Gebruik deze code op je andere apparaten om te verbinden.
                 </p>
               </div>

               <button 
                 onClick={onDisconnect}
                 className="w-full py-2.5 border border-red-100 text-red-500 hover:bg-red-50 rounded-xl font-bold text-sm transition-colors"
               >
                 Stop Synchronisatie
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
