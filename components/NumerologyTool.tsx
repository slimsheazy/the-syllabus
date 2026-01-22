
import React, { useState } from 'react';
import { getNumerologyAnalysis } from '../services/geminiService';
import { GlossaryTerm } from './GlossaryEngine';
import { ReadAloudButton } from './ReadAloudButton';

const NumerologyTool: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    if (!name || !birthday) return;
    setLoading(true);
    setResult(null);
    const analysis = await getNumerologyAnalysis(name, birthday);
    setResult(analysis);
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
             <h2 className="heading-marker text-6xl text-marker-teal lowercase">Life Path Reader</h2>
             <p className="handwritten text-lg text-marker-teal opacity-60">Numerology & Purpose</p>
           </header>
           
           <div className="space-y-8">
             <div className="space-y-2">
               <label className="handwritten text-sm text-marker-black opacity-40 block ml-2">Full Name</label>
               <input 
                  type="text" 
                  placeholder="Subject Name"
                  className="w-full p-6 text-marker-black text-2xl shadow-sm italic"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
             </div>
             
             <div className="space-y-2">
               <label className="handwritten text-sm text-marker-black opacity-40 block ml-2">Birth Date</label>
               <input 
                  type="date" 
                  className="w-full p-6 text-marker-black text-2xl shadow-sm italic"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                />
             </div>

             <button 
                onClick={calculate}
                disabled={loading}
                className="brutalist-button w-full !py-6 !text-2xl mt-4"
              >
                {loading ? 'Analyzing...' : 'Analyze Identity'}
              </button>
           </div>
        </div>

        <div className="flex-1 w-full flex flex-col items-center justify-start min-h-[600px]">
           {loading && (
             <div className="flex flex-col items-center justify-center h-full gap-8 mt-40">
                <div className="w-20 h-20 border-4 border-marker-teal border-t-transparent animate-spin rounded-full"></div>
                <span className="handwritten text-xl text-marker-teal animate-pulse">Mapping Numbers...</span>
             </div>
           )}

           {result ? (
             <div className="w-full space-y-10 animate-in fade-in duration-500 pb-16">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Life Path', key: 'lifePath' },
                    { label: 'Destiny', key: 'destinyNumber' },
                    { label: 'Soul Urge', key: 'soulUrge' }
                  ].map((item, i) => (
                    <div key={item.key} className="bg-white/40 p-6 text-center marker-border border-marker-black">
                       <span className="handwritten text-[10px] text-marker-black/30 mb-2 block uppercase">{item.label}</span>
                       <span className={`heading-marker text-6xl ${i === 1 ? 'text-marker-red' : 'text-marker-black'}`}>{result[item.key]}</span>
                    </div>
                  ))}
                </div>

                <div className="p-10 marker-border border-marker-blue bg-white/40 shadow-xl">
                   <div className="flex justify-between items-center mb-4 border-b-2 border-marker-blue/10 pb-2">
                     <span className="handwritten text-xs font-bold uppercase text-marker-blue">Synthesis</span>
                     <ReadAloudButton text={result.meaning} className="!py-1 !px-2 !text-xs bg-marker-blue/10 border-marker-blue/20 text-marker-blue" />
                   </div>
                   <p className="handwritten text-2xl italic text-marker-black/80 leading-relaxed">"{result.meaning}"</p>
                </div>

                <div className="p-10 marker-border border-marker-red bg-white/40 text-center">
                   <div className="flex justify-center items-center gap-4 mb-4">
                     <div className="handwritten text-xs text-marker-red uppercase font-bold italic">Esoteric Insight</div>
                     <ReadAloudButton text={result.esotericInsight} className="!py-1 !px-2 !text-xs bg-marker-red/10 border-marker-red/20 text-marker-red" />
                   </div>
                   <p className="heading-marker text-4xl text-marker-black lowercase">
                      {result.esotericInsight}
                   </p>
                </div>
             </div>
           ) : !loading && (
             <div className="text-center opacity-10 flex flex-col items-center justify-center h-full mt-40 select-none">
                <div className="text-[10rem] heading-marker text-marker-black leading-none">ZERO</div>
                <p className="handwritten text-2xl mt-4">awaiting input...</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default NumerologyTool;
