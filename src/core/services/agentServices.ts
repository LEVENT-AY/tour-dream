import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  type DocumentData,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "../../firebase";
import { uploadAgentProfileImage } from "./agentStorage";
import {
  fetchAgentBookings as fetchMirroredAgentBookings,
  fetchUserNotifications,
  markNotificationRead as markUserNotificationRead,
  deleteNotification as deleteUserNotification,
  type Booking,
  type Review,
  type AppNotification,
} from "./firebaseServices";
export type { Booking, Review, AppNotification };

export const AGENT_LISTING_COLLECTIONS = [
  "tours",
  "hotels",
  "flights",
  "cars",
  "activities",
  "resorts",
  "chalets",
] as const;

export type ListingCollection = (typeof AGENT_LISTING_COLLECTIONS)[number];
export type ListingStatus = "draft" | "pending_review" | "approved" | "rejected" | "suspended";

export interface DashboardStats {
  listings: {
    total: number;
    draft: number;
    pendingReview: number;
    approved: number;
    rejected: number;
    byType: Record<string, number>;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    byType: Record<string, number>;
    recent: any[];
    monthlyIncome: number[];
  };
  reviews: {
    total: number;
    averageRating: number;
  };
  earnings: {
    total: number;
    estimated: boolean;
  };
}

export interface AgentNotificationPrefs {
  bookingAlerts?: { push?: boolean; sms?: boolean; email?: boolean };
  commissionAlerts?: { push?: boolean; sms?: boolean; email?: boolean };
  reviewAlerts?: { push?: boolean; sms?: boolean; email?: boolean };
  listingAlerts?: { push?: boolean; sms?: boolean; email?: boolean };
  systemAnnouncements?: { push?: boolean; sms?: boolean; email?: boolean };
}

export interface AgentProfileUpdate {
  displayName?: string;
  phone?: string;
  photoURL?: string;
  businessName?: string;
  businessType?: string;
  businessAddress?: string;
  description?: string;
  notifications?: AgentNotificationPrefs;
  [key: string]: any;
}

export interface AgentListing {
  id: string;
  collection: ListingCollection;
  agentId: string;
  ownerId?: string;
  createdBy?: string;
  title?: string;
  name?: string;
  status?: ListingStatus | string;
  approvalStatus?: ListingStatus | string;
  published?: boolean;
  featured?: boolean;
  location?: string;
  city?: string;
  country?: string;
  price?: number;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

const belongsToAgent = (item: DocumentData, agentId: string): boolean =>
  item.agentId === agentId || item.ownerId === agentId || item.userId === agentId;

const normalizeListingStatus = (item: DocumentData): string => {
  const approvalStatus = typeof item.approvalStatus === "string" ? item.approvalStatus.toLowerCase().trim() : "";
  if (approvalStatus) return approvalStatus;
  const status = typeof item.status === "string" ? item.status.toLowerCase().trim() : "";
  if (status) return status;
  if (item.published === false) return "draft";
  if (item.published === true) return "approved";
  return "approved"; // default when no status field exists
};

const bookingAmount = (booking: DocumentData): number => {
  const val =
    typeof booking.totalAmount === "number"
      ? booking.totalAmount
      : typeof booking.price === "number"
      ? booking.price
      : typeof booking.amount === "number"
      ? booking.amount
      : 0;
  return val;
};

const formatBookingDate = (booking: DocumentData): string => {
  const raw = booking.bookingDate || booking.createdAt || booking.date;
  if (!raw) return "—";
  try {
    return new Date(raw).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return String(raw);
  }
};

export const bookingStatusDisplay = (status?: string): { label: string; action: string; badge: string } => {
  const s = (status || "pending").toLowerCase();
  if (s === "confirmed") return { label: "Upcoming", action: "upcoming", badge: "badge-info" };
  if (s === "completed") return { label: "Completed", action: "completed", badge: "badge-success" };
  if (s === "cancelled" || s === "canceled") return { label: "Cancelled", action: "cancelled", badge: "badge-danger" };
  if (s === "rejected") return { label: "Rejected", action: "cancelled", badge: "badge-danger" };
  return { label: "Pending", action: "upcoming", badge: "badge-secondary" };
};

export const formatCurrency = (value: number, currency = "USD") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);

const fetchAgentItems = async (agentId: string): Promise<DocumentData[]> => {
  const allItems: DocumentData[] = [];
  const seen = new Set<string>();

  await Promise.all(
    AGENT_LISTING_COLLECTIONS.map(async (col) => {
      try {
        const [agentSnap, ownerSnap] = await Promise.all([
          getDocs(query(collection(db, col), where("agentId", "==", agentId))),
          getDocs(query(collection(db, col), where("ownerId", "==", agentId))),
        ]);
        agentSnap.forEach((d) => {
          if (!seen.has(d.id)) {
            seen.add(d.id);
            allItems.push({ id: d.id, collection: col, ...d.data() });
          }
        });
        ownerSnap.forEach((d) => {
          if (!seen.has(d.id)) {
            seen.add(d.id);
            allItems.push({ id: d.id, collection: col, ...d.data() });
          }
        });
      } catch (err) {
        // Collection may not exist or index may be missing; fall back to client filter.
        try {
          const snap = await getDocs(collection(db, col));
          snap.forEach((d) => {
            const data = d.data();
            if (belongsToAgent(data, agentId) && !seen.has(d.id)) {
              seen.add(d.id);
              allItems.push({ id: d.id, collection: col, ...data });
            }
          });
        } catch {
          // ignore
        }
      }
    })
  );

  return allItems;
};

export const getAgentListing = async (
  collectionName: ListingCollection,
  itemId: string,
  agentId: string
): Promise<AgentListing | null> => {
  const snap = await getDoc(doc(db, collectionName, itemId));
  if (!snap.exists()) return null;
  const data = { id: snap.id, collection: collectionName, ...snap.data() } as AgentListing;
  if (data.agentId !== agentId && data.ownerId !== agentId) {
    throw new Error("You do not have permission to access this listing.");
  }
  return data;
};

export const fetchAgentListings = async (
  agentId: string,
  collectionName?: ListingCollection,
  statusFilter?: ListingStatus | string
): Promise<AgentListing[]> => {
  const targetCollections = collectionName
    ? [collectionName]
    : AGENT_LISTING_COLLECTIONS;

  const allItems: AgentListing[] = [];

  await Promise.all(
    targetCollections.map(async (col) => {
      try {
        const [agentSnap, ownerSnap] = await Promise.all([
          getDocs(query(collection(db, col), where("agentId", "==", agentId))),
          getDocs(query(collection(db, col), where("ownerId", "==", agentId))),
        ]);
        agentSnap.forEach((d) => {
          allItems.push({ id: d.id, collection: col, ...d.data() } as AgentListing);
        });
        ownerSnap.forEach((d) => {
          allItems.push({ id: d.id, collection: col, ...d.data() } as AgentListing);
        });
      } catch {
        // ignore missing collections
      }
    })
  );

  const unique = new Map<string, AgentListing>();
  allItems.forEach((item) => unique.set(item.id, item));

  let result = Array.from(unique.values());

  if (statusFilter && statusFilter !== "all") {
    result = result.filter((item) => {
      const status = normalizeListingStatus(item);
      return status === statusFilter;
    });
  }

  return result.sort((a, b) => {
    const ta = new Date(b.createdAt || 0).getTime();
    const tb = new Date(a.createdAt || 0).getTime();
    return ta - tb;
  });
};

export const createAgentListing = async (
  collectionName: ListingCollection,
  data: Omit<AgentListing, "id">,
  agentId: string
): Promise<string> => {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    agentId,
    ownerId: agentId,
    createdBy: agentId,
    status: "draft" as ListingStatus,
    approvalStatus: "draft" as ListingStatus,
    published: false,
    featured: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateAgentListing = async (
  collectionName: ListingCollection,
  itemId: string,
  data: Partial<Omit<AgentListing, "id" | "collection">>,
  agentId: string
): Promise<void> => {
  const existing = await getDoc(doc(db, collectionName, itemId));
  if (!existing.exists()) throw new Error("Listing not found.");
  const existingData = existing.data() as AgentListing;
  if (existingData.agentId !== agentId && existingData.ownerId !== agentId) {
    throw new Error("You do not have permission to edit this listing.");
  }
  const currentStatus = normalizeListingStatus(existingData);
  if (!['draft', 'rejected'].includes(currentStatus)) {
    throw new Error("Only draft or rejected listings can be edited.");
  }

  // Agents cannot change ownership or publication fields
  const safe = { ...data };
  delete safe.agentId;
  delete safe.ownerId;
  delete safe.createdBy;
  delete safe.status;
  delete safe.approvalStatus;
  delete safe.published;
  delete safe.featured;
  delete safe.rejectionReason;
  delete safe.rejectedReason;
  delete safe.approvedAt;
  delete safe.approvedBy;
  delete safe.rejectedAt;
  delete safe.rejectedBy;

  await updateDoc(doc(db, collectionName, itemId), {
    ...safe,
    updatedAt: serverTimestamp(),
  });
};

export const deleteAgentListing = async (
  collectionName: ListingCollection,
  itemId: string,
  agentId: string
): Promise<void> => {
  const existing = await getDoc(doc(db, collectionName, itemId));
  if (!existing.exists()) throw new Error("Listing not found.");
  const existingData = existing.data() as AgentListing;
  if (existingData.agentId !== agentId && existingData.ownerId !== agentId) {
    throw new Error("You do not have permission to delete this listing.");
  }
  const status = normalizeListingStatus(existingData);
  if (!["draft", "rejected"].includes(status)) {
    throw new Error("Only draft or rejected listings can be deleted.");
  }
  await deleteDoc(doc(db, collectionName, itemId));
};

export const submitListingForReview = async (
  collectionName: ListingCollection,
  itemId: string,
  agentId: string
): Promise<void> => {
  const existing = await getDoc(doc(db, collectionName, itemId));
  if (!existing.exists()) throw new Error("Listing not found.");
  const existingData = existing.data() as AgentListing;
  if (existingData.agentId !== agentId && existingData.ownerId !== agentId) {
    throw new Error("You do not have permission to submit this listing.");
  }
  const status = normalizeListingStatus(existingData);
  if (!["draft", "rejected"].includes(status)) {
    throw new Error("Only draft or rejected listings can be submitted for review.");
  }
  await updateDoc(doc(db, collectionName, itemId), {
    status: "pending_review" as ListingStatus,
    approvalStatus: "pending_review" as ListingStatus,
    updatedAt: serverTimestamp(),
  });
};

export const fetchAgentBookings = async (agentId: string): Promise<Booking[]> => {
  return fetchMirroredAgentBookings(agentId);
};

export const fetchAgentBookingRequests = async (agentId: string): Promise<Booking[]> => {
  return fetchAgentBookings(agentId);
};

export const updateBookingStatus = async (
  bookingId: string,
  status: "pending" | "confirmed" | "completed" | "cancelled" | "rejected",
  notes?: string
): Promise<void> => {
  void bookingId;
  void status;
  void notes;
  throw new Error("Agent booking status updates are disabled in this phase.");
};

const fetchAllReviews = async (): Promise<DocumentData[]> => {
  const snap = await getDocs(collection(db, "reviews"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const fetchAgentDashboardStats = async (
  agentId: string
): Promise<DashboardStats> => {
  const [listings, bookings, reviews] = await Promise.all([
    fetchAgentItems(agentId),
    fetchAgentBookings(agentId),
    fetchAllReviews(),
  ]);

  const listingIds = new Set(listings.map((item) => item.id));

  const stats: DashboardStats = {
    listings: {
      total: listings.length,
      draft: 0,
      pendingReview: 0,
      approved: 0,
      rejected: 0,
      byType: {},
    },
    bookings: {
      total: bookings.length,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      byType: {},
      recent: [],
      monthlyIncome: Array(12).fill(0),
    },
    reviews: {
      total: 0,
      averageRating: 0,
    },
    earnings: {
      total: 0,
      estimated: true,
    },
  };

  listings.forEach((item) => {
    const type = item.type || item.itemType || item.collection || "other";
    stats.listings.byType[type] = (stats.listings.byType[type] || 0) + 1;

    const status = normalizeListingStatus(item);
    if (status === "draft") stats.listings.draft++;
    else if (status === "pending" || status === "pending-review" || status === "under review")
      stats.listings.pendingReview++;
    else if (status === "approved" || status === "published" || status === "active")
      stats.listings.approved++;
    else if (status === "rejected" || status === "declined") stats.listings.rejected++;
    else stats.listings.pendingReview++;
  });

  const currentYear = new Date().getFullYear();

  bookings.forEach((booking) => {
    const status = String(booking.status || "pending").toLowerCase();
    if (status === "pending") stats.bookings.pending++;
    else if (status === "confirmed") stats.bookings.confirmed++;
    else if (status === "completed") stats.bookings.completed++;
    else if (status === "cancelled" || status === "canceled") stats.bookings.cancelled++;
    else stats.bookings.pending++;

    const type = String(booking.itemType || "other").toLowerCase();
    stats.bookings.byType[type] = (stats.bookings.byType[type] || 0) + 1;

    const amount = bookingAmount(booking);
    if (status === "confirmed" || status === "completed") {
      stats.earnings.total += amount;

      const rawDate = booking.createdAt || booking.bookingDate;
      if (rawDate) {
        try {
          const date = new Date(rawDate);
          if (date.getFullYear() === currentYear) {
            stats.bookings.monthlyIncome[date.getMonth()] += amount;
          }
        } catch {
          // ignore invalid dates
        }
      }
    }
  });

  // Recent bookings sorted by creation date (newest first)
  stats.bookings.recent = bookings
    .slice()
    .sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      return db - da;
    })
    .slice(0, 10)
    .map((booking) => ({
      id: booking.id,
      action: `booking-${booking.id}`,
      hotel: booking.itemType || "—",
      hotelName: booking.itemTitle || "—",
      hotelImage: booking.itemImage || "assets/img/hotels/hotel-20.jpg",
      location: booking.userName || booking.userEmail || "—",
      room: booking.itemType || "—",
      guest: booking.userEmail || "—",
      days: "—",
      pricing: `$${bookingAmount(booking)}`,
      bookedOn: formatBookingDate(booking),
      date: booking.createdAt || "",
      status:
        booking.status === "confirmed"
          ? "Upcoming"
          : booking.status === "cancelled"
          ? "Cancelled"
          : booking.status === "completed"
          ? "Completed"
          : "Pending",
    }));

  const agentReviews = reviews.filter(
    (r) => listingIds.has(r.itemId) || r.agentId === agentId
  );

  stats.reviews.total = agentReviews.length;
  if (agentReviews.length > 0) {
    const sum = agentReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    stats.reviews.averageRating = Number((sum / agentReviews.length).toFixed(1));
  }

  return stats;
};

const ALLOWED_AGENT_FIELDS = new Set([
  "displayName",
  "phone",
  "photoURL",
  "businessName",
  "businessType",
  "businessAddress",
  "description",
  "notifications",
]);

export const updateAgentProfile = async (
  uid: string,
  data: AgentProfileUpdate
): Promise<void> => {
  const payload: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (ALLOWED_AGENT_FIELDS.has(key)) {
      payload[key] = value;
    }
  });
  if (Object.keys(payload).length === 0) return;
  payload.updatedAt = serverTimestamp();
  await updateDoc(doc(db, "users", uid), payload);
};

export const uploadAgentProfilePhoto = async (
  uid: string,
  file: File
): Promise<{ url: string; path: string; fileName: string }> => {
  return uploadAgentProfileImage(uid, file);
};

export const changeAgentPassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");
  if (!user.email) throw new Error("User has no email for reauthentication");

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
};

export const sendAgentPasswordReset = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("No authenticated user email");
  await sendPasswordResetEmail(auth, user.email);
};

// AGENT REVIEWS

export interface AgentReview extends Review {
  listingTitle?: string;
  agentResponse?: string;
  agentRespondedAt?: string;
}

export const fetchAgentReviews = async (agentId: string): Promise<AgentReview[]> => {
  const listings = await fetchAgentItems(agentId);
  const listingIds = new Set(listings.map((item) => String(item.id)));

  const snap = await getDocs(collection(db, "reviews"));
  const reviews = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AgentReview);

  return reviews
    .filter((r) => listingIds.has(r.itemId) || (r as any).agentId === agentId)
    .sort((a, b) => {
      const ta = new Date(b.createdAt || 0).getTime();
      const tb = new Date(a.createdAt || 0).getTime();
      return ta - tb;
    })
    .map((r) => ({
      ...r,
      listingTitle:
        r.itemTitle || listings.find((l) => l.id === r.itemId)?.title || "Listing",
    }));
};

export const addAgentReviewResponse = async (
  reviewId: string,
  response: string
): Promise<void> => {
  await updateDoc(doc(db, "reviews", reviewId), {
    agentResponse: response,
    agentRespondedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

// AGENT NOTIFICATIONS

export interface AgentNotificationItem extends AppNotification {
  read?: boolean;
}

export const fetchAgentNotifications = async (
  agentId: string
): Promise<AgentNotificationItem[]> => {
  return fetchUserNotifications(agentId) as Promise<AgentNotificationItem[]>;
};

export const markAgentNotificationRead = async (
  agentId: string,
  notificationId: string,
  read: boolean
): Promise<void> => {
  await markUserNotificationRead(agentId, notificationId, read);
};

export const deleteAgentNotification = async (agentId: string, notificationId: string): Promise<void> => {
  await deleteUserNotification(agentId, notificationId);
};

// AGENT ENQUIRIES

export interface Enquiry {
  id?: string;
  listingId?: string;
  agentId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  message: string;
  status: "pending" | "responded" | "closed";
  createdAt?: string;
  updatedAt?: string;
  listingTitle?: string;
}

export const fetchAgentEnquiries = async (agentId: string): Promise<Enquiry[]> => {
  try {
    const q = query(
      collection(db, "enquiries"),
      where("agentId", "==", agentId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Enquiry);
  } catch {
    return [];
  }
};

export const updateEnquiryStatus = async (
  enquiryId: string,
  status: "pending" | "responded" | "closed"
): Promise<void> => {
  await updateDoc(doc(db, "enquiries", enquiryId), {
    status,
    updatedAt: serverTimestamp(),
  });
};

export const addEnquiry = async (enquiry: Omit<Enquiry, "id" | "createdAt">): Promise<string> => {
  const docRef = await addDoc(collection(db, "enquiries"), {
    ...enquiry,
    status: enquiry.status || "pending",
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

// AGENT EARNINGS

export interface AgentEarnings {
  totalEstimated: number;
  confirmedCount: number;
  completedCount: number;
  currency: string;
}

export const calculateAgentEarnings = async (agentId: string): Promise<AgentEarnings> => {
  const bookings = await fetchAgentBookings(agentId);
  const eligible = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "completed"
  );

  const totalEstimated = eligible.reduce((sum, b) => {
    const amount =
      typeof b.totalAmount === "number"
        ? b.totalAmount
        : typeof b.price === "number"
        ? b.price
        : 0;
    return sum + amount;
  }, 0);

  return {
    totalEstimated,
    confirmedCount: eligible.filter((b) => b.status === "confirmed").length,
    completedCount: eligible.filter((b) => b.status === "completed").length,
    currency: eligible[0]?.currency || "USD",
  };
};
