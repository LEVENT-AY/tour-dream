import { useEffect, useMemo, useState } from "react";
import { all_routes } from "../../router/all_routes";
import Breadcrumb from "../../../core/common/Breadcrumb/breadcrumb";
import Sidebar from "../sidebar/sidebar";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { useAuth } from "../../../core/contexts/AuthContext";
import {
  fetchAgentListings,
  deleteAgentListing,
  submitListingForReview,
  type ListingCollection,
  type ListingStatus,
  type AgentListing,
  AGENT_LISTING_COLLECTIONS,
} from "../../../core/services/agentServices";
import AgentCatalogManager from "./AgentCatalogManager";

const collectionLabels: Record<ListingCollection, string> = {
  tours: "Tours",
  hotels: "Hotels",
  flights: "Flights",
  cars: "Cars",
  activities: "Activities",
  resorts: "Resorts",
  chalets: "Chalets",
};

const collectionRoutes: Record<ListingCollection, string> = {
  tours: all_routes.editTour,
  hotels: all_routes.editHotel,
  flights: all_routes.editFlight,
  cars: all_routes.editCar,
  activities: "#",
  resorts: `${all_routes.agentListing}?collection=resorts`,
  chalets: `${all_routes.agentListing}?collection=chalets`,
};

const statusBadgeClass: Record<ListingStatus, string> = {
  draft: "badge-secondary",
  pending_review: "badge-warning",
  approved: "badge-success",
  rejected: "badge-danger",
  suspended: "badge-dark",
};

const AgentListings = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, isAgent } = useAuth();

  const [listings, setListings] = useState<AgentListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ListingStatus | "all">("all");
  const [activeTab, setActiveTab] = useState<ListingCollection | "all">("tours");
  const [deleteTarget, setDeleteTarget] = useState<AgentListing | null>(null);

  const agentId = currentUser?.uid;

  useEffect(() => {
    const collectionParam = searchParams.get("collection") as ListingCollection | null;
    if (collectionParam && AGENT_LISTING_COLLECTIONS.includes(collectionParam)) {
      setActiveTab(collectionParam);
    }
  }, [searchParams]);

  const load = async () => {
    if (!agentId) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await fetchAgentListings(
        agentId,
        activeTab === "all" ? undefined : activeTab,
        statusFilter === "all" ? undefined : statusFilter
      );
      setListings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, activeTab, statusFilter]);

  const filteredListings = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return listings;
    return listings.filter((item) => {
      const title = String(item.title || item.name || "").toLowerCase();
      const location = String(item.location || item.city || item.country || "").toLowerCase();
      return title.includes(term) || location.includes(term);
    });
  }, [listings, search]);

  const handleEdit = (item: AgentListing) => {
    const route = collectionRoutes[item.collection as ListingCollection];
    if (route === "#") {
      navigate(`/agent/agent-listings?collection=${item.collection}`);
    } else {
      navigate(`${route}?id=${item.id}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !agentId) return;
    try {
      await deleteAgentListing(
        deleteTarget.collection as ListingCollection,
        deleteTarget.id,
        agentId
      );
      setSuccess(deleteTarget.collection === 'hotels' ? 'Draft hotel deleted.' : deleteTarget.collection === 'flights' ? 'Draft flight deleted.' : 'Draft listing deleted.');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleSubmitForReview = async (item: AgentListing) => {
    if (!agentId) return;
    try {
      await submitListingForReview(
        item.collection as ListingCollection,
        item.id,
        agentId
      );
      setSuccess(item.collection === 'hotels' ? 'Hotel submitted for review.' : item.collection === 'flights' ? 'Flight submitted for review.' : 'Listing submitted for review.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    }
  };

  const createRoute = activeTab === 'tours'
    ? routes.addTour
    : activeTab === 'hotels'
    ? routes.editHotel
    : activeTab === 'flights'
    ? routes.editFlight
    : activeTab === 'cars'
    ? routes.editCar
    : activeTab === 'activities'
    ? routes.agentListing
    : activeTab === 'resorts'
    ? `${routes.agentListing}?collection=resorts`
    : activeTab === 'chalets'
    ? `${routes.agentListing}?collection=chalets`
    : routes.addHotel;

  const breadcrumbs = [
    { label: "Agent", active: false, link: routes.agentDashboard },
    { label: "Listings", active: true },
  ];

  if (!isAgent) {
    return (
      <div className="content">
        <div className="container py-5 text-center">
          <h5>Access Denied</h5>
          <p className="text-muted">Only agents can manage listings.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb title="Listings" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-04" />
      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-xl-3 col-lg-4">
              <Sidebar />
            </div>
            <div className="col-xl-9 col-lg-8">
              <div className="card border-0 mb-4">
                <div className="card-body d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                  <div>
                    <h5 className="mb-1">My Listings</h5>
                    <p className="mb-0 text-muted">Total: {filteredListings.length}</p>
                  </div>
                  <Link to={createRoute} className="btn btn-primary d-inline-flex align-items-center">
                    <i className="isax isax-add me-1 fs-16" />
                   {activeTab === 'tours'
                      ? 'Create Tour'
                      : activeTab === 'hotels'
                      ? 'Create Hotel'
                      : activeTab === 'flights'
                      ? 'Create Flight'
                      : activeTab === 'cars'
                      ? 'Create Car'
                      : activeTab === 'activities'
                      ? 'Create Activity'
                      : activeTab === 'resorts'
                      ? 'Create Resort'
                      : activeTab === 'chalets'
                      ? 'Create Chalet'
                      : 'Add Listing'}
                  </Link>
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 mb-4">
                <div className="place-nav listing-nav overflow-auto">
                  <ul className="nav mb-2 flex-nowrap">
                    <li className="me-2">
                      <Link
                        to="#"
                        className={`nav-link ${activeTab === "all" ? "active" : ""}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab("all");
                        }}
                      >
                        All
                      </Link>
                    </li>
                    {AGENT_LISTING_COLLECTIONS.map((col: ListingCollection) => (
                      <li className="me-2" key={col}>
                        <Link
                          to="#"
                          className={`nav-link ${activeTab === col ? "active" : ""}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveTab(col);
                          }}
                        >
                          {collectionLabels[col]}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search listings..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ minWidth: "200px" }}
                  />
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as ListingStatus | "all")}
                    style={{ width: "160px" }}
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger alert-dismissible fade show">
                  {error}
                  <button type="button" className="btn-close" onClick={() => setError(null)} />
                </div>
              )}

              {success && (
                <div className="alert alert-success alert-dismissible fade show">
                  {success}
                  <button type="button" className="btn-close" onClick={() => setSuccess(null)} />
                </div>
              )}

              {activeTab === "activities" && (
                <AgentCatalogManager
                  title="Activity Management"
                  collectionName="activities"
                  defaultItem={{ title: "", category: "", price: 0, duration: "", rating: 0, reviewsCount: 0, location: "", description: "", image: "", gallery: [] }}
                  fields={[
                    { name: "title", label: "Title", type: "text", required: true },
                    { name: "category", label: "Category", type: "text" },
                    { name: "price", label: "Price", type: "number" },
                    { name: "duration", label: "Duration", type: "text" },
                    { name: "rating", label: "Rating", type: "number" },
                    { name: "reviewsCount", label: "Reviews Count", type: "number" },
                    { name: "location", label: "Location", type: "text" },
                    { name: "image", label: "Main Image", type: "image" },
                    { name: "gallery", label: "Gallery", type: "gallery" },
                    { name: "description", label: "Description", type: "textarea" },
                  ]}
                />
              )}

              {activeTab === "resorts" && (
                <AgentCatalogManager
                  title="Resort Management"
                  collectionName="resorts"
                  defaultItem={{
                    name: "",
                    description: "",
                    location: "",
                    lat: 0,
                    lng: 0,
                    startingPrice: 0,
                    rating: 0,
                    amenities: [],
                    mainImage: "",
                    gallery: [],
                    availability: true,
                  }}
                  fields={[
                    { name: "name", label: "Resort Name", type: "text", required: true },
                    { name: "description", label: "Description", type: "textarea" },
                    { name: "location", label: "Location", type: "text" },
                    { name: "lat", label: "Latitude", type: "number" },
                    { name: "lng", label: "Longitude", type: "number" },
                    { name: "startingPrice", label: "Starting Price", type: "number" },
                    { name: "rating", label: "Rating", type: "number" },
                    { name: "amenities", label: "Amenities", type: "tags" },
                    { name: "mainImage", label: "Main Image", type: "image" },
                    { name: "gallery", label: "Gallery", type: "gallery" },
                    { name: "availability", label: "Available", type: "checkbox" },
                  ]}
                />
              )}

              {activeTab === "chalets" && (
                <AgentCatalogManager
                  title="Chalet Management"
                  collectionName="chalets"
                  defaultItem={{
                    name: "",
                    description: "",
                    location: "",
                    capacity: 0,
                    bedrooms: 0,
                    bathrooms: 0,
                    pricePerNight: 0,
                    seasonalPricing: "",
                    amenities: [],
                    rating: 0,
                    reviewsCount: 0,
                    mainImage: "",
                    gallery: [],
                    availability: true,
                  }}
                  fields={[
                    { name: "name", label: "Chalet Name", type: "text", required: true },
                    { name: "description", label: "Description", type: "textarea" },
                    { name: "location", label: "Location", type: "text" },
                    { name: "capacity", label: "Capacity", type: "number" },
                    { name: "bedrooms", label: "Bedrooms", type: "number" },
                    { name: "bathrooms", label: "Bathrooms", type: "number" },
                    { name: "pricePerNight", label: "Price Per Night", type: "number" },
                    { name: "seasonalPricing", label: "Seasonal Pricing", type: "textarea" },
                    { name: "amenities", label: "Amenities", type: "tags" },
                    { name: "rating", label: "Rating", type: "number" },
                    { name: "reviewsCount", label: "Reviews Count", type: "number" },
                    { name: "mainImage", label: "Main Image", type: "image" },
                    { name: "gallery", label: "Gallery", type: "gallery" },
                    { name: "availability", label: "Available", type: "checkbox" },
                  ]}
                />
              )}

              {activeTab !== "activities" && activeTab !== "resorts" && activeTab !== "chalets" && (
                loading ? (
                <div className="text-center py-5">
                  <span className="spinner-border spinner-border-sm text-primary me-2" />
                  Loading listings...
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="card border-0">
                  <div className="card-body text-center py-5">
                    <h6>No listings found</h6>
                    <p className="text-muted mb-3">
                      {search || statusFilter !== "all"
                        ? "Try adjusting your filters."
                        : "Get started by adding your first listing."}
                    </p>
                    <Link to={createRoute} className="btn btn-primary">
                      {activeTab === 'hotels'
                        ? 'Create Hotel'
                        : activeTab === 'flights'
                        ? 'Create Flight'
                        : activeTab === 'cars'
                        ? 'Create Car'
                        : 'Create Tour'}
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="row justify-content-center">
                  {filteredListings.map((item) => {
                    const title = item.title || item.name || "Untitled";
                    const image = item.image || item.mainImage || (item.gallery?.length ? item.gallery[0] : "assets/img/banner/banner-01.jpg");
                    const price = item.price ?? item.startingPrice ?? item.pricePerNight ?? 0;
                    const status = (item.approvalStatus || item.status || "draft") as ListingStatus;
                    const canDelete = ["draft", "rejected"].includes(status);
                    const canSubmit = ["draft", "rejected"].includes(status);
                    const rejectionReason = item.rejectedReason || item.rejectionReason;

                    return (
                      <div className="col-xl-4 col-md-6 d-flex" key={`${item.collection}-${item.id}`}>
                        <div className="place-item mb-4 flex-fill">
                          <div className="place-img">
                            <Link to="#" onClick={(e) => { e.preventDefault(); handleEdit(item); }}>
                              <ImageWithBasePath src={image} className="img-fluid" alt={title} />
                            </Link>
                            <div className="edit-delete-item d-flex align-items-center">
                              <Link
                                to="#"
                                onClick={(e) => { e.preventDefault(); handleEdit(item); }}
                                className="me-2 d-inline-flex align-items-center justify-content-center"
                              >
                                <i className="isax isax-edit" />
                              </Link>
                              {canDelete && (
                                <Link
                                  to="#"
                                  onClick={(e) => { e.preventDefault(); setDeleteTarget(item); }}
                                  className="d-inline-flex align-items-center justify-content-center"
                                >
                                  <i className="isax isax-trash" />
                                </Link>
                              )}
                            </div>
                          </div>
                          <div className="place-content">
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <span className={`badge ${statusBadgeClass[status]} fs-10 fw-medium`}>
                                {status.replace("_", " ")}
                              </span>
                              <span className={`badge ${item.published ? "bg-success" : "bg-secondary"} fs-10 fw-medium`}>
                                {item.published ? "Published" : "Unpublished"}
                              </span>
                            </div>
                            <h5 className="mb-1 text-truncate">
                              <Link to="#" onClick={(e) => { e.preventDefault(); handleEdit(item); }}>
                                {title}
                              </Link>
                            </h5>
                            <p className="d-flex align-items-center mb-2">
                              <i className="isax isax-location5 me-2" />
                              {item.location || item.city || item.country || "—"}
                            </p>
                            {rejectionReason && (
                              <p className="small text-danger mb-2">
                                Rejection: {rejectionReason}
                              </p>
                            )}
                            <p className="small text-muted mb-0">Gallery: {(item.gallery || []).length} images</p>
                            <div className="d-flex align-items-center justify-content-between border-top pt-3">
                              <h5 className="text-primary text-nowrap me-2">
                                ${price}
                                <span className="fs-14 fw-normal text-default">
                                  {item.collection === "hotels" || item.collection === "resorts" || item.collection === "chalets"
                                    ? " / Night"
                                    : item.collection === "cars"
                                    ? " / Day"
                                    : ""}
                                </span>
                              </h5>
                              <div className="d-flex align-items-center gap-2">
                                {canSubmit && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-primary"
                                    onClick={() => handleSubmitForReview(item)}
                                  >
                                    Submit
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {deleteTarget && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button type="button" className="btn-close" onClick={() => setDeleteTarget(null)} />
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to delete <strong>{deleteTarget.title || deleteTarget.name}</strong>? This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setDeleteTarget(null)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentListings;
