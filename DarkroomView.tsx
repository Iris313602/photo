import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, FlaskConical, Droplet } from 'lucide-react';
import { sounds } from './SoundEffects';
import { Roll, saveRoll } from '../utils/db';
import { motion, AnimatePresence } from 'motion/react';

interface DarkroomViewProps {
  roll: Roll;
  onDeveloped: () => void;
}

const DEVELOPING_STEPS = [
  {
    progress: 0,
    title: '准备冲洗工具',
    description: '暗室红光开启。准备显影罐、卷片轴、显影液、停显液、定影液...',
    icon: FlaskConical
  },
  {
    progress: 20,
    title: '🧪 浸入显影液 (Developer Bath)',
    description: '银盐感光晶体正在化学还原为黑色金属银，底片影像显影中...',
    icon: FlaskConical
  },
  {
    progress: 50,
    title: '💧 停显终止 (Stop Bath)',
    description: '注入弱酸性溶液，瞬间终止显影剂的化学活性，精确控制影调和反差...',
    icon: Droplet
  },
  {
    progress: 75,
    title: '🧼 酸性定影 (Fixer Bath)',
    description: '溶解未感光的银盐晶体，固定银盐颗粒，让原本不透明的胶片变得通透剔除感光性...',
    icon: Droplet
  },
  {
    progress: 90,
    title: '🚿 清水水洗与悬挂晾干 (Wash & Dry)',
    description: '彻底洗去残留的定影液，在无尘暗房内悬挂，等待底片干燥封存...',
    icon: Sparkles
  },
  {
    progress: 100,
    title: '🎉 胶片冲洗圆满完成！',
    description: '恭喜！这一卷回忆已全部从银盐晶体转入清晰成片。请取回您的成卷！',
    icon: CheckCircle2
  }
];

export default function DarkroomView({ roll, onDeveloped }: DarkroomViewProps) {
  const [progress, setProgress] = useState<number>(0);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  useEffect(() => {
    sounds.playWinding(); // Play vintage whirr to initiate roll winding

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        
        const next = prev + Math.floor(Math.random() * 4) + 2; // steady random increment
        const capped = Math.min(next, 100);

        // Find applicable step index
        const stepIndex = DEVELOPING_STEPS.findIndex((step, i) => {
          const nextStep = DEVELOPING_STEPS[i + 1];
          return capped >= step.progress && (!nextStep || capped < nextStep.progress);
        });
        
        if (stepIndex !== -1 && stepIndex !== currentStepIndex) {
          setCurrentStepIndex(stepIndex);
          sounds.playBeep(); // tiny alert on stage switch
        }

        return capped;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [currentStepIndex]);

  // Handle final completion
  useEffect(() => {
    if (progress >= 100 && !isCompleted) {
      setIsCompleted(true);
      sounds.playDevelopmentBell(); // Beautiful clear high bell sound!
    }
  }, [progress, isCompleted]);

  const handleFinishDevelopment = async () => {
    const updatedRoll: Roll = {
      ...roll,
      status: 'developed',
      developedAt: Date.now()
    };
    await saveRoll(updatedRoll);
    onDeveloped();
  };

  const currentStep = DEVELOPING_STEPS[currentStepIndex];
  const StepIcon = currentStep.icon;

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-8 flex flex-col items-center">
      
      {/* Visual Ambient Darkroom Background Wrapper */}
      <div className="w-full bg-zinc-950 border border-red-950 rounded-3xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.15)] flex flex-col items-center relative overflow-hidden">
        
        {/* Pulsing Red Darkroom LED light indicator */}
        <div className="absolute top-6 right-6 flex items-center gap-1.5 z-10">
          <span className="text-[10px] font-mono text-red-500 font-bold tracking-widest animate-pulse">SAFE LIGHT</span>
          <div className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_12px_rgba(239,68,68,1)] animate-ping" />
        </div>

        <div className="text-center mb-8 mt-2">
          <h2 className="text-xl font-bold font-mono tracking-wider text-red-500 uppercase">
            Darkroom Lab / 暗房冲洗室
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            SILVER HALIDE PHOTOCHEMICAL DEVELOPMENT
          </p>
        </div>

        {/* Visual Chemical Tub / Developing Tray */}
        <div className="w-full aspect-[16/10] bg-zinc-900 border-2 border-zinc-850 rounded-2xl relative shadow-inner overflow-hidden flex flex-col items-center justify-center p-6 mb-8 group">
          
          {/* Pulsing ambient red water reflection */}
          <div className="absolute inset-0 bg-red-950/15 group-hover:bg-red-950/25 transition-all duration-1000 animate-pulse pointer-events-none" />
          
          {/* Simulated liquid waves */}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-red-900/10 backdrop-blur-[2px] rounded-b-2xl wave-effect animate-pulse" />

          {/* Core Graphic: Floating Film Strip Negative being dipped */}
          <div className="relative z-10 flex flex-col items-center gap-4">
            
            <div className="flex items-center gap-2">
              {/* Spinning Flask / Chem indicator */}
              <div className="w-12 h-12 rounded-full bg-zinc-950 border border-red-500/20 flex items-center justify-center text-red-500 shadow-inner">
                <StepIcon className={`w-6 h-6 ${progress < 100 ? 'animate-bounce' : 'animate-none'}`} />
              </div>
            </div>

            {/* Visual Film Strip Negative Cell */}
            <div className="w-48 h-20 bg-zinc-950 border-y-2 border-zinc-800 rounded-sm relative flex items-center justify-between p-1.5 shadow-2xl overflow-hidden">
              {/* Film sprocket holes top */}
              <div className="absolute top-0.5 inset-x-0 flex justify-between px-2 opacity-40">
                {Array.from({ length: 14 }).map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-sm bg-zinc-800" />
                ))}
              </div>

              {/* Central silhouette photo fading in */}
              <div className="w-full h-11 mx-auto bg-amber-950/20 border border-zinc-900 rounded-sm overflow-hidden relative flex items-center justify-center">
                
                {/* Developing blurry shapes */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-amber-600/30 to-red-500/30 blur-md transition-all duration-500"
                  style={{ opacity: progress / 100 }}
                />
                
                <span className="text-[10px] font-mono text-zinc-600 font-bold uppercase z-10 tracking-widest">
                  {progress < 100 ? 'Developing...' : 'Developed!'}
                </span>
              </div>

              {/* Film sprocket holes bottom */}
              <div className="absolute bottom-0.5 inset-x-0 flex justify-between px-2 opacity-40">
                {Array.from({ length: 14 }).map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-sm bg-zinc-800" />
                ))}
              </div>
            </div>

            <div className="text-center">
              <span className="text-3xl font-black font-mono text-red-500 tracking-tight drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]">
                {progress}%
              </span>
            </div>
          </div>
        </div>

        {/* Current Chemical Stage Box */}
        <div className="w-full bg-zinc-900 border border-zinc-850 rounded-2xl p-4 flex flex-col gap-1 shadow-md mb-6">
          <span className="text-[10px] font-mono text-red-500 font-bold uppercase tracking-widest">
            Current Stage / 当前冲洗阶段
          </span>
          <h4 className="text-sm font-bold text-zinc-200 mt-1">
            {currentStep.title}
          </h4>
          <p className="text-xs text-zinc-400 leading-relaxed mt-1">
            {currentStep.description}
          </p>
        </div>

        {/* Outer Linear Progress Bar */}
        <div className="w-full h-2.5 bg-zinc-900 rounded-full border border-zinc-850 overflow-hidden relative mb-6">
          <div 
            className="h-full bg-red-600 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Big Complete Unlock Button */}
        <AnimatePresence>
          {progress >= 100 && (
            <motion.button
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5 }}
              onClick={handleFinishDevelopment}
              className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-zinc-100 text-sm font-bold py-4 rounded-xl shadow-xl shadow-red-950/30 transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 uppercase cursor-pointer z-10 border border-red-500/30"
              style={{ contentVisibility: 'auto' }}
            >
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>打开胶卷：取回 {roll.totalCount} 张成片 (Open Developed Roll)</span>
            </motion.button>
          )}
        </AnimatePresence>

      </div>

      <p className="text-[11px] text-zinc-500 text-center leading-relaxed mt-6 max-w-sm">
        💡 冲洗流程复刻真实化学显影工艺。照片被还原的瞬间往往最让人心动。
      </p>
    </div>
  );
}
