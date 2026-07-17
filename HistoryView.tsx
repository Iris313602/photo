import React, { useState, useEffect } from 'react';
import { Roll, getAllRolls, getPhotosForRoll, deleteRoll } from '../utils/db';
import { FILM_STYLES } from '../utils/filter';
import { sounds } from './SoundEffects';
import { Film, Calendar, Trash2, ChevronRight, ArrowLeft, Image, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HistoryViewProps {
  onSelectRoll: (roll: Roll) => void;
  onBack: () => void;
}

export default function HistoryView({ onSelectRoll, onBack }: HistoryViewProps) {
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    loadDevelopedRolls();
  }, []);

  const loadDevelopedRolls = async () => {
    setLoading(true);
    const allRolls = await getAllRolls();
    // Only show developed rolls in the historical gallery
    const developed = allRolls.filter(r => r.status === 'developed');
    setRolls(developed);
    setLoading(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent opening roll on delete
    sounds.playBeep();
    await deleteRoll(id);
    setDeleteConfirmId(null);
    loadDevelopedRolls();
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8" id="history-section">
      
      {/* Header controls */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回相机</span>
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-black text-zinc-100 tracking-tight flex items-center gap-2">
          <Film className="w-6 h-6 text-amber-500" />
          我的冲洗档案库 (Developed Rolls Archive)
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          记录您创作的每一个实体感数字胶卷，可以随时回顾、下载以及打印。
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-3">
          <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <span className="text-xs font-mono">正在调取存储库...</span>
        </div>
      ) : rolls.length === 0 ? (
        /* Empty State */
        <div className="bg-zinc-900/40 border border-zinc-850 rounded-3xl p-10 text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-zinc-850 flex items-center justify-center text-zinc-600 mb-2 border border-zinc-800">
            <Camera className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-zinc-300 font-bold text-sm">您的冲洗档案库目前空空如也</h4>
            <p className="text-zinc-500 text-xs max-w-xs mx-auto leading-relaxed mt-1">
              您还没有冲洗完成的胶卷。快去装入底片，拍满并完成冲洗吧！
            </p>
          </div>
          <button
            onClick={onBack}
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs py-2.5 px-6 rounded-xl shadow-lg transition active:scale-95 cursor-pointer mt-2"
          >
            开启第一卷拍摄 (Start Shooting)
          </button>
        </div>
      ) : (
        /* Developed Rolls List */
        <div className="flex flex-col gap-3">
          {rolls.map((roll, index) => {
            const style = FILM_STYLES.find(f => f.id === roll.filmStyle) || FILM_STYLES[0];
            const dateStr = roll.developedAt
              ? new Date(roll.developedAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
              : '未知';

            return (
              <motion.div
                key={roll.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
                onClick={() => {
                  sounds.playBeep();
                  onSelectRoll(roll);
                }}
                className="bg-zinc-900/60 hover:bg-zinc-850 border border-zinc-850 hover:border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Decorative film stack */}
                  <div className={`w-10 h-12 rounded-md bg-gradient-to-b ${style.color} p-1 flex flex-col justify-between shadow-lg relative flex-shrink-0 group-hover:scale-105 transition-transform`}>
                    <span className="text-[6px] font-bold text-zinc-950">{roll.totalCount} EXP</span>
                    <span className="text-[12px] font-black text-zinc-950 text-center font-mono leading-none">{roll.totalCount}</span>
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-zinc-200 truncate group-hover:text-amber-400 transition-colors">
                      {roll.name}
                    </h4>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1">
                      <span className="font-semibold text-zinc-500">{style.name}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-700" />
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-zinc-500" />
                        {dateStr} 冲洗
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sounds.playBeep();
                      setDeleteConfirmId(roll.id);
                    }}
                    className="text-zinc-600 hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 transition cursor-pointer"
                    title="删除胶卷"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-transform group-hover:translate-x-0.5" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-sm bg-zinc-900 border border-zinc-850 rounded-2xl p-6 flex flex-col gap-4">
              <h3 className="text-zinc-200 font-bold text-base">永久删除此胶卷？</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                这将永久删除此胶卷档案及其所有的底片，该操作不可恢复。
              </p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-medium py-2.5 rounded-lg transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  onClick={(e) => handleDelete(deleteConfirmId, e)}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-zinc-100 text-xs font-medium py-2.5 rounded-lg transition cursor-pointer"
                >
                  确认删除
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
