import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Category, CountryOption, StarRating } from '../../../../core/common/selectOption/json/selectOption';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import DefaultEditor from "react-simple-wysiwyg";
import { all_routes } from '../../../router/all_routes';
import Breadcrumb from '../../../../core/common/Breadcrumb/breadcrumb';
import CustomSelect from '../../../../core/common/commonSelect';
import ImageWithBasePath from '../../../../core/common/imageWithBasePath';
import AddFaq from '../../../../core/common/modal/addFaq';
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

const COLLECTION: ListingCollection = 'hotels';

interface HotelForm {
  title: string;
  category: string;
  established: string;
  renovation: string;
  starRating: string;
  totalRooms: string;
  maxCapacity: string;
  pricePerNight: string;
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

const defaultForm: HotelForm = {
  title: '',
  category: '',
  established: '',
  renovation: '',
  starRating: '',
  totalRooms: '',
  maxCapacity: '',
  pricePerNight: '',
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

const EditHotel = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const agentId = currentUser?.uid;
  const listingId = searchParams.get('id');

  const [form, setForm] = useState<HotelForm>(defaultForm);
  const [loading, setLoading] = useState(!!listingId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState('');
  const [hotelMeta, setHotelMeta] = useState<{ approvalStatus?: string; published?: boolean; featured?: boolean; rejectedReason?: string }>({});

  const breadcrumbs = [
    { label: 'Edit Hotel', active: false, link: routes.home1 },
    { label: listingId ? 'Edit Hotel' : 'Add Hotel', active: true },
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
            established: data.established || '',
            renovation: data.renovation || '',
            starRating: data.starRating || '',
            totalRooms: data.totalRooms ? String(data.totalRooms) : '',
            maxCapacity: data.maxCapacity ? String(data.maxCapacity) : '',
            pricePerNight: data.pricePerNight ? String(data.pricePerNight) : '',
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
          setHotelMeta({
            approvalStatus,
            published: !!data.published,
            featured: !!data.featured,
            rejectedReason: data.rejectedReason || data.rejectionReason || '',
          });
          setImagePreview(data.image || '');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load hotel');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [listingId, agentId]);

  const updateField = <K extends keyof HotelForm>(key: K, value: HotelForm[K]) => {
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
      setError('Save the draft first so the image can be stored under the hotel ID.');
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

  const removeGalleryItem = (index: number) => {
    updateField('gallery', form.gallery.filter((_, i) => i !== index));
  };

  const buildPayload = () => {
    const price = parseFloat(form.pricePerNight);
    const rating = parseFloat(form.starRating);
    return {
      title: form.title,
      category: form.category,
      type: form.category,
      established: form.established,
      renovation: form.renovation,
      starRating: form.starRating,
      rating: isNaN(rating) ? 0 : rating,
      totalRooms: form.totalRooms,
      maxCapacity: form.maxCapacity,
      price: isNaN(price) ? 0 : price,
      pricePerNight: isNaN(price) ? 0 : price,
      reviewsCount: 0,
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
      location: form.city || form.address || '',
    };
  };

  const handleSave = async (e?: React.FormEvent, submitForReviewAfter = false) => {
    e?.preventDefault();
    if (!agentId) {
      setError('You must be signed in.');
      return;
    }
    if (!form.title.trim()) {
      setError('Hotel name is required.');
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
      setSuccess(submitForReviewAfter ? 'Hotel submitted for review.' : 'Hotel saved as draft.');
      if (!listingId && id) {
        navigate(`${routes.editHotel}?id=${id}`);
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

  const categoryOption = useMemo(() => Category.find((o) => o.value === form.category) || null, [form.category]);
  const countryOption = useMemo(() => CountryOption.find((o) => o.value === form.country) || null, [form.country]);
  const starOption = useMemo(() => StarRating.find((o) => o.value === form.starRating) || null, [form.starRating]);

  if (loading) {
    return (
      <div className="content text-center py-5">
        <span className="spinner-border spinner-border-sm text-primary me-2" />
        Loading hotel...
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb title={listingId ? 'Edit Hotel' : 'Add Hotel'} breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-01" />
      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-lg-3 theiaStickySidebar">
              <div className="card border-0 mb-4 mb-lg-0">
                <div className="card-body">
                  <div>
                    <h5 className="mb-3">{listingId ? 'Edit Hotel' : 'Add Hotel'}</h5>
                    <ul className="add-tab-list">
                      <li className='active'><Link to="#basic_info">Basic Info</Link></li>
                      <li><Link to="#location">Locations</Link></li>
                      <li><Link to="#highlights">Highlights</Link></li>
                      <li><Link to="#gallery">Gallery</Link></li>
                      <li><Link to="#description">Description</Link></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-9">
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <form onSubmit={(e) => handleSave(e)}>
                <div className="card shadow-none" id="basic_info">
                  <div className="card-header"><h5 className="fs-18">Hotel Details</h5></div>
                  <div className="card-body pb-1">
                    <div className="alert alert-light border d-flex flex-wrap gap-3 align-items-center mb-3">
                      <span><strong>Approval:</strong> {hotelMeta.approvalStatus || 'draft'}</span>
                      <span><strong>Published:</strong> {hotelMeta.published ? 'Yes' : 'No'}</span>
                      <span><strong>Featured:</strong> {hotelMeta.featured ? 'Yes' : 'No'}</span>
                      {hotelMeta.rejectedReason && <span className="text-danger"><strong>Rejection:</strong> {hotelMeta.rejectedReason}</span>}
                    </div>
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Hotel Name</label>
                          <input type="text" className="form-control" value={form.title} onChange={(e) => updateField('title', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Category</label>
                          <CustomSelect
                            options={Category}
                            className="select d-flex"
                            placeholder="Select"
                            value={categoryOption}
                            onChange={(selected: any) => updateField('category', selected?.value || '')}
                          />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Established</label>
                          <DatePicker
                            className="form-control datetimepicker"
                            placeholder="dd/mm/yyyy"
                            format="DD-MM-YYYY"
                            value={form.established ? dayjs(form.established, 'DD-MM-YYYY') : null}
                            onChange={(date) => updateField('established', date ? date.format('DD-MM-YYYY') : '')}
                          />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Renovation</label>
                          <DatePicker
                            className="form-control datetimepicker"
                            placeholder="dd/mm/yyyy"
                            format="DD-MM-YYYY"
                            value={form.renovation ? dayjs(form.renovation, 'DD-MM-YYYY') : null}
                            onChange={(date) => updateField('renovation', date ? date.format('DD-MM-YYYY') : '')}
                          />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Star Ratings</label>
                          <CustomSelect
                            options={StarRating}
                            className="select d-flex"
                            placeholder="Select"
                            value={starOption}
                            onChange={(selected: any) => updateField('starRating', selected?.value || '')}
                          />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Total Number Of Rooms</label>
                          <input type="text" className="form-control" value={form.totalRooms} onChange={(e) => updateField('totalRooms', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Maximum Capacity</label>
                          <input type="text" className="form-control" value={form.maxCapacity} onChange={(e) => updateField('maxCapacity', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Price Per Night (USD)</label>
                          <input type="number" className="form-control" value={form.pricePerNight} onChange={(e) => updateField('pricePerNight', e.target.value)} />
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

      {deleteConfirm && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button type="button" className="btn-close" onClick={() => setDeleteConfirm(false)} />
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this hotel? Only draft/rejected hotels can be deleted.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setDeleteConfirm(false)}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditHotel;
