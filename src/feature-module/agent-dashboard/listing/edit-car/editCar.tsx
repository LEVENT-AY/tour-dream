import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Access, Brake, CarBody, CountryOption, Door, FuelType, Steering, Transmission, VehicleType } from '../../../../core/common/selectOption/json/selectOption';
import { all_routes } from '../../../router/all_routes';
import Breadcrumb from '../../../../core/common/Breadcrumb/breadcrumb';
import CustomSelect from '../../../../core/common/commonSelect';
import DefaultEditor from 'react-simple-wysiwyg';
import ImageWithBasePath from '../../../../core/common/imageWithBasePath';
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

const COLLECTION: ListingCollection = 'cars';

interface CarForm {
  title: string;
  make: string;
  model: string;
  vehicleType: string;
  transmission: string;
  body: string;
  fuelType: string;
  mileage: string;
  modelYear: string;
  ac: string;
  doors: string;
  steering: string;
  brake: string;
  engine: string;
  access: string;
  price: string;
  country: string;
  city: string;
  state: string;
  zipCode: string;
  address: string;
  address1: string;
  description: string;
  image: string;
  gallery: string[];
}

const defaultForm: CarForm = {
  title: '',
  make: '',
  model: '',
  vehicleType: '',
  transmission: '',
  body: '',
  fuelType: '',
  mileage: '',
  modelYear: '',
  ac: '',
  doors: '',
  steering: '',
  brake: '',
  engine: '',
  access: '',
  price: '',
  country: '',
  city: '',
  state: '',
  zipCode: '',
  address: '',
  address1: '',
  description: '',
  image: '',
  gallery: [],
};

const EditCar = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const agentId = currentUser?.uid;
  const listingId = searchParams.get('id');

  const [form, setForm] = useState<CarForm>(defaultForm);
  const [loading, setLoading] = useState(!!listingId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState('');

  const breadcrumbs = [
    { label: 'Edit Car', active: false, link: routes.home1 },
    { label: listingId ? 'Edit Car' : 'Add Car', active: true },
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
          setForm({
            title: data.title || data.name || '',
            make: data.make || '',
            model: data.model || '',
            vehicleType: data.vehicleType || '',
            transmission: data.transmission || '',
            body: data.body || '',
            fuelType: data.fuelType || '',
            mileage: data.mileage ? String(data.mileage) : '',
            modelYear: data.modelYear ? String(data.modelYear) : '',
            ac: data.ac ? String(data.ac) : '',
            doors: data.doors ? String(data.doors) : '',
            steering: data.steering || '',
            brake: data.brake || '',
            engine: data.engine ? String(data.engine) : '',
            access: data.access || '',
            price: data.price ? String(data.price) : '',
            country: data.country || '',
            city: data.city || '',
            state: data.state || '',
            zipCode: data.zipCode || '',
            address: data.address || '',
            address1: data.address1 || '',
            description: data.description || '',
            image: data.image || '',
            gallery: Array.isArray(data.gallery) ? data.gallery : [],
          });
          setImagePreview(data.image || '');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load car');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [listingId, agentId]);

  const updateField = <K extends keyof CarForm>(key: K, value: CarForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (file: File, isGallery: boolean) => {
    if (!agentId) return;
    if (!listingId) {
      setError('Save the draft first so the image can be stored under the car ID.');
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
        title: form.title,
        make: form.make,
        brand: form.make,
        model: form.model,
        vehicleType: form.vehicleType,
        type: form.vehicleType || form.body,
        transmission: form.transmission,
        gear: form.transmission,
        body: form.body,
        fuelType: form.fuelType,
        fuel: form.fuelType,
        mileage: form.mileage,
        travelled: form.mileage,
        modelYear: form.modelYear,
        ac: form.ac,
        doors: form.doors,
        seats: Number(form.access) || 0,
        steering: form.steering,
        brake: form.brake,
        engine: form.engine,
        access: form.access,
        price: isNaN(price) ? 0 : price,
        rating: 0,
        reviewsCount: 0,
        country: form.country,
        city: form.city,
        state: form.state,
      zipCode: form.zipCode,
      address: form.address,
      address1: form.address1,
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
      setError('Car title is required.');
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
      setSuccess(submitForReviewAfter ? 'Car submitted for review.' : 'Car saved as draft.');
      if (!listingId && id) {
        navigate(`${routes.editCar}?id=${id}`);
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

  const vehicleTypeOption = useMemo(() => VehicleType.find((o) => o.value === form.vehicleType) || null, [form.vehicleType]);
  const transmissionOption = useMemo(() => Transmission.find((o) => o.value === form.transmission) || null, [form.transmission]);
  const bodyOption = useMemo(() => CarBody.find((o) => o.value === form.body) || null, [form.body]);
  const fuelTypeOption = useMemo(() => FuelType.find((o) => o.value === form.fuelType) || null, [form.fuelType]);
  const doorOption = useMemo(() => Door.find((o) => o.value === form.doors) || null, [form.doors]);
  const steeringOption = useMemo(() => Steering.find((o) => o.value === form.steering) || null, [form.steering]);
  const brakeOption = useMemo(() => Brake.find((o) => o.value === form.brake) || null, [form.brake]);
  const accessOption = useMemo(() => Access.find((o) => o.value === form.access) || null, [form.access]);
  const countryOption = useMemo(() => CountryOption.find((o) => o.value === form.country) || null, [form.country]);

  if (loading) {
    return (
      <div className="content text-center py-5">
        <span className="spinner-border spinner-border-sm text-primary me-2" />
        Loading car...
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb title={listingId ? 'Edit Car' : 'Add Car'} breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-03" />
      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-lg-3">
              <div className="card border-0 mb-4 mb-lg-0 theiaStickySidebar">
                <div className="card-body">
                  <div>
                    <h5 className="mb-3">{listingId ? 'Edit Car' : 'Add Car'}</h5>
                    <ul className="add-tab-list">
                      <li><Link to="#basic_info" className="active">Basic Info</Link></li>
                      <li><Link to="#specifications">Specifications</Link></li>
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
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Car Title</label>
                          <input type="text" className="form-control" value={form.title} onChange={(e) => updateField('title', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-xl-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Make</label>
                          <input type="text" className="form-control" value={form.make} onChange={(e) => updateField('make', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-xl-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Model</label>
                          <input type="text" className="form-control" value={form.model} onChange={(e) => updateField('model', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-xl-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Vehicle Type</label>
                          <CustomSelect
                            options={VehicleType}
                            className="select d-flex"
                            placeholder="Select"
                            value={vehicleTypeOption}
                            onChange={(selected: any) => updateField('vehicleType', selected?.value || '')}
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
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Transmission</label>
                          <CustomSelect
                            options={Transmission}
                            className="select d-flex"
                            placeholder="Select"
                            value={transmissionOption}
                            onChange={(selected: any) => updateField('transmission', selected?.value || '')}
                          />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Body</label>
                          <CustomSelect
                            options={CarBody}
                            className="select d-flex"
                            placeholder="Select"
                            value={bodyOption}
                            onChange={(selected: any) => updateField('body', selected?.value || '')}
                          />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Fuel Type</label>
                          <CustomSelect
                            options={FuelType}
                            className="select d-flex"
                            placeholder="Select"
                            value={fuelTypeOption}
                            onChange={(selected: any) => updateField('fuelType', selected?.value || '')}
                          />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Mileage</label>
                          <input type="text" className="form-control" value={form.mileage} onChange={(e) => updateField('mileage', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Model Year</label>
                          <input type="text" className="form-control" value={form.modelYear} onChange={(e) => updateField('modelYear', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">AC</label>
                          <input type="text" className="form-control" value={form.ac} onChange={(e) => updateField('ac', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Doors</label>
                          <CustomSelect
                            options={Door}
                            className="select d-flex"
                            placeholder="Select"
                            value={doorOption}
                            onChange={(selected: any) => updateField('doors', selected?.value || '')}
                          />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Steering</label>
                          <CustomSelect
                            options={Steering}
                            className="select d-flex"
                            placeholder="Select"
                            value={steeringOption}
                            onChange={(selected: any) => updateField('steering', selected?.value || '')}
                          />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Brake</label>
                          <CustomSelect
                            options={Brake}
                            className="select d-flex"
                            placeholder="Select"
                            value={brakeOption}
                            onChange={(selected: any) => updateField('brake', selected?.value || '')}
                          />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Engine (Hp)</label>
                          <input type="text" className="form-control" value={form.engine} onChange={(e) => updateField('engine', e.target.value)} />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Access</label>
                          <CustomSelect
                            options={Access}
                            className="select d-flex"
                            placeholder="Select"
                            value={accessOption}
                            onChange={(selected: any) => updateField('access', selected?.value || '')}
                          />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Price Per Day (USD)</label>
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

      {deleteConfirm && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button type="button" className="btn-close" onClick={() => setDeleteConfirm(false)} />
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this car? Only draft/rejected cars can be deleted.</p>
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

export default EditCar;
