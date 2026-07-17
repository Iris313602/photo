import React, { useState } from 'react';
import { Sparkles, Camera, BookOpen, Film, ChevronRight } from 'lucide-react';
import { FILM_STYLES, FilmStyle } from '../utils/filter';
import { sounds } from './SoundEffects';
import { Roll, saveRoll } from '../utils/db';
import { motion } from 'motion/react';

interface RollSelectorProps {
  onRollSelected: (roll: Roll) => void;
  onViewHistory: () => void;
  hasHistory: boolean;
}

export default function RollSelector({ onRollSelected, onViewHistory, hasHistory }: RollSelectorProps) {
  const [selectedStyleId, setSelectedStyleId] = useState<string>('classic-gold');
  const [rollName, setRollName] = useState<string>('');
  const [capacity, setCapacity] = useState<number>(26); // Default 26, can be 3
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const selectedStyle = FILM_STYLES.find(f => f.id === selectedStyleId) || FILM_STYLES[0];

  const handleStartShooting = async () => {
    setIsLoading(true);
    sounds.playWinding(); // Play vintage film loading motor sound!

    // Wait a brief moment for the sound effect to establish immersive mood
    setTimeout(async () => {
      const defaultName = rollName.trim() || `胶卷 - ${selectedStyle.name} (${capacity === 26 ? '经典版' : '迷你版'})`;
      const newRollId = `roll_${Date.now()}`;
      
      const newRoll: Roll = {
        id: newRollId,
        name: defaultName,
        status: 'shooting',
        totalCount: capacity,
        currentCount: 0,
        filmStyle: selectedStyleId,
        createdAt: Date.now()
      };

      await saveRoll(newRoll);
      setIsLoading(false);
      onRollSelected(newRoll);
    }, 800);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto px-4 py-8">
      {/* Visual Header card */}
      <div className="text-center mb-8 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-xl flex items-center justify-center text-amber-500 mb-4">
          <Film className="w-8 h-8 animate-pulse" />
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight flex items-center gap-1">
          ANALOG <span className="text-amber-500">FILM</span> CAMERA
        </h1>
        <p className="text-sm text-zinc-400 mt-2 max-w-sm leading-relaxed">
          重温延迟满足、不确定性与极致摄影仪式感。
          拍满后才能开启冲洗显影流程，解锁并展示成片。
        </p>
      </div>

      {/* Main configuration Card */}
      <div className="w-full bg-zinc-900/85 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
        
        {/* Step 1: Naming the Roll */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
            <span>01</span> Naming Your Roll / 给这卷胶卷命名
          </label>
          <input
            type="text"
            placeholder="例如：夏日海滩旅纪、日常切片..."
            value={rollName}
            onChange={(e) => setRollName(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/50 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 transition"
          />
        </div>

        {/* Step 2: Selecting Capacity (Classic vs. Mini) */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
            <span>02</span> Select Capacity / 选择胶卷规格
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                sounds.playBeep();
                setCapacity(26);
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                capacity === 26
                  ? 'bg-zinc-800/80 border-amber-500/60 shadow-[0_4px_12px_rgba(245,158,11,0.1)]'
                  : 'bg-zinc-950/50 border-zinc-850 hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-sm font-bold text-zinc-100">经典版 (26 EXP)</span>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  capacity === 26 ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-700'
                }`}>
                  {capacity === 26 && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                </div>
              </div>
              <span className="text-[10px] text-zinc-400 mt-2 leading-relaxed">
                完整胶片体验，严格拍摄 26 张后一并显影，最具期待感。
              </span>
            </button>

            <button
              onClick={() => {
                sounds.playBeep();
                setCapacity(3);
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                capacity === 3
                  ? 'bg-zinc-800/80 border-amber-500/60 shadow-[0_4px_12px_rgba(245,158,11,0.1)]'
                  : 'bg-zinc-950/50 border-zinc-850 hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-sm font-bold text-zinc-100 flex items-center gap-1">
                  迷你版 (3 EXP)
                  <span className="text-[8px] bg-amber-500/20 text-amber-500 font-mono font-black px-1 py-0.5 rounded uppercase scale-90 origin-left">MINI</span>
                </span>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  capacity === 3 ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-700'
                }`}>
                  {capacity === 3 && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                </div>
              </div>
              <span className="text-[10px] text-zinc-400 mt-2 leading-relaxed">
                轻快体验装，只需拍 3 张即可开启显影，适合快速试用。
              </span>
            </button>
          </div>
        </div>

        {/* Step 3: Selecting Film Stock */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
            <span>03</span> Select Film Stock / 选择胶片滤镜
          </label>
          
          {/* List of custom film stocks */}
          <div className="grid grid-cols-1 gap-2.5 max-h-64 overflow-y-auto pr-1">
            {FILM_STYLES.map((style) => {
              const isSelected = style.id === selectedStyleId;
              return (
                <button
                  key={style.id}
                  onClick={() => {
                    sounds.playBeep();
                    setSelectedStyleId(style.id);
                  }}
                  className={`text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-zinc-800/80 border-amber-500/60 shadow-[0_4px_12px_rgba(245,158,11,0.1)]'
                      : 'bg-zinc-950/50 border-zinc-850 hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Retro mini canister look */}
                    <div className={`w-8 h-10 rounded-md bg-gradient-to-b ${style.color} p-1 flex flex-col justify-between shadow-md`}>
                      <span className="text-[7px] font-extrabold text-black uppercase tracking-tight leading-none">
                        EXP
                      </span>
                      <span className="text-[8px] font-mono font-black text-zinc-900 leading-none">
                        {capacity}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                        {style.name}
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        )}
                      </span>
                      <span className="text-[11px] text-zinc-400 leading-snug mt-0.5 line-clamp-1 max-w-[280px]">
                        {style.description}
                      </span>
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-700'
                  }`}>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Film Preview Detail */}
        <div className="bg-zinc-950/60 border border-zinc-850 rounded-2xl p-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md bg-gradient-to-r ${selectedStyle.color} text-black font-mono uppercase`}>
              {selectedStyle.id.replace('-', ' ')}
            </span>
            <span className="text-zinc-500 font-mono text-[10px]">ISO 200 • Daylight Bal.</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {selectedStyle.description}
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleStartShooting}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-zinc-950 text-sm font-bold tracking-wider py-4 rounded-2xl shadow-xl transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 uppercase mt-2 cursor-pointer"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              <span>Loading Film Stock / 装填银盐胶卷...</span>
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              <span>Load Roll & Start Shooting / 装入胶卷，开启拍摄</span>
            </>
          )}
        </button>

      </div>

      {/* Secondary Button to open Developed Roll History */}
      {hasHistory && (
        <button
          onClick={() => {
            sounds.playBeep();
            onViewHistory();
          }}
          className="mt-6 text-xs text-zinc-500 hover:text-amber-500 flex items-center gap-1.5 transition py-2 px-4 rounded-xl hover:bg-zinc-900/40 border border-transparent hover:border-zinc-800"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>浏览历史已冲洗胶卷 (View Developed History)</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
