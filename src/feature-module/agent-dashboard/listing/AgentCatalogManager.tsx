import React, { useEffect, useMemo, useState } from "react";
import {
  fetchAgentListings,
  createAgentListing,
  updateAgentListing,
  deleteAgentListing,
  submitListingForReview,
  type ListingCollection,
  type ListingStatus,
  type AgentListing,
} from "../../../core/services/agentServices";
import {
  uploadAgentImage,
  cleanupReplacedAgentImage,
  type AgentStorageCategory,
} from "../../../core/services/agentStorage";
import { useAuth } from "../../../core/contexts/AuthContext";

export interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "number" | "textarea" | "checkbox" | "image" | "gallery" | "select" | "tags";
  required?: boolean;
  options?: string[];
}

interface AgentCatalogManagerProps {
  title: string;
  collectionName: ListingCollection;
  fields: FieldConfig[];
  defaultItem: Record<string, any>;
}

const AgentCatalogManager: React.FC<AgentCatalogManagerProps> = ({
  title,
  collectionName,
  fields,
  defaultItem,
}) => {
  const { currentUser } = useAuth();
  const agentId = currentUser?.uid;

  const [items, setItems] = useState<AgentListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ListingStatus | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>(defaultItem);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageSuccess, setPageSuccess] = useState<string | null>(null);

  const loadItems = async () => {
    if (!agentId) return;
    setLoading(true);
    setPageError(null);
    try {
      const data = await fetchAgentListings(
        agentId,
        collectionName,
        statusFilter === "all" ? undefined : statusFilter
      );
      setItems(data);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to load items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, statusFilter, agentId]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => {
      const text = String(item.title || item.name || "").toLowerCase();
      return text.includes(term);
    });
  }, [items, search]);

  const openAdd = () => {
    setForm(defaultItem);
    setEditingId(null);
    setFormError(null);
    setPageSuccess(null);
    setModalOpen(true);
  };

  const openEdit = (item: AgentListing) => {
    setForm({ ...defaultItem, ...item });
    setEditingId(item.id);
    setFormError(null);
    setPageSuccess(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setDeleteId(null);
    setUploadingField(null);
  };

  const entityLabel = title.replace("Management", "").replace("Settings", "").trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentId) {
      setFormError("You must be signed in.");
      return;
    }
    const requiredMissing = fields.some(
      (f) => f.required && !form[f.name] && form[f.name] !== 0
    );
    if (requiredMissing) {
      setFormError("Please fill all required fields.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = { ...form };
      delete payload.id;
      delete payload.collection;
      if (editingId) {
        await updateAgentListing(collectionName, editingId, payload, agentId);
        setPageSuccess(`${entityLabel} updated.`);
      } else {
        await createAgentListing(collectionName, payload, agentId);
        setPageSuccess(`${entityLabel} saved as draft.`);
      }
      await loadItems();
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !agentId) return;
    try {
      await deleteAgentListing(collectionName, deleteId, agentId);
      await loadItems();
      setDeleteId(null);
      setPageSuccess(`${entityLabel} deleted.`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleSubmitForReviewClick = async (item: AgentListing) => {
    if (!agentId) return;
    try {
      await submitListingForReview(collectionName, item.id, agentId);
      await loadItems();
      setPageSuccess(`${entityLabel} submitted for review.`);
    } catch (err) {
      console.error(err);
    }
  };

  const showApprovalDetails = collectionName === "resorts" || collectionName === "chalets";

  const updateFormField = (name: string, value: any) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (fieldName: string, file: File, isGallery: boolean) => {
    if (!agentId) return;
    const listingId = editingId || "temp";
    setUploadingField(fieldName);
    try {
      const result = await uploadAgentImage(
        agentId,
        collectionName as AgentStorageCategory,
        listingId,
        file
      );
      if (isGallery) {
        const gallery: string[] = Array.isArray(form[fieldName]) ? form[fieldName] : [];
        updateFormField(fieldName, [...gallery, result.url]);
      } else {
        const previousUrl = form[fieldName];
        updateFormField(fieldName, result.url);
        if (editingId) {
          await cleanupReplacedAgentImage(previousUrl, agentId);
        }
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploadingField(null);
    }
  };

  const renderFieldInput = (field: FieldConfig) => {
    const value = form[field.name];
    if (field.type === "textarea") {
      return (
        <textarea
          className="form-control"
          rows={3}
          value={value || ""}
          data-testid={`agent-field-${field.name}`}
          onChange={(e) => updateFormField(field.name, e.target.value)}
          required={field.required}
        />
      );
    }
    if (field.type === "checkbox") {
      return (
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            checked={!!value}
            onChange={(e) => updateFormField(field.name, e.target.checked)}
            id={`field-${field.name}`}
          />
          <label className="form-check-label" htmlFor={`field-${field.name}`}>
            {field.label}
          </label>
        </div>
      );
    }
    if (field.type === "image") {
      return (
        <div>
          <input
            type="file"
            className="form-control form-control-sm"
            accept="image/*"
            data-testid={`agent-field-${field.name}`}
            disabled={uploadingField === field.name}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(field.name, file, false);
            }}
          />
          {uploadingField === field.name && (
            <div className="small text-muted mt-1">Uploading...</div>
          )}
          {value && (
            <div className="mt-2 border rounded p-1" style={{ width: "80px", height: "80px" }}>
              <img
                src={value}
                alt="Preview"
                className="img-fluid rounded"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes("banner-01.jpg")) {
                    target.src = "assets/img/banner/banner-01.jpg";
                  }
                }}
              />
            </div>
          )}
        </div>
      );
    }
    if (field.type === "gallery") {
      const gallery: string[] = Array.isArray(value) ? value : [];
      return (
        <div>
          <input
            type="file"
            className="form-control form-control-sm"
            accept="image/*"
            data-testid={`agent-field-${field.name}`}
            disabled={uploadingField === field.name}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(field.name, file, true);
            }}
          />
          <div className="d-flex flex-wrap gap-2 mt-2">
            {gallery.map((img, i) => (
              <div
                key={i}
                className="position-relative border rounded p-1"
                style={{ width: "80px", height: "80px" }}
              >
                <img
                  src={img}
                  alt=""
                  className="img-fluid rounded"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-danger position-absolute top-0 end-0 p-0"
                  style={{ width: "20px", height: "20px", fontSize: "10px" }}
                  onClick={() => updateFormField(field.name, gallery.filter((_, idx) => idx !== i))}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (field.type === "select") {
      return (
        <select
          className="form-select"
          value={value || ""}
          onChange={(e) => updateFormField(field.name, e.target.value)}
          required={field.required}
        >
          <option value="">Select {field.label}</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }
    if (field.type === "tags") {
      const tags: string[] = Array.isArray(value) ? value : typeof value === "string" && value ? [value] : [];
      return (
        <div>
          <input
            type="text"
            className="form-control"
            data-testid={`agent-field-${field.name}`}
            placeholder="Type and press Enter"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const val = (e.target as HTMLInputElement).value.trim();
                if (val && !tags.includes(val)) {
                  updateFormField(field.name, [...tags, val]);
                  (e.target as HTMLInputElement).value = "";
                }
              }
            }}
          />
          <div className="d-flex flex-wrap gap-2 mt-2">
            {tags.map((tag, i) => (
              <span key={i} className="badge bg-light text-dark border d-flex align-items-center">
                {tag}
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 ms-1 text-danger"
                  style={{ fontSize: "12px", lineHeight: 1 }}
                  onClick={() => updateFormField(field.name, tags.filter((_, idx) => idx !== i))}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      );
    }
      return (
        <input
          type={field.type === "number" ? "number" : "text"}
          className="form-control"
          value={value === undefined || value === null ? "" : value}
          data-testid={`agent-field-${field.name}`}
          onChange={(e) =>
            updateFormField(
              field.name,
              field.type === "number" ? parseFloat(e.target.value) : e.target.value
          )
        }
        required={field.required}
      />
    );
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
        <h3 className="mb-0">{title}</h3>
        <button className="btn btn-primary d-flex align-items-center" data-testid="agent-add-listing" onClick={openAdd}>
          <i className="isax isax-add me-2" />
          Add {title.replace("Management", "").trim()}
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-body d-flex flex-wrap gap-3">
          <div className="flex-grow-1" style={{ minWidth: "240px" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            style={{ width: "180px" }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ListingStatus | "all")}
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

      {pageError && <div className="alert alert-danger">{pageError}</div>}
      {pageSuccess && <div className="alert alert-success">{pageSuccess}</div>}

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Published</th>
                  <th>Price</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      <span className="spinner-border spinner-border-sm text-primary me-2" />
                      Loading...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const status = item.status || "draft";
                    const canEdit = ["draft", "rejected"].includes(status);
                    const approvalStatus = String(item.approvalStatus || item.status || "draft");
                    const rejectionReason = item.rejectedReason || item.rejectionReason;
                    return (
                      <tr key={item.id}>
                        <td>
                          <img
                            src={item.mainImage || item.image || item.gallery?.[0] || "assets/img/banner/banner-01.jpg"}
                            alt=""
                            style={{ width: "60px", height: "45px", objectFit: "cover" }}
                            className="rounded"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.src.includes("banner-01.jpg")) {
                                target.src = "assets/img/banner/banner-01.jpg";
                              }
                            }}
                          />
                        </td>
                        <td className="fw-medium">
                          <div>{item.title || item.name}</div>
                          {showApprovalDetails && (
                            <>
                              <div className="small text-muted" data-testid={`agent-approval-status-${item.id}`}>
                                Approval: {approvalStatus.replace("_", " ")}
                              </div>
                              {rejectionReason && <div className="small text-danger">Rejection: {rejectionReason}</div>}
                            </>
                          )}
                        </td>
                        <td>
                          <span className={`badge bg-light text-dark border`}>
                            {status.replace("_", " ")}
                          </span>
                        </td>
                        <td>{item.published ? "Yes" : "No"}</td>
                        <td>${item.price ?? item.startingPrice ?? item.pricePerNight ?? 0}</td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-light me-2"
                            data-testid={`agent-edit-${item.id}`}
                            onClick={() => openEdit(item)}
                            disabled={!canEdit}
                            title={canEdit ? "Edit" : "Only draft/rejected listings can be edited"}
                          >
                            <i className="isax isax-edit-2" />
                          </button>
                          {canEdit && (
                            <button
                              className="btn btn-sm btn-warning me-2"
                              data-testid={`agent-submit-for-review-${item.id}`}
                              onClick={() => handleSubmitForReviewClick(item)}
                            >
                              Submit
                            </button>
                          )}
                          {canEdit && (
                            <button
                              className="btn btn-sm btn-danger"
                              data-testid={`agent-delete-${item.id}`}
                              onClick={() => setDeleteId(item.id)}
                            >
                              <i className="isax isax-trash" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingId ? "Edit" : "Add"} {title.replace("Management", "").trim()}
                  </h5>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>
                <div className="modal-body">
                  {formError && <div className="alert alert-danger">{formError}</div>}
                  <div className="row">
                    {fields.map((field) => (
                      <div
                        className={`mb-3 ${
                          field.type === "textarea" || field.type === "gallery" ? "col-12" : "col-md-6"
                        }`}
                        key={field.name}
                      >
                        {field.type !== "checkbox" && <label className="form-label">{field.label}</label>}
                        {renderFieldInput(field)}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" data-testid="agent-save-draft" disabled={saving}>
                    {saving && <span className="spinner-border spinner-border-sm me-2" />}
                    Save Draft
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button type="button" className="btn-close" onClick={() => setDeleteId(null)} />
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this record? This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setDeleteId(null)}>
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

export default AgentCatalogManager;
