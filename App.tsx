
import React, { useEffect, useState, useMemo } from 'react';
import { Page } from './types';
import { useSyllabusStore } from './store';
import { initDB } from './services/dbService';
import { GlossaryProvider } from './components/GlossaryEngine';

// Tools
import HoraryTool from './components/HoraryTool';
import ElectionalTool from './components/ElectionalTool';
import NumerologyTool from './components/NumerologyTool';
import SigilMaker from './components/SigilMaker';
import Archive from './components/Archive';
import CosmicMadLibs from './components/CosmicMadLibs';
import FriendshipMatrix from './components/FriendshipMatrix';
import BaziTool from './components/BaziTool';
import BioCalcTool from './components/BioCalcTool';
import FlyingStarTool from './components/FlyingStarTool';
import PieDeconstructionTool from './components/PieDeconstructionTool';
import ColorPaletteTool from './components/ColorPaletteTool';

// --- Configuration ---

const MENU_CATEGORIES = [
  {
    label: "Divination",
    color: "var(--marker-blue)",
    items: [
      { name: "Horary Moment", page: Page.HORARY },
      { name: "Electional Finder", page: Page.ELECTIONAL },
      { name: "Life Path Reader", page: Page.NUMEROLOGY },
      { name: "Friendship Matrix", page: Page.FRIENDSHIP_MATRIX },
    ]
  },
  {
    label: "Blueprints",
    color: "var(--marker-red)",
    items: [
      { name: "Four Pillars Engine", page: Page.BAZI },
      { name: "Vitality Gauge", page: Page.BIO_CALC },
      { name: "Flying Star Mapper", page: Page.FLYING_STAR },
      { name: "Zodiacal Palette", page: Page.COLOR_PALETTE },
    ]
  },
  {
    label: "Knowledge",
    color: "var(--marker-green)",
    items: [
      { name: "Sigil Engine", page: Page.SIGIL_MAKER },
      { name: "Semantic Trace", page: Page.PIE_DECONSTRUCTION },
      { name: "Archive", page: Page.ARCHIVE },
      { name: "Rituals", page: Page.MAD_LIBS },
    ]
  }
];

// Map Pages to Components for cleaner routing
const TOOL_COMPONENTS: Partial<Record<Page, React.ComponentType<{ onBack: () => void }>>> = {
  [Page.HORARY]: HoraryTool,
  [Page.ELECTIONAL]: ElectionalTool,
  [Page.NUMEROLOGY]: NumerologyTool,
  [Page.SIGIL_MAKER]: SigilMaker,
  [Page.ARCHIVE]: Archive,
  [Page.MAD_LIBS]: CosmicMadLibs,
  [Page.FRIENDSHIP_MATRIX]: FriendshipMatrix,
  [Page.BAZI]: BaziTool,
  [Page.BIO_CALC]: BioCalcTool,
  [Page.FLYING_STAR]: FlyingStarTool,
  [Page.PIE_DECONSTRUCTION]: PieDeconstructionTool,
  [Page.COLOR_PALETTE]: ColorPaletteTool,
};

// --- Sub-Components ---

const MenuButton: React.FC<{ isOpen: boolean; toggle: () => void }> = ({ isOpen, toggle }) => (
  <button 
    onClick={toggle}
    className="fixed top-8 left-8 md:top-12 md:left-12 z-[110] w-16 h-16 flex flex-col items-center justify-center gap-1.5 bg-white border-4 border-marker-black marker-border group hover:shadow-xl transition-all"
    aria-label="Toggle Menu"
  >
    <div className={`w-10 h-1.5 bg-marker-black transition-all ${isOpen ? 'rotate-45 translate-y-3' : ''}`} />
    <div className={`w-10 h-1.5 bg-marker-black transition-all ${isOpen ? 'opacity-0' : ''}`} />
    <div className={`w-10 h-1.5 bg-marker-black transition-all ${isOpen ? '-rotate-45 -translate-y-3' : ''}`} />
  </button>
);

const NavigationOverlay: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onNavigate: (page: Page) => void 
}> = ({ isOpen, onClose, onNavigate }) => {
  const { isEclipseMode, toggleEclipseMode } = useSyllabusStore();
  
  return (
    <div className={`fixed inset-0 z-[100] transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
      <div className="absolute inset-0 bg-white/95 backdrop-blur-md" onClick={onClose} />
      <div className={`absolute top-0 left-0 h-full w-full md:w-[440px] bg-white border-r-8 border-marker-black transition-transform duration-500 shadow-2xl flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-10 md:p-16 pt-32 md:pt-40 flex-grow overflow-y-auto custom-scrollbar">
          <div className="handwritten text-2xl text-marker-blue mb-12 uppercase font-black tracking-tighter border-b-2 border-marker-blue/20 pb-2">Primary Index</div>
          <div className="space-y-12">
            {MENU_CATEGORIES.map((cat, i) => (
              <div key={i} className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="handwritten text-2xl md:text-3xl font-black uppercase tracking-tighter" style={{ color: cat.color }}>{cat.label}</span>
                  <div className="h-0.5 flex-grow opacity-30" style={{ backgroundColor: cat.color }} />
                </div>
                <ul className="space-y-2">
                  {cat.items.map((item, j) => (
                    <li key={j}>
                      <button 
                        onClick={() => onNavigate(item.page)}
                        className="w-full text-left font-black text-lg md:text-xl tracking-tighter text-marker-black hover:text-marker-blue transition-all py-1.5"
                      >
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            
            {/* Eclipse Toggle */}
            <div className="pt-8 border-t-2 border-marker-black/10">
               <button 
                 onClick={toggleEclipseMode}
                 className="w-full flex items-center justify-between group"
               >
                 <div className="flex flex-col items-start">
                   <span className="handwritten text-2xl font-black text-marker-black uppercase tracking-tighter group-hover:text-marker-purple transition-colors">Eclipse Mode</span>
                   <span className="handwritten text-xs text-marker-black/50 uppercase tracking-widest">{isEclipseMode ? 'Active (Night Chalk)' : 'Inactive (Day Marker)'}</span>
                 </div>
                 <div className={`w-14 h-8 rounded-full border-2 border-marker-black relative transition-all ${isEclipseMode ? 'bg-marker-black' : 'bg-transparent'}`}>
                    <div className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-marker-black transition-all duration-300 ${isEclipseMode ? 'left-[calc(100%-1.6rem)] bg-white' : 'left-0.5 bg-marker-black'}`}></div>
                 </div>
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HomeView: React.FC<{ onEnter: () => void }> = ({ onEnter }) => (
  <div className="relative min-h-screen flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden bg-white/40">
    <div className="z-10 max-w-5xl w-full text-center space-y-12">
      <div className="flex flex-col items-center gap-4">
         <span className="handwritten text-3xl md:text-4xl text-marker-blue font-extrabold italic tracking-tight">an open syllabus of esoteric study</span>
         <div className="w-64 h-2 bg-marker-black marker-border" />
      </div>

      <h1 className="title-main font-black text-marker-black">the syllabus</h1>
      
      <div className="py-12">
        <button onClick={onEnter} className="brutalist-button px-16 py-6 text-3xl md:text-4xl">
          Enter Library
        </button>
      </div>
    </div>
    
    <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end handwritten text-xl text-marker-black/60 font-black italic uppercase tracking-widest">
      <span>Knowledge is free to all</span>
      <span>Open Repository</span>
    </div>
  </div>
);

// --- Main App Component ---

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { updateLastAccess, isEclipseMode } = useSyllabusStore();

  useEffect(() => {
    updateLastAccess();
    initDB(); 
  }, [updateLastAccess]);

  // Sync Eclipse Mode with DOM
  useEffect(() => {
    if (isEclipseMode) {
      document.documentElement.classList.add('eclipse-mode');
    } else {
      document.documentElement.classList.remove('eclipse-mode');
    }
  }, [isEclipseMode]);

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    setIsMenuOpen(false);
  };

  const CurrentToolComponent = useMemo(() => TOOL_COMPONENTS[currentPage], [currentPage]);

  return (
    <GlossaryProvider>
      <div className="min-h-screen relative selection:bg-marker-blue/30 selection:text-marker-black">
        
        <MenuButton 
          isOpen={isMenuOpen} 
          toggle={() => setIsMenuOpen(!isMenuOpen)} 
        />

        <NavigationOverlay 
          isOpen={isMenuOpen} 
          onClose={() => setIsMenuOpen(false)} 
          onNavigate={handleNavigate} 
        />

        <main className="min-h-screen">
          <div key={currentPage} className="page-enter-animation">
            {currentPage === Page.HOME ? (
              <HomeView onEnter={() => setIsMenuOpen(true)} />
            ) : CurrentToolComponent ? (
              <CurrentToolComponent onBack={() => handleNavigate(Page.HOME)} />
            ) : null}
          </div>
        </main>

      </div>
    </GlossaryProvider>
  );
};

export default App;
