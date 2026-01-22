
import React, { useState, useMemo } from 'react';
import { generateSigil } from '../services/geminiService';

const FEELINGS = ["clarity", "protection", "abundance", "transformation", "serenity", "power"];

const SigilMaker: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [intention, setIntention] = useState('');
  const [selectedFeeling, setSelectedFeeling] = useState('clarity');
  const [sigilUrl, setSigilUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Extract consonants to show "work" (Legit method)
  const distilled = useMemo(() => {
    if (!intention) return "";
    const clean = intention.toUpperCase().replace(/[^A-Z]/g, '');
    const vowels = ['A', 'E', 'I', 'O', 'U'];
    const unique = new Set();
    for (const c of clean) {
      if (!vowels.includes(c)) unique.add(c);
    }
    return Array.from(unique).join(' ');
  }, [intention]);

  const handleSynthesize = async () => {
    if (!intention.trim()) return;
    setLoading(true);
    setSigilUrl(null);
    const url = await generateSigil(intention, selectedFeeling);
    setSigilUrl(url);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-20 px-8 relative max-w-7xl mx-auto">
      <button 
        onClick={onBack} 
        className="fixed top-8 right-8 brutalist-button !text-sm !px-4 !py-1 z-50 bg-white"
      >
        Index
      </button>

      <div className="w-full flex flex-col lg:flex-row gap-16 items-start">
        <div className="flex-1 w-full space-y-12">
           <header className="space-y-2">
             <h2 className="heading-marker text-6xl text-marker-teal lowercase">Sigil Engine</h2>
             <p className="handwritten text-lg text-marker-teal opacity-60">Austin Osman Spare Method</p>
           </header>
           
           <div className="space-y-10">
             <div className="space-y-2">
               <label className="handwritten text-sm text-marker-black opacity-40 block ml-2">Manifestation Goal</label>
               <input 
                  type="text" 
                  placeholder="I am..."
                  className="w-full p-8 text-marker-black text-2xl shadow-sm italic placeholder:opacity-25"
                  value={intention}
                  onChange={(e) => setIntention(e.target.value)}
                />
             </div>

             {/* Live Extraction Display */}
             <div className="p-6 marker-border border-marker-black/10 bg-white/30 transition-all duration-300">
                <label className="handwritten text-xs text-marker-black opacity-40 block mb-2 uppercase tracking-widest">Sigil Core (Consonants)</label>
                <div className="heading-marker text-4xl text-marker-black tracking-[0.2em] h-12">
                   {distilled || <span className="opacity-10 text-xl tracking-normal">awaiting input...</span>}
                </div>
             </div>

             <div className="space-y-4">
               <label className="handwritten text-sm text-marker-black opacity-40 block ml-2">Emotional Tone</label>
               <div className="flex flex-wrap gap-3">
                 {FEELINGS.map(f => (
                   <button
                    key={f}
                    onClick={() => setSelectedFeeling(f)}
                    className={`px-6 py-2 marker-border handwritten text-sm font-bold tracking-widest transition-all ${
                      selectedFeeling === f ? 'bg-marker-teal/10 border-marker-teal text-marker-teal' : 'border-marker-black/10 text-marker-black opacity-40 hover:opacity-100'
                    }`}
                   >
                     {f}
                   </button>
                 ))}
               </div>
             </div>

             <button 
                onClick={handleSynthesize}
                disabled={loading}
                className="brutalist-button w-full !py-8 !text-2xl mt-4"
              >
                {loading ? 'Constructing Glyph...' : 'Draw Pattern'}
              </button>
           </div>
        </div>

        <div className="flex-1 w-full flex flex-col items-center justify-center min-h-[600px]">
           {loading && (
             <div className="flex flex-col items-center justify-center h-full gap-8 mt-40">
                <div className="w-20 h-20 border-4 border-marker-teal border-t-transparent animate-spin rounded-full"></div>
                <span className="handwritten text-xl text-marker-teal animate-pulse italic">Fusing Forms...</span>
             </div>
           )}

           {sigilUrl ? (
             <div className="w-full flex flex-col items-center gap-10 animate-in fade-in duration-1000 pb-16">
                <div className="relative group">
                  {/* Paper-like effect */}
                  <div className="absolute inset-0 bg-white translate-x-2 translate-y-2 marker-border border-marker-black opacity-20"></div>
                  <div className="marker-border border-marker-black p-8 bg-white shadow-2xl relative z-10">
                    <img 
                      src={sigilUrl} 
                      alt="Synthesized Sigil" 
                      className="w-full max-w-md aspect-square object-contain contrast-125"
                    />
                  </div>
                </div>
                
                <div className="text-center space-y-6">
                  <p className="handwritten text-lg text-marker-black/40 italic">Glyph Activated.</p>
                  <a 
                    href={sigilUrl} 
                    download="sigil.png"
                    className="brutalist-button !text-sm !py-3 !px-8 hover:!bg-marker-black/5"
                  >
                    Save Image
                  </a>
                </div>
             </div>
           ) : !loading && (
             <div className="text-center opacity-10 flex flex-col items-center justify-center h-full mt-40 select-none">
                <div className="text-[10rem] heading-marker text-marker-black leading-none">SEAL</div>
                <p className="handwritten text-2xl mt-4">awaiting intent...</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default SigilMaker;
