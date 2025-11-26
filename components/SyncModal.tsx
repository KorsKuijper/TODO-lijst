import React, { useState } from 'react';
import { X, Cloud, Copy, Check, Smartphone, Loader2, Share2, QrCode } from 'lucide-react';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncId: string | null;
  onEnableSync: () => Promise<void>;
}

export const SyncModal: React.FC<SyncModalProps> = ({ 
  isOpen, 
  onClose, 
  syncId, 
  onEnableSync
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUrl = window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnable = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onEnableSync();
    } catch (e) {
      setError("Kon geen online database aanmaken. Probeer het later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-amber-400 to-orange-400 p-6 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
             <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <Cloud size={24} className="text-white" />
             </div>
             <div>
                <h3 className="font-bold text-lg leading-tight">Live Synchronisatie</h3>
                <p className="text-amber-50 text-xs font-medium opacity-90">Altijd up-to-date, overal.</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-3 font-medium">
               <div className="w-2 h-2 bg-red-500 rounded-full" />
               {error}
            </div>
          )}

          {!syncId ? (
            <div className="space-y-8 text-center">
               <div>
                  <div className="inline-flex justify-center items-center gap-6 mb-6">
                     <div className="bg-slate-100 p-4 rounded-2xl text-slate-400">
                        <Smartphone size={32} />
                     </div>
                     <Loader2 className="text-amber-400 animate-spin-slow" size={24} />
                     <div className="bg-slate-100 p-4 rounded-2xl text-slate-400">
                        <Share2 size={32} />
                     </div>
                  </div>
                  <h4 className="text-slate-800 font-bold text-lg mb-2">Gebruik op meerdere apparaten</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Maak een gedeelde online lijst aan. Je krijgt een unieke link die je kunt openen op je telefoon, tablet of computer.
                  </p>
               </div>
               
               <button 
                 onClick={handleEnable}
                 disabled={isLoading}
                 className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all transform active:scale-95 shadow-xl shadow-slate-200 flex items-center justify-center gap-3"
               >
                 {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Cloud size={20} />}
                 Start Cloud Database
               </button>
            </div>
          ) : (
            <div className="space-y-6">
               <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-start gap-4">
                  <div className="bg-emerald-100 p-2 rounded-full shrink-0">
                     <Check size={16} className="text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900 text-sm">Verbinding Actief</h4>
                    <p className="text-emerald-700/80 text-xs mt-1 leading-relaxed">
                        Alle wijzigingen worden nu opgeslagen in de cloud database.
                    </p>
                  </div>
               </div>

               <div className="text-center space-y-4">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Scan met je mobiel
                 </p>
                 <div className="flex justify-center">
                    <div className="p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm">
                        {/* Generates a QR code for the current URL */}
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentUrl)}`} 
                            alt="QR Code" 
                            className="w-32 h-32 opacity-90"
                        />
                    </div>
                 </div>
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 text-center">Of deel de link</label>
                 <div className="flex gap-2">
                    <div className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-medium text-xs truncate flex items-center select-all">
                       {currentUrl}
                    </div>
                    <button 
                      onClick={handleCopy}
                      className="px-4 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-xl transition-colors flex items-center justify-center font-bold shadow-sm shadow-amber-100"
                    >
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};