
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SyllabusState {
  calculationsRun: number;
  lastAccess: string;
  isEclipseMode: boolean;
  recordCalculation: () => void;
  updateLastAccess: () => void;
  toggleEclipseMode: () => void;
}

export const useSyllabusStore = create<SyllabusState>()(
  persist(
    (set) => ({
      calculationsRun: 0,
      lastAccess: new Date().toISOString(),
      isEclipseMode: false,
      recordCalculation: () => set((state) => ({ 
        calculationsRun: state.calculationsRun + 1 
      })),
      updateLastAccess: () => set({ lastAccess: new Date().toISOString() }),
      toggleEclipseMode: () => set((state) => ({ isEclipseMode: !state.isEclipseMode })),
    }),
    {
      name: 'the-syllabus-state',
    }
  )
);
