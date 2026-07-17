/**
 * Professional Canvas-based Retro Film Filter Processor
 */

export interface FilmStyle {
  id: string;
  name: string;
  description: string;
  color: string; // Tailwind indicator color
}

export const FILM_STYLES: FilmStyle[] = [
  {
    id: 'classic-gold',
    name: 'Kodak Gold 200',
    description: '经典的温暖金色调，适中对比度，散发着夏日午后的复古气息。适合户外与人像。',
    color: 'from-amber-400 to-orange-500'
  },
  {
    id: 'fuji-green',
    name: 'Fuji Superia 400',
    description: '标志性的日系清新，暗部呈现微妙的墨绿与青色，冷暖交织，带有清冷文艺质感。',
    color: 'from-emerald-400 to-teal-600'
  },
  {
    id: 'noir-mono',
    name: 'Kodak Tri-X 400',
    description: '高反差黑白影调，深邃的阴影与高光，重度噪点颗粒，极致的故事感与纪实氛围。',
    color: 'from-neutral-500 to-neutral-800'
  },
  {
    id: 'vintage-chrome',
    name: 'Ektachrome 100',
    description: '浓郁的正片色彩，饱和度极高，深邃的湛蓝，鲜明的红黄，犹如旧杂志插画。',
    color: 'from-sky-400 to-blue-600'
  },
  {
    id: 'y2k-leak',
    name: 'Y2K Dream Leak',
    description: '千禧年漏光梦境，极具冲击力的橙粉色重度漏光，低保真色调，叛逆又梦幻。',
    color: 'from-pink-400 to-rose-600'
  }
];

/**
 * Utility to load an image URL into an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image for processing'));
    img.src = src;
  });
}

/**
 * Apply Film Style processing on a canvas
 */
export async function processFilmPhoto(
  imageSrc: string,
  styleId: string,
  sequenceNo: number
): Promise<string> {
  const img = await loadImage(imageSrc);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get 2D context');
  }

  // Define target size (maintain 4:3 or 1:1 format, typical of vintage camera frames)
  // Let's standardise on a decent high-resolution but responsive size, e.g. 1020 x 765
  const originalWidth = img.width;
  const originalHeight = img.height;
  
  // standard 4:3 canvas size
  const targetWidth = 1200;
  const targetHeight = 900;
  
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Calculate cover dimensions to draw image with proper aspect ratio fill
  const ratio = Math.max(targetWidth / originalWidth, targetHeight / originalHeight);
  const drawWidth = originalWidth * ratio;
  const drawHeight = originalHeight * ratio;
  const xOffset = (targetWidth - drawWidth) / 2;
  const yOffset = (targetHeight - drawHeight) / 2;

  // 1. Apply Base Color Filtering using canvas 2D filter operations
  // If browser doesn't support ctx.filter, we draw normally and apply manual effects
  let filterString = 'contrast(1.05) brightness(1.0) saturate(1.0)';
  
  switch (styleId) {
    case 'classic-gold':
      // Warm, golden, slightly low highlights, sepia blend
      filterString = 'contrast(1.1) brightness(0.98) saturate(1.15) sepia(0.18) hue-rotate(-5deg)';
      break;
    case 'fuji-green':
      // Slightly cooler, cyan/green shift, bright highlights
      filterString = 'contrast(1.05) brightness(1.02) saturate(0.95) hue-rotate(5deg) sepia(0.05)';
      break;
    case 'noir-mono':
      // Pure monochrome with high contrast and slight brightness boost
      filterString = 'grayscale(1) contrast(1.4) brightness(0.95)';
      break;
    case 'vintage-chrome':
      // Deep blues, rich saturation
      filterString = 'contrast(1.2) saturate(1.35) brightness(0.95) hue-rotate(-3deg)';
      break;
    case 'y2k-leak':
      // Low contrast, washed out highlights, slight pinkish/purple tint
      filterString = 'contrast(0.9) brightness(1.05) saturate(1.1) sepia(0.1) hue-rotate(15deg)';
      break;
  }

  // Set the filter on context
  try {
    ctx.filter = filterString;
  } catch (e) {
    console.warn('Canvas filter not supported on this browser:', e);
  }

  // Draw the image onto canvas
  ctx.drawImage(img, xOffset, yOffset, drawWidth, drawHeight);

  // Reset filter for subsequent overlays
  try {
    ctx.filter = 'none';
  } catch (e) {}

  // 2. Extra Color Correction Overlay (Fallback for split-toning)
  if (styleId === 'classic-gold') {
    // Add amber tint overlay with 'color' or 'overlay' blend mode
    ctx.fillStyle = 'rgba(251, 191, 36, 0.08)';
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.globalCompositeOperation = 'source-over';
  } else if (styleId === 'fuji-green') {
    // Greenish shadow split tint
    ctx.fillStyle = 'rgba(16, 185, 129, 0.04)';
    ctx.globalCompositeOperation = 'color-burn';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.globalCompositeOperation = 'source-over';
  }

  // 3. Apply Vignette Effect (Dark corners)
  const gradient = ctx.createRadialGradient(
    targetWidth / 2, targetHeight / 2, Math.min(targetWidth, targetHeight) * 0.3,
    targetWidth / 2, targetHeight / 2, Math.max(targetWidth, targetHeight) * 0.75
  );
  
  if (styleId === 'noir-mono') {
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
  } else if (styleId === 'y2k-leak') {
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.08)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
  } else {
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
  }
  
  ctx.fillStyle = gradient;
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.globalCompositeOperation = 'source-over';

  // 4. Apply Light Leak (Randomized vintage leakage)
  // We'll simulate a red/orange film leak
  const hasLeak = styleId === 'y2k-leak' || Math.random() > 0.4; // 60% chance for other styles, 100% for Y2K
  if (hasLeak && styleId !== 'noir-mono') {
    // Generate light leak parameters based on style and sequence
    const leakType = (sequenceNo % 3); // 3 different leak patterns
    ctx.globalCompositeOperation = 'screen';
    
    if (leakType === 0) {
      // Left edge vertical leak
      const leakGrad = ctx.createLinearGradient(0, 0, targetWidth * 0.25, 0);
      leakGrad.addColorStop(0, 'rgba(239, 68, 68, 0.7)'); // Red
      leakGrad.addColorStop(0.3, 'rgba(245, 158, 11, 0.4)'); // Orange
      leakGrad.addColorStop(0.7, 'rgba(236, 72, 153, 0.1)'); // Pink
      leakGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = leakGrad;
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    } else if (leakType === 1) {
      // Right-bottom diagonal leak
      const leakGrad = ctx.createRadialGradient(
        targetWidth, targetHeight, 0,
        targetWidth, targetHeight, targetWidth * 0.45
      );
      leakGrad.addColorStop(0, 'rgba(244, 63, 94, 0.85)'); // Rose
      leakGrad.addColorStop(0.4, 'rgba(249, 115, 22, 0.5)'); // Orange-red
      leakGrad.addColorStop(0.8, 'rgba(253, 224, 71, 0.15)'); // Yellow
      leakGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = leakGrad;
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    } else {
      // Horizontal stripe across the middle/top
      const leakGrad = ctx.createLinearGradient(0, targetHeight * 0.1, 0, targetHeight * 0.45);
      leakGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      leakGrad.addColorStop(0.4, 'rgba(239, 68, 68, 0.4)');
      leakGrad.addColorStop(0.6, 'rgba(249, 115, 22, 0.5)');
      leakGrad.addColorStop(0.8, 'rgba(239, 68, 68, 0.2)');
      leakGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = leakGrad;
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }
    
    ctx.globalCompositeOperation = 'source-over';
  }

  // 5. Apply Film Grain (Procedural noise texture overlay)
  // To keep performance super fast, we generate random noise dots on a separate smaller pattern or draw dots
  const grainAmount = styleId === 'noir-mono' ? 0.08 : styleId === 'classic-gold' ? 0.05 : 0.04;
  const grainSize = styleId === 'noir-mono' ? 2 : 1.5;
  
  // We draw random noise dots
  ctx.fillStyle = 'rgba(255, 255, 255, 0.13)';
  for (let i = 0; i < (targetWidth * targetHeight) * grainAmount; i++) {
    const gx = Math.random() * targetWidth;
    const gy = Math.random() * targetHeight;
    const size = Math.random() * grainSize;
    // Alternate white/black noise
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.11)' : 'rgba(0, 0, 0, 0.09)';
    ctx.fillRect(gx, gy, size, size);
  }

  // 6. Draw Retro Orange LED Date Timestamp (Bottom Right)
  // Format: '26 07 16 (Year Month Day, styled like a 90s camera LED)
  const dateStr = getVintageTimestamp();
  
  ctx.save();
  // Vintage digital glow styling
  ctx.fillStyle = styleId === 'noir-mono' ? 'rgba(240, 240, 240, 0.85)' : 'rgba(249, 115, 22, 0.85)'; // Classic orange LED or white for black-and-white
  ctx.font = 'bold 36px "Courier New", Courier, monospace';
  ctx.textAlign = 'right';
  ctx.shadowColor = styleId === 'noir-mono' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(249, 115, 22, 0.6)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  
  // Draw near bottom right
  ctx.fillText(dateStr, targetWidth - 60, targetHeight - 50);
  ctx.restore();

  // Return the processed dataUrl
  return canvas.toDataURL('image/jpeg', 0.88);
}

/**
 * Returns a vintage styled date: "‘26 07 16"
 */
export function getVintageTimestamp(): string {
  const now = new Date();
  
  // Get year in 2-digit format, e.g. "26"
  const year = now.getFullYear().toString().slice(-2);
  
  // Month and Day padded with 0
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  
  return `’${year} ${month} ${day}`;
}

/**
 * Helper to generate a placeholder retro photo in case camera isn't accessible.
 * We draw a beautiful retro scenery onto canvas and process it.
 */
export async function generateRetroMockPhoto(styleId: string, sequenceNo: number): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas not supported');
  }
  
  canvas.width = 1200;
  canvas.height = 900;
  
  // Draw a lovely stylized abstract vector retro landscape!
  // Sun, hills, or ocean
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 600);
  skyGrad.addColorStop(0, '#1e293b'); // Dark blue
  skyGrad.addColorStop(0.4, '#475569'); // Slate
  skyGrad.addColorStop(0.7, '#f97316'); // Orange sunset
  skyGrad.addColorStop(1, '#fef08a'); // Yellow sun flare
  
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 1200, 900);
  
  // Sun
  ctx.fillStyle = '#f87171'; // Red/pink sun
  ctx.beginPath();
  ctx.arc(600, 520, 150, 0, Math.PI * 2);
  ctx.fill();
  
  // Mountains/Hills in layers
  ctx.fillStyle = '#0f172a'; // Deep hills
  ctx.beginPath();
  ctx.moveTo(0, 900);
  ctx.lineTo(0, 650);
  ctx.quadraticCurveTo(300, 580, 600, 680);
  ctx.quadraticCurveTo(900, 780, 1200, 620);
  ctx.lineTo(1200, 900);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = '#020617'; // Foreground dark hills
  ctx.beginPath();
  ctx.moveTo(0, 900);
  ctx.lineTo(0, 750);
  ctx.quadraticCurveTo(400, 720, 800, 800);
  ctx.quadraticCurveTo(1000, 820, 1200, 740);
  ctx.lineTo(1200, 900);
  ctx.closePath();
  ctx.fill();
  
  // A tiny little cabin or vintage car outline or palm tree
  // Let's draw a couple of birds in the sky
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(350, 300);
  ctx.quadraticCurveTo(370, 280, 390, 300);
  ctx.quadraticCurveTo(410, 280, 430, 300);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(850, 220);
  ctx.quadraticCurveTo(865, 205, 880, 220);
  ctx.quadraticCurveTo(895, 205, 910, 220);
  ctx.stroke();
  
  const mockImageSrc = canvas.toDataURL('image/jpeg');
  
  // Run it through the processFilmPhoto filter for the proper film style overlay, vignette, and grain!
  return await processFilmPhoto(mockImageSrc, styleId, sequenceNo);
}
