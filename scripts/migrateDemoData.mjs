import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA53UvUPYNbs5sBK7Y8dS1-GnidLbmXO3g",
  authDomain: "tour-tunisi.firebaseapp.com",
  projectId: "tour-tunisi",
  storageBucket: "tour-tunisi.firebasestorage.app",
  messagingSenderId: "680331427957",
  appId: "1:680331427957:web:652d180694969fcf62f83c",
  measurementId: "G-2EN7YMMTRK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const stableId = (prefix, title) => `${prefix}-${slugify(title)}`;

const demoTours = [
  { id: stableId('tour', 'Rainbow Mountain Valley'), title: 'Rainbow Mountain Valley', type: 'Ecotourism', location: 'Ciutat Vella, Barcelona', price: 500, oldPrice: 789, rating: 5.0, reviewsCount: 105, duration: '4 Days', image: 'assets/img/tours/tours-07.jpg', gallery: ['assets/img/tours/tours-07.jpg'], trending: true, featured: true, published: true, description: 'Explore the vibrant Rainbow Mountain Valley with our expert guides.' },
  { id: stableId('tour', 'Joy Jubilee Jamboree'), title: 'Joy Jubilee Jamboree', type: 'Adventure Tour', location: 'Paris, France', price: 450, oldPrice: 600, rating: 4.8, reviewsCount: 92, duration: '3 Days', image: 'assets/img/tours/tours-08.jpg', gallery: ['assets/img/tours/tours-08.jpg'], trending: false, featured: true, published: true, description: 'An unforgettable adventure tour through Paris and beyond.' },
  { id: stableId('tour', 'LaughFest Carnival'), title: 'LaughFest Carnival', type: 'Group Tours', location: 'London, UK', price: 320, oldPrice: 450, rating: 4.7, reviewsCount: 88, duration: '2 Days', image: 'assets/img/tours/tours-09.jpg', gallery: ['assets/img/tours/tours-09.jpg'], trending: true, featured: false, published: true, description: 'Join the fun at LaughFest Carnival with group tours.' },
  { id: stableId('tour', 'Romantic Places Tour'), title: 'Romantic Places Tour', type: 'Beach Tours', location: 'Venice, Italy', price: 750, oldPrice: 999, rating: 4.9, reviewsCount: 154, duration: '5 Days', image: 'assets/img/tours/tours-10.jpg', gallery: ['assets/img/tours/tours-10.jpg'], trending: false, featured: true, published: true, description: 'Discover the most romantic places in Venice and nearby beaches.' },
  { id: stableId('tour', 'Whimsy Wonderland'), title: 'Whimsy Wonderland', type: 'Historical Tours', location: 'Rome, Italy', price: 520, oldPrice: 650, rating: 4.6, reviewsCount: 79, duration: '4 Days', image: 'assets/img/tours/tours-11.jpg', gallery: ['assets/img/tours/tours-11.jpg'], trending: false, featured: false, published: true, description: 'Step into a whimsical wonderland of historical landmarks in Rome.' },
  { id: stableId('tour', 'Giggles & Games Gala'), title: 'Giggles & Games Gala', type: 'Summer Trip', location: 'Istanbul, Turkey', price: 380, oldPrice: 480, rating: 4.5, reviewsCount: 63, duration: '3 Days', image: 'assets/img/tours/tours-12.jpg', gallery: ['assets/img/tours/tours-12.jpg'], trending: false, featured: false, published: true, description: 'A summer trip full of games, giggles, and gala events in Istanbul.' },
];

const demoHotels = [
  { id: stableId('hotel', 'Hotel Plaza Athenee'), title: 'Hotel Plaza Athenee', location: 'Ciutat Vella, Barcelona', price: 500, rating: 5.0, reviewsCount: 400, image: 'assets/img/hotels/hotel-01.jpg', gallery: ['assets/img/hotels/hotel-01.jpg', 'assets/img/hotels/hotel-02.jpg', 'assets/img/hotels/hotel-03.jpg'], type: 'Suite Room', badge: 'Trending', trending: true, featured: true, published: true, description: 'Luxury suite room in the heart of Barcelona.' },
  { id: stableId('hotel', 'The Luxe Haven'), title: 'The Luxe Haven', location: 'Oxford Street, London', price: 600, rating: 4.7, reviewsCount: 360, image: 'assets/img/hotels/hotel-05.jpg', gallery: ['assets/img/hotels/hotel-05.jpg'], type: 'Queen Room', badge: 'Trending', trending: true, featured: true, published: true, description: 'A luxurious haven on Oxford Street.' },
  { id: stableId('hotel', 'The Urban Retreat'), title: 'The Urban Retreat', location: 'Princes Street, Edinburgh', price: 500, rating: 4.5, reviewsCount: 500, image: 'assets/img/hotels/hotel-06.jpg', gallery: ['assets/img/hotels/hotel-06.jpg'], type: 'Single Room', badge: 'Trending', trending: true, featured: false, published: true, description: 'Modern urban retreat in Edinburgh.' },
  { id: stableId('hotel', 'The Grand Horizon'), title: 'The Grand Horizon', location: 'Deansgate, Manchester', price: 400, rating: 4.9, reviewsCount: 450, image: 'assets/img/hotels/hotel-07.jpg', gallery: ['assets/img/hotels/hotel-07.jpg'], type: 'Deluxe Room', badge: 'Trending', trending: true, featured: true, published: true, description: 'Grand horizon views from Manchester.' },
  { id: stableId('hotel', 'Hotel Evergreen'), title: 'Hotel Evergreen', location: "King's Road, Chelsea", price: 550, rating: 4.3, reviewsCount: 380, image: 'assets/img/hotels/hotel-08.jpg', gallery: ['assets/img/hotels/hotel-08.jpg', 'assets/img/hotels/hotel-02.jpg', 'assets/img/hotels/hotel-03.jpg'], type: 'Standard Room', badge: 'Trending', trending: true, featured: false, published: true, description: 'Evergreen comfort in Chelsea.' },
  { id: stableId('hotel', 'Stardust Hotel'), title: 'Stardust Hotel', location: 'Bold Street, Liverpool', price: 450, rating: 4.1, reviewsCount: 270, image: 'assets/img/hotels/hotel-09.jpg', gallery: ['assets/img/hotels/hotel-09.jpg'], type: 'City View Room', badge: 'Trending', trending: true, featured: false, published: true, description: 'Stardust charm in Liverpool.' },
  { id: stableId('hotel', 'Hotel Serene Valley'), title: 'Hotel Serene Valley', location: 'Broad Street, Bristol', price: 350, rating: 4.6, reviewsCount: 650, image: 'assets/img/hotels/hotel-10.jpg', gallery: ['assets/img/hotels/hotel-10.jpg', 'assets/img/hotels/hotel-04.jpg', 'assets/img/hotels/hotel-06.jpg'], type: 'Valley Room', badge: 'Trending', trending: true, featured: false, published: true, description: 'Serene valley escape in Bristol.' },
  { id: stableId('hotel', 'Hotel Skyline Vista'), title: 'Hotel Skyline Vista', location: 'Chapel Street, Salford', price: 700, rating: 4.2, reviewsCount: 550, image: 'assets/img/hotels/hotel-11.jpg', gallery: ['assets/img/hotels/hotel-11.jpg', 'assets/img/hotels/hotel-05.jpg', 'assets/img/hotels/hotel-03.jpg'], type: 'Skyline Room', badge: 'Trending', trending: true, featured: true, published: true, description: 'Skyline views in Salford.' },
  { id: stableId('hotel', 'Hotel Aurora Bliss'), title: 'Hotel Aurora Bliss', location: 'Castle Street, Cambridge', price: 650, rating: 4.8, reviewsCount: 700, image: 'assets/img/hotels/hotel-12.jpg', gallery: ['assets/img/hotels/hotel-12.jpg', 'assets/img/hotels/hotel-08.jpg', 'assets/img/hotels/hotel-10.jpg'], type: 'Bliss Suite', badge: 'Trending', trending: true, featured: true, published: true, description: 'Aurora bliss in Cambridge.' },
];

const demoFlights = [
  { id: stableId('flight', 'Antonov An-32'), title: 'Antonov An-32', departureCity: 'Newyork', arrivalCity: 'Sydney', airline: 'Air India', stopInfo: '1-stop at Texas', dates: 'Aug 01, 2024 - Aug 03, 2024', rating: 5.0, price: 500, badge: 'Cheapest', seatsLeft: 20, image: 'assets/img/bg/flight-bg.png', gallery: ['assets/img/bg/flight-bg.png', 'assets/img/flight/flight-large-05.jpg', 'assets/img/flight/flight-img-1.png'], featured: true, published: true, description: 'Fly from Newyork to Sydney with Air India.' },
  { id: stableId('flight', 'SkyBound 102'), title: 'SkyBound 102', departureCity: 'London', arrivalCity: 'London', airline: 'Indigo', stopInfo: '1-stop at Dubai', dates: 'Aug 13, 2024 - Aug 15, 2024', rating: 4.3, price: 600, badge: 'Cheapest', seatsLeft: 18, image: 'assets/img/banner/flight-banner.jpg', gallery: ['assets/img/banner/flight-banner.jpg'], featured: false, published: true, description: 'SkyBound service with Indigo.' },
  { id: stableId('flight', 'Nimbus 345'), title: 'Nimbus 345', departureCity: 'Paris', arrivalCity: 'Cape Town', airline: 'Indigo', stopInfo: '1-stop at Dubai', dates: 'Aug 26, 2024 - Aug 27, 2024', rating: 4.8, price: 300, badge: 'Cheapest', seatsLeft: 27, image: 'assets/img/flight/flight-large-06.jpg', gallery: ['assets/img/flight/flight-large-06.jpg'], featured: true, published: true, description: 'Paris to Cape Town with Nimbus.' },
  { id: stableId('flight', 'AstraFlight 215'), title: 'AstraFlight 215', departureCity: 'Toronto', arrivalCity: 'Bangkok', airline: 'Indigo', stopInfo: '1-stop at Frankfurt', dates: 'Sep 04, 2024 - Sep 07, 2024', rating: 4.3, price: 300, badge: 'Cheapest', seatsLeft: 27, image: 'assets/img/flight/flight-large-01.jpg', gallery: ['assets/img/flight/flight-large-01.jpg'], featured: false, published: true, description: 'Toronto to Bangkok with AstraFlight.' },
  { id: stableId('flight', 'Cloudrider 789'), title: 'Cloudrider 789', departureCity: 'Chicago', arrivalCity: 'Melbourne', airline: 'Air India', stopInfo: '1-stop at Dallas', dates: 'Sep 11, 2024 - Sep 13, 2024', rating: 4.7, price: 550, badge: 'Cheapest', seatsLeft: 14, image: 'assets/img/flight/flight-large-02.jpg', gallery: ['assets/img/flight/flight-large-02.jpg', 'assets/img/flight/flight-large-04.jpg', 'assets/img/flight/flight-img-1.png'], featured: true, published: true, description: 'Chicago to Melbourne with Cloudrider.' },
  { id: stableId('flight', 'Aether Express 901'), title: 'Aether Express 901', departureCity: 'Miami', arrivalCity: 'Tokyo', airline: 'Indigo', stopInfo: '1-stop at Seoul', dates: 'Sep 22, 2024 - Sep 24, 2024', rating: 4.5, price: 450, badge: 'Cheapest', seatsLeft: 12, image: 'assets/img/flight/flight-large-03.jpg', gallery: ['assets/img/flight/flight-large-03.jpg'], featured: false, published: true, description: 'Miami to Tokyo with Aether Express.' },
  { id: stableId('flight', 'Voyager 658'), title: 'Voyager 658', departureCity: 'Frankfurt', arrivalCity: 'Auckland', airline: 'Air India', stopInfo: '1-stop at Sydney', dates: 'Oct 04, 2024 - Oct 07, 2024', rating: 4.6, price: 350, badge: 'Cheapest', seatsLeft: 21, image: 'assets/img/flight/flight-img-1.png', gallery: ['assets/img/flight/flight-img-1.png', 'assets/img/flight/flight-large-03.jpg', 'assets/img/flight/flight-large-01.jpg'], featured: false, published: true, description: 'Frankfurt to Auckland with Voyager.' },
  { id: stableId('flight', 'Silverwing 505'), title: 'Silverwing 505', departureCity: 'Boston', arrivalCity: 'Singapore', airline: 'Air India', stopInfo: '1-stop at London', dates: 'Oct 17, 2024 - Oct 19, 2024', rating: 4.9, price: 700, badge: 'Cheapest', seatsLeft: 18, image: 'assets/img/flight/flight-large-04.jpg', gallery: ['assets/img/flight/flight-large-04.jpg', 'assets/img/flight/flight-img-1.png', 'assets/img/flight/flight-large-01.jpg'], featured: true, published: true, description: 'Boston to Singapore with Silverwing.' },
  { id: stableId('flight', 'Altair 333'), title: 'Altair 333', departureCity: 'London', arrivalCity: 'Honolulu', airline: 'Air India', stopInfo: '1-stop at Los Angeles', dates: 'Oct 20, 2024 - Oct 22, 2024', rating: 4.1, price: 650, badge: 'Cheapest', seatsLeft: 25, image: 'assets/img/flight/flight-large-05.jpg', gallery: ['assets/img/flight/flight-large-05.jpg', 'assets/img/flight/flight-large-06.jpg', 'assets/img/flight/flight-large-02.jpg'], featured: false, published: true, description: 'London to Honolulu with Altair.' },
];

const demoCars = [
  { id: stableId('car', 'Toyota Camry SE 400'), title: 'Toyota Camry SE 400', type: 'Sedan', location: 'Ciutat Vella, Barcelona', fuel: 'Hybrid', gear: 'Manual', travelled: '14,000 KM', rating: 5.0, reviewsCount: 400, image: 'assets/img/cars/car-06.jpg', gallery: ['assets/img/cars/car-06.jpg', 'assets/img/cars/car-07.jpg', 'assets/img/cars/car-08.jpg'], badge: 'Trending', price: 500, priceUnit: 'day', featured: true, published: true, description: 'Reliable hybrid sedan for city drives.' },
  { id: stableId('car', 'Ford Mustang 4.0 AT'), title: 'Ford Mustang 4.0 AT', type: 'Sedan', location: 'Oxford Street, London', fuel: 'Diesel', gear: 'Manual', travelled: '10,300 KM', rating: 4.7, reviewsCount: 300, image: 'assets/img/cars/car-07.jpg', gallery: ['assets/img/cars/car-07.jpg', 'assets/img/cars/car-08.jpg', 'assets/img/cars/car-09.jpg'], badge: 'Trending', price: 600, priceUnit: 'day', featured: true, published: true, description: 'Powerful Ford Mustang for road trips.' },
  { id: stableId('car', 'Ferrari 458 MM Special'), title: 'Ferrari 458 MM Special', type: 'Sedan', location: 'Princes Street, Edinburgh', fuel: 'Hybrid', gear: 'Auto', travelled: '13,000 KM', rating: 4.0, reviewsCount: 320, image: 'assets/img/cars/car-08.jpg', gallery: ['assets/img/cars/car-08.jpg', 'assets/img/cars/car-09.jpg', 'assets/img/cars/car-10.jpg'], badge: 'Trending', price: 300, priceUnit: 'day', featured: false, published: true, description: 'Luxury Ferrari for special occasions.' },
  { id: stableId('car', 'Mercedes-benz Convertible'), title: 'Mercedes-benz Convertible', type: 'Sedan', location: 'Princes Street, Edinburgh', fuel: 'Hybrid', gear: 'Auto', travelled: '10,000 KM', rating: 4.0, reviewsCount: 380, image: 'assets/img/cars/car-09.jpg', gallery: ['assets/img/cars/car-09.jpg', 'assets/img/cars/car-10.jpg', 'assets/img/cars/car-11.jpg'], badge: 'Trending', price: 400, priceUnit: 'day', featured: false, published: true, description: 'Stylish Mercedes convertible.' },
  { id: stableId('car', 'BMW 3.0 Gran Turismo'), title: 'BMW 3.0 Gran Turismo', type: 'Sedan', location: "King's Road, Chelsea", fuel: 'Petrol', gear: 'Manual', travelled: '12,800 KM', rating: 4.3, reviewsCount: 300, image: 'assets/img/cars/car-10.jpg', gallery: ['assets/img/cars/car-10.jpg', 'assets/img/cars/car-11.jpg', 'assets/img/cars/car-12.jpg'], badge: 'Trending', price: 550, priceUnit: 'day', featured: false, published: true, description: 'Gran Turismo comfort and performance.' },
  { id: stableId('car', 'Infiniti QX60'), title: 'Infiniti QX60', type: 'Sedan', location: 'Bold Street, Liverpool', fuel: 'Diesel', gear: 'Auto', travelled: '13,500 KM', rating: 4.1, reviewsCount: 450, image: 'assets/img/cars/car-11.jpg', gallery: ['assets/img/cars/car-11.jpg', 'assets/img/cars/car-12.jpg', 'assets/img/cars/car-13.jpg'], badge: 'Trending', price: 450, priceUnit: 'day', featured: false, published: true, description: 'Spacious Infiniti QX60 for family trips.' },
  { id: stableId('car', 'Toyota 86 Sports'), title: 'Toyota 86 Sports', type: 'Sedan', location: 'Broad Street, Bristol', fuel: 'Hybrid', gear: 'Auto', travelled: '15,000 KM', rating: 4.6, reviewsCount: 520, image: 'assets/img/cars/car-12.jpg', gallery: ['assets/img/cars/car-12.jpg', 'assets/img/cars/car-13.jpg', 'assets/img/cars/car-14.jpg'], badge: 'Trending', price: 350, priceUnit: 'day', featured: false, published: true, description: 'Sporty Toyota 86 for enthusiasts.' },
  { id: stableId('car', 'Jeep Wrangler'), title: 'Jeep Wrangler', type: 'Sedan', location: 'Chapel Street, Salford', fuel: 'Diesel', gear: 'Manual', travelled: '10,300 KM', rating: 4.2, reviewsCount: 360, image: 'assets/img/cars/car-13.jpg', gallery: ['assets/img/cars/car-13.jpg', 'assets/img/cars/car-14.jpg', 'assets/img/cars/car-11.jpg'], badge: 'Trending', price: 700, priceUnit: 'day', featured: true, published: true, description: 'Rugged Jeep Wrangler for adventures.' },
  { id: stableId('car', 'Jaguar XK'), title: 'Jaguar XK', type: 'Sedan', location: 'Castle Street, Cambridge', fuel: 'Petrol', gear: 'Auto', travelled: '13,800 KM', rating: 4.8, reviewsCount: 500, image: 'assets/img/cars/car-14.jpg', gallery: ['assets/img/cars/car-14.jpg', 'assets/img/cars/car-11.jpg', 'assets/img/cars/car-12.jpg'], badge: 'Trending', price: 650, priceUnit: 'day', featured: true, published: true, description: 'Elegant Jaguar XK for luxury drives.' },
];

const demoActivities = [
  { id: stableId('activity', 'Snorkeling Tour'), title: 'Snorkeling Tour', location: 'Phuket, Thailand', duration: '4 hrs', rating: 4.9, reviewsCount: 672, image: 'assets/img/activities/activity-11.jpg', gallery: ['assets/img/activities/activity-11.jpg'], badge: 'Trending', price: 400, oldPrice: 480, featured: true, published: true, description: 'Explore marine life with a snorkeling tour in Phuket.' },
  { id: stableId('activity', 'Alpine Snowboarding'), title: 'Alpine Snowboarding', location: 'Zermatt, Switzerland', duration: '3 hrs', rating: 4.6, reviewsCount: 450, image: 'assets/img/activities/activity-12.jpg', gallery: ['assets/img/activities/activity-12.jpg'], badge: 'Trending', price: 150, oldPrice: 200, featured: true, published: true, description: 'Thrilling alpine snowboarding in Zermatt.' },
  { id: stableId('activity', 'White Water Rafting'), title: 'White Water Rafting', location: 'Rotorua, New Zealand', duration: '5 hrs', rating: 4.5, reviewsCount: 320, image: 'assets/img/activities/activity-13.jpg', gallery: ['assets/img/activities/activity-13.jpg'], badge: 'Trending', price: 350, oldPrice: 400, featured: false, published: true, description: 'Adrenaline-packed white water rafting in Rotorua.' },
  { id: stableId('activity', 'Cliffside Paragliding'), title: 'Cliffside Paragliding', location: 'Annecy, France', duration: '2 hrs', rating: 4.2, reviewsCount: 280, image: 'assets/img/activities/activity-14.jpg', gallery: ['assets/img/activities/activity-14.jpg'], badge: 'Trending', price: 300, oldPrice: 350, featured: false, published: true, description: 'Soar above Annecy with cliffside paragliding.' },
  { id: stableId('activity', 'River Cruise'), title: 'River Cruise', location: 'Paris, France', duration: '3 hrs', rating: 4.0, reviewsCount: 510, image: 'assets/img/activities/activity-15.jpg', gallery: ['assets/img/activities/activity-15.jpg'], badge: 'Trending', price: 280, oldPrice: 300, featured: false, published: true, description: 'Romantic river cruise through Paris.' },
  { id: stableId('activity', 'Dessert Adventure'), title: 'Dessert Adventure', location: 'Dubai, UAE', duration: '5 hrs', rating: 4.7, reviewsCount: 730, image: 'assets/img/activities/activity-16.jpg', gallery: ['assets/img/activities/activity-16.jpg'], badge: 'Trending', price: 200, oldPrice: 220, featured: false, published: true, description: 'Desert safari adventure in Dubai.' },
  { id: stableId('activity', 'Coastal Kayaking'), title: 'Coastal Kayaking', location: 'Sydney, Australia', duration: '4 hrs', rating: 4.1, reviewsCount: 280, image: 'assets/img/tours/tours-37.jpg', gallery: ['assets/img/tours/tours-37.jpg'], badge: 'Trending', price: 150, oldPrice: 160, featured: false, published: true, description: 'Coastal kayaking along Sydney shores.' },
  { id: stableId('activity', 'Historic Landmarks Tour'), title: 'Historic Landmarks Tour', location: 'Rome, Italy', duration: '2 hrs', rating: 4.8, reviewsCount: 140, image: 'assets/img/tours/tours-38.jpg', gallery: ['assets/img/tours/tours-38.jpg'], badge: 'Trending', price: 120, oldPrice: 150, featured: false, published: true, description: 'Discover historic landmarks in Rome.' },
  { id: stableId('activity', 'Wildlife Safari'), title: 'Wildlife Safari', location: 'Kruger, South Africa', duration: '3 hrs', rating: 5.0, reviewsCount: 560, image: 'assets/img/tours/tours-50.jpg', gallery: ['assets/img/tours/tours-50.jpg'], badge: 'Trending', price: 200, oldPrice: 220, featured: true, published: true, description: 'Wildlife safari in Kruger National Park.' },
];

const defaultHomepageSettings = {
  heroTitle: 'Find Your Next Adventure',
  heroSubtitle: 'Book tours, hotels, flights, cars, and activities around the world.',
  heroImage: 'assets/img/banner/banner-01.jpg',
  ctaLabel: 'Explore Now',
  ctaLink: '/tour-grid',
  sections: {
    featuredTours: true,
    featuredHotels: true,
    featuredFlights: true,
    featuredCars: false,
    featuredActivities: false,
  },
  sectionTitles: {
    featuredTours: 'Featured Tours',
    featuredHotels: 'Featured Hotels',
    featuredFlights: 'Featured Flights',
    featuredCars: 'Featured Cars',
    featuredActivities: 'Featured Activities',
  },
  featuredTours: demoTours.filter((t) => t.featured).map((t) => t.id),
  featuredHotels: demoHotels.filter((h) => h.featured).map((h) => h.id),
  featuredFlights: demoFlights.filter((f) => f.featured).map((f) => f.id),
  featuredCars: demoCars.filter((c) => c.featured).map((c) => c.id),
  featuredActivities: demoActivities.filter((a) => a.featured).map((a) => a.id),
};

const setIfMissing = async (collectionName, items) => {
  const colRef = collection(db, collectionName);
  const snapshot = await getDocs(colRef);
  const existingIds = new Set(snapshot.docs.map((d) => d.id));
  const batch = writeBatch(db);
  let count = 0;

  items.forEach((item) => {
    if (!existingIds.has(item.id)) {
      batch.set(doc(db, collectionName, item.id), {
        ...item,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
  }
  return count;
};

const main = async () => {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Usage: node scripts/migrateDemoData.mjs <admin-email> <admin-password>');
    process.exit(1);
  }

  console.log('Signing in...');
  await signInWithEmailAndPassword(auth, email, password);
  console.log('Signed in as admin.');

  const result = {
    tours: await setIfMissing('tours', demoTours),
    hotels: await setIfMissing('hotels', demoHotels),
    flights: await setIfMissing('flights', demoFlights),
    cars: await setIfMissing('cars', demoCars),
    activities: await setIfMissing('activities', demoActivities),
  };

  const settingsSnap = await getDocs(collection(db, 'siteSettings'));
  const hasHomepage = settingsSnap.docs.some((d) => d.id === 'homepage');
  if (!hasHomepage) {
    await setDoc(doc(db, 'siteSettings', 'homepage'), {
      ...defaultHomepageSettings,
      updatedAt: serverTimestamp(),
    });
    result.homepage = true;
  } else {
    result.homepage = false;
  }

  console.log('\nMigration complete:');
  console.log(`  Tours imported:      ${result.tours}`);
  console.log(`  Hotels imported:     ${result.hotels}`);
  console.log(`  Flights imported:    ${result.flights}`);
  console.log(`  Cars imported:       ${result.cars}`);
  console.log(`  Activities imported: ${result.activities}`);
  console.log(`  Homepage created:    ${result.homepage ? 'Yes' : 'Already exists'}`);
  process.exit(0);
};

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
