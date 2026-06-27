import {
  collection,
  query,
  where,
  getCountFromServer,
  getDocs,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';

export interface AdminStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalCustomers: number;
  totalAgents: number;
  totalTours: number;
  totalHotels: number;
  totalFlights: number;
  totalCars: number;
  totalActivities: number;
  totalListings: number;
  totalRevenue: number;
  totalServiceRequests: number;
  pendingServiceRequests: number;
  contactedServiceRequests: number;
  confirmedServiceRequests: number;
  cancelledServiceRequests: number;
  todayServiceRequests: number;
  urgentServiceRequests: number;
}

export interface RecentBooking {
  id: string;
  bookingCode?: string;
  serviceName?: string;
  customerEmail?: string;
  status?: string;
  totalPrice?: number;
  currency?: string;
  createdAt?: Timestamp;
}

export interface RecentUser {
  id: string;
  email?: string;
  displayName?: string;
  role?: string;
  createdAt?: Timestamp;
}

export interface RecentListing {
  id: string;
  title?: string;
  type?: string;
  status?: string;
  price?: number;
  createdAt?: Timestamp;
}

const getCount = async (
  col: string,
  filters?: { field: string; value: unknown; op?: string }[]
) => {
  try {
    let q = query(collection(db, col));
    if (filters) {
      filters.forEach((f) => {
        q = query(q, where(f.field, f.op as any || '==', f.value));
      });
    }
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch {
    return 0;
  }
};

export const getAdminStats = async (): Promise<AdminStats> => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalBookings,
    pendingBookings,
    confirmedBookings,
    cancelledBookings,
    totalCustomers,
    totalAgents,
    totalTours,
    totalHotels,
    totalFlights,
    totalCars,
    totalActivities,
    totalRequests,
    pendingRequests,
    contactedRequests,
    confirmedRequests,
    cancelledRequests,
    todayRequests,
    urgentRequests,
  ] = await Promise.all([
    getCount('bookings'),
    getCount('bookings', [{ field: 'status', value: 'pending' }]),
    getCount('bookings', [{ field: 'status', value: 'confirmed' }]),
    getCount('bookings', [{ field: 'status', value: 'cancelled' }]),
    getCount('users', [{ field: 'role', value: 'customer' }]),
    getCount('users', [{ field: 'role', value: 'agent' }]),
    getCount('tours'),
    getCount('hotels'),
    getCount('flights'),
    getCount('cars'),
    getCount('activities'),
    getCount('serviceRequests'),
    getCount('serviceRequests', [{ field: 'status', value: 'pending' }]),
    getCount('serviceRequests', [{ field: 'status', value: 'contacted' }]),
    getCount('serviceRequests', [{ field: 'status', value: 'confirmed' }]),
    getCount('serviceRequests', [{ field: 'status', value: 'cancelled' }]),
    getCount('serviceRequests', [{ field: 'createdAt', value: todayStart.toISOString(), op: '>=' }]),
    getCount('serviceRequests', [{ field: 'priority', value: 'urgent' }]),
  ]);

  return {
    totalBookings,
    pendingBookings,
    confirmedBookings,
    cancelledBookings,
    totalCustomers,
    totalAgents,
    totalTours,
    totalHotels,
    totalFlights,
    totalCars,
    totalActivities,
    totalListings: totalTours + totalHotels + totalFlights + totalCars + totalActivities,
    totalRevenue: 0,
    totalServiceRequests: totalRequests,
    pendingServiceRequests: pendingRequests,
    contactedServiceRequests: contactedRequests,
    confirmedServiceRequests: confirmedRequests,
    cancelledServiceRequests: cancelledRequests,
    todayServiceRequests: todayRequests,
    urgentServiceRequests: urgentRequests,
  };
};

export const getRecentBookings = async (max = 5): Promise<RecentBooking[]> => {
  try {
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(max));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as RecentBooking);
  } catch {
    return [];
  }
};

export const getRecentUsers = async (role: 'customer' | 'agent', max = 5): Promise<RecentUser[]> => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', role),
      orderBy('createdAt', 'desc'),
      limit(max)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as RecentUser);
  } catch {
    return [];
  }
};

export interface ServiceRequestAssignmentStats {
  unassignedServiceRequests: number;
  urgentUnassignedServiceRequests: number;
  followUpDueTodayServiceRequests: number;
}

export const getServiceRequestAssignmentStats = async (): Promise<ServiceRequestAssignmentStats> => {
  try {
    const snapshot = await getDocs(collection(db, 'serviceRequests'));
    const today = new Date().toISOString().slice(0, 10);
    let unassigned = 0;
    let urgentUnassigned = 0;
    let followUpDueToday = 0;
    snapshot.docs.forEach((doc) => {
      const d = doc.data();
      if (!d.assignedTo) {
        unassigned++;
        if (d.priority === 'urgent') urgentUnassigned++;
      }
      if (
        d.followUpDate &&
        d.followUpDate === today &&
        d.status !== 'confirmed' &&
        d.status !== 'cancelled'
      ) {
        followUpDueToday++;
      }
    });
    return {
      unassignedServiceRequests: unassigned,
      urgentUnassignedServiceRequests: urgentUnassigned,
      followUpDueTodayServiceRequests: followUpDueToday,
    };
  } catch {
    return {
      unassignedServiceRequests: 0,
      urgentUnassignedServiceRequests: 0,
      followUpDueTodayServiceRequests: 0,
    };
  }
};

export const getRecentListings = async (max = 5): Promise<RecentListing[]> => {
  try {
    const [toursSnap, hotelsSnap, flightsSnap] = await Promise.all([
      getDocs(query(collection(db, 'tours'), orderBy('createdAt', 'desc'), limit(max))),
      getDocs(query(collection(db, 'hotels'), orderBy('createdAt', 'desc'), limit(max))),
      getDocs(query(collection(db, 'flights'), orderBy('createdAt', 'desc'), limit(max))),
    ]);

    const tours: RecentListing[] = toursSnap.docs.map((doc) => ({
      id: doc.id,
      type: 'Tour',
      ...doc.data(),
    })) as RecentListing[];

    const hotels: RecentListing[] = hotelsSnap.docs.map((doc) => ({
      id: doc.id,
      type: 'Hotel',
      ...doc.data(),
    })) as RecentListing[];

    const flights: RecentListing[] = flightsSnap.docs.map((doc) => ({
      id: doc.id,
      type: 'Flight',
      ...doc.data(),
    })) as RecentListing[];

    return [...tours, ...hotels, ...flights]
      .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0))
      .slice(0, max);
  } catch {
    return [];
  }
};
