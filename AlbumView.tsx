import React, { useState, useRef } from 'react';
import { Photo, Roll, deleteRoll } from '../utils/db';
import { FILM_STYLES } from '../utils/filter';
import { sounds } from './SoundEffects';
import { Download, ChevronLeft, ChevronRight, X, Trash2, Layout, Share2, Sparkles, Film, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AlbumViewProps {
  roll: Roll;
  photos: Photo[];
  onBack: () => void;
  onRestart: () => void;
}

export default function AlbumView({ roll, photos, onBack, onRestart }: AlbumViewProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [showCollageModal, setShowCollageModal] = useState<boolean>(false);
  const [collageDataUrl, setCollageDataUrl] = useState<string | null>(null);
  const [generatingCollage, setGeneratingCollage] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const activeStyle = FILM_STYLES.find(f => f.id === roll.filmStyle) || FILM_STYLES[0];
  const dateStr = roll.developedAt 
    ? new Date(roll.developedAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
    : '未冲洗';

  const downloadPhoto = (photo: Photo) => {
    sounds.playBeep();
    const link = document.createElement('a');
    link.href = photo.processedDataUrl;
    link.download = `AnalogCamera_${roll.name}_EXP_${photo.sequenceNo}.jpg`;
    link.click();
  };

  // Generate a beautiful film memorial grid collage
  const handleGenerateCollage = async () => {
    if (photos.length === 0) return;
    setGeneratingCollage(true);
    sounds.playBeep();

    setTimeout(() => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Choose grid size based on available photos
        // We will make a beautiful 3x3 grid (9 photos) or up to 3x4 (12 photos)
        // Let's pick 9 representative photos (evenly distributed from the 26 photos)
        const totalToPick = Math.min(photos.length, 9);
        const selectedPhotos: Photo[] = [];
        
        if (photos.length <= 9) {
          selectedPhotos.push(...photos);
        } else {
          // Select 9 photos evenly spaced across the 26
          for (let i = 0; i < 9; i++) {
            const index = Math.floor((i / 8) * (photos.length - 1));
            selectedPhotos.push(photos[index]);
          }
        }

        // Poster Dimensions: 1200 width, 1800 height (ideal vertical poster ratio)
        const pWidth = 1200;
        const pHeight = 1800;
        canvas.width = pWidth;
        canvas.height = pHeight;

        // Draw Poster Background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, pHeight);
        bgGrad.addColorStop(0, '#121214'); // Dark carbon
        bgGrad.addColorStop(1, '#080809');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, pWidth, pHeight);

        // Header: Poster Titles
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#e4e4e7';
        ctx.font = 'bold 50px "Courier New", Courier, monospace';
        ctx.fillText('ANALOG FILM ROLL', pWidth / 2, 100);
        
        ctx.font = 'bold 36px "Courier New", Courier, monospace';
        ctx.fillStyle = '#f59e0b'; // Amber Gold
        ctx.fillText(roll.name.toUpperCase(), pWidth / 2, 160);

        ctx.font = '12px "Courier New", Courier, monospace';
        ctx.fillStyle = '#71717a';
        ctx.fillText(`DEVELOPED ON ${dateStr.toUpperCase()} • STOCK: ${activeStyle.name.toUpperCase()}`, pWidth / 2, 210);
        ctx.restore();

        // Draw film reel border sprocket holes on left and right borders of the poster
        const holeWidth = 15;
        const holeHeight = 25;
        const holeSpacing = 50;
        ctx.fillStyle = '#27272a';
        
        for (let y = 50; y < pHeight - 50; y += holeSpacing) {
          // Left rail hole
          ctx.fillRect(30, y, holeWidth, holeHeight);
          // Right rail hole
          ctx.fillRect(pWidth - 30 - holeWidth, y, holeWidth, holeHeight);
        }

        // Draw 3x3 Grid of Photos
        const gridCols = 3;
        const startX = 100;
        const startY = 280;
        const gap = 40;
        
        // Single picture block size
        const picW = 310;
        const picH = 380; // slightly taller to look like polaroid with border

        selectedPhotos.forEach((photo, idx) => {
          const col = idx % gridCols;
          const row = Math.floor(idx / gridCols);
          
          const x = startX + col * (picW + gap);
          const y = startY + row * (picH + gap);

          // 1. Draw polaroid frame background
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
          ctx.shadowBlur = 12;
          ctx.shadowOffsetY = 4;
          ctx.fillStyle = '#ffffff'; // White paper frame
          ctx.fillRect(x, y, picW, picH);
          ctx.restore();

          // 2. Load and Draw Image
          const img = new Image();
          img.onload = () => {
            // Draw photo inside frame (maintain 4:3 area inside)
            const imgW = picW - 24;
            const imgH = picH - 74; // leaving room for stamp on bottom
            
            ctx.drawImage(img, x + 12, y + 12, imgW, imgH);

            // Draw sequence number like "EXP #05"
            ctx.fillStyle = '#71717a';
            ctx.font = '14px "Courier New", Courier, monospace';
            ctx.fillText(`EXP #${photo.sequenceNo.toString().padStart(2, '0')}`, x + 20, y + picH - 22);

            // If we are on the last photo, generate the dataURL
            if (idx === selectedPhotos.length - 1) {
              setCollageDataUrl(canvas.toDataURL('image/jpeg', 0.88));
              setGeneratingCollage(false);
              setShowCollageModal(true);
            }
          };
          img.src = photo.processedDataUrl;
        });

      } catch (err) {
        console.error(err);
        setGeneratingCollage(false);
      }
    }, 500);
  };

  const downloadCollage = () => {
    if (!collageDataUrl) return;
    sounds.playBeep();
    const link = document.createElement('a');
    link.href = collageDataUrl;
    link.download = `AnalogCamera_Memorial_Collage_${roll.name}.jpg`;
    link.click();
  };

  const handleDeleteRoll = async () => {
    sounds.playBeep();
    await deleteRoll(roll.id);
    onBack();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6" id="album-section">
      
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回列表</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Collage generator */}
          <button
            onClick={handleGenerateCollage}
            disabled={generatingCollage}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {generatingCollage ? (
              <div className="w-3.5 h-3.5 border-2 border-zinc-200 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Layout className="w-4 h-4 text-amber-500" />
            )}
            <span>生成冲印纪念海报 (Poster)</span>
          </button>

          {/* New Roll */}
          <button
            onClick={onRestart}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-zinc-950 text-xs font-black py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>开启新胶卷 (New Roll)</span>
          </button>
        </div>
      </div>

      {/* Roll Info Card */}
      <div className="bg-zinc-900/40 border border-zinc-850 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-14 rounded-lg bg-gradient-to-b ${activeStyle.color} p-1.5 flex flex-col justify-between shadow-xl`}>
            <span className="text-[8px] font-black text-black tracking-tighter">FILM</span>
            <span className="text-[14px] font-mono font-black text-zinc-950 text-center leading-none">{roll.totalCount}</span>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-zinc-100">{roll.name}</h2>
            <p className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-amber-500/90 font-medium">{activeStyle.name}</span>
              <span className="text-zinc-600">•</span>
              <span>冲洗日期: {dateStr}</span>
              <span className="text-zinc-600">•</span>
              <span>共 {photos.length} 张底片</span>
            </p>
          </div>
        </div>

        {/* Delete roll */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="text-zinc-600 hover:text-red-500 hover:bg-red-500/10 p-2.5 rounded-xl border border-transparent hover:border-red-500/20 transition self-end md:self-auto cursor-pointer"
          title="删除此胶卷"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Grid of Photos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {photos.map((photo, index) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
            onClick={() => {
              sounds.playBeep();
              setActivePhotoIndex(index);
            }}
            className="bg-white p-3 rounded-md shadow-lg transform hover:-rotate-1 hover:scale-[1.02] transition-all cursor-pointer group flex flex-col"
          >
            {/* Aspect wrapper */}
            <div className="w-full aspect-[4/3] bg-zinc-100 rounded-sm overflow-hidden relative border border-zinc-200">
              <img
                src={photo.processedDataUrl}
                alt={`Photo ${photo.sequenceNo}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              {/* Exposed film index label */}
              <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-sm text-[8px] font-mono text-zinc-200 px-1.5 py-0.5 rounded-full uppercase tracking-widest font-semibold z-10">
                Exp {photo.sequenceNo}
              </div>
            </div>

            {/* Polaroid lower spacer label */}
            <div className="pt-3 pb-0.5 px-1 flex justify-between items-center text-zinc-400 font-mono text-[9px]">
              <span className="font-semibold text-zinc-500 uppercase">#{photo.sequenceNo.toString().padStart(2, '0')}</span>
              <span>{new Date(photo.shotAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox Slideshow Modal */}
      <AnimatePresence>
        {activePhotoIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-950/98 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            {/* Close */}
            <button
              onClick={() => setActivePhotoIndex(null)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-100 bg-zinc-900/60 p-2.5 rounded-full hover:bg-zinc-800 transition z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Navigator */}
            <button
              onClick={() => {
                sounds.playBeep();
                setActivePhotoIndex(prev => (prev! > 0 ? prev! - 1 : photos.length - 1));
              }}
              className="absolute left-4 md:left-8 text-zinc-400 hover:text-zinc-100 bg-zinc-900/40 p-3 rounded-full hover:bg-zinc-850 transition z-10 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Lightbox Content: Large Polaroid Card */}
            <motion.div
              initial={{ scale: 0.92, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 10 }}
              className="w-full max-w-2xl bg-white p-4 pb-8 md:p-6 md:pb-12 rounded-lg shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="w-full aspect-[4/3] bg-zinc-100 border border-zinc-200 rounded-sm overflow-hidden relative">
                <img
                  src={photos[activePhotoIndex].processedDataUrl}
                  alt={`Photo Large ${photos[activePhotoIndex].sequenceNo}`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                
                {/* Micro Stamp */}
                <div className="absolute top-3 left-3 bg-zinc-950/70 text-[9px] font-mono text-zinc-300 px-2 py-0.5 rounded-full uppercase font-bold tracking-widest">
                  Canister Entry #{photos[activePhotoIndex].sequenceNo}
                </div>
              </div>

              {/* Polaroid bottom control footer */}
              <div className="flex items-center justify-between border-t border-zinc-100 pt-4 px-1">
                <div className="flex flex-col">
                  <span className="text-xs font-mono font-bold text-zinc-700">
                    EXPEDITION ROLL FRAME #{photos[activePhotoIndex].sequenceNo.toString().padStart(2, '0')}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono mt-0.5">
                    {new Date(photos[activePhotoIndex].shotAt).toLocaleString('zh-CN')}
                  </span>
                </div>

                <button
                  onClick={() => downloadPhoto(photos[activePhotoIndex])}
                  className="bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下载单张 (Save Image)</span>
                </button>
              </div>
            </motion.div>

            {/* Right Navigator */}
            <button
              onClick={() => {
                sounds.playBeep();
                setActivePhotoIndex(prev => (prev! < photos.length - 1 ? prev! + 1 : 0));
              }}
              className="absolute right-4 md:right-8 text-zinc-400 hover:text-zinc-100 bg-zinc-900/40 p-3 rounded-full hover:bg-zinc-850 transition z-10 cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collage Preview Modal */}
      <AnimatePresence>
        {showCollageModal && collageDataUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-950/98 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
                <h3 className="text-sm font-bold text-zinc-200 font-mono flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-amber-500 animate-pulse" />
                  冲印纪念海报已成功生成！
                </h3>
                <button
                  onClick={() => setShowCollageModal(false)}
                  className="text-zinc-500 hover:text-zinc-300 p-1 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Poster Image view */}
              <div className="w-full aspect-[2/3] max-h-[55vh] border border-zinc-800 rounded-xl overflow-hidden shadow-inner bg-zinc-950 relative flex justify-center">
                <img
                  src={collageDataUrl}
                  alt="Poster Collage"
                  className="h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setShowCollageModal(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-bold py-3 rounded-xl transition cursor-pointer"
                >
                  返回相册
                </button>
                <button
                  onClick={downloadCollage}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-zinc-950 text-xs font-extrabold py-3 rounded-xl shadow-lg transition transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>下载海报 (Save Poster)</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-sm bg-zinc-900 border border-zinc-850 rounded-2xl p-6 flex flex-col gap-4">
              <h3 className="text-zinc-200 font-bold text-base">删除这卷胶卷？</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                此操作将永久从您的设备存储（IndexedDB）中删除胶卷 “{roll.name}” 的所有 {roll.totalCount} 张已冲洗成片。此操作不可撤销。
              </p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-medium py-2.5 rounded-lg transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteRoll}
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
