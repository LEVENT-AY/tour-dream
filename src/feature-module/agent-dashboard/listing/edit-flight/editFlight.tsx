import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { DatePicker } from 'antd'
import dayjs from 'dayjs';
import DefaultEditor from "react-simple-wysiwyg";
import Breadcrumb from '../../../../core/common/Breadcrumb/breadcrumb';
import CustomSelect from '../../../../core/common/commonSelect';
import { CountryOption } from '../../../../core/common/selectOption/json/selectOption';
import { all_routes } from '../../../router/all_routes';
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

const COLLECTION: ListingCollection = 'flights';

interface FlightForm {
  airlineName: string;
  flightName: string;
  flightNumber: string;
  make: string;
  launchedOn: string;
  length: string;
  staffs: string;
  beam: string;
  weight: string;
  diningCrew: string;
  speed: string;
  arrivalDate: string;
  arrivalTime: string;
  departureDate: string;
  departureTime: string;
  country: string;
  city: string;
  state: string;
  zipCode: string;
  address: string;
  address1: string;
  price: string;
  description: string;
  image: string;
  gallery: string[];
}

const defaultForm: FlightForm = {
  airlineName: '',
  flightName: '',
  flightNumber: '',
  make: '',
  launchedOn: '',
  length: '',
  staffs: '',
  beam: '',
  weight: '',
  diningCrew: '',
  speed: '',
  arrivalDate: '',
  arrivalTime: '',
  departureDate: '',
  departureTime: '',
  country: '',
  city: '',
  state: '',
  zipCode: '',
  address: '',
  address1: '',
  price: '',
  description: '',
  image: '',
  gallery: [],
};

const EditFlight = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const agentId = currentUser?.uid;
  const listingId = searchParams.get('id');

  const [form, setForm] = useState<FlightForm>(defaultForm);
  const [loading, setLoading] = useState(!!listingId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState('');
  const [flightMeta, setFlightMeta] = useState<{ approvalStatus?: string; published?: boolean; featured?: boolean; rejectedReason?: string }>({});

  const breadcrumbs = [
    { label: 'Edit Flight', active: false, link: routes.home1 },
    { label: listingId ? 'Edit Flight' : 'Add Flight', active: true },
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
            airlineName: data.airlineName || '',
            flightName: data.flightName || data.title || data.name || '',
            flightNumber: data.flightNumber || '',
            make: data.make || '',
            launchedOn: data.launchedOn || '',
            length: data.length || '',
            staffs: data.staffs || '',
            beam: data.beam || '',
            weight: data.weight || '',
            diningCrew: data.diningCrew || '',
            speed: data.speed || '',
            arrivalDate: data.arrivalDate || '',
            arrivalTime: data.arrivalTime || '',
            departureDate: data.departureDate || '',
            departureTime: data.departureTime || '',
            country: data.country || '',
            city: data.city || '',
            state: data.state || '',
            zipCode: data.zipCode || '',
            address: data.address || '',
            address1: data.address1 || '',
            price: data.price ? String(data.price) : '',
            description: data.description || '',
            image: data.image || '',
            gallery: Array.isArray(data.gallery) ? data.gallery : [],
          });
          setFlightMeta({
            approvalStatus,
            published: !!data.published,
            featured: !!data.featured,
            rejectedReason: data.rejectedReason || data.rejectionReason || '',
          });
          setImagePreview(data.image || '');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load flight');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [listingId, agentId]);

  const updateField = <K extends keyof FlightForm>(key: K, value: FlightForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (file: File, isGallery: boolean) => {
    if (!agentId) return;
    if (!listingId) {
      setError('Save the draft first so the image can be stored under the flight ID.');
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
    const price = parseFloat(form.price);
    return {
      airlineName: form.airlineName,
      flightName: form.flightName,
      flightNumber: form.flightNumber,
      make: form.make,
      launchedOn: form.launchedOn,
      length: form.length,
      staffs: form.staffs,
      beam: form.beam,
      weight: form.weight,
      diningCrew: form.diningCrew,
      speed: form.speed,
      arrivalDate: form.arrivalDate,
      arrivalTime: form.arrivalTime,
      departureDate: form.departureDate,
      departureTime: form.departureTime,
      country: form.country,
      city: form.city,
      state: form.state,
      zipCode: form.zipCode,
      address: form.address,
      address1: form.address1,
      price: isNaN(price) ? 0 : price,
      rating: 0,
      reviewsCount: 0,
      description: form.description,
      image: form.image,
      gallery: form.gallery,
      location: form.city || form.address || '',
      title: form.flightName,
      airline: form.airlineName,
      departureCity: form.city || form.address || '',
      arrivalCity: form.country || '',
      stopInfo: form.flightNumber || form.make || '',
      dates: [form.departureDate, form.arrivalDate].filter(Boolean).join(' - '),
    };
  };

  const handleSave = async (e?: React.FormEvent, submitForReviewAfter = false) => {
    e?.preventDefault();
    if (!agentId) {
      setError('You must be signed in.');
      return;
    }
    if (!form.flightName.trim()) {
      setError('Flight name is required.');
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
      setSuccess(submitForReviewAfter ? 'Flight submitted for review.' : 'Flight saved as draft.');
      if (!listingId && id) {
        navigate(`${routes.editFlight}?id=${id}`);
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

  const countryOption = useMemo(() => CountryOption.find((o) => o.value === form.country) || null, [form.country]);

  if (loading) {
    return (
      <div className="content text-center py-5">
        <span className="spinner-border spinner-border-sm text-primary me-2" />
        Loading flight...
      </div>
    );
  }

  return (
    <>
      <Breadcrumb title={listingId ? 'Edit Flight' : 'Add Flight'} breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-05" />
      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-lg-3">
              <div className="card border-0 mb-4 mb-lg-0 theiaStickySidebar">
                <div className="card-body">
                  <div>
                    <h5 className="mb-3">{listingId ? 'Edit Flight' : 'Add Flight'}</h5>
                    <ul className="add-tab-list">
                      <li><Link to="#basic_info" className="active">Basic Info</Link></li>
                      <li><Link to="#specifications">Specifications</Link></li>
                      <li><Link to="#departure">Arrival &amp; Departure</Link></li>
                      <li><Link to="#location">Locations</Link></li>
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
                  <div className="card-header"><h6 className="fs-18">Basic Info</h6></div>
                  <div className="card-body pb-1">
                    <div className="alert alert-light border d-flex flex-wrap gap-3 align-items-center mb-3">
                      <span><strong>Approval:</strong> {flightMeta.approvalStatus || 'draft'}</span>
                      <span><strong>Published:</strong> {flightMeta.published ? 'Yes' : 'No'}</span>
                      <span><strong>Featured:</strong> {flightMeta.featured ? 'Yes' : 'No'}</span>
                      {flightMeta.rejectedReason && <span className="text-danger"><strong>Rejection:</strong> {flightMeta.rejectedReason}</span>}
                    </div>
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Airline Name</label>
                          <input type="text" className="form-control" value={form.airlineName} onChange={(e) => updateField('airlineName', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Flight Name</label>
                          <input type="text" className="form-control" value={form.flightName} onChange={(e) => updateField('flightName', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Flight Number</label>
                          <input type="text" className="form-control" value={form.flightNumber} onChange={(e) => updateField('flightNumber', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Make</label>
                          <input type="text" className="form-control" value={form.make} onChange={(e) => updateField('make', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Launched On</label>
                          <DatePicker
                            className="form-control datetimepicker"
                            placeholder="dd/mm/yyyy"
                            format="DD-MM-YYYY"
                            value={form.launchedOn ? dayjs(form.launchedOn, 'DD-MM-YYYY') : null}
                            onChange={(date) => updateField('launchedOn', date ? date.format('DD-MM-YYYY') : '')}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card shadow-none" id="specifications">
                  <div className="card-header"><h6 className="fs-18">Specifications</h6></div>
                  <div className="card-body pb-1">
                    <div className="row">
                      {[
                        { key: 'length', label: 'Length' },
                        { key: 'staffs', label: 'Staffs' },
                        { key: 'beam', label: 'Beam' },
                        { key: 'weight', label: 'Weight' },
                        { key: 'diningCrew', label: 'Dining Crew' },
                        { key: 'speed', label: 'Speed' },
                      ].map((spec) => (
                        <div className="col-lg-4 col-md-6" key={spec.key}>
                          <div className="mb-3">
                            <label className="form-label">{spec.label}</label>
                            <input type="text" className="form-control" value={(form as any)[spec.key]} onChange={(e) => updateField(spec.key as any, e.target.value)} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="card shadow-none" id="departure">
                  <div className="card-header"><h5 className="fs-18">Arrival &amp; Departure</h5></div>
                  <div className="card-body pb-1">
                    <div className="row">
                      <div className="col-xl-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Arrival Date</label>
                          <DatePicker
                            className="form-control datetimepicker"
                            placeholder="dd/mm/yyyy"
                            format="DD-MM-YYYY"
                            value={form.arrivalDate ? dayjs(form.arrivalDate, 'DD-MM-YYYY') : null}
                            onChange={(date) => updateField('arrivalDate', date ? date.format('DD-MM-YYYY') : '')}
                          />
                        </div>
                      </div>
                      <div className="col-xl-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Arrival Time</label>
                          <input type="text" className="form-control" placeholder="e.g. 10:00 AM" value={form.arrivalTime} onChange={(e) => updateField('arrivalTime', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-xl-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Departure Date</label>
                          <DatePicker
                            className="form-control datetimepicker"
                            placeholder="dd/mm/yyyy"
                            format="DD-MM-YYYY"
                            value={form.departureDate ? dayjs(form.departureDate, 'DD-MM-YYYY') : null}
                            onChange={(date) => updateField('departureDate', date ? date.format('DD-MM-YYYY') : '')}
                          />
                        </div>
                      </div>
                      <div className="col-xl-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Departure Time</label>
                          <input type="text" className="form-control" placeholder="e.g. 02:00 PM" value={form.departureTime} onChange={(e) => updateField('departureTime', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-xl-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Price (USD)</label>
                          <input type="number" className="form-control" value={form.price} onChange={(e) => updateField('price', e.target.value)} />
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
                    </div>
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
                <p>Are you sure you want to delete this flight? Only draft/rejected flights can be deleted.</p>
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

export default EditFlight;
