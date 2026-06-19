import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { readFile } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { cwd } from 'node:process';

const firebaseConfig = {
  apiKey: 'AIzaSyA53UvUPYNbs5sBK7Y8dS1-GnidLbmXO3g',
  authDomain: 'tour-tunisi.firebaseapp.com',
  projectId: 'tour-tunisi',
  storageBucket: 'tour-tunisi.firebasestorage.app',
  messagingSenderId: '680331427957',
  appId: '1:680331427957:web:652d180694969fcf62f83c',
  measurementId: 'G-2EN7YMMTRK',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const ASSET_ROOT = join(cwd(), 'public');

const ADMIN_EMAIL = 'manager.emtilek@gmail.com';
const ADMIN_PASSWORD = 'ChangeMe123!';

const REPLACEMENT_POOLS = {
  tours: [
    'assets/img/tours/tours-07.jpg',
    'assets/img/tours/tours-08.jpg',
    'assets/img/tours/tours-09.jpg',
    'assets/img/tours/tours-10.jpg',
    'assets/img/tours/tours-11.jpg',
    'assets/img/tours/tours-12.jpg',
  ],
  hotels: [
    'assets/img/hotels/hotel-01.jpg',
    'assets/img/hotels/hotel-05.jpg',
    'assets/img/hotels/hotel-06.jpg',
    'assets/img/hotels/hotel-07.jpg',
    'assets/img/hotels/hotel-08.jpg',
    'assets/img/hotels/hotel-09.jpg',
    'assets/img/hotels/hotel-10.jpg',
    'assets/img/hotels/hotel-11.jpg',
    'assets/img/hotels/hotel-12.jpg',
  ],
  flights: [
    'assets/img/flight/flight-large-01.jpg',
    'assets/img/flight/flight-large-02.jpg',
    'assets/img/flight/flight-large-03.jpg',
    'assets/img/flight/flight-large-04.jpg',
    'assets/img/flight/flight-large-05.jpg',
    'assets/img/flight/flight-large-06.jpg',
    'assets/img/flight/flight-img-1.png',
    'assets/img/banner/flight-banner.jpg',
    'assets/img/bg/flight-bg.png',
  ],
  cars: [
    'assets/img/cars/car-06.jpg',
    'assets/img/cars/car-07.jpg',
    'assets/img/cars/car-08.jpg',
    'assets/img/cars/car-09.jpg',
    'assets/img/cars/car-10.jpg',
    'assets/img/cars/car-11.jpg',
    'assets/img/cars/car-12.jpg',
    'assets/img/cars/car-13.jpg',
    'assets/img/cars/car-14.jpg',
  ],
  activities: [
    'assets/img/activities/activity-11.jpg',
    'assets/img/activities/activity-12.jpg',
    'assets/img/activities/activity-13.jpg',
    'assets/img/activities/activity-14.jpg',
    'assets/img/activities/activity-15.jpg',
    'assets/img/activities/activity-16.jpg',
    'assets/img/tours/tours-37.jpg',
    'assets/img/tours/tours-38.jpg',
    'assets/img/tours/tours-50.jpg',
  ],
  homepage: ['assets/img/banner/banner-01.jpg'],
};

const uploadedUrlCache = new Map();
const uploadedCountByCategory = {};
const invalidUrlsRemoved = new Set();

const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
};

const getMimeType = (localPath) => {
  const ext = extname(localPath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
};

const isFirebaseStorageUrl = (url) =>
  typeof url === 'string' &&
  url.startsWith('https://') &&
  (url.includes('firebasestorage.googleapis.com') ||
    url.includes('.firebasestorage.app'));

const needsRepair = (url) => {
  if (typeof url !== 'string' || url.trim() === '') return true;
  if (isFirebaseStorageUrl(url)) return false;
  // Anything else (local paths, Windows paths, malformed URLs) should be repaired.
  return true;
};

const normalizeLocalPath = (url) => {
  if (!url) return null;
  let normalized = url.trim();
  if (normalized.startsWith('/')) normalized = normalized.slice(1);
  if (/^[a-zA-Z]:\\/.test(normalized)) {
    // Windows-style absolute path - not supported as an asset reference.
    return null;
  }
  return normalized;
};

const getReplacement = (category, seed) => {
  const pool = REPLACEMENT_POOLS[category] || REPLACEMENT_POOLS.homepage;
  const index = hashString(seed) % pool.length;
  return pool[index];
};

const ensureUploaded = async (localPath, category) => {
  if (!localPath) {
    throw new Error(`No local asset path provided for category ${category}`);
  }

  const fileName = basename(localPath);
  const storagePath = `demo/${category}/${fileName}`;

  if (uploadedUrlCache.has(storagePath)) {
    return uploadedUrlCache.get(storagePath);
  }

  try {
    const existingUrl = await getDownloadURL(ref(storage, storagePath));
    uploadedUrlCache.set(storagePath, existingUrl);
    return existingUrl;
  } catch (err) {
    if (err.code !== 'storage/object-not-found') {
      throw err;
    }
  }

  const absolutePath = join(ASSET_ROOT, localPath);
  const fileBuffer = await readFile(absolutePath);
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, fileBuffer, {
    contentType: getMimeType(localPath),
  });
  const downloadUrl = await getDownloadURL(storageRef);

  uploadedUrlCache.set(storagePath, downloadUrl);
  uploadedCountByCategory[category] = (uploadedCountByCategory[category] || 0) + 1;

  return downloadUrl;
};

const repairUrl = async (url, category, seed) => {
  if (!needsRepair(url)) return url;

  invalidUrlsRemoved.add(url);

  const replacementLocal = normalizeLocalPath(getReplacement(category, seed));
  if (!replacementLocal) {
    throw new Error(`Could not resolve replacement asset for ${category}/${seed}`);
  }

  return ensureUploaded(replacementLocal, category);
};

const repairCollection = async (collectionName) => {
  const snapshot = await getDocs(collection(db, collectionName));
  let repaired = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const updates = {};

    if (needsRepair(data.image)) {
      updates.image = await repairUrl(data.image, collectionName, docSnap.id);
    }

    if (Array.isArray(data.gallery)) {
      const newGallery = [];
      let galleryChanged = false;

      for (let i = 0; i < data.gallery.length; i++) {
        const repairedUrl = await repairUrl(
          data.gallery[i],
          collectionName,
          `${docSnap.id}-gallery-${i}`
        );
        newGallery.push(repairedUrl);
        if (repairedUrl !== data.gallery[i]) galleryChanged = true;
      }

      if (galleryChanged) {
        updates.gallery = newGallery;
      }
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = serverTimestamp();
      await updateDoc(doc(db, collectionName, docSnap.id), updates);
      repaired++;
    }
  }

  return repaired;
};

const repairHomepage = async () => {
  const homepageRef = doc(db, 'siteSettings', 'homepage');
  const homepageSnap = await getDocs(collection(db, 'siteSettings'));
  const homepageDoc = homepageSnap.docs.find((d) => d.id === 'homepage');

  if (!homepageDoc) {
    console.log('  No homepage settings document found.');
    return 0;
  }

  const data = homepageDoc.data();
  if (!needsRepair(data.heroImage)) {
    return 0;
  }

  const newHeroImage = await repairUrl(data.heroImage, 'homepage', 'hero');
  await updateDoc(homepageRef, {
    heroImage: newHeroImage,
    updatedAt: serverTimestamp(),
  });

  return 1;
};

const main = async () => {
  const email = process.argv[2] || ADMIN_EMAIL;
  const password = process.argv[3] || ADMIN_PASSWORD;

  console.log('Signing in as admin...');
  await signInWithEmailAndPassword(auth, email, password);
  console.log('Signed in successfully.\n');

  const results = {
    tours: await repairCollection('tours'),
    hotels: await repairCollection('hotels'),
    flights: await repairCollection('flights'),
    cars: await repairCollection('cars'),
    activities: await repairCollection('activities'),
    homepage: await repairHomepage(),
  };

  console.log('\n=== Repair Summary ===');
  console.log(`  Tours repaired:      ${results.tours}`);
  console.log(`  Hotels repaired:     ${results.hotels}`);
  console.log(`  Flights repaired:    ${results.flights}`);
  console.log(`  Cars repaired:       ${results.cars}`);
  console.log(`  Activities repaired: ${results.activities}`);
  console.log(`  Homepage repaired:   ${results.homepage}`);

  console.log('\n=== Images Uploaded by Storage Category ===');
  for (const category of Object.keys(REPLACEMENT_POOLS)) {
    console.log(
      `  demo/${category}/: ${uploadedCountByCategory[category] || 0} new upload(s)`
    );
  }

  if (invalidUrlsRemoved.size > 0) {
    console.log(`\n=== Invalid/Placeholder URLs Replaced (${invalidUrlsRemoved.size}) ===`);
    for (const url of invalidUrlsRemoved) {
      console.log(`  - ${url || '(empty)'}`);
    }
  }

  process.exit(0);
};

main().catch((err) => {
  console.error('\nRepair failed:', err.message || err);
  process.exit(1);
});
