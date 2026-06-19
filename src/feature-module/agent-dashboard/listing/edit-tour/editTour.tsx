import React, { useEffect, useMemo, useState } from 'react'
import { all_routes } from '../../../router/all_routes';
import Breadcrumb from '../../../../core/common/Breadcrumb/breadcrumb';
import ImageWithBasePath from '../../../../core/common/imageWithBasePath';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import DefaultEditor from "react-simple-wysiwyg";
import CustomSelect from '../../../../core/common/commonSelect';
import { CountryOption, Days, Nights, tourCategory } from '../../../../core/common/selectOption/json/selectOption';
import { DatePicker } from 'antd';
import AddFaq from '../../../../core/common/modal/addFaq';
import DeleteModal from '../../../../core/common/modal/deleteModal';
import { useAuth } from '../../../../core/contexts/AuthContext';
import {
  createAgentListing,
  updateAgentListing,
  deleteAgentListing,
  submitListingForReview,
  getAgentListing,
  type ListingCollection,
} from '../../../../core/services/agentServices';
import { uploadAgentImageWithProgress, cleanupReplacedAgentImage, type AgentStorageCategory } from '../../../../core/services/agentStorage';

const COLLECTION: ListingCollection = 'tours';

interface TourForm {
  title: string;
  category: string;
  startDate: string;
  endDate: string;
  destination: string;
  durationDays: string;
  durationNights: string;
  maxPeople: string;
  price: string;
  offerPrice: string;
  minAge: string;
  country: string;
  city: string;
  state: string;
  zipCode: string;
  address: string;
  address1: string;
  highlights: string[];
  description: string;
  image: string;
  gallery: string[];
}

const defaultForm: TourForm = {
  title: '',
  category: '',
  startDate: '',
  endDate: '',
  destination: '',
  durationDays: '',
  durationNights: '',
  maxPeople: '',
  price: '',
  offerPrice: '',
  minAge: '',
  country: '',
  city: '',
  state: '',
  zipCode: '',
  address: '',
  address1: '',
  highlights: [],
  description: '',
  image: '',
  gallery: [],
};

const EditTour = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const agentId = currentUser?.uid;
  const listingId = searchParams.get('id');

  const [form, setForm] = useState<TourForm>(defaultForm);
  const [loading, setLoading] = useState(!!listingId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState('');
  const [tourMeta, setTourMeta] = useState<{ approvalStatus?: string; published?: boolean; featured?: boolean; rejectedReason?: string }>({});

  const breadcrumbs = [
    { label: 'Tour Details', link: routes.allService1, active: false },
    { label: listingId ? 'Edit Tour' : 'Add Tour', active: true },
  ];

  useEffect(() => {
    const load = async () => {
      if (!listingId || !agentId) {
        setLoading(false);
        return;
      }
      try {
        const data = await getAgentListing(COLLECTION, listingId, agentId);
        if (data) {
          const approvalStatus = String(data.approvalStatus || data.status || 'draft');
          setForm({
            title: data.title || data.name || '',
            category: data.category || '',
            startDate: data.startDate || '',
            endDate: data.endDate || '',
            destination: data.destination || '',
            durationDays: data.durationDays || '',
            durationNights: data.durationNights || '',
            maxPeople: data.maxPeople || data.totalPeople || '',
            price: data.price ? String(data.price) : '',
            offerPrice: data.offerPrice ? String(data.offerPrice) : '',
            minAge: data.minAge ? String(data.minAge) : '',
            country: data.country || '',
            city: data.city || '',
            state: data.state || '',
            zipCode: data.zipCode || '',
            address: data.address || '',
            address1: data.address1 || '',
            highlights: Array.isArray(data.highlights) ? data.highlights : [],
            description: data.description || '',
            image: data.image || '',
            gallery: Array.isArray(data.gallery) ? data.gallery : [],
          });
          setTourMeta({
            approvalStatus,
            published: !!data.published,
            featured: !!data.featured,
            rejectedReason: data.rejectedReason || data.rejectionReason || '',
          });
          setImagePreview(data.image || '');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tour');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [listingId, agentId]);

  const updateField = <K extends keyof TourForm>(key: K, value: TourForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addHighlight = () => updateField('highlights', [...form.highlights, '']);
  const removeHighlight = (index: number) => updateField('highlights', form.highlights.filter((_, i) => i !== index));
  const updateHighlight = (index: number, value: string) => {
    const updated = [...form.highlights];
    updated[index] = value;
    updateField('highlights', updated);
  };

  const handleImageUpload = async (file: File, isGallery: boolean) => {
    if (!agentId) return;
    if (!listingId) {
      setError('Save the draft first so the image can be stored under the tour ID.');
      return;
    }
    setUploadingImage(true);
    setUploadProgress(0);
    try {
      const upload = uploadAgentImageWithProgress(
        agentId,
        COLLECTION as AgentStorageCategory,
        listingId,
        file,
        (state) => {
          setUploadProgress(state.progress);
          if (!isGallery && state.preview) {
            setImagePreview(state.preview);
          }
        }
      );
      const result = await upload.promise;
      if (isGallery) {
        updateField('gallery', [...form.gallery, result.url]);
      } else {
        const previousUrl = form.image;
        updateField('image', result.url);
        setImagePreview(result.url);
        if (listingId && previousUrl) {
          await cleanupReplacedAgentImage(previousUrl, agentId);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeGalleryItem = async (index: number) => {
    updateField('gallery', form.gallery.filter((_, i) => i !== index));
  };

  const buildPayload = () => {
    const price = parseFloat(form.price);
    const offerPrice = form.offerPrice ? parseFloat(form.offerPrice) : undefined;
    return {
      title: form.title,
      category: form.category,
      startDate: form.startDate,
      endDate: form.endDate,
      destination: form.destination,
      durationDays: form.durationDays,
      durationNights: form.durationNights,
      maxPeople: form.maxPeople,
      price: isNaN(price) ? 0 : price,
      offerPrice: offerPrice && !isNaN(offerPrice) ? offerPrice : undefined,
      minAge: form.minAge,
      country: form.country,
      city: form.city,
      state: form.state,
      zipCode: form.zipCode,
      address: form.address,
      address1: form.address1,
      highlights: form.highlights,
      description: form.description,
      image: form.image,
      gallery: form.gallery,
      location: form.city || form.destination || '',
    };
  };

  const handleSave = async (e?: React.FormEvent, submitForReviewAfter = false) => {
    e?.preventDefault();
    if (!agentId) {
      setError('You must be signed in.');
      return;
    }
    if (!form.title.trim()) {
      setError('Tour name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      let id = listingId;
      const payload = buildPayload();
      if (id) {
        await updateAgentListing(COLLECTION, id, payload, agentId);
      } else {
        id = await createAgentListing(COLLECTION, payload, agentId);
      }
      if (submitForReviewAfter && id) {
        await submitListingForReview(COLLECTION, id, agentId);
      }
      setSuccess(submitForReviewAfter ? 'Tour submitted for review.' : 'Tour saved as draft.');
      if (!listingId && id) {
        navigate(`${routes.editTour}?id=${id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!listingId || !agentId) return;
    try {
      await deleteAgentListing(COLLECTION, listingId, agentId);
      navigate(routes.agentListing);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setDeleteConfirm(false);
    }
  };

  const categoryOption = useMemo(() => tourCategory.find((o) => o.value === form.category) || null, [form.category]);
  const daysOption = useMemo(() => Days.find((o) => o.value === form.durationDays) || null, [form.durationDays]);
  const nightsOption = useMemo(() => Nights.find((o) => o.value === form.durationNights) || null, [form.durationNights]);
  const countryOption = useMemo(() => CountryOption.find((o) => o.value === form.country) || null, [form.country]);

  if (loading) {
    return (
      <div className="content text-center py-5">
        <span className="spinner-border spinner-border-sm text-primary me-2" />
        Loading tour...
      </div>
    );
  }

  return (
    <>
      <Breadcrumb title={listingId ? 'Edit Tour' : 'Add Tour'} breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-02" />
      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-lg-3">
              <div className="card border-0 mb-4 mb-lg-0 theiaStickySidebar">
                <div className="card-body">
                  <div>
                    <h5 className="mb-3">{listingId ? 'Edit Tour' : 'Add Tour'}</h5>
                    <ul id="list-example" className="add-tab-list">
                      <li><Link to="#basic_info">Tour Details</Link></li>
                      <li><Link to="#location">Locations</Link></li>
                      <li><Link to="#highlights">Highlights</Link></li>
                      <li><Link to="#description">Description</Link></li>
                      <li><Link to="#gallery">Gallery</Link></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-9">
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <form onSubmit={(e) => handleSave(e)} data-bs-spy="scroll" data-bs-target="#list-example" data-bs-smooth-scroll="true">
                <div className="card shadow-none" id="basic_info">
                  <div className="card-header"><h5 className="fs-18">Tour Details</h5></div>
                  <div className="card-body pb-1">
                    <div className="alert alert-light border d-flex flex-wrap gap-3 align-items-center mb-3">
                      <span><strong>Approval:</strong> {tourMeta.approvalStatus || 'draft'}</span>
                      <span><strong>Published:</strong> {tourMeta.published ? 'Yes' : 'No'}</span>
                      <span><strong>Featured:</strong> {tourMeta.featured ? 'Yes' : 'No'}</span>
                      {tourMeta.rejectedReason && <span className="text-danger"><strong>Rejection:</strong> {tourMeta.rejectedReason}</span>}
                    </div>
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Tour Name</label>
                          <input type="text" className="form-control" value={form.title} onChange={(e) => updateField('title', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Category</label>
                          <CustomSelect
                            options={tourCategory}
                            className="select d-flex"
                            placeholder="Select"
                            value={categoryOption}
                            onChange={(selected: any) => updateField('category', selected?.value || '')}
                          />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Start Date</label>
                          <DatePicker
                            className="form-control datetimepicker"
                            placeholder="dd/mm/yyyy"
                            format="DD-MM-YYYY"
                            value={form.startDate ? dayjs(form.startDate, 'DD-MM-YYYY') : null}
                            onChange={(date) => updateField('startDate', date ? date.format('DD-MM-YYYY') : '')}
                          />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">End Date</label>
                          <DatePicker
                            className="form-control datetimepicker"
                            placeholder="dd/mm/yyyy"
                            format="DD-MM-YYYY"
                            value={form.endDate ? dayjs(form.endDate, 'DD-MM-YYYY') : null}
                            onChange={(date) => updateField('endDate', date ? date.format('DD-MM-YYYY') : '')}
                          />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Destination</label>
                          <input type="text" className="form-control" value={form.destination} onChange={(e) => updateField('destination', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Duration (Days)</label>
                          <CustomSelect
                            options={Days}
                            className="select d-flex"
                            placeholder="Select"
                            value={daysOption}
                            onChange={(selected: any) => updateField('durationDays', selected?.value || '')}
                          />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Duration (Nights)</label>
                          <CustomSelect
                            options={Nights}
                            className="select d-flex"
                            placeholder="Select"
                            value={nightsOption}
                            onChange={(selected: any) => updateField('durationNights', selected?.value || '')}
                          />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Total Number Of Peoples</label>
                          <input type="text" className="form-control" value={form.maxPeople} onChange={(e) => updateField('maxPeople', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Pricing (USD)</label>
                          <input type="number" className="form-control" value={form.price} onChange={(e) => updateField('price', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Offer Price (USD)</label>
                          <input type="number" className="form-control" value={form.offerPrice} onChange={(e) => updateField('offerPrice', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Min Age</label>
                          <input type="number" className="form-control" value={form.minAge} onChange={(e) => updateField('minAge', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card shadow-none" id="location">
                  <div className="card-header"><h5 className="fs-18">Location</h5></div>
                  <div className="card-body pb-1">
                    <div className="row">
                      <div className="col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Country</label>
                          <CustomSelect
                            options={CountryOption}
                            className="select d-flex"
                            placeholder="Select"
                            value={countryOption}
                            onChange={(selected: any) => updateField('country', selected?.value || '')}
                          />
                        </div>
                      </div>
                      <div className="col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">City</label>
                          <input type="text" className="form-control" value={form.city} onChange={(e) => updateField('city', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">State</label>
                          <input type="text" className="form-control" value={form.state} onChange={(e) => updateField('state', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Zip Code</label>
                          <input type="text" className="form-control" value={form.zipCode} onChange={(e) => updateField('zipCode', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Address</label>
                          <input type="text" className="form-control" value={form.address} onChange={(e) => updateField('address', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Address 1</label>
                          <input type="text" className="form-control" value={form.address1} onChange={(e) => updateField('address1', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card shadow-none" id="highlights">
                  <div className="card-header"><h5 className="fs-18">Highlights</h5></div>
                  <div className="card-body">
                    {form.highlights.map((highlight, index) => (
                      <div key={index} className="mb-3">
                        <label>Highlight</label>
                        <div className="d-flex">
                          <input type="text" className="form-control" value={highlight} onChange={(e) => updateHighlight(index, e.target.value)} />
                          <Link to="#" onClick={() => removeHighlight(index)} className="text-danger trash-icon d-flex align-items-center justify-content-center ms-3">
                            <i className="isax isax-trash"></i>
                          </Link>
                        </div>
                      </div>
                    ))}
                    <Link to="#" onClick={addHighlight} className="btn btn-primary btn-sm add-highlight">
                      <i className="isax isax-add-circle me-1" /> Add New
                    </Link>
                  </div>
                </div>
                <div className="card shadow-none" id="gallery">
                  <div className="card-header"><h5 className="fs-18">Gallery</h5></div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label">Main Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control"
                        disabled={uploadingImage}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, false);
                        }}
                      />
                      {uploadingImage && <div className="small text-muted mt-1">Uploading... {uploadProgress}%</div>}
                      {imagePreview && (
                        <div className="mt-2" style={{ width: '120px', height: '80px' }}>
                          <ImageWithBasePath src={imagePreview} className="img-fluid rounded" alt="Main" />
                        </div>
                      )}
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Gallery Images</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control"
                        disabled={uploadingImage}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, true);
                        }}
                      />
                    </div>
                    <div className="d-flex align-items-center flex-wrap gap-2">
                      {form.gallery.map((src, index) => (
                        <div key={index} className="position-relative" style={{ width: '80px', height: '80px' }}>
                          <ImageWithBasePath src={src} className="img-fluid rounded w-100 h-100 object-fit-cover" alt={`Gallery ${index}`} />
                          <span className="trash-icon d-flex align-items-center justify-content-center text-danger gallery-trash" onClick={() => removeGalleryItem(index)}>
                            <i className="isax isax-trash" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="card shadow-none" id="description">
                  <div className="card-header"><h5 className="fs-18">Description</h5></div>
                  <div className="card-body text-editor">
                    <DefaultEditor value={form.description} onChange={(e: any) => updateField('description', e.target.value)} />
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-center flex-wrap gap-2 mb-4">
                  <button type="button" className="btn btn-light" onClick={() => navigate(routes.agentListing)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving && <span className="spinner-border spinner-border-sm me-2" />}
                    Save Draft
                  </button>
                  {listingId && (
                    <>
                      <button type="button" className="btn btn-warning" disabled={saving} onClick={(e) => handleSave(e as any, true)}>
                        Submit for Review
                      </button>
                      <button type="button" className="btn btn-danger" onClick={() => setDeleteConfirm(true)}>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <AddFaq />
      <DeleteModal />

      {deleteConfirm && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button type="button" className="btn-close" onClick={() => setDeleteConfirm(false)} />
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this tour? Only draft/rejected tours can be deleted.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setDeleteConfirm(false)}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditTour;
