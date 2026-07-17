import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Sparkles, Upload, AlertCircle, HelpCircle } from 'lucide-react';
import { sounds } from './SoundEffects';
import { Photo, Roll, savePhoto, saveRoll } from '../utils/db';
import { processFilmPhoto, FILM_STYLES, generateRetroMockPhoto } from '../utils/filter';
import { motion, AnimatePresence } from 'motion/react';

interface CameraViewProps {
  roll: Roll;
  onPhotoAdded: (photosCount: number) => void;
  onRollCompleted: () => void;
}

export default function CameraView({ roll, onPhotoAdded, onRollCompleted }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<'loading' | 'active' | 'denied' | 'simulated'>('loading');
  const [isFrontCamera, setIsFrontCamera] = useState<boolean>(false);
  const [flashActive, setFlashActive] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeStyle = FILM_STYLES.find(f => f.id === roll.filmStyle) || FILM_STYLES[0];
  const framesRemaining = roll.totalCount - roll.currentCount;

  // Initialize camera
  useEffect(() => {
    initCamera();
    return () => {
      stopCamera();
    };
  }, [isFrontCamera]);

  const initCamera = async () => {
    setCameraState('loading');
    stopCamera();

    try {
      // Constraints
      const constraints = {
        video: {
          facingMode: isFrontCamera ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 960 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setCameraState('active');
    } catch (err) {
      console.warn('Camera initiation failed, switching to simulated sensor mode.', err);
      setCameraState('simulated');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const toggleCameraFacing = () => {
    sounds.playBeep();
    setIsFrontCamera(!isFrontCamera);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Perform Shutter click (Capture image)
  const handleShutterClick = async () => {
    if (processing || framesRemaining <= 0) return;

    // Play shutter sound
    sounds.playShutter();
    
    // Trigger physical flash animation
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 200);

    setProcessing(true);

    try {
      let capturedDataUrl = '';

      if (cameraState === 'active' && videoRef.current) {
        // Draw video frame onto a canvas to capture
        const captureCanvas = document.createElement('canvas');
        captureCanvas.width = videoRef.current.videoWidth || 1280;
        captureCanvas.height = videoRef.current.videoHeight || 960;
        const ctx = captureCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, captureCanvas.width, captureCanvas.height);
          capturedDataUrl = captureCanvas.toDataURL('image/jpeg', 0.9);
        }
      }

      // If simulated mode, or camera failed to capture
      if (!capturedDataUrl) {
        // Generate beautiful retro-styled scenery!
        capturedDataUrl = await generateRetroMockPhoto(roll.filmStyle, roll.currentCount + 1);
      }

      // Run it through our processing filter
      const processedDataUrl = cameraState === 'active' 
        ? await processFilmPhoto(capturedDataUrl, roll.filmStyle, roll.currentCount + 1)
        : capturedDataUrl; // if generated, filter is already applied

      // Save to IndexedDB
      const nextSequence = roll.currentCount + 1;
      const newPhoto: Photo = {
        rollId: roll.id,
        sequenceNo: nextSequence,
        originalDataUrl: capturedDataUrl,
        processedDataUrl: processedDataUrl,
        shotAt: Date.now()
      };

      await savePhoto(newPhoto);

      // Update roll details
      const updatedRoll = {
        ...roll,
        currentCount: nextSequence,
        status: nextSequence >= roll.totalCount ? 'full' as const : 'shooting' as const
      };

      await saveRoll(updatedRoll);
      
      onPhotoAdded(nextSequence);
      showToast(`🎞️ 第 ${nextSequence} 张底片已成功封存入暗盒`);

      if (nextSequence >= roll.totalCount) {
        // Trigger roll completed view transition after a short delay so they can enjoy the final count LED glow
        setTimeout(() => {
          onRollCompleted();
        }, 1500);
      }

    } catch (e) {
      console.error(e);
      showToast('⚠️ 胶片保存失败，请重新拍摄');
    } finally {
      setProcessing(false);
    }
  };

  // Upload Photo simulation
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || processing || framesRemaining <= 0) return;

    setProcessing(true);
    sounds.playBeep();

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawUrl = event.target?.result as string;

        // Apply flash effect
        setFlashActive(true);
        setTimeout(() => setFlashActive(false), 200);
        sounds.playShutter();

        // Process image file
        const processedUrl = await processFilmPhoto(rawUrl, roll.filmStyle, roll.currentCount + 1);

        const nextSequence = roll.currentCount + 1;
        const newPhoto: Photo = {
          rollId: roll.id,
          sequenceNo: nextSequence,
          originalDataUrl: rawUrl,
          processedDataUrl: processedUrl,
          shotAt: Date.now()
        };

        await savePhoto(newPhoto);

        const updatedRoll = {
          ...roll,
          currentCount: nextSequence,
          status: nextSequence >= roll.totalCount ? 'full' as const : 'shooting' as const
        };

        await saveRoll(updatedRoll);
        onPhotoAdded(nextSequence);
        showToast(`🎞️ 导入的照片已胶片化，封存为第 ${nextSequence} 张`);

        if (nextSequence >= roll.totalCount) {
          setTimeout(() => {
            onRollCompleted();
          }, 1500);
        }

      } catch (err) {
        console.error(err);
        showToast('⚠️ 胶片转换失败，请更换其他图片');
      } finally {
        setProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center w-full px-4 py-6" id="camera-section">
      {/* Absolute flash effect */}
      <AnimatePresence>
        {flashActive && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 bg-white z-50 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Floating Status Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-6 z-40 bg-zinc-900 text-amber-100 border border-amber-500/30 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium tracking-wide flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Tactile Analog Camera Body */}
      <div className="w-full max-w-md bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950 border border-zinc-700 rounded-3xl p-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative flex flex-col items-center">
        
        {/* Brushed Metal Top Plate */}
        <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 rounded-t-3xl border-b border-zinc-950 flex items-center justify-between px-6 z-10">
          {/* Brand/Model details */}
          <div className="text-[10px] font-mono tracking-widest text-zinc-400 font-bold uppercase">
            RETRO-{roll.totalCount} EXP
          </div>
          {/* LED light indicator */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-zinc-500 uppercase">Status</span>
            <div className={`w-2.5 h-2.5 rounded-full border border-zinc-950 shadow-[0_0_8px] transition-colors duration-300 ${
              processing ? 'bg-amber-500 shadow-amber-500 animate-pulse' : 'bg-emerald-500 shadow-emerald-500'
            }`} />
          </div>
        </div>

        {/* Outer view spacers */}
        <div className="h-6" />

        {/* Counter screen & Film indicator line */}
        <div className="w-full flex justify-between items-end mb-4 px-1 mt-2">
          {/* Loaded Film Canister Miniature */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-12 rounded-lg bg-zinc-950 border border-zinc-700 shadow-inner relative flex flex-col overflow-hidden">
              {/* Canister head */}
              <div className="h-1.5 w-full bg-yellow-600" />
              {/* Canister body label */}
              <div className="flex-1 bg-yellow-500 flex flex-col justify-between p-1">
                <div className="text-[6px] font-extrabold text-black uppercase leading-tight">
                  KODAK
                </div>
                <div className="text-[5px] font-mono font-bold text-zinc-900">
                  {roll.totalCount}x
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 font-mono">Loaded Film</span>
              <span className={`text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r ${activeStyle.color} tracking-tight`}>
                {activeStyle.name}
              </span>
            </div>
          </div>

          {/* Glowing Red Segment Counter Panel */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-1">
              Frames Left
            </span>
            <div className="bg-zinc-950 border-2 border-zinc-800 rounded-lg px-3 py-1.5 shadow-inner flex items-center justify-center relative">
              <div className="absolute inset-0 bg-red-950/20 rounded-md" />
              {/* Fake background lines of 7 segment */}
              <div className="text-zinc-900 font-mono font-bold text-2xl tracking-tight absolute opacity-10 select-none">
                88
              </div>
              {/* Actual value */}
              <div className="text-red-500 font-mono font-extrabold text-2xl tracking-tight z-10 drop-shadow-[0_0_6px_rgba(239,68,68,0.75)]">
                {framesRemaining.toString().padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>

        {/* VIEW FINDER / CAMERA VIEW */}
        <div className="w-full aspect-[4/3] bg-zinc-950 rounded-2xl overflow-hidden border-4 border-zinc-800 shadow-[inset_0_4px_12px_rgba(0,0,0,0.8)] relative group">
          
          {/* Overlay grid / Viewfinder guidelines */}
          <div className="absolute inset-0 border border-zinc-800/25 pointer-events-none z-10">
            {/* Corner guides */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-zinc-400/40" />
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-zinc-400/40" />
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-zinc-400/40" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-zinc-400/40" />
            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-zinc-400/30" />
          </div>

          {/* Active Camera Video */}
          {cameraState === 'active' && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-transform duration-300 ${
                isFrontCamera ? 'scale-x-[-1]' : ''
              }`}
            />
          )}

          {/* Loading view */}
          {cameraState === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-zinc-500">
              <Camera className="w-8 h-8 animate-spin" />
              <span className="text-xs font-mono">Initializing Sensor...</span>
            </div>
          )}

          {/* Simulated Mode View (Dynamic scenery generator or image uploader) */}
          {cameraState === 'simulated' && (
            <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center p-6 text-center select-none">
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700/50 text-amber-500/80 mb-3 shadow-inner">
                <Sparkles className="w-7 h-7 animate-pulse" />
              </div>
              <h4 className="text-zinc-200 text-sm font-semibold mb-1">
                模拟环境光传感器已就绪
              </h4>
              <p className="text-zinc-400 text-xs max-w-xs leading-relaxed mb-4">
                无法调用系统摄像头。已开启胶卷感光算法，您可以点击快门生成模拟自然风景，或导入照片。
              </p>
              
              <button
                onClick={triggerUploadClick}
                className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium px-4 py-2 rounded-xl border border-zinc-700 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                导入外部照片进行胶片化
              </button>
            </div>
          )}

          {/* Processing screen cover overlay */}
          <AnimatePresence>
            {processing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center"
              >
                <div className="relative w-12 h-12 flex items-center justify-center mb-2">
                  <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <span className="text-amber-500 text-xs font-mono uppercase tracking-widest animate-pulse">
                  Exposing Film...
                </span>
                <span className="text-zinc-500 text-[10px] font-mono mt-1">
                  正在进行银盐感光与胶质封存
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Secret input for manual image upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePhotoUpload}
          accept="image/*"
          className="hidden"
        />

        {/* CAMERA CONTROLS AND DIAL PANEL */}
        <div className="w-full flex justify-between items-center mt-6 px-2">
          
          {/* Left button: Camera Rotator or Upload Toggle */}
          <div className="flex flex-col items-center gap-1">
            {cameraState === 'active' ? (
              <button
                onClick={toggleCameraFacing}
                disabled={processing}
                className="w-12 h-12 rounded-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 border border-zinc-700 shadow-md flex items-center justify-center transition-all disabled:opacity-50"
                title="切换镜头"
              >
                <RefreshCw className="w-5 h-5 text-zinc-400" />
              </button>
            ) : (
              <button
                onClick={triggerUploadClick}
                disabled={processing}
                className="w-12 h-12 rounded-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 border border-zinc-700 shadow-md flex items-center justify-center transition-all disabled:opacity-50"
                title="导入照片"
              >
                <Upload className="w-5 h-5 text-zinc-400" />
              </button>
            )}
            <span className="text-[10px] text-zinc-500 font-mono uppercase">
              {cameraState === 'active' ? 'Flip' : 'Import'}
            </span>
          </div>

          {/* Middle: Big Tactile Shutter Button with Metallic Bezel */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 border-4 border-zinc-950 shadow-[0_10px_20px_rgba(0,0,0,0.5)] flex items-center justify-center relative p-1.5">
              <button
                onClick={handleShutterClick}
                disabled={processing || framesRemaining <= 0}
                className={`w-full h-full rounded-full bg-gradient-to-b from-zinc-300 via-zinc-400 to-zinc-500 active:from-zinc-500 active:to-zinc-600 border-2 border-zinc-200 active:border-zinc-500 shadow-md transform transition-all active:translate-y-1 active:shadow-[inset_0_6px_10px_rgba(0,0,0,0.6)] relative overflow-hidden group ${
                  processing || framesRemaining <= 0 ? 'opacity-40 cursor-not-allowed' : ''
                }`}
                style={{ contentVisibility: 'auto' }}
              >
                {/* Internal ring reflection */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-zinc-900/10 border border-white/20" />
                </div>
              </button>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono font-bold uppercase tracking-widest mt-2">
              Shutter
            </span>
          </div>

          {/* Right: Info / Helper panel */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => {
                sounds.playBeep();
                showToast(`💡 提示：本款胶片是 ${activeStyle.name}。拍满 ${roll.totalCount} 张才能洗照片哦！`);
              }}
              className="w-12 h-12 rounded-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 border border-zinc-700 shadow-md flex items-center justify-center transition-all"
              title="胶片描述"
            >
              <HelpCircle className="w-5 h-5 text-zinc-400" />
            </button>
            <span className="text-[10px] text-zinc-500 font-mono uppercase">Info</span>
          </div>

        </div>

        {/* Vintage leatherette textured band at camera bottom */}
        <div className="w-full h-10 mt-6 bg-zinc-950 border-t border-zinc-900 flex items-center justify-center px-4 rounded-b-2xl">
          <p className="text-[11px] text-zinc-500 text-center truncate italic font-serif">
            "{activeStyle.description.slice(0, 36)}..."
          </p>
        </div>

      </div>

      {/* Progress slider bar under camera */}
      <div className="w-full max-w-sm mt-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-400 font-mono font-medium">当前胶卷拍摄进度</span>
          <span className="text-amber-500 font-mono font-bold">{roll.currentCount} / {roll.totalCount} 张</span>
        </div>
        
        {/* Visual canister track */}
        <div className="w-full h-3.5 bg-zinc-950 rounded-full p-0.5 border border-zinc-800 relative overflow-hidden flex items-center">
          {/* Striped roll marker */}
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(roll.currentCount / roll.totalCount) * 100}%` }}
          />
          
          {/* Mini negative lines along the progress bar */}
          <div className="absolute inset-0 flex justify-between pointer-events-none px-2 opacity-15">
            {Array.from({ length: 13 }).map((_, i) => (
              <div key={i} className="w-0.5 h-full bg-white" />
            ))}
          </div>
        </div>

        <p className="text-[11px] text-zinc-500 text-center leading-normal mt-1">
          🔒 冲洗前，所有成片严格加密封存。静享纯粹拍摄乐趣，静待 {roll.totalCount} 张圆满瞬间。
        </p>
      </div>
    </div>
  );
}
