import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "../../firebase";

const defaultTours = [
  {
    title: "Rainbow Mountain Valley",
    type: "Ecotourism",
    location: "Ciutat Vella, Barcelona",
    price: 500,
    oldPrice: 789,
    rating: 5.0,
    reviewsCount: 105,
    duration: "4 Days",
    image: "assets/img/tours/tours-07.jpg",
    trending: true
  },
  {
    title: "Joy Jubilee Jamboree",
    type: "Adventure Tour",
    location: "Paris, France",
    price: 450,
    oldPrice: 600,
    rating: 4.8,
    reviewsCount: 92,
    duration: "3 Days",
    image: "assets/img/tours/tours-08.jpg",
    trending: false
  },
  {
    title: "LaughFest Carnival",
    type: "Group Tours",
    location: "London, UK",
    price: 320,
    oldPrice: 450,
    rating: 4.7,
    reviewsCount: 88,
    duration: "2 Days",
    image: "assets/img/tours/tours-09.jpg",
    trending: true
  },
  {
    title: "Romantic Places Tour",
    type: "Beach Tours",
    location: "Venice, Italy",
    price: 750,
    oldPrice: 999,
    rating: 4.9,
    reviewsCount: 154,
    duration: "5 Days",
    image: "assets/img/tours/tours-10.jpg",
    trending: false
  },
  {
    title: "Whimsy Wonderland",
    type: "Historical Tours",
    location: "Rome, Italy",
    price: 520,
    oldPrice: 650,
    rating: 4.6,
    reviewsCount: 79,
    duration: "4 Days",
    image: "assets/img/tours/tours-11.jpg",
    trending: false
  },
  {
    title: "Giggles & Games Gala",
    type: "Summer Trip",
    location: "Istanbul, Turkey",
    price: 380,
    oldPrice: 480,
    rating: 4.5,
    reviewsCount: 63,
    duration: "3 Days",
    image: "assets/img/tours/tours-12.jpg",
    trending: false
  }
];

const defaultHotels = [
  {
    title: "Hotel Athenee",
    location: "Barcelona, Spain",
    price: 150,
    rating: 4.9,
    reviewsCount: 124,
    image: "assets/img/hotels/hotel-01.jpg",
    type: "Suite Room"
  },
  {
    title: "The Luxe Haven",
    location: "London, UK",
    price: 220,
    rating: 4.8,
    reviewsCount: 96,
    image: "assets/img/hotels/hotel-02.jpg",
    type: "Queen Room"
  },
  {
    title: "The Urban Retreat",
    location: "Paris, France",
    price: 180,
    rating: 4.7,
    reviewsCount: 85,
    image: "assets/img/hotels/hotel-03.jpg",
    type: "Single Room"
  },
  {
    title: "Hotel Serene Valley",
    location: "Chelsea, UK",
    price: 130,
    rating: 4.5,
    reviewsCount: 52,
    image: "assets/img/hotels/hotel-04.jpg",
    type: "City View Room"
  }
];

export const seedDatabase = async () => {
  try {
    // Check if tours collection is empty
    const toursSnapshot = await getDocs(collection(db, "tours"));
    if (toursSnapshot.empty) {
      console.log("Seeding default tours to Firestore...");
      const batch = writeBatch(db);
      defaultTours.forEach((tour) => {
        const newDocRef = doc(collection(db, "tours"));
        batch.set(newDocRef, { ...tour, createdAt: new Date().toISOString() });
      });
      await batch.commit();
      console.log("✓ Tours successfully seeded!");
    }

    // Check if hotels collection is empty
    const hotelsSnapshot = await getDocs(collection(db, "hotels"));
    if (hotelsSnapshot.empty) {
      console.log("Seeding default hotels to Firestore...");
      const batch = writeBatch(db);
      defaultHotels.forEach((hotel) => {
        const newDocRef = doc(collection(db, "hotels"));
        batch.set(newDocRef, { ...hotel, createdAt: new Date().toISOString() });
      });
      await batch.commit();
      console.log("✓ Hotels successfully seeded!");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};
