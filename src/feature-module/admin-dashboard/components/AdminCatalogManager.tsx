import React, { useEffect, useMemo, useState } from 'react';
import {
  fetchCollectionItems,
  addCatalogItem,
  updateCatalogItem,
  updateResortModeration,
  updateChaletModeration,
  deleteCatalogItem,
} from '../../../core/services/firebaseServices';
import { useAuth } from '../../../core/contexts/AuthContext';
import ImageUpload from './ImageUpload';

type FieldType = 'text' | 'number' | 'textarea' | 'checkbox' | 'image' | 'gallery' | 'select' | 'tags';

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
}

interface AdminCatalogManagerProps {
  title: string;
  collectionName: string;
  fields: FieldConfig[];
  defaultItem: Record<string, any>;
  resortModeration?: boolean;
  chaletModeration?: boolean;
}

const AdminCatalogManager: React.FC<AdminCatalogManagerProps> = ({
  title,
  collectionName,
  fields,
  defaultItem,
  resortModeration = false,
  chaletModeration = false,
}) => {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'unpublished'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>(defaultItem);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageSuccess, setPageSuccess] = useState<string | null>(null);
  const adminUploadFolder = currentUser?.uid ? `users/${currentUser.uid}/profile` : 'users/admin/profile';

  const loadItems = async () => {
    setLoading(true);
    setPageError(null);
    try {
      const data = await fetchCollectionItems(collectionName);
      setItems(data);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [collectionName]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const text = String(item.title || item.name || '').toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'published'
          ? item.published !== false
          : item.published === false;
      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  const openAdd = () => {
    setForm(defaultItem);
    setEditingId(null);
    setFormError(null);
    setPageSuccess(null);
    setModalOpen(true);
  };

  const openEdit = (item: any) => {
    setForm({ ...defaultItem, ...item });
    setEditingId(item.id);
    setFormError(null);
    setPageSuccess(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setDeleteId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const requiredMissing = fields.some((f) => f.required && !form[f.name] && form[f.name] !== 0);
    if (requiredMissing) {
      setFormError('Please fill all required fields.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = { ...form };
      delete payload.id;
      if ((resortModeration || chaletModeration) && payload.published === true) {
        payload.approvalStatus = 'approved';
        payload.status = 'approved';
        payload.rejectionReason = '';
        payload.rejectedReason = '';
      }
      if (editingId) {
        await updateCatalogItem(collectionName, editingId, payload);
        setPageSuccess('Record updated.');
      } else {
        await addCatalogItem(collectionName, payload);
        setPageSuccess('Record created.');
      }
      await loadItems();
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCatalogItem(collectionName, deleteId);
      await loadItems();
      setDeleteId(null);
      setPageSuccess('Record deleted.');
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const toggleField = async (item: any, field: string) => {
    try {
      await updateCatalogItem(collectionName, item.id, { [field]: !item[field] });
      await loadItems();
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleResortModeration = async (item: any, action: 'approve' | 'reject' | 'unpublish') => {
    try {
      const rejectionReason = action === 'reject'
        ? window.prompt('Optional rejection reason', item.rejectionReason || item.rejectedReason || '') || ''
        : undefined;
      await updateResortModeration(item.id, action, rejectionReason);
      await loadItems();
      setPageSuccess(
        action === 'approve'
          ? 'Resort approved and published.'
          : action === 'reject'
          ? 'Resort rejected.'
          : 'Resort unpublished.'
      );
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Moderation update failed');
    }
  };

  const handleChaletModeration = async (item: any, action: 'approve' | 'reject' | 'unpublish') => {
    try {
      const rejectionReason = action === 'reject'
        ? window.prompt('Optional rejection reason', item.rejectionReason || item.rejectedReason || '') || ''
        : undefined;
      await updateChaletModeration(item.id, action, rejectionReason);
      await loadItems();
      setPageSuccess(
        action === 'approve'
          ? 'Chalet approved and published.'
          : action === 'reject'
          ? 'Chalet rejected.'
          : 'Chalet unpublished.'
      );
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Moderation update failed');
    }
  };

  const updateFormField = (name: string, value: any) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const renderFieldInput = (field: FieldConfig) => {
    const value = form[field.name];
    if (field.type === 'textarea') {
      return (
        <textarea
          className="form-control"
          rows={3}
          value={value || ''}
          onChange={(e) => updateFormField(field.name, e.target.value)}
          required={field.required}
        />
      );
    }
    if (field.type === 'checkbox') {
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
    if (field.type === 'image') {
      return (
          <ImageUpload
          value={value || ''}
          onChange={(url) => updateFormField(field.name, url)}
          label={field.label}
          storageFolder={adminUploadFolder}
          inputTestId={`admin-image-upload-${field.name}`}
        />
      );
    }
    if (field.type === 'gallery') {
      const gallery: string[] = Array.isArray(value) ? value : [];
      return (
        <div>
          <ImageUpload
            value=""
            onChange={(url) => updateFormField(field.name, [...gallery, url])}
            label="Add Gallery Image"
            storageFolder={adminUploadFolder}
            inputTestId={`admin-gallery-upload-${field.name}`}
          />
          <div className="d-flex flex-wrap gap-2 mt-2">
            {gallery.map((img, i) => (
              <div key={i} className="position-relative border rounded p-1" style={{ width: '80px', height: '80px' }}>
                <img src={img} alt="" className="img-fluid rounded" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  className="btn btn-sm btn-danger position-absolute top-0 end-0 p-0"
                  style={{ width: '20px', height: '20px', fontSize: '10px' }}
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
    if (field.type === 'select') {
      return (
        <select
          className="form-select"
          value={value || ''}
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
    if (field.type === 'tags') {
      const tags: string[] = Array.isArray(value) ? value : typeof value === 'string' && value ? [value] : [];
      return (
        <div>
          <input
            type="text"
            className="form-control"
            placeholder="Type and press Enter"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const val = (e.target as HTMLInputElement).value.trim();
                if (val && !tags.includes(val)) {
                  updateFormField(field.name, [...tags, val]);
                  (e.target as HTMLInputElement).value = '';
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
                  style={{ fontSize: '12px', lineHeight: 1 }}
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
        type={field.type === 'number' ? 'number' : 'text'}
        className="form-control"
        min={field.type === 'number' ? 0 : undefined}
        value={value === undefined || value === null ? '' : value}
        onChange={(e) =>
          updateFormField(field.name, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)
        }
        required={field.required}
      />
    );
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
        <h3 className="mb-0">{title}</h3>
        <button className="btn btn-primary d-flex align-items-center" onClick={openAdd}>
          <i className="isax isax-add me-2" />
          Add {title.replace('Management', '').replace('Settings', '').trim()}
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-body d-flex flex-wrap gap-3">
          <div className="flex-grow-1" style={{ minWidth: '240px' }}>
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
            style={{ width: '180px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
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
                  <th>Location</th>
                  <th>Price</th>
                  <th>Rating</th>
                    <th>Featured</th>
                    <th>{resortModeration || chaletModeration ? 'Approval' : 'Published'}</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      <span className="spinner-border spinner-border-sm text-primary me-2" />
                      Loading...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const approvalStatus = String(item.approvalStatus || item.status || 'draft').replace(/_/g, ' ');
                    const rejectionReason = item.rejectionReason || item.rejectedReason;
                    return (
                    <tr key={item.id}>
                      <td>
                        <img
                          src={item.mainImage || item.image || item.gallery?.[0] || 'assets/img/banner/banner-01.jpg'}
                          alt=""
                          style={{ width: '60px', height: '45px', objectFit: 'cover' }}
                          className="rounded"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.src.includes('banner-01.jpg')) {
                              target.src = 'assets/img/banner/banner-01.jpg';
                            }
                          }}
                        />
                      </td>
                      <td className="fw-medium">
                        <div>{item.title || item.name}</div>
                        {(resortModeration || chaletModeration) && rejectionReason && (
                          <div className="small text-danger">Rejection: {rejectionReason}</div>
                        )}
                      </td>
                      <td>{item.location || '—'}</td>
                      <td>{`${item.currency || 'TND'} ${item.price ?? item.startingPrice ?? item.pricePerNight ?? 0}`}</td>
                      <td>{typeof item.rating === 'number' && item.rating > 0 ? item.rating : '—'}</td>
                      <td>
                        <button
                          data-testid={`admin-featured-toggle-${item.id}`}
                          className={`btn btn-sm ${item.featured ? 'btn-warning' : 'btn-light'}`}
                          onClick={() => toggleField(item, 'featured')}
                        >
                          {item.featured ? 'Featured' : 'Not Featured'}
                        </button>
                      </td>
                      <td>
                        {resortModeration || chaletModeration ? (
                          <span
                            className={`badge ${item.published ? 'bg-success' : approvalStatus === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}
                            data-testid={`admin-approval-status-${item.id}`}
                          >
                            {approvalStatus}
                          </span>
                        ) : (
                          <button
                            data-testid={`admin-published-status-${item.id}`}
                            className={`btn btn-sm ${item.published !== false ? 'btn-success' : 'btn-secondary'}`}
                            onClick={() => toggleField(item, 'published')}
                          >
                            {item.published !== false ? 'Published' : 'Unpublished'}
                          </button>
                        )}
                      </td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-light me-2" data-testid={`admin-edit-${item.id}`} onClick={() => openEdit(item)}>
                          <i className="isax isax-edit-2" />
                        </button>
                        {resortModeration && (
                          <>
                            <button
                              className="btn btn-sm btn-success me-2"
                              data-testid={`admin-approve-${item.id}`}
                              onClick={() => handleResortModeration(item, 'approve')}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-sm btn-warning me-2"
                              data-testid={`admin-reject-${item.id}`}
                              onClick={() => handleResortModeration(item, 'reject')}
                            >
                              Reject
                            </button>
                            {item.published && (
                              <button
                                className="btn btn-sm btn-secondary me-2"
                                data-testid={`admin-unpublish-${item.id}`}
                                onClick={() => handleResortModeration(item, 'unpublish')}
                              >
                                Unpublish
                              </button>
                            )}
                          </>
                        )}
                        {chaletModeration && (
                          <>
                            <button
                              className="btn btn-sm btn-success me-2"
                              data-testid={`admin-approve-${item.id}`}
                              onClick={() => handleChaletModeration(item, 'approve')}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-sm btn-warning me-2"
                              data-testid={`admin-reject-${item.id}`}
                              onClick={() => handleChaletModeration(item, 'reject')}
                            >
                              Reject
                            </button>
                            {item.published && (
                              <button
                                className="btn btn-sm btn-secondary me-2"
                                data-testid={`admin-unpublish-${item.id}`}
                                onClick={() => handleChaletModeration(item, 'unpublish')}
                              >
                                Unpublish
                              </button>
                            )}
                          </>
                        )}
                        <button className="btn btn-sm btn-danger" data-testid={`admin-delete-${item.id}`} onClick={() => setDeleteId(item.id)}>
                          <i className="isax isax-trash" />
                        </button>
                      </td>
                    </tr>
                  )})
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">{editingId ? 'Edit' : 'Add'} {title.replace('Management', '').replace('Settings', '').trim()}</h5>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>
                <div className="modal-body">
                  {formError && <div className="alert alert-danger">{formError}</div>}
                  <div className="row">
                    {fields.map((field) => (
                      <div
                        className={`mb-3 ${field.type === 'textarea' || field.type === 'gallery' ? 'col-12' : 'col-md-6'}`}
                        key={field.name}
                      >
                        {field.type !== 'checkbox' && <label className="form-label">{field.label}</label>}
                        {renderFieldInput(field)}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving && <span className="spinner-border spinner-border-sm me-2" />}
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
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

export default AdminCatalogManager;
