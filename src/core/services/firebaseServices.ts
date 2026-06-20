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
  collectionGroup,
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
  if (userDoc.exists()) {
    return userDoc.data() as UserProfile;
  } else {
    // Default fallback
    return {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "",
      role: "customer",
      createdAt: new Date().toISOString()
    };
  }
};

export const signOutUser = async (): Promise<void> => {
  await signOut(auth);
};

export const subscribeToAuthChanges = (callback: (userProfile: UserProfile | null) => void) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        callback(userDoc.data() as UserProfile);
      } else {
        callback({
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "",
          role: "customer",
          createdAt: new Date().toISOString()
        });
      }
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

export const fetchHomepageSettings = async (): Promise<HomepageSettings | null> => {
  const docSnap = await getDoc(doc(db, "siteSettings", "homepage"));
  return docSnap.exists() ? (docSnap.data() as HomepageSettings) : null;
};

export const updateHomepageSettings = async (settings: Partial<HomepageSettings>): Promise<void> => {
  await setDoc(doc(db, "siteSettings", "homepage"), {
    ...settings,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};


// BOOKINGS

export interface Booking {
  id?: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  agentId?: string;
  ownerId?: string | null;
  listingOwnerId?: string | null;
  createdBy?: string | null;
  itemId: string;
  itemTitle: string;
  itemImage?: string;
  itemType: "tour" | "hotel" | "car" | "flight" | "bus" | "visa" | "cruise" | "activities" | "resort" | "chalet";
  title?: string;
  listingId?: string;
  listingType?: "tour" | "hotel" | "car" | "flight" | "bus" | "visa" | "cruise" | "activities" | "resort" | "chalet";
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
  price?: number;
  currency?: string;
}

export interface WishlistItem {
  id?: string;
  userId: string;
  itemId: string;
  itemType: "tour" | "hotel" | "car" | "flight" | "activities" | "visa" | "cruise" | "resort" | "chalet";
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

export const createUserBookingRequest = async (
  userId: string,
  bookingData: UserBookingRequest
): Promise<string> => {
  const now = new Date().toISOString();
  const bookingOwnerId = bookingData.ownerId || bookingData.listingOwnerId || bookingData.agentId || null;
  const docRef = await addDoc(collection(db, "users", userId, "bookings"), {
    userId,
    userName: bookingData.customerName || "",
    userEmail: bookingData.customerEmail || "",
    userPhone: bookingData.customerPhone || "",
    customerId: bookingData.customerId,
    customerName: bookingData.customerName || "",
    customerEmail: bookingData.customerEmail || "",
    customerPhone: bookingData.customerPhone || "",
    agentId: bookingOwnerId,
    ownerId: bookingOwnerId,
    listingOwnerId: bookingData.listingOwnerId || bookingData.ownerId || bookingData.agentId || null,
    createdBy: bookingData.createdBy || userId,
    itemId: bookingData.listingId || bookingData.title,
    itemTitle: bookingData.title,
    itemType: bookingData.listingType || "hotel",
    listingId: bookingData.listingId || bookingData.title,
    listingType: bookingData.listingType || "hotel",
    title: bookingData.title,
    assignmentScope: bookingOwnerId ? "agent" : "admin",
    price: bookingData.price,
    currency: bookingData.currency,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
};

export const createBooking = async (bookingData: Omit<Booking, "createdAt" | "status">): Promise<string> => {
  const docRef = await addDoc(collection(db, "bookings"), {
    ...bookingData,
    status: "pending",
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const fetchUserBookings = async (userId: string): Promise<Booking[]> => {
  const q = query(collection(db, "users", userId, "bookings"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  const bookings: Booking[] = [];
  querySnapshot.forEach((doc) => {
    bookings.push({ id: doc.id, ...doc.data() } as Booking);
  });
  return bookings;
};

export const updateBookingStatus = async (
  bookingId: string,
  status: "pending" | "confirmed" | "completed" | "cancelled" | "rejected",
  notes?: string,
  userId?: string
): Promise<void> => {
  const bookingRef = userId ? doc(db, "users", userId, "bookings", bookingId) : doc(db, "bookings", bookingId);
  const payload: Record<string, any> = { status, updatedAt: serverTimestamp() };
  if (notes !== undefined) payload.adminNotes = notes;
  await updateDoc(bookingRef, payload);
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

export const fetchBookings = async (status?: "pending" | "confirmed" | "cancelled"): Promise<Booking[]> => {
  const snapshot = await getDocs(query(collectionGroup(db, "bookings"), orderBy("createdAt", "desc")));
  const bookings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
  return status ? bookings.filter((booking) => booking.status === status) : bookings;
};


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
  body: string;
  userId?: string;
  role?: UserRole | "all";
  read?: boolean;
  createdAt?: string;
}

export const fetchNotifications = async (): Promise<AppNotification[]> => {
  const snapshot = await getDocs(collection(db, "notifications"));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() } as AppNotification))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
};

export const createNotification = async (notification: Omit<AppNotification, "id" | "createdAt">): Promise<string> => {
  const docRef = await addDoc(collection(db, "notifications"), {
    ...notification,
    read: false,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const markNotificationRead = async (notificationId: string, read: boolean): Promise<void> => {
  await updateDoc(doc(db, "notifications", notificationId), { read, updatedAt: serverTimestamp() });
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  await deleteDoc(doc(db, "notifications", notificationId));
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
