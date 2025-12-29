
import React, { useState } from 'react';
import Snowfall from './components/Snowfall';
import ScratchReveal from './components/ScratchReveal';
import SleepingAnimal from './components/SleepingAnimal';
import { DayData } from './types';
import { CALENDAR_DAYS, WEEKDAYS, TARGET_YEAR, TARGET_MONTH, isWeekendOrHoliday } from './constants';

const App: React.FC = () => {
  const [days, setDays] = useState<DayData[]>(CALENDAR_DAYS);
  // Simulation de la date au 16 Janvier 2026
  const [todayDate] = useState(16);
  const [today] = useState(new Date(2026, 0, todayDate));

  const isAvailable = (dayNum: number) => {
    return dayNum <= todayDate;
  };

  const handleReveal = (dayNum: number) => {
    setDays(prev => prev.map(d => d.day === dayNum ? { ...d, isUnlocked: true } : d));
  };

  const firstDayOfMonth = new Date(TARGET_YEAR, TARGET_MONTH, 1);
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7; 

  return (
    <div className="min-h-screen relative flex flex-col items-center pb-48">
      <Snowfall />

      {/* Hero Section */}
      <header className="relative z-10 w-full max-w-6xl px-8 pt-24 pb-16 text-center flex flex-col items-center">
        <div className="animate-float mb-10">
           <div className="glass p-6 rounded-[3rem] shadow-xl shadow-blue-500/5 flex items-center gap-6">
             <div className="flex items-center">
                <img 
                  src="/logos/HomeExchange_logo.png" 
                  alt="HomeExchange" 
                  className="h-10 w-auto object-contain"
                />
             </div>
             <div className="h-12 w-[1.5px] bg-slate-200/50" />
             <div className="flex items-center">
                <img 
                  src="/logos/Notion-logo.svg.png" 
                  alt="Notion" 
                  className="w-10 h-10 object-contain"
                />
             </div>
           </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <span className="h-[1px] w-10 bg-slate-200" />
            <h2 className="text-[12px] uppercase tracking-[0.5em] font-black text-blue-500/70">HomeExchange • After-Calendar</h2>
            <span className="h-[1px] w-10 bg-slate-200" />
          </div>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-[#1d1d1f] leading-none">
            January <span className="text-blue-600 font-extralight italic">2026</span>
          </h1>
          <p className="text-[#86868b] text-xl font-light max-w-2xl mx-auto pt-6 leading-relaxed">
            Un calendrier de l'après pour découvrir les features de Notion AI un peu tous les jours.
            <br />
            <span className="text-sm font-medium text-slate-400 mt-2 block italic">Prolongez le plaisir des fêtes en explorant de nouvelles fonctionnalités chaque jour.</span>
          </p>
        </div>
      </header>

      {/* Calendar Grid Container - Wide for full screen */}
      <main className="relative z-10 w-full max-w-[1440px] px-8 lg:px-16">
        <div className="grid grid-cols-7 gap-6 mb-12">
          {WEEKDAYS.map(wd => (
            <div key={wd} className="text-center py-3 border-b-2 border-slate-50">
              <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-300">{wd}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-6">
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`offset-${i}`} className="aspect-square rounded-3xl bg-slate-50/5 border border-slate-50/20" />
          ))}

          {days.map((day) => {
            const available = isAvailable(day.day);
            const quietMode = isWeekendOrHoliday(TARGET_YEAR, TARGET_MONTH, day.day);
            const isToday = day.day === todayDate;

            return (
              <div key={day.day} className="flex flex-col gap-4 group">
                <div className="flex items-center justify-between px-3">
                  <span className={`text-[12px] font-black tracking-widest ${available ? 'text-slate-900' : 'text-slate-200'}`}>
                    {day.day.toString().padStart(2, '0')}
                  </span>
                  {available && !quietMode && !day.isUnlocked && (
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    </div>
                  )}
                </div>

                {quietMode ? (
                  <div className="hover:scale-[1.02] transition-transform duration-700">
                    <SleepingAnimal day={day.day} />
                  </div>
                ) : (
                  <ScratchReveal 
                    onReveal={() => handleReveal(day.day)} 
                    isUnlocked={available}
                    isOpened={day.isUnlocked}
                    isToday={isToday}
                    day={day.day}
                    startOffset={startOffset}
                  >
                    <div className="flex flex-col items-center text-center w-full">
                      <div className="w-10 h-10 mb-3 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 transition-colors shadow-inner">
                        <span className="text-lg">✨</span>
                      </div>
                      <h4 className="text-[11px] font-bold text-[#1d1d1f] mb-2 leading-tight px-1 line-clamp-3 min-h-[3rem] flex items-center justify-center">
                        {day.title}
                      </h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(day.notionUrl, '_blank');
                        }}
                        className="w-auto px-4 py-2 bg-[#1d1d1f] hover:bg-black text-white text-[7px] font-black uppercase tracking-[0.2em] rounded-lg transition-all active:scale-[0.98] shadow-lg shadow-black/5 mt-1"
                      >
                        Explore
                      </button>
                    </div>
                  </ScratchReveal>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <footer className="fixed bottom-12 z-50">
        <div className="glass px-10 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-12 border border-white/50">
          <div className="flex items-center gap-5">
             <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shadow-lg p-2">
                <img 
                  src="/logos/Notion-logo.svg.png" 
                  alt="Notion" 
                  className="w-full h-full object-contain"
                />
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">HomeExchange</span>
                <span className="text-base font-bold text-blue-900">After-Calendar</span>
             </div>
          </div>
          
          <div className="h-10 w-[1px] bg-slate-200" />
          
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 group/top"
          >
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover/top:text-blue-600 transition-colors">Remonter</span>
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover/top:bg-blue-50 transition-all border border-slate-100">
              <svg className="w-4 h-4 text-slate-400 group-hover/top:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
              </svg>
            </div>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;
