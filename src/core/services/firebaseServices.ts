import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  deleteUser,
  onAuthStateChanged,
  type User
} from "firebase/auth";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  query, 
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  type DocumentData
} from "firebase/firestore";
import { auth, db } from "../../firebase";

export type UserRole = "customer" | "agent" | "admin";

// USER AUTHENTICATION & PROFILE

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

const VALID_USER_ROLES: UserRole[] = ["customer", "agent", "admin"];

const createProfileError = (code: string, message: string) => {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  return error;
};

/**
 * Public registration. Always creates a customer role.
 * Admin/agent promotion must be done via a trusted server-side process.
 */
export const signUpUser = async (email: string, password: string, displayName: string): Promise<UserProfile> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  try {
    await updateProfile(user, { displayName });
    
    const userProfile: UserProfile = {
      uid: user.uid,
      email: email,
      displayName: displayName,
      role: "customer",
      createdAt: new Date().toISOString()
    };
    
    // Store user details in Firestore
    await setDoc(doc(db, "users", user.uid), userProfile);
    
    return userProfile;
  } catch (error) {
    // If anything after Auth creation fails, clean up the orphaned Auth account
    try {
      await deleteUser(user);
    } catch (deleteError) {
      console.error("Failed to clean up orphaned Auth user:", deleteError);
    }
    throw error;
  }
};

export const signInUser = async (email: string, password: string): Promise<UserProfile> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Get role from Firestore
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists()) {
    await signOut(auth);
    throw createProfileError(
      "auth/profile-not-found",
      "We found your sign-in account, but your user profile is missing. Please contact support."
    );
  }

  const profile = userDoc.data() as Partial<UserProfile>;
  if (!profile.role || !VALID_USER_ROLES.includes(profile.role as UserRole)) {
    await signOut(auth);
    throw createProfileError(
      "auth/role-missing",
      "Your account profile is missing a valid role. Please contact support."
    );
  }

  return {
    uid: user.uid,
    email: profile.email || user.email || "",
    displayName: profile.displayName || user.displayName || "",
    role: profile.role,
    createdAt: profile.createdAt || new Date().toISOString(),
  };
};

export const signOutUser = async (): Promise<void> => {
  await signOut(auth);
};

export const subscribeToAuthChanges = (callback: (userProfile: UserProfile | null) => void) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await signOut(auth);
        callback(null);
        return;
      }

      const profile = userDoc.data() as Partial<UserProfile>;
      if (!profile.role || !VALID_USER_ROLES.includes(profile.role as UserRole)) {
        await signOut(auth);
        callback(null);
        return;
      }

      callback({
        uid: user.uid,
        email: profile.email || user.email || "",
        displayName: profile.displayName || user.displayName || "",
        role: profile.role,
        createdAt: profile.createdAt || new Date().toISOString(),
      });
    } else {
      callback(null);
    }
  });
};


// CATALOG ITEMS (TOURS, HOTELS, CARS, FLIGHTS)

export const fetchCollectionItems = async (collectionName: string): Promise<DocumentData[]> => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  const items: DocumentData[] = [];
  querySnapshot.forEach((doc) => {
    items.push({ id: doc.id, ...doc.data() });
  });
  return items;
};

export const fetchTours = async (): Promise<DocumentData[]> => {
  const q = query(collection(db, "tours"), where("published", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as DocumentData) }))
    .filter((tour) => (tour as DocumentData).published === true);
};
export const fetchHotels = async (): Promise<DocumentData[]> => {
  const snapshot = await getDocs(query(collection(db, "hotels"), where("published", "==", true)));
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as DocumentData) }))
    .filter((hotel) => {
      const approvalStatus = String((hotel as DocumentData).approvalStatus || (hotel as DocumentData).status || 'approved').toLowerCase();
      return (hotel as DocumentData).published === true && approvalStatus !== 'rejected' && approvalStatus !== 'suspended';
    })
    .map((hotel) => {
      const data = hotel as DocumentData;
      return {
      ...hotel,
      title: data.title || data.name || '',
      name: data.name || data.title || '',
      listingCategory: data.listingCategory || 'lodging',
      propertyType: data.propertyType || 'hotel',
      image: data.image || (Array.isArray(data.gallery) ? data.gallery[0] : ''),
      price: data.price ?? data.pricePerNight ?? 0,
      rating: data.rating ?? data.starRating ?? 0,
      location: data.location || data.city || data.country || '',
    };
    });
};
export const fetchCars = async (): Promise<DocumentData[]> => {
  const q = query(collection(db, "cars"), where("published", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as DocumentData) }))
    .filter((car) => (car as DocumentData).published === true)
    .map((car) => {
      const data = car as DocumentData;
      return {
        ...car,
        title: data.title || data.name || '',
        brand: data.brand || data.make || '',
        model: data.model || '',
        type: data.type || data.vehicleType || data.body || '',
        transmission: data.transmission || data.gear || '',
        seats: data.seats ?? data.access ?? 0,
        doors: data.doors ?? 0,
        fuelType: data.fuelType || data.fuel || '',
        price: data.price ?? 0,
        rating: data.rating ?? 0,
        reviewsCount: data.reviewsCount ?? 0,
        image: data.image || (Array.isArray(data.gallery) ? data.gallery[0] : ''),
        location: data.location || data.city || data.country || '',
        fuel: data.fuel || data.fuelType || '',
        gear: data.gear || data.transmission || '',
        travelled: data.travelled || data.mileage || '',
      };
    });
};
export const fetchFlights = async (): Promise<DocumentData[]> => {
  const q = query(collection(db, "flights"), where("published", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as DocumentData) }))
    .filter((flight) => (flight as DocumentData).published === true)
    .map((flight) => {
      const data = flight as DocumentData;
      return {
        ...flight,
        title: data.title || data.flightName || data.name || '',
        airline: data.airline || data.airlineName || '',
        departureCity: data.departureCity || data.city || data.address || '',
        arrivalCity: data.arrivalCity || data.country || '',
        stopInfo: data.stopInfo || data.flightNumber || data.make || '',
        dates: data.dates || [data.departureDate, data.arrivalDate].filter(Boolean).join(' - '),
        price: data.price ?? 0,
        seatsLeft: data.seatsLeft ?? data.staffs ?? 0,
        rating: data.rating ?? 0,
        reviewsCount: data.reviewsCount ?? 0,
        image: data.image || (Array.isArray(data.gallery) ? data.gallery[0] : ''),
        location: data.location || data.city || data.country || '',
      };
    });
};
export const fetchFlightById = async (flightId: string): Promise<DocumentData | null> =>
  getCatalogItem("flights", flightId);
export const fetchActivities = async (): Promise<DocumentData[]> => {
  const q = query(collection(db, "activities"), where("published", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as DocumentData) }))
    .filter((activity) => (activity as DocumentData).published === true)
    .map((activity) => {
      const data = activity as DocumentData;
      return {
        ...activity,
        title: data.title || data.name || '',
        category: data.category || '',
        location: data.location || data.city || data.country || '',
        price: data.price ?? 0,
        duration: data.duration || '',
        rating: data.rating ?? 0,
        reviewsCount: data.reviewsCount ?? 0,
        image: data.image || (Array.isArray(data.gallery) ? data.gallery[0] : ''),
        gallery: Array.isArray(data.gallery) ? data.gallery : [],
        description: data.description || '',
      };
    });
};

export const fetchCruises = async (): Promise<DocumentData[]> => {
  const q = query(collection(db, "cruises"), where("published", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as DocumentData) }))
    .filter((cruise) => (cruise as DocumentData).published === true)
    .map((cruise) => {
      const data = cruise as DocumentData;
      return {
        ...cruise,
        title: data.title || data.name || '',
        category: data.category || '',
        location: data.location || data.city || data.country || '',
        price: data.price ?? 0,
        duration: data.duration || '',
        rating: data.rating ?? 0,
        reviewsCount: data.reviewsCount ?? 0,
        image: data.image || (Array.isArray(data.gallery) ? data.gallery[0] : ''),
        gallery: Array.isArray(data.gallery) ? data.gallery : [],
        description: data.description || '',
      };
    });
};

export const fetchCruiseById = async (cruiseId: string): Promise<DocumentData | null> =>
  getCatalogItem("cruises", cruiseId);

export const fetchBuses = async (): Promise<DocumentData[]> => {
  const q = query(collection(db, "buses"), where("published", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as DocumentData) }))
    .filter((bus) => {
      const data = bus as DocumentData;
      const approvalStatus = String(data.approvalStatus || data.status || 'approved').toLowerCase();
      return data.published === true && approvalStatus !== 'rejected' && approvalStatus !== 'suspended';
    })
    .map((bus) => {
      const data = bus as DocumentData;
      return {
        ...bus,
        title: data.title || data.name || '',
        name: data.name || data.title || '',
        category: data.category || 'bus',
        location: data.location || `${data.departureCity || ''} - ${data.arrivalCity || ''}`.replace(/^ - | - $/g, ''),
        departureCity: data.departureCity || '',
        arrivalCity: data.arrivalCity || '',
        departureDate: data.departureDate || '',
        departureTime: data.departureTime || '',
        arrivalDate: data.arrivalDate || '',
        arrivalTime: data.arrivalTime || '',
        seats: data.seats ?? data.capacity ?? 0,
        capacity: data.capacity ?? data.seats ?? 0,
        price: data.price ?? 0,
        rating: data.rating ?? 0,
        reviewsCount: data.reviewsCount ?? 0,
        image: data.image || (Array.isArray(data.gallery) ? data.gallery[0] : ''),
        gallery: Array.isArray(data.gallery) ? data.gallery : [],
        description: data.description || '',
      };
    });
};

export const fetchBusById = async (busId: string): Promise<DocumentData | null> =>
  getCatalogItem("buses", busId);

export const fetchChalets = async (): Promise<DocumentData[]> => {
  const q = query(collection(db, 'chalets'), where('published', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as DocumentData) }))
    .filter((chalet) => {
      const data = chalet as DocumentData;
      const approvalStatus = String(data.approvalStatus || data.status || 'approved').toLowerCase();
      return data.published === true && approvalStatus !== 'rejected' && approvalStatus !== 'suspended';
    })
    .map((chalet) => {
      const data = chalet as DocumentData;
      return {
        ...chalet,
        title: data.title || data.name || '',
        name: data.name || data.title || '',
        listingCategory: data.listingCategory || 'lodging',
        propertyType: data.propertyType || 'chalet',
        location: data.location || data.city || data.country || '',
        price: data.price ?? data.pricePerNight ?? 0,
        rating: data.rating ?? 0,
        reviewsCount: data.reviewsCount ?? 0,
        image: data.mainImage || data.image || (Array.isArray(data.gallery) ? data.gallery[0] : ''),
        gallery: Array.isArray(data.gallery) ? data.gallery : [],
        description: data.description || '',
        amenities: Array.isArray(data.amenities) ? data.amenities : typeof data.amenities === 'string' && data.amenities ? [data.amenities] : [],
        availability: data.availability,
        capacity: data.capacity ?? 0,
        bedrooms: data.bedrooms ?? 0,
        bathrooms: data.bathrooms ?? 0,
      };
    });
};

export const fetchResorts = async (): Promise<DocumentData[]> => {
  const q = query(collection(db, "resorts"), where("published", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as DocumentData) }))
    .filter((resort) => (resort as DocumentData).published === true)
    .filter((resort) => {
      const data = resort as DocumentData;
      const approvalStatus = String(data.approvalStatus || data.status || 'approved').toLowerCase();
      return approvalStatus !== 'rejected' && approvalStatus !== 'suspended';
    })
    .map((resort) => {
      const data = resort as DocumentData;
      return {
        ...resort,
        title: data.title || data.name || '',
        name: data.name || data.title || '',
        listingCategory: data.listingCategory || 'lodging',
        propertyType: data.propertyType || 'resort',
        location: data.location || data.city || data.country || '',
        price: data.price ?? data.startingPrice ?? 0,
        rating: data.rating ?? 0,
        reviewsCount: data.reviewsCount ?? 0,
        image: data.mainImage || data.image || (Array.isArray(data.gallery) ? data.gallery[0] : ''),
        gallery: Array.isArray(data.gallery) ? data.gallery : [],
        description: data.description || '',
        amenities: Array.isArray(data.amenities) ? data.amenities : typeof data.amenities === 'string' && data.amenities ? [data.amenities] : [],
        availability: data.availability,
        lat: data.lat ?? data.latitude ?? null,
        lng: data.lng ?? data.longitude ?? null,
        published: data.published === true,
        featured: data.featured === true,
        approvalStatus: data.approvalStatus || data.status || '',
      };
    });
};

export const addCatalogItem = async (collectionName: string, itemData: any): Promise<string> => {
  const docRef = await addDoc(collection(db, collectionName), {
    ...itemData,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const addTour = (tourData: any) => addCatalogItem("tours", tourData);
export const addHotel = (hotelData: any) => addCatalogItem("hotels", hotelData);
export const addCar = (carData: any) => addCatalogItem("cars", carData);
export const addFlight = (flightData: any) => addCatalogItem("flights", flightData);

export const getCatalogItem = async (collectionName: string, itemId: string): Promise<DocumentData | null> => {
  const docSnap = await getDoc(doc(db, collectionName, itemId));
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const fetchHotelById = async (hotelId: string): Promise<DocumentData | null> =>
  getCatalogItem('hotels', hotelId);

export const fetchTourById = async (tourId: string): Promise<DocumentData | null> =>
  getCatalogItem('tours', tourId);

export const fetchActivityById = async (activityId: string): Promise<DocumentData | null> =>
  getCatalogItem('activities', activityId);

export const fetchCarById = async (carId: string): Promise<DocumentData | null> =>
  getCatalogItem('cars', carId);

export const fetchChaletById = async (chaletId: string): Promise<DocumentData | null> =>
  getCatalogItem('chalets', chaletId);

export const fetchResortById = async (resortId: string): Promise<DocumentData | null> =>
  getCatalogItem('resorts', resortId);

export const updateCatalogItem = async (collectionName: string, itemId: string, itemData: any): Promise<void> => {
  await setDoc(doc(db, collectionName, itemId), {
    ...itemData,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const updateResortModeration = async (
  itemId: string,
  action: "approve" | "reject" | "unpublish",
  rejectionReason?: string
): Promise<void> => {
  const payload: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (action === "approve") {
    payload.approvalStatus = "approved";
    payload.status = "approved";
    payload.published = true;
    payload.rejectionReason = "";
    payload.rejectedReason = "";
  } else if (action === "reject") {
    payload.approvalStatus = "rejected";
    payload.status = "rejected";
    payload.published = false;
    payload.rejectionReason = rejectionReason || "";
    payload.rejectedReason = rejectionReason || "";
  } else if (action === "unpublish") {
    payload.published = false;
  }

  await updateDoc(doc(db, "resorts", itemId), payload);
};

export const updateChaletModeration = async (
  itemId: string,
  action: "approve" | "reject" | "unpublish",
  rejectionReason?: string
): Promise<void> => {
  const payload: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (action === "approve") {
    payload.approvalStatus = "approved";
    payload.status = "approved";
    payload.published = true;
    payload.rejectionReason = "";
    payload.rejectedReason = "";
  } else if (action === "reject") {
    payload.approvalStatus = "rejected";
    payload.status = "rejected";
    payload.published = false;
    payload.rejectionReason = rejectionReason || "";
    payload.rejectedReason = rejectionReason || "";
  } else if (action === "unpublish") {
    payload.published = false;
  }

  await updateDoc(doc(db, "chalets", itemId), payload);
};

export const deleteCatalogItem = async (collectionName: string, itemId: string): Promise<void> => {
  await deleteDoc(doc(db, collectionName, itemId));
};

export interface HomepageSettings {
  siteName?: string;
  logo?: string;
  favicon?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  ctaLabel: string;
  ctaLink: string;
  banners?: { image: string; link: string; title?: string }[];
  headerNavigation?: HeaderNavigationItem[];
  headerVariantOverrides?: Partial<Record<string, HomeHeaderVariantChoice>>;
  publicTemplates?: Partial<Record<PublicTemplateCategory, string>>;
  sections: {
    featuredTours: boolean;
    featuredHotels: boolean;
    featuredFlights: boolean;
    featuredCars: boolean;
    featuredActivities: boolean;
  };
  sectionTitles: {
    featuredTours: string;
    featuredHotels: string;
    featuredFlights: string;
    featuredCars: string;
    featuredActivities: string;
  };
  featuredTours: string[];
  featuredHotels: string[];
  featuredFlights: string[];
  featuredCars: string[];
  featuredActivities: string[];
  navLinks?: { label: string; path: string }[];
  footerLinks?: { label: string; path: string }[];
  footerText?: string;
  socialLinks?: Record<string, string>;
}

export type PublicTemplateCategory =
  | "home"
  | "hotel"
  | "tour"
  | "car"
  | "activity"
  | "flight"
  | "resort"
  | "chalet"
  | "bus"
  | "cruise"
  | "guide"
  | "visa";

export type HomeTemplateCategory = "general" | "specialized" | "service-specific" | "preview";

export type HomeTemplateGroup = "recommended" | "other" | "shell-specific";

export type HomeTemplateShellMode = {
  header: "shared" | "local";
  footer: "shared" | "local" | "none";
};

export type HomeHeaderVariantChoice =
  | "template-default"
  | "shared-default"
  | "shared-compact-2"
  | "shared-four-family"
  | "shared-three"
  | "shared-five"
  | "shared-seven"
  | "shared-eleven";

export type HomeHeaderVariantVisualKey = HomeHeaderVariantChoice | "local-ten" | "local-twelve";

export type HomeHeaderVariantScope = "shared" | "local";

export type HomeHeaderVariantMenuStatus = "Global Menu" | "Template Default Menu" | "Custom Menu Copy not configured";

export type HomeHeaderVariantSafety = "Safe" | "Needs resolver" | "Template-only";

export type HomeHeaderVariantDefinition = {
  key: HomeHeaderVariantVisualKey;
  label: string;
  route: string;
  scope: HomeHeaderVariantScope;
  menuStatus: HomeHeaderVariantMenuStatus;
  safety: HomeHeaderVariantSafety;
  templateOnly: boolean;
};

export const HOME_HEADER_VARIANT_DEFINITIONS: HomeHeaderVariantDefinition[] = [
  {
    key: "template-default",
    label: "Template default",
    route: "",
    scope: "shared",
    menuStatus: "Global Menu",
    safety: "Safe",
    templateOnly: false,
  },
  {
    key: "shared-default",
    label: "Shared Default",
    route: "/",
    scope: "shared",
    menuStatus: "Global Menu",
    safety: "Safe",
    templateOnly: false,
  },
  {
    key: "shared-compact-2",
    label: "Compact 2",
    route: "/index-2",
    scope: "shared",
    menuStatus: "Global Menu",
    safety: "Needs resolver",
    templateOnly: false,
  },
  {
    key: "shared-four-family",
    label: "Four Family",
    route: "/index-4",
    scope: "shared",
    menuStatus: "Global Menu",
    safety: "Needs resolver",
    templateOnly: false,
  },
  {
    key: "shared-three",
    label: "Three",
    route: "/index-5",
    scope: "shared",
    menuStatus: "Global Menu",
    safety: "Needs resolver",
    templateOnly: false,
  },
  {
    key: "shared-five",
    label: "Five",
    route: "/index-7",
    scope: "shared",
    menuStatus: "Global Menu",
    safety: "Needs resolver",
    templateOnly: false,
  },
  {
    key: "shared-seven",
    label: "Seven",
    route: "/index-9",
    scope: "shared",
    menuStatus: "Global Menu",
    safety: "Needs resolver",
    templateOnly: false,
  },
  {
    key: "shared-eleven",
    label: "Eleven",
    route: "/index-11",
    scope: "shared",
    menuStatus: "Global Menu",
    safety: "Needs resolver",
    templateOnly: false,
  },
  {
    key: "local-ten",
    label: "Local Ten",
    route: "/index-10",
    scope: "local",
    menuStatus: "Template Default Menu",
    safety: "Template-only",
    templateOnly: true,
  },
  {
    key: "local-twelve",
    label: "Local Twelve",
    route: "/index-12",
    scope: "local",
    menuStatus: "Template Default Menu",
    safety: "Template-only",
    templateOnly: true,
  },
];

const HOME_HEADER_VARIANT_VISUAL_LOOKUP = new Map(
  HOME_HEADER_VARIANT_DEFINITIONS.map((definition) => [definition.key, definition]),
);

const HOME_HEADER_VARIANT_ALLOWED_OVERRIDE_KEYS = new Set<HomeHeaderVariantChoice>([
  "template-default",
  "shared-default",
  "shared-compact-2",
  "shared-four-family",
  "shared-three",
  "shared-five",
  "shared-seven",
  "shared-eleven",
]);

const HOME_HEADER_VARIANT_DEFAULT_VISUAL_BY_ROUTE: Record<string, HomeHeaderVariantVisualKey> = {
  "/": "shared-default",
  "/index": "shared-default",
  "/index-2": "shared-compact-2",
  "/index-3": "shared-default",
  "/index-4": "shared-four-family",
  "/index-5": "shared-three",
  "/index-6": "shared-four-family",
  "/index-7": "shared-five",
  "/index-8": "shared-four-family",
  "/index-9": "shared-seven",
  "/index-10": "local-ten",
  "/index-11": "shared-eleven",
  "/index-12": "local-twelve",
};

export const getHomeHeaderVariantDefaultChoice = (_templateRoute?: string | null): HomeHeaderVariantChoice => "template-default";

export const normalizeHomeHeaderVariantChoice = (
  templateRoute: string,
  value?: string | null,
): HomeHeaderVariantChoice => {
  const normalizedValue = (value || "").trim() as HomeHeaderVariantChoice;
  if (!normalizedValue) return "template-default";
  if (!isHomeHeaderVariantSelectable(templateRoute)) return "template-default";
  if (!HOME_HEADER_VARIANT_ALLOWED_OVERRIDE_KEYS.has(normalizedValue)) return "template-default";

  return normalizedValue;
};

export const resolveHomeHeaderVariantChoice = (
  templateRoute?: string | null,
  overrides?: Partial<Record<string, string>> | null,
): HomeHeaderVariantChoice => {
  const route = (templateRoute || "").trim();
  const override = overrides?.[route];
  return normalizeHomeHeaderVariantChoice(route, override);
};

export const resolveHomeHeaderVariantVisualKey = (
  templateRoute?: string | null,
  overrides?: Partial<Record<string, string>> | null,
): HomeHeaderVariantVisualKey => {
  const route = (templateRoute || "").trim();
  const choice = resolveHomeHeaderVariantChoice(route, overrides);
  if (choice !== "template-default") {
    return choice;
  }

  return HOME_HEADER_VARIANT_DEFAULT_VISUAL_BY_ROUTE[route] || "shared-default";
};

export const resolveHomeHeaderVariantRoute = (
  templateRoute?: string | null,
  overrides?: Partial<Record<string, string>> | null,
): string => {
  const visualKey = resolveHomeHeaderVariantVisualKey(templateRoute, overrides);
  return HOME_HEADER_VARIANT_VISUAL_LOOKUP.get(visualKey)?.route || (templateRoute || "").trim() || "/";
};

export const getHomeHeaderVariantDefinition = (
  templateRoute?: string | null,
  overrides?: Partial<Record<string, string>> | null,
): HomeHeaderVariantDefinition => {
  const visualKey = resolveHomeHeaderVariantVisualKey(templateRoute, overrides);
  return HOME_HEADER_VARIANT_VISUAL_LOOKUP.get(visualKey) || HOME_HEADER_VARIANT_VISUAL_LOOKUP.get("shared-default")!;
};

export const getHomeHeaderVariantMenuStatus = (
  templateRoute?: string | null,
  overrides?: Partial<Record<string, string>> | null,
): HomeHeaderVariantMenuStatus => {
  return getHomeHeaderVariantDefinition(templateRoute, overrides).menuStatus;
};

export const isHomeHeaderVariantSelectable = (templateRoute?: string | null): boolean =>
  HOME_HEADER_VARIANT_DEFAULT_VISUAL_BY_ROUTE[(templateRoute || "").trim()]?.startsWith("local") !== true;

export type HomeTemplateInventoryItem = {
  key: string;
  label: string;
  route: string;
  component: string;
  category: HomeTemplateCategory;
  group: HomeTemplateGroup;
  shell: HomeTemplateShellMode;
  description: string;
  safeForCanonicalHome: boolean;
};

export const HOME_TEMPLATE_INVENTORY: HomeTemplateInventoryItem[] = [
  {
    key: "home-service-one",
    label: "All Services 1",
    route: "/",
    component: "HomeServiceOne",
    category: "general",
    group: "recommended",
    shell: { header: "shared", footer: "shared" },
    description: "Original canonical home with the full all-services travel shell.",
    safeForCanonicalHome: true,
  },
  {
    key: "home-service-two",
    label: "All Services 2",
    route: "/index-2",
    component: "HomeServiceTwo",
    category: "general",
    group: "recommended",
    shell: { header: "shared", footer: "local" },
    description: "Alternative all-services home focused on discovery and platform benefits.",
    safeForCanonicalHome: true,
  },
  {
    key: "home-one",
    label: "All Services 3",
    route: "/index-3",
    component: "HomeOne",
    category: "general",
    group: "recommended",
    shell: { header: "shared", footer: "shared" },
    description: "General marketplace-style home with broad cross-category discovery sections.",
    safeForCanonicalHome: true,
  },
  {
    key: "home-two",
    label: "Hotels",
    route: "/index-4",
    component: "HomeTwo",
    category: "service-specific",
    group: "other",
    shell: { header: "shared", footer: "local" },
    description: "Hotel-focused homepage with a local footer and hotel discovery content.",
    safeForCanonicalHome: true,
  },
  {
    key: "home-three",
    label: "Cars",
    route: "/index-5",
    component: "HomeThree",
    category: "service-specific",
    group: "other",
    shell: { header: "shared", footer: "local" },
    description: "Car-focused homepage with a dedicated local footer.",
    safeForCanonicalHome: true,
  },
  {
    key: "home-four",
    label: "Flight",
    route: "/index-6",
    component: "HomeFour",
    category: "service-specific",
    group: "other",
    shell: { header: "shared", footer: "local" },
    description: "Flight-focused homepage with local footer layout treatment.",
    safeForCanonicalHome: true,
  },
  {
    key: "home-five",
    label: "Cruise",
    route: "/index-7",
    component: "HomeFive",
    category: "service-specific",
    group: "other",
    shell: { header: "shared", footer: "local" },
    description: "Cruise-focused homepage with its own footer component.",
    safeForCanonicalHome: true,
  },
  {
    key: "home-six",
    label: "Tours",
    route: "/index-8",
    component: "HomeSix",
    category: "service-specific",
    group: "other",
    shell: { header: "shared", footer: "local" },
    description: "Tour-focused homepage with a dedicated footer and service blocks.",
    safeForCanonicalHome: true,
  },
  {
    key: "home-seven",
    label: "Bus",
    route: "/index-9",
    component: "HomeSeven",
    category: "service-specific",
    group: "other",
    shell: { header: "shared", footer: "local" },
    description: "Bus-focused homepage with its own local footer component.",
    safeForCanonicalHome: true,
  },
  {
    key: "home-ten",
    label: "Guide",
    route: "/index-10",
    component: "HomeTen",
    category: "specialized",
    group: "shell-specific",
    shell: { header: "local", footer: "local" },
    description: "Guide-focused homepage with its own embedded header and footer.",
    safeForCanonicalHome: true,
  },
  {
    key: "home-eleven",
    label: "Activity",
    route: "/index-11",
    component: "HomeEleven",
    category: "specialized",
    group: "other",
    shell: { header: "shared", footer: "local" },
    description: "Activity-focused homepage with a local footer and shared shell header.",
    safeForCanonicalHome: true,
  },
  {
    key: "home-twelve",
    label: "Visa",
    route: "/index-12",
    component: "HomeTwelve",
    category: "specialized",
    group: "shell-specific",
    shell: { header: "local", footer: "local" },
    description: "Visa-focused homepage with its own local header and footer.",
    safeForCanonicalHome: true,
  },
];

const GENERAL_HOME_TEMPLATE_LOOKUP = new Map(
  HOME_TEMPLATE_INVENTORY.flatMap((option) => [
    [option.key, option],
    [option.route, option],
  ]),
);

export const findGeneralHomeTemplateOption = (value?: string | null): HomeTemplateInventoryItem =>
  GENERAL_HOME_TEMPLATE_LOOKUP.get((value || "").trim()) || HOME_TEMPLATE_INVENTORY[0];

export const resolveGeneralHomeTemplateRoute = (value?: string | null): string =>
  findGeneralHomeTemplateOption(value).route;

export const shouldShowSharedHeaderForHomeRoute = (
  value?: string | null,
  overrides?: Partial<Record<string, string>> | null,
): boolean => getHomeHeaderVariantDefinition(value, overrides).scope === "shared";

export const shouldShowSharedFooterForHomeRoute = (value?: string | null): boolean =>
  findGeneralHomeTemplateOption(value).shell.footer === "shared";

export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
  siteName: "",
  logo: "",
  favicon: "",
  contactEmail: "",
  contactPhone: "",
  contactAddress: "",
  heroTitle: "",
  heroSubtitle: "",
  heroImage: "",
  ctaLabel: "",
  ctaLink: "",
  banners: [],
  headerNavigation: [],
  headerVariantOverrides: {},
  publicTemplates: {
    home: "/",
    hotel: "hotel-grid",
    tour: "tour-grid",
    car: "car-grid",
    activity: "activity-grid",
    flight: "flight-grid",
    resort: "resort-grid",
    chalet: "chalet-grid",
    bus: "bus-list",
    cruise: "cruise-grid",
    guide: "guide-grid",
    visa: "visa-grid",
  },
  sections: {
    featuredTours: true,
    featuredHotels: true,
    featuredFlights: true,
    featuredCars: true,
    featuredActivities: true,
  },
  sectionTitles: {
    featuredTours: "Featured Tours",
    featuredHotels: "Featured Hotels",
    featuredFlights: "Featured Flights",
    featuredCars: "Featured Cars",
    featuredActivities: "Featured Activities",
  },
  featuredTours: [],
  featuredHotels: [],
  featuredFlights: [],
  featuredCars: [],
  featuredActivities: [],
  navLinks: [],
  footerLinks: [],
  footerText: "",
  socialLinks: {},
};

const normalizeHeaderNavigationChild = (child: Partial<HeaderNavigationChild>): HeaderNavigationChild | null => {
  const label = (child.label || "").trim();
  const url = normalizeWebsiteSettingsPath(child.url);
  if (!label || !url) return null;
  return {
    label,
    url,
    visible: child.visible !== false,
  };
};

export const normalizeHeaderNavigationItem = (item: Partial<HeaderNavigationItem>, index = 0): HeaderNavigationItem | null => {
  const label = (item.label || "").trim();
  if (!label) return null;

  const type = item.type === "dropdown" ? "dropdown" : "link";
  const normalizedChildren = (item.children || [])
    .map((child) => normalizeHeaderNavigationChild(child))
    .filter((child): child is HeaderNavigationChild => !!child);
  const normalizedUrl = normalizeWebsiteSettingsPath(item.url);
  const id = (item.id || label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `nav-${index + 1}`).trim();

  if (type === "dropdown" && normalizedChildren.length === 0) {
    return null;
  }

  if (type === "link" && !normalizedUrl) {
    return null;
  }

  return {
    id,
    label,
    url: type === "dropdown" ? normalizedUrl || undefined : normalizedUrl,
    visible: item.visible !== false,
    type,
    children: type === "dropdown" ? normalizedChildren : [],
    imageUrl: (item.imageUrl || "").trim() || undefined,
  };
};

export const normalizeHomepageSettings = (settings?: Partial<HomepageSettings> | null): HomepageSettings => {
  const normalizedPublicTemplates = {
    ...DEFAULT_HOMEPAGE_SETTINGS.publicTemplates,
    ...((settings?.publicTemplates || {}) as Partial<Record<PublicTemplateCategory, string>>),
  };

  const normalizedHeaderVariantOverrides = Object.entries((settings?.headerVariantOverrides || {}) as Record<string, string>)
    .reduce((acc, [templateRoute, value]) => {
      const route = normalizeWebsiteSettingsPath(templateRoute);
      if (!route) return acc;
      acc[route] = normalizeHomeHeaderVariantChoice(route, value);
      return acc;
    }, {} as Partial<Record<string, HomeHeaderVariantChoice>>);

  const merged: HomepageSettings = {
    ...DEFAULT_HOMEPAGE_SETTINGS,
    ...(settings || {}),
    headerVariantOverrides: normalizedHeaderVariantOverrides,
    publicTemplates: {
      ...normalizedPublicTemplates,
      home: resolveGeneralHomeTemplateRoute(normalizedPublicTemplates.home),
    },
    sections: {
      ...DEFAULT_HOMEPAGE_SETTINGS.sections,
      ...(settings?.sections || {}),
    },
    sectionTitles: {
      ...DEFAULT_HOMEPAGE_SETTINGS.sectionTitles,
      ...(settings?.sectionTitles || {}),
    },
    banners: Array.isArray(settings?.banners) ? settings!.banners : [],
    navLinks: Array.isArray(settings?.navLinks) ? settings!.navLinks : [],
    footerLinks: Array.isArray(settings?.footerLinks) ? settings!.footerLinks : [],
    featuredTours: Array.isArray(settings?.featuredTours) ? settings!.featuredTours : [],
    featuredHotels: Array.isArray(settings?.featuredHotels) ? settings!.featuredHotels : [],
    featuredFlights: Array.isArray(settings?.featuredFlights) ? settings!.featuredFlights : [],
    featuredCars: Array.isArray(settings?.featuredCars) ? settings!.featuredCars : [],
    featuredActivities: Array.isArray(settings?.featuredActivities) ? settings!.featuredActivities : [],
    socialLinks: settings?.socialLinks || {},
    headerNavigation: Array.isArray(settings?.headerNavigation)
      ? settings!.headerNavigation
          .map((item, index) => normalizeHeaderNavigationItem(item, index))
          .filter((item): item is HeaderNavigationItem => !!item)
      : [],
  };

  return merged;
};

export const fetchHomepageSettings = async (): Promise<HomepageSettings | null> => {
  const docSnap = await getDoc(doc(db, "siteSettings", "homepage"));
  return docSnap.exists() ? normalizeHomepageSettings(docSnap.data() as HomepageSettings) : null;
};

export const updateHomepageSettings = async (settings: Partial<HomepageSettings>): Promise<void> => {
  await setDoc(doc(db, "siteSettings", "homepage"), {
    ...normalizeHomepageSettings(settings),
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export interface HeaderNavigationChild {
  label: string;
  url: string;
  visible?: boolean;
}

export interface HeaderNavigationItem {
  id?: string;
  label: string;
  url?: string;
  visible?: boolean;
  type?: "link" | "dropdown";
  children?: HeaderNavigationChild[];
  imageUrl?: string;
}

export const normalizeWebsiteSettingsPath = (path?: string): string => {
  const value = (path || "").trim();
  if (!value) return "";
  if (value === "/index" || value.startsWith("/index/") || value.startsWith("/index?")) return "/";
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("//")) {
    return value;
  }
  return value.startsWith("/") ? value : `/${value}`;
};


// BOOKINGS

export interface Booking {
  id?: string;
  bookingId?: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  agentId?: string | null;
  ownerId?: string | null;
  listingOwnerId?: string | null;
  createdBy?: string | null;
  itemId: string;
  itemTitle: string;
  itemImage?: string;
  name?: string;
  itemType: "tour" | "hotel" | "car" | "flight" | "bus" | "visa" | "cruise" | "activity" | "activities" | "resort" | "chalet";
  title?: string;
  listingId?: string;
  listingType?: "tour" | "hotel" | "car" | "flight" | "bus" | "visa" | "cruise" | "activity" | "activities" | "resort" | "chalet";
  assignmentScope?: "agent" | "admin";
  price?: number;
  totalAmount?: number;
  currency?: string;
  bookingDate?: string;
  checkInDate?: string;
  checkOutDate?: string;
  startDate?: string;
  endDate?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "rejected";
  cancellationReason?: string;
  agentNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserBookingRequest {
  listingId?: string;
  listingType?: Booking["itemType"];
  title: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  agentId?: string | null;
  ownerId?: string | null;
  listingOwnerId?: string | null;
  createdBy?: string | null;
  checkInDate?: string;
  checkOutDate?: string;
  startDate?: string;
  endDate?: string;
  bookingDate?: string;
  price?: number;
  currency?: string;
}

export type NotificationType = 'booking_submitted' | 'booking_confirmed' | 'booking_cancelled';

export interface NotificationInput {
  title: string;
  message: string;
  type: NotificationType;
  bookingId?: string;
  status?: Booking['status'];
}

const sortBookingsByCreatedAtDesc = (bookings: Booking[]): Booking[] =>
  [...bookings].sort((a, b) => {
    const ta = new Date(b.createdAt || 0).getTime();
    const tb = new Date(a.createdAt || 0).getTime();
    return ta - tb;
  });

const bookingAssignedAgentId = (booking: Partial<Booking>): string | null =>
  booking.agentId || booking.ownerId || booking.listingOwnerId || null;

const bookingBelongsToAgent = (booking: Partial<Booking>, agentId: string): boolean =>
  booking.agentId === agentId || booking.ownerId === agentId || booking.listingOwnerId === agentId;

const buildBookingPayload = (userId: string, bookingId: string, bookingData: UserBookingRequest, now: string): Booking => {
  const assignedAgentId = bookingData.agentId || bookingData.ownerId || bookingData.listingOwnerId || null;
  const title = bookingData.title;
  return {
    bookingId,
    userId,
    userName: bookingData.customerName || "",
    userEmail: bookingData.customerEmail || "",
    userPhone: bookingData.customerPhone || "",
    customerId: bookingData.customerId,
    customerName: bookingData.customerName || "",
    customerEmail: bookingData.customerEmail || "",
    customerPhone: bookingData.customerPhone || "",
    agentId: assignedAgentId,
    ownerId: bookingData.ownerId || assignedAgentId,
    listingOwnerId: bookingData.listingOwnerId || bookingData.ownerId || assignedAgentId,
    createdBy: bookingData.createdBy || userId,
    itemId: bookingData.listingId || title,
    itemTitle: title,
    name: title,
    itemType: bookingData.listingType || "hotel",
    listingId: bookingData.listingId || title,
    listingType: bookingData.listingType || "hotel",
    title,
    assignmentScope: assignedAgentId ? "agent" : "admin",
    price: bookingData.price,
    currency: bookingData.currency,
    ...(bookingData.bookingDate || bookingData.startDate || bookingData.checkInDate
      ? { bookingDate: bookingData.bookingDate || bookingData.startDate || bookingData.checkInDate }
      : {}),
    ...(bookingData.checkInDate ? { checkInDate: bookingData.checkInDate } : {}),
    ...(bookingData.checkOutDate ? { checkOutDate: bookingData.checkOutDate } : {}),
    ...(bookingData.startDate ? { startDate: bookingData.startDate } : {}),
    ...(bookingData.endDate ? { endDate: bookingData.endDate } : {}),
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
};

const resolveBookingMirror = async (bookingId: string, userId?: string): Promise<{ booking: Booking; userId: string }> => {
  const topLevelRef = doc(db, "bookings", bookingId);
  const topLevelSnap = await getDoc(topLevelRef);
  if (topLevelSnap.exists()) {
    const booking = { id: topLevelSnap.id, ...topLevelSnap.data() } as Booking;
    return { booking, userId: booking.userId };
  }

  if (!userId) {
    throw new Error("Booking mirror is missing the customer reference.");
  }

  const userRef = doc(db, "users", userId, "bookings", bookingId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    throw new Error("Booking not found.");
  }

  const booking = { id: userSnap.id, ...userSnap.data() } as Booking;
  return { booking, userId };
};

const ALLOWED_ADMIN_BOOKING_TRANSITIONS: Record<Booking["status"], Booking["status"][]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["cancelled"],
  cancelled: [],
  completed: [],
  rejected: [],
};

const notificationCollection = (userId: string) => collection(db, 'users', userId, 'notifications');

const notificationMessageTitle = (booking: Partial<Booking>) => booking.title || booking.name || booking.itemTitle || 'Booking';

const createNotificationSafe = async (userId: string, notification: NotificationInput): Promise<void> => {
  try {
    await createNotification(userId, notification);
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

const createBookingCreatedNotifications = async (booking: Booking): Promise<void> => {
  const title = notificationMessageTitle(booking);
  const recipients = new Set<string>();
  recipients.add(booking.userId);
  const assignedAgentId = bookingAssignedAgentId(booking);
  if (assignedAgentId) {
    recipients.add(assignedAgentId);
  }

  await Promise.all(
    Array.from(recipients).map((userId) => {
      const isCustomer = userId === booking.userId;
      return createNotificationSafe(userId, {
        title: isCustomer ? 'Booking request submitted' : 'New booking request',
        message: isCustomer
          ? `${title} booking request submitted.`
          : `A new booking request was submitted for ${title}.`,
        type: 'booking_submitted',
        bookingId: booking.bookingId || booking.id,
        status: booking.status,
      });
    })
  );
};

const createBookingStatusNotifications = async (booking: Booking, status: Booking['status']): Promise<void> => {
  if (status !== 'confirmed' && status !== 'cancelled') return;
  const title = notificationMessageTitle(booking);
  const recipients = new Set<string>([booking.userId]);
  const assignedAgentId = bookingAssignedAgentId(booking);
  if (assignedAgentId) {
    recipients.add(assignedAgentId);
  }

  const statusLabel = status === 'confirmed' ? 'confirmed' : 'cancelled';
  await Promise.all(
    Array.from(recipients).map((userId) =>
      createNotificationSafe(userId, {
        title: `Booking ${statusLabel}`,
        message: `${title} booking ${statusLabel}.`,
        type: status === 'confirmed' ? 'booking_confirmed' : 'booking_cancelled',
        bookingId: booking.bookingId || booking.id,
        status,
      })
    )
  );
};

export interface WishlistItem {
  id?: string;
  userId: string;
  itemId: string;
  itemType: "tour" | "hotel" | "car" | "flight" | "activity" | "activities" | "visa" | "cruise" | "resort" | "chalet";
  itemTitle: string;
  itemImage?: string;
  location?: string;
  price?: number;
  currency?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserOrder {
  id?: string;
  userId: string;
  orderId: string;
  title: string;
  itemType?: string;
  status?: string;
  totalAmount?: number;
  currency?: string;
  createdAt: string;
  updatedAt?: string;
}

export const fetchUserWishlist = async (userId: string): Promise<WishlistItem[]> => {
  const snapshot = await getDocs(collection(db, "users", userId, "wishlist"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as WishlistItem));
};

export const addToWishlist = async (
  userId: string,
  item: Omit<WishlistItem, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<void> => {
  const now = new Date().toISOString();
  await setDoc(doc(db, "users", userId, "wishlist", item.itemId), {
    ...item,
    userId,
    createdAt: now,
    updatedAt: now,
  });
};

export const removeFromWishlist = async (userId: string, itemId: string): Promise<void> => {
  await deleteDoc(doc(db, "users", userId, "wishlist", itemId));
};

export const fetchUserOrders = async (userId: string): Promise<UserOrder[]> => {
  const snapshot = await getDocs(collection(db, "users", userId, "orders"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as UserOrder));
};

export const createBookingRequest = async (
  userId: string,
  bookingData: UserBookingRequest
): Promise<string> => {
  const now = new Date().toISOString();
  const bookingRef = doc(collection(db, "users", userId, "bookings"));
  const bookingId = bookingRef.id;
  const bookingPayload = buildBookingPayload(userId, bookingId, bookingData, now);
  const batch = writeBatch(db);
  batch.set(bookingRef, bookingPayload);
  batch.set(doc(db, "bookings", bookingId), bookingPayload);
  await batch.commit();
  await createBookingCreatedNotifications(bookingPayload);
  return bookingId;
};

export const createUserBookingRequest = createBookingRequest;

export const syncBookingMirror = async (
  bookingId: string,
  updates: Partial<Booking>,
  userId?: string
): Promise<void> => {
  const { booking, userId: resolvedUserId } = await resolveBookingMirror(bookingId, userId);
  const payload: Partial<Booking> = {
    ...updates,
    bookingId,
    userId: resolvedUserId,
    agentId: updates.agentId ?? bookingAssignedAgentId(updates) ?? booking.agentId,
    ownerId: updates.ownerId ?? booking.ownerId,
    listingOwnerId: updates.listingOwnerId ?? booking.listingOwnerId,
    updatedAt: updates.updatedAt || new Date().toISOString(),
  };

  const batch = writeBatch(db);
  batch.set(doc(db, "bookings", bookingId), payload, { merge: true });
  batch.set(doc(db, "users", resolvedUserId, "bookings", bookingId), payload, { merge: true });
  await batch.commit();
};

export const createBooking = async (bookingData: Omit<Booking, "createdAt" | "status">): Promise<string> => {
  const docRef = await addDoc(collection(db, "bookings"), {
    ...bookingData,
    status: "pending",
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const fetchCustomerBookings = async (userId: string): Promise<Booking[]> => {
  const q = query(collection(db, "users", userId, "bookings"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  const bookings: Booking[] = [];
  querySnapshot.forEach((doc) => {
    bookings.push({ id: doc.id, ...doc.data() } as Booking);
  });
  return bookings;
};

export const fetchUserBookings = fetchCustomerBookings;

export const fetchAgentBookings = async (agentId: string): Promise<Booking[]> => {
  try {
    const q = query(collection(db, "bookings"), where("agentId", "==", agentId), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
  } catch {
    const snapshot = await getDocs(collection(db, "bookings"));
    return sortBookingsByCreatedAtDesc(
      snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as Booking))
        .filter((booking) => bookingBelongsToAgent(booking, agentId))
    );
  }
};

export const fetchAdminBookings = async (status?: "pending" | "confirmed" | "cancelled"): Promise<Booking[]> => {
  const snapshot = await getDocs(collection(db, "bookings"));
  const bookings = sortBookingsByCreatedAtDesc(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)));
  return status ? bookings.filter((booking) => booking.status === status) : bookings;
};

export const updateBookingStatus = async (
  bookingId: string,
  status: "pending" | "confirmed" | "completed" | "cancelled" | "rejected",
  notes?: string,
  userId?: string
): Promise<void> => {
  const { booking } = await resolveBookingMirror(bookingId, userId);
  const currentStatus = booking.status || "pending";
  if (currentStatus === status) return;
  if (!ALLOWED_ADMIN_BOOKING_TRANSITIONS[currentStatus].includes(status)) {
    throw new Error(`Invalid booking status transition from ${currentStatus} to ${status}.`);
  }

  const payload: Partial<Booking> & { adminNotes?: string } = {
    status,
    updatedAt: new Date().toISOString(),
  };
  if (notes !== undefined) payload.adminNotes = notes;
  await syncBookingMirror(bookingId, payload, booking.userId);
  await createBookingStatusNotifications({ ...booking, bookingId }, status);
};


// USERS

export interface AdminUserView {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  phone?: string;
  photoURL?: string;
  approved?: boolean;
  agentStatus?: "pending" | "approved" | "rejected" | "suspended";
  accountStatus?: "active" | "suspended";
  businessName?: string;
  businessType?: string;
  businessAddress?: string;
  taxNumber?: string;
  description?: string;
  joinedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectedReason?: string;
  suspendedAt?: string;
  suspendedBy?: string;
  [key: string]: any;
}

export const fetchUsersByRole = async (role: UserRole): Promise<AdminUserView[]> => {
  const q = query(collection(db, "users"), where("role", "==", role));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ uid: d.id, ...d.data() } as AdminUserView));
};

/**
 * Fetch every user that is either already an agent or has an agentStatus value.
 * This covers approved agents, suspended agents, and customer applicants.
 */
export const fetchAgentCandidates = async (): Promise<AdminUserView[]> => {
  const statuses = ["pending", "approved", "rejected", "suspended"];
  const [roleSnap, statusSnap] = await Promise.all([
    getDocs(query(collection(db, "users"), where("role", "==", "agent"))),
    getDocs(query(collection(db, "users"), where("agentStatus", "in", statuses))),
  ]);
  const map = new Map<string, AdminUserView>();
  roleSnap.docs.forEach((d) => {
    map.set(d.id, { uid: d.id, ...d.data() } as AdminUserView);
  });
  statusSnap.docs.forEach((d) => {
    map.set(d.id, { uid: d.id, ...d.data() } as AdminUserView);
  });
  return Array.from(map.values());
};

export const updateUserSafe = async (uid: string, data: Partial<AdminUserView>): Promise<void> => {
  // Only allow safe fields to be updated from the admin client. Never allow role/uid changes.
  const allowed = new Set([
    "displayName",
    "phone",
    "photoURL",
    "approved",
    "agentStatus",
    "accountStatus",
    "businessName",
    "businessType",
    "businessAddress",
    "taxNumber",
    "description",
    "approvedAt",
    "approvedBy",
    "rejectedAt",
    "rejectedBy",
    "rejectedReason",
    "suspendedAt",
    "suspendedBy",
    "suspended",
    "businessDescription",
    "address",
    "city",
    "country",
  ]);
  const payload: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (allowed.has(key)) payload[key] = value;
  });
  if (Object.keys(payload).length === 0) return;
  payload.updatedAt = serverTimestamp();
  await updateDoc(doc(db, "users", uid), payload);
};


// AGENT APPLICATIONS

export interface AgentApplication {
  id?: string;
  userId: string;
  email: string;
  displayName: string;
  businessName: string;
  businessType: string;
  businessAddress: string;
  taxNumber: string;
  phone: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectedReason?: string;
}

export const fetchAgentApplications = async (status?: "pending" | "approved" | "rejected"): Promise<AgentApplication[]> => {
  let q = query(collection(db, "agentApplications"), where("status", "==", status || "pending"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AgentApplication));
};

export const submitAgentApplication = async (application: Omit<AgentApplication, "id" | "status" | "createdAt">): Promise<string> => {
  // Guard against duplicate pending applications for the same user.
  const existing = await getDocs(
    query(
      collection(db, "agentApplications"),
      where("userId", "==", application.userId),
      where("status", "==", "pending")
    )
  );
  if (!existing.empty) {
    throw new Error("You already have a pending agent application.");
  }
  const docRef = await addDoc(collection(db, "agentApplications"), {
    ...application,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateAgentApplication = async (
  applicationId: string,
  data: Partial<Pick<AgentApplication, "status" | "reviewedAt" | "reviewedBy" | "rejectedReason">>
): Promise<void> => {
  await updateDoc(doc(db, "agentApplications", applicationId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const countAgentListings = async (agentId: string): Promise<Record<string, number>> => {
  const collections = ["tours", "hotels", "flights", "cars", "activities", "resorts", "chalets"];
  const result: Record<string, number> = {};
  await Promise.all(
    collections.map(async (col) => {
      try {
        const q = query(collection(db, col), where("agentId", "==", agentId));
        const snapshot = await getDocs(q);
        result[col] = snapshot.size;
      } catch {
        result[col] = 0;
      }
    })
  );
  return result;
};


// BOOKINGS

export const fetchBookings = fetchAdminBookings;


// REVIEWS

export interface Review {
  id?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  itemId: string;
  itemTitle?: string;
  itemType?: string;
  rating: number;
  comment?: string;
  status?: "pending" | "approved" | "hidden";
  createdAt?: string;
}

export const fetchReviews = async (): Promise<Review[]> => {
  const snapshot = await getDocs(collection(db, "reviews"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
};

export const updateReviewStatus = async (reviewId: string, status: "pending" | "approved" | "hidden"): Promise<void> => {
  await updateDoc(doc(db, "reviews", reviewId), { status, updatedAt: serverTimestamp() });
};

export const deleteReview = async (reviewId: string): Promise<void> => {
  await deleteDoc(doc(db, "reviews", reviewId));
};


// COUPONS

export interface Coupon {
  id?: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  active: boolean;
  applicableServices: string[];
}

export const fetchCoupons = async (): Promise<Coupon[]> => {
  const snapshot = await getDocs(collection(db, "coupons"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Coupon));
};

export const addCoupon = async (coupon: Omit<Coupon, "id">): Promise<string> => {
  const docRef = await addDoc(collection(db, "coupons"), {
    ...coupon,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const updateCoupon = async (couponId: string, coupon: Partial<Coupon>): Promise<void> => {
  await setDoc(doc(db, "coupons", couponId), {
    ...coupon,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

export const deleteCoupon = async (couponId: string): Promise<void> => {
  await deleteDoc(doc(db, "coupons", couponId));
};


// NOTIFICATIONS

export interface AppNotification {
  id?: string;
  title: string;
  message: string;
  body?: string;
  type: NotificationType;
  bookingId?: string;
  status?: Booking['status'];
  read?: boolean;
  createdAt?: string;
  updatedAt?: string;
  readAt?: string | null;
}

export const fetchUserNotifications = async (userId: string): Promise<AppNotification[]> => {
  try {
    const snapshot = await getDocs(query(notificationCollection(userId), orderBy('createdAt', 'desc')));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification));
  } catch {
    const snapshot = await getDocs(notificationCollection(userId));
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as AppNotification))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }
};

export const createNotification = async (userId: string, notification: NotificationInput): Promise<string> => {
  const docRef = await addDoc(notificationCollection(userId), {
    ...notification,
    body: notification.message,
    read: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return docRef.id;
};

export const markNotificationRead = async (userId: string, notificationId: string, read: boolean): Promise<void> => {
  await updateDoc(doc(db, 'users', userId, 'notifications', notificationId), {
    read,
    readAt: read ? new Date().toISOString() : null,
    updatedAt: new Date().toISOString(),
  });
};

export const markAllNotificationsRead = async (userId: string): Promise<void> => {
  const notifications = await fetchUserNotifications(userId);
  const unread = notifications.filter((notification) => notification.id && !notification.read);
  const batch = writeBatch(db);
  unread.forEach((notification) => {
    batch.set(doc(db, 'users', userId, 'notifications', notification.id!), {
      read: true,
      readAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  });
  if (unread.length > 0) {
    await batch.commit();
  }
};

export const deleteNotification = async (userId: string, notificationId: string): Promise<void> => {
  await deleteDoc(doc(db, 'users', userId, 'notifications', notificationId));
};


// WEBSITE SETTINGS

export interface WebsiteSettings {
  siteName?: string;
  logo?: string;
  favicon?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  socialLinks?: Record<string, string>;
  navLinks?: { label: string; path: string }[];
  footerLinks?: { label: string; path: string }[];
  footerText?: string;
}

export const fetchWebsiteSettings = async (): Promise<WebsiteSettings | null> => {
  const docSnap = await getDoc(doc(db, "siteSettings", "website"));
  return docSnap.exists() ? (docSnap.data() as WebsiteSettings) : null;
};

export const updateWebsiteSettings = async (settings: Partial<WebsiteSettings>): Promise<void> => {
  await setDoc(doc(db, "siteSettings", "website"), {
    ...settings,
    updatedAt: serverTimestamp()
  }, { merge: true });
};
