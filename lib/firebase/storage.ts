import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { storage } from '../../config/firebase';
import imageCompression from 'browser-image-compression';

// Upload a single file and return URL
const uploadFile = async (
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      reject,
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
};

// Upload image with both thumbnail and original
export const uploadImage = async (
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<{ thumbnailUrl: string; originalUrl: string }> => {
  // Create thumbnail (300px, low quality for fast loading)
  const thumbnail = await imageCompression(file, {
    maxSizeMB: 0.1,
    maxWidthOrHeight: 400,
    useWebWorker: true
  });

  // Create optimized original (1920px, good quality for viewing/download)
  const original = await imageCompression(file, {
    maxSizeMB: 2,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  });

  // Upload both
  const thumbnailPath = path.replace(/(\.[^.]+)$/, '_thumb$1');
  const [thumbnailUrl, originalUrl] = await Promise.all([
    uploadFile(thumbnail, thumbnailPath),
    uploadFile(original, path, onProgress)
  ]);

  return { thumbnailUrl, originalUrl };
};

// Legacy single URL upload (for backwards compatibility)
export const uploadImageSingle = async (
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const compressedFile = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  });

  return uploadFile(compressedFile, path, onProgress);
};

export const uploadMultipleImages = async (
  files: File[],
  basePath: string,
  onProgress?: (index: number, progress: number) => void
): Promise<{ thumbnailUrls: string[]; originalUrls: string[] }> => {
  const thumbnailUrls: string[] = [];
  const originalUrls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const timestamp = Date.now();
    const path = `${basePath}/${timestamp}_${i}_${file.name}`;

    const { thumbnailUrl, originalUrl } = await uploadImage(file, path, (progress) => {
      onProgress?.(i, progress);
    });

    thumbnailUrls.push(thumbnailUrl);
    originalUrls.push(originalUrl);
  }

  return { thumbnailUrls, originalUrls };
};

export const deleteImage = async (url: string): Promise<void> => {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};

export const deleteMultipleImages = async (urls: string[]): Promise<void> => {
  await Promise.all(urls.map(url => deleteImage(url)));
};
