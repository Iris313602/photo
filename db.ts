/**
 * IndexedDB Utility for Analog Film Camera Simulator.
 * Stores photos safely without exceeding the 5MB localStorage limit.
 */

export interface Photo {
  id?: number;
  rollId: string;
  sequenceNo: number; // 1 to 26
  originalDataUrl: string;
  processedDataUrl: string;
  shotAt: number;
}

export interface Roll {
  id: string; // unique ID
  name: string; // e.g. "Roll #1", "2026 Summer Roll"
  status: 'shooting' | 'full' | 'developing' | 'developed';
  totalCount: number; // strictly 26
  currentCount: number;
  filmStyle: string; // e.g. "classic-gold", "retro-warm", "noir-mono", "vibrant-chrome"
  createdAt: number;
  developedAt?: number;
}

const DB_NAME = 'AnalogFilmCameraDB';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // Store for film rolls
      if (!db.objectStoreNames.contains('rolls')) {
        db.createObjectStore('rolls', { keyPath: 'id' });
      }
      
      // Store for photos
      if (!db.objectStoreNames.contains('photos')) {
        const photoStore = db.createObjectStore('photos', { keyPath: 'id', autoIncrement: true });
        photoStore.createIndex('rollId', 'rollId', { unique: false });
      }
    };
  });
}

export async function saveRoll(roll: Roll): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('rolls', 'readwrite');
    const store = tx.objectStore('rolls');
    const request = store.put(roll);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getRoll(id: string): Promise<Roll | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('rolls', 'readonly');
    const store = tx.objectStore('rolls');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllRolls(): Promise<Roll[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('rolls', 'readonly');
    const store = tx.objectStore('rolls');
    const request = store.getAll();
    request.onsuccess = () => {
      const results = request.result as Roll[];
      // Sort by createdAt descending
      results.sort((a, b) => b.createdAt - a.createdAt);
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteRoll(id: string): Promise<void> {
  const db = await openDB();
  
  // First, delete all photos of this roll
  const photos = await getPhotosForRoll(id);
  const txPhotos = db.transaction('photos', 'readwrite');
  const photoStore = txPhotos.objectStore('photos');
  for (const photo of photos) {
    if (photo.id !== undefined) {
      photoStore.delete(photo.id);
    }
  }

  // Then delete the roll
  return new Promise((resolve, reject) => {
    const txRoll = db.transaction('rolls', 'readwrite');
    const rollStore = txRoll.objectStore('rolls');
    const request = rollStore.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function savePhoto(photo: Photo): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('photos', 'readwrite');
    const store = tx.objectStore('photos');
    const request = store.add(photo);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function getPhotosForRoll(rollId: string): Promise<Photo[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('photos', 'readonly');
    const store = tx.objectStore('photos');
    const index = store.index('rollId');
    const request = index.getAll(rollId);
    request.onsuccess = () => {
      const results = request.result as Photo[];
      // Sort by sequenceNo ascending
      results.sort((a, b) => a.sequenceNo - b.sequenceNo);
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Gets the active roll (status: shooting, full, developing) or creates one if none exists.
 */
export async function getActiveRollOrCreate(): Promise<{ roll: Roll; photos: Photo[] }> {
  const rolls = await getAllRolls();
  let activeRoll = rolls.find(r => r.status !== 'developed');
  
  if (!activeRoll) {
    const newRollId = `roll_${Date.now()}`;
    const rollCount = rolls.length + 1;
    activeRoll = {
      id: newRollId,
      name: `胶卷 #${rollCount}`,
      status: 'shooting',
      totalCount: 26,
      currentCount: 0,
      filmStyle: 'classic-gold',
      createdAt: Date.now()
    };
    await saveRoll(activeRoll);
    return { roll: activeRoll, photos: [] };
  }

  const photos = await getPhotosForRoll(activeRoll.id);
  return { roll: activeRoll, photos };
}
