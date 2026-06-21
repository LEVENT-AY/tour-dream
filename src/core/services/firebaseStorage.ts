import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  type StorageReference,
  type UploadMetadata,
} from "firebase/storage";
import { app } from "../../firebase";

const storage = getStorage(app);

export type ImageCategory =
  | "tours"
  | "hotels"
  | "flights"
  | "cars"
  | "activities"
  | "resorts"
  | "chalets"
  | "homepage"
  | "default";

const FALLBACK_ASSETS: Record<ImageCategory, string> = {
  tours: "assets/img/tours/tours-07.jpg",
  hotels: "assets/img/hotels/hotel-01.jpg",
  flights: "assets/img/flight/flight-large-01.jpg",
  cars: "assets/img/cars/car-06.jpg",
  activities: "assets/img/activities/activity-11.jpg",
  resorts: "assets/img/hotels/hotel-large-01.jpg",
  chalets: "assets/img/hotels/hotel-large-02.jpg",
  homepage: "assets/img/banner/banner-01.jpg",
  default: "assets/img/banner/banner-01.jpg",
};

/**
 * Returns a local fallback image path for a given catalog category.
 * Used by components to recover gracefully when a remote image fails to load.
 */
export const getCategoryFallbackSrc = (category?: ImageCategory): string => {
  return FALLBACK_ASSETS[category || "default"] || FALLBACK_ASSETS.default;
};

/**
 * Upload a file to Firebase Storage under a demo/<category>/<filename> path.
 * Returns the public download URL.
 */
export const uploadDemoImage = async (
  file: Blob | Uint8Array | ArrayBuffer,
  category: ImageCategory,
  fileName: string,
  metadata?: UploadMetadata
): Promise<string> => {
  const storageRef = ref(storage, `demo/${category}/${fileName}`);
  await uploadBytes(storageRef, file, metadata);
  return getDownloadURL(storageRef);
};

/**
 * Upload a generic listing image under listings/<listingId>/<filename>.
 */
export const uploadListingImage = async (
  file: Blob | Uint8Array | ArrayBuffer,
  listingId: string,
  fileName: string,
  metadata?: UploadMetadata
): Promise<string> => {
  const storageRef = ref(storage, `listings/${listingId}/${fileName}`);
  await uploadBytes(storageRef, file, metadata);
  return getDownloadURL(storageRef);
};

const PROFILE_IMAGE_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const PROFILE_IMAGE_MAX_SIZE = 5 * 1024 * 1024;

const generateProfileImageFileName = (file: File): string => {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const stamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${stamp}_${random}.${ext}`;
};

const validateProfileImage = (file: File): string | null => {
  if (!PROFILE_IMAGE_ALLOWED_TYPES.has(file.type)) {
    return "Only JPG, PNG, WEBP, and GIF images are allowed.";
  }
  if (file.size > PROFILE_IMAGE_MAX_SIZE) {
    return "Profile photos must be smaller than 5MB.";
  }
  return null;
};

export const uploadUserProfileImage = async (
  userId: string,
  file: File,
  metadata?: UploadMetadata
): Promise<{ url: string; path: string; fileName: string }> => {
  const validationError = validateProfileImage(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const fileName = generateProfileImageFileName(file);
  const path = `users/${userId}/profile/${fileName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, {
    contentType: file.type,
    ...metadata,
  });
  const url = await getDownloadURL(storageRef);
  return { url, path, fileName };
};

/**
 * Resolve a Firebase Storage reference for a known demo path.
 */
export const getDemoImageRef = (
  category: ImageCategory,
  fileName: string
): StorageReference => {
  return ref(storage, `demo/${category}/${fileName}`);
};

/**
 * Resolve a public download URL for a known demo path.
 */
export const getDemoImageUrl = async (
  category: ImageCategory,
  fileName: string
): Promise<string> => {
  return getDownloadURL(getDemoImageRef(category, fileName));
};

export { storage };
