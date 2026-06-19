import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type UploadMetadata,
} from "firebase/storage";
import { app } from "../../firebase";

const storage = getStorage(app);

export type AgentStorageCategory =
  | "tours"
  | "hotels"
  | "flights"
  | "cars"
  | "activities"
  | "resorts"
  | "chalets";

export interface AgentUploadOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
  metadata?: UploadMetadata;
}

export interface AgentUploadResult {
  url: string;
  path: string;
  fileName: string;
}

export interface AgentUploadProgress {
  progress: number;
  uploading: boolean;
  error: string | null;
  preview: string | null;
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const validateAgentImage = (
  file: File,
  options: AgentUploadOptions = {}
): string | null => {
  const maxSize = options.maxSizeBytes ?? DEFAULT_MAX_SIZE;
  const allowedTypes = options.allowedTypes ?? DEFAULT_ALLOWED_TYPES;
  if (!allowedTypes.includes(file.type)) {
    return `Only ${allowedTypes.map((t) => t.replace("image/", "").toUpperCase()).join(", ")} images are allowed.`;
  }
  if (file.size > maxSize) {
    return `File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB.`;
  }
  return null;
};

export const generateSafeFileName = (file: File): string => {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}_${random}.${ext}`;
};

export const buildAgentImagePath = (
  agentId: string,
  category: AgentStorageCategory,
  listingId: string,
  fileName: string
): string => {
  return `agents/${agentId}/listings/${category}/${listingId}/${fileName}`;
};

export const buildAgentProfileImagePath = (agentId: string): string => {
  return `agents/${agentId}/profile/profile-image`;
};

export const uploadAgentImage = async (
  agentId: string,
  category: AgentStorageCategory,
  listingId: string,
  file: File,
  options: AgentUploadOptions = {}
): Promise<AgentUploadResult> => {
  const validationError = validateAgentImage(file, options);
  if (validationError) throw new Error(validationError);

  const fileName = generateSafeFileName(file);
  const path = buildAgentImagePath(agentId, category, listingId, fileName);
  const storageRef = ref(storage, path);

  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
    ...options.metadata,
  });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      () => {},
      (err) => reject(err),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({ url, path, fileName });
      }
    );
  });
};

export const uploadAgentImageWithProgress = (
  agentId: string,
  category: AgentStorageCategory,
  listingId: string,
  file: File,
  onStateChange: (state: AgentUploadProgress) => void,
  options: AgentUploadOptions = {}
): { cancel: () => void; promise: Promise<AgentUploadResult> } => {
  const validationError = validateAgentImage(file, options);
  if (validationError) {
    onStateChange({ progress: 0, uploading: false, error: validationError, preview: null });
    return {
      cancel: () => {},
      promise: Promise.reject(new Error(validationError)),
    };
  }

  const previewUrl = URL.createObjectURL(file);
  onStateChange({ progress: 0, uploading: true, error: null, preview: previewUrl });

  const fileName = generateSafeFileName(file);
  const path = buildAgentImagePath(agentId, category, listingId, fileName);
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
    ...options.metadata,
  });

  const promise = new Promise<AgentUploadResult>((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        onStateChange({ progress, uploading: true, error: null, preview: previewUrl });
      },
      (err) => {
        URL.revokeObjectURL(previewUrl);
        onStateChange({ progress: 0, uploading: false, error: err.message, preview: null });
        reject(err);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        URL.revokeObjectURL(previewUrl);
        onStateChange({ progress: 100, uploading: false, error: null, preview: null });
        resolve({ url, path, fileName });
      }
    );
  });

  return {
    cancel: () => uploadTask.cancel(),
    promise,
  };
};

export const deleteAgentImage = async (path: string): Promise<void> => {
  if (!path) return;
  try {
    const imageRef = ref(storage, path);
    await deleteObject(imageRef);
  } catch (err) {
    console.warn("Failed to delete agent image:", path, err);
  }
};

export const extractStoragePathFromUrl = (url: string): string | null => {
  try {
    const decoded = decodeURIComponent(url);
    const match = decoded.match(/\/o\/(.*?)\?alt=media/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

export const cleanupReplacedAgentImage = async (
  previousUrl: string | null | undefined,
  currentAgentId: string
): Promise<void> => {
  if (!previousUrl) return;
  const path = extractStoragePathFromUrl(previousUrl);
  if (!path) return;
  if (path.startsWith(`agents/${currentAgentId}/`)) {
    await deleteAgentImage(path);
  }
};

export const uploadAgentProfileImage = async (
  agentId: string,
  file: File,
  options: AgentUploadOptions = {}
): Promise<AgentUploadResult> => {
  const validationError = validateAgentImage(file, options);
  if (validationError) throw new Error(validationError);

  const path = buildAgentProfileImagePath(agentId);
  const storageRef = ref(storage, path);

  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
    ...options.metadata,
  });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      () => {},
      (err) => reject(err),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({ url, path, fileName: 'profile-image' });
      }
    );
  });
};

export { storage };
