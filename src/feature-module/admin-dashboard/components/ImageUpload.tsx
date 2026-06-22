import React, { useState, useRef } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { app } from '../../../firebase';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  storageFolder?: string;
  inputTestId?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const DEFAULT_STORAGE_FOLDER = 'demo/site-settings';

const storage = getStorage(app);

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label = 'Image',
  storageFolder = DEFAULT_STORAGE_FOLDER,
  inputTestId,
}) => {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) return 'Only JPG, PNG, WebP, or GIF images are allowed.';
    if (file.size > MAX_FILE_SIZE) return 'File size must be less than 5MB.';
    return null;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    const storageRef = ref(storage, `${storageFolder}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setProgress(pct);
      },
      (err) => {
        setError(err.message);
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        onChange(url);
        setUploading(false);
        setProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    );
  };

  return (
    <div className="mb-3">
      <label className="form-label">{label}</label>
      <div className="d-flex gap-2 align-items-start">
        <div className="flex-grow-1">
          <input
            type="text"
            className="form-control mb-2"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Image URL or uploaded Storage path"
          />
          <input
            ref={fileInputRef}
            type="file"
            className="form-control form-control-sm"
            accept="image/*"
            data-testid={inputTestId}
            onChange={handleFileChange}
            disabled={uploading}
          />
          {uploading && (
            <div className="mt-2">
              <div className="progress" style={{ height: '6px' }}>
                <div className="progress-bar" role="progressbar" style={{ width: `${progress}%` }}>
                  {progress}%
                </div>
              </div>
            </div>
          )}
          {error && <div className="text-danger small mt-1">{error}</div>}
        </div>
        {value && (
          <div className="border rounded p-1" style={{ width: '80px', height: '80px' }}>
            <img
              src={value}
              alt="Preview"
              className="img-fluid rounded"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('banner-01.jpg')) {
                  target.src = 'assets/img/banner/banner-01.jpg';
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
