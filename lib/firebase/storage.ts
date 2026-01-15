import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { storage } from '../../config/firebase';
import imageCompression from 'browser-image-compression';

export const uploadImage = async (
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const compressedFile = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  });

  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, compressedFile);

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

export const uploadMultipleImages = async (
  files: File[],
  basePath: string,
  onProgress?: (index: number, progress: number) => void
): Promise<string[]> => {
  const urls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const timestamp = Date.now();
    const path = `${basePath}/${timestamp}_${i}_${file.name}`;

    const url = await uploadImage(file, path, (progress) => {
      onProgress?.(i, progress);
    });

    urls.push(url);
  }

  return urls;
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
