import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../router/all_routes";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import { getCategoryFallbackSrc, type ImageCategory } from "../../core/services/firebaseStorage";
import {
  fetchCruises,
  fetchBuses,
  fetchVisas,
  fetchGuides,
} from "../../core/services/firebaseServices";
import type { DocumentData } from "firebase/firestore";

interface ServiceItem {
  id: string;
  category: string;
  title: string;
  location: string;
  price: number;
  rating: number;
  reviewsCount: number;
  image: string;
}

type CategoryKey = "cruises" | "buses" | "visas" | "guides";

const CATEGORY_CONFIG: Record<
  CategoryKey,
  { label: string; listRoute: string; detailRoute: string; icon: string }
> = {
  cruises: {
    label: "Cruises",
    listRoute: all_routes.cruiseList,
    detailRoute: all_routes.cruiseDetails,
    icon: "isax isax-ship",
  },
  buses: {
    label: "Buses",
    listRoute: all_routes.busList,
    detailRoute: all_routes.busDetails,
    icon: "isax isax-bus",
  },
  visas: {
    label: "Visas",
    listRoute: all_routes.visaList,
    detailRoute: all_routes.visaDetails,
    icon: "isax isax-passport",
  },
  guides: {
    label: "Guides",
    listRoute: all_routes.guideGrid,
    detailRoute: all_routes.guideDetails,
    icon: "isax isax-people",
  },
};

const MAX_ITEMS = 8;
const MAX_PER_CATEGORY = 3;

const CATEGORY_FALLBACK: Record<CategoryKey, ImageCategory> = {
  cruises: "tours",
  buses: "cars",
  visas: "default",
  guides: "default",
};

function normalizeItem(data: DocumentData): ServiceItem {
  return {
    id: data.id as string,
    category: (data.category as string) || "",
    title: (data.title as string) || (data.name as string) || "",
    location: (data.location as string) || "",
    price: (data.price as number) ?? 0,
    rating: (data.rating as number) ?? 0,
    reviewsCount: (data.reviewsCount as number) ?? 0,
    image: (data.image as string) || "",
  };
}

interface CategoryResult {
  key: CategoryKey;
  items: ServiceItem[];
}

const FeaturedServices = () => {
  const [results, setResults] = useState<CategoryResult[] | null>(null);
  const [loading, setLoading] = useState(true);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    setLoading(true);

    const load = async () => {
      const settled = await Promise.allSettled([
        fetchCruises(),
        fetchBuses(),
        fetchVisas(),
        fetchGuides(),
      ]);

      if (cancelledRef.current) return;

      const keys: CategoryKey[] = ["cruises", "buses", "visas", "guides"];
      const all: CategoryResult[] = [];
      let total = 0;

      for (let i = 0; i < settled.length && total < MAX_ITEMS; i++) {
        const r = settled[i];
        if (r.status !== "fulfilled") continue;
        const items = r.value.map(normalizeItem).slice(0, MAX_PER_CATEGORY);
        if (items.length === 0) continue;
        all.push({ key: keys[i], items });
        total += items.length;
      }

      if (!cancelledRef.current) {
        setResults(all.length > 0 ? all : []);
        setLoading(false);
      }
    };

    void load();

    return () => {
      cancelledRef.current = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="section featured-services">
        <div className="container">
          <div className="section-header-eight text-center wow fadeInUp">
            <h2>Explore Tunisia Services</h2>
            <p className="text-muted">Discover amazing services across Tunisia</p>
          </div>
          <div className="row row-gap-4 justify-content-center">
            {Array.from({ length: 4 }).map((_, i) => (
              <div className="col-xxl-3 col-lg-4 col-md-6" key={i}>
                <div className="trending-list-item">
                  <div className="place-img" style={{ height: 200, background: "#f0f0f0" }} />
                  <div className="place-content">
                    <div style={{ height: 20, background: "#f0f0f0", marginBottom: 8, borderRadius: 4 }} />
                    <div style={{ height: 16, background: "#f0f0f0", width: "60%", borderRadius: 4 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!results || results.length === 0) return null;

  return (
    <section className="section featured-services">
      <div className="container">
        <div className="section-header-eight text-center wow fadeInUp">
          <h2>
            Explore Tunisia{" "}
            <img
              src="./assets/img/bg/heading-bg-01.png"
              alt=""
            />{" "}
            Services
          </h2>
          <p className="text-muted">Real services from Tunisia. Send a request and our team will follow up — no online payment required.</p>
        </div>

        {results.map(({ key, items }) => {
          const cfg = CATEGORY_CONFIG[key];
          return (
            <div className="mb-5" key={key}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h4 className="fw-semibold mb-0">
                  <i className={`${cfg.icon} me-2`} />
                  {cfg.label}
                </h4>
                <Link to={cfg.listRoute} className="btn btn-outline-primary btn-sm">
                  View All
                </Link>
              </div>
              <div className="row row-gap-4">
                {items.map((item) => (
                  <div className="col-xxl-4 col-lg-4 col-md-6" key={item.id}>
                    <div className="trending-list-item">
                      <div className="place-img">
                        <Link to={`${cfg.detailRoute}?id=${item.id}`}>
                          <ImageWithBasePath
                            src={item.image}
                            className="img-fluid"
                            alt={item.title}
                            fallbackSrc={getCategoryFallbackSrc(CATEGORY_FALLBACK[key])}
                          />
                        </Link>
                        <div className="fav-item d-flex align-items-center gap-2 flex-wrap">
                          <span className="badge bg-white text-dark">
                            {item.reviewsCount > 0
                              ? `${item.reviewsCount} review${item.reviewsCount !== 1 ? "s" : ""}`
                              : "New"}
                          </span>
                        </div>
                      </div>
                      <div className="place-content">
                        <h3 className="text-truncate mb-2 home-eight-title">
                          <Link to={`${cfg.detailRoute}?id=${item.id}`}>
                            {item.title}
                          </Link>
                        </h3>
                        {item.location && (
                          <div className="d-flex align-items-center mb-2">
                            <i className="isax isax-location text-muted me-1" />
                            <span className="text-muted small text-truncate">{item.location}</span>
                          </div>
                        )}
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center">
                            <i className="isax isax-star text-warning me-1" />
                            <span className="me-2">
                              {item.rating > 0 ? item.rating.toFixed(1) : "—"}
                            </span>
                            {item.price > 0 && (
                              <span className="text-primary fw-semibold">
                                {item.price} TND
                              </span>
                            )}
                          </div>
                          <Link
                            to={`${cfg.detailRoute}?id=${item.id}`}
                            className="btn btn-primary btn-sm rounded"
                          >
                            Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FeaturedServices;
