import React, { useEffect, useState } from 'react';
import {
  fetchHomepageSettings,
  updateHomepageSettings,
  fetchTours,
  fetchHotels,
  fetchFlights,
  fetchCars,
  fetchActivities,
  type HomepageSettings,
} from '../../../core/services/firebaseServices';
import ImageUpload from '../components/ImageUpload';

const defaultSettings: HomepageSettings = {
  siteName: '',
  logo: '',
  favicon: '',
  contactEmail: '',
  contactPhone: '',
  contactAddress: '',
  heroTitle: '',
  heroSubtitle: '',
  heroImage: '',
  ctaLabel: '',
  ctaLink: '',
  banners: [],
  sections: {
    featuredTours: true,
    featuredHotels: true,
    featuredFlights: true,
    featuredCars: true,
    featuredActivities: true,
  },
  sectionTitles: {
    featuredTours: 'Featured Tours',
    featuredHotels: 'Featured Hotels',
    featuredFlights: 'Featured Flights',
    featuredCars: 'Featured Cars',
    featuredActivities: 'Featured Activities',
  },
  featuredTours: [],
  featuredHotels: [],
  featuredFlights: [],
  featuredCars: [],
  featuredActivities: [],
  navLinks: [],
  footerLinks: [],
  footerText: '',
  socialLinks: {},
};

const AdminHomepageSettings: React.FC = () => {
  const [settings, setSettings] = useState<HomepageSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tours, setTours] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, t, h, f, c, a] = await Promise.all([
          fetchHomepageSettings(),
          fetchTours(),
          fetchHotels(),
          fetchFlights(),
          fetchCars(),
          fetchActivities(),
        ]);
        setSettings({ ...defaultSettings, ...(s || {}) });
        setTours(t);
        setHotels(h);
        setFlights(f);
        setCars(c);
        setActivities(a);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const update = (path: string, value: any) => {
    setSettings((prev) => {
      const keys = path.split('.');
      const next: any = { ...prev };
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...cur[keys[i]] };
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const toggleSection = (key: keyof HomepageSettings['sections']) => {
    update(`sections.${key}`, !settings.sections[key]);
  };

  const updateListItem = (
    list: { label: string; path: string }[],
    index: number,
    field: 'label' | 'path',
    value: string,
    listKey: 'navLinks' | 'footerLinks'
  ) => {
    const next = [...list];
    next[index] = { ...next[index], [field]: value };
    update(listKey, next);
  };

  const addListItem = (listKey: 'navLinks' | 'footerLinks') => {
    const current = (settings[listKey] || []) as { label: string; path: string }[];
    update(listKey, [...current, { label: '', path: '' }]);
  };

  const removeListItem = (listKey: 'navLinks' | 'footerLinks', index: number) => {
    const current = (settings[listKey] || []) as { label: string; path: string }[];
    update(listKey, current.filter((_, i) => i !== index));
  };

  const updateSocial = (platform: string, value: string) => {
    update('socialLinks', { ...settings.socialLinks, [platform]: value });
  };

  const updateBanner = (index: number, field: string, value: string) => {
    const banners = [...(settings.banners || [])];
    banners[index] = { ...banners[index], [field]: value };
    update('banners', banners);
  };

  const addBanner = () => update('banners', [...(settings.banners || []), { image: '', link: '', title: '' }]);
  const removeBanner = (index: number) => update('banners', (settings.banners || []).filter((_, i) => i !== index));

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await updateHomepageSettings(settings);
      setMessage('Homepage settings saved successfully.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <span className="spinner-border text-primary" />
      </div>
    );
  }

  const sectionKeys: (keyof HomepageSettings['sections'])[] = [
    'featuredTours',
    'featuredHotels',
    'featuredFlights',
    'featuredCars',
    'featuredActivities',
  ];

  const renderFeaturedSelector = (label: string, key: keyof HomepageSettings, options: any[]) => {
    const selected: string[] = (settings[key] as string[]) || [];
    return (
      <div className="mb-3">
        <label className="form-label">{label}</label>
        <select
          multiple
          className="form-select"
          size={5}
          value={selected}
          onChange={(e) => {
            const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
            update(key as string, opts);
          }}
        >
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.title || opt.name}
            </option>
          ))}
        </select>
        <small className="text-muted">Hold Ctrl/Cmd to select multiple.</small>
      </div>
    );
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h3 className="mb-0">Website Settings</h3>
        <button className="btn btn-primary d-flex align-items-center" onClick={handleSave} disabled={saving}>
          {saving && <span className="spinner-border spinner-border-sm me-2" />}
          <i className="isax isax-save-2 me-2" />
          Save Settings
        </button>
      </div>

      {message && (
        <div className={`alert ${message.includes('failed') ? 'alert-danger' : 'alert-success'}`}>{message}</div>
      )}

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="mb-0">Branding</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Site Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.siteName || ''}
                  onChange={(e) => update('siteName', e.target.value)}
                />
              </div>
              <ImageUpload label="Logo" value={settings.logo || ''} onChange={(url) => update('logo', url)} />
              <ImageUpload label="Favicon" value={settings.favicon || ''} onChange={(url) => update('favicon', url)} />
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="mb-0">Contact Details</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={settings.contactEmail || ''}
                  onChange={(e) => update('contactEmail', e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Phone</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.contactPhone || ''}
                  onChange={(e) => update('contactPhone', e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Address</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={settings.contactAddress || ''}
                  onChange={(e) => update('contactAddress', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="mb-0">Homepage Hero</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Hero Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.heroTitle}
                      onChange={(e) => update('heroTitle', e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Hero Subtitle</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={settings.heroSubtitle}
                      onChange={(e) => update('heroSubtitle', e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <ImageUpload
                    label="Hero Background Image"
                    value={settings.heroImage}
                    onChange={(url) => update('heroImage', url)}
                  />
                  <div className="row">
                    <div className="col-6">
                      <div className="mb-3">
                        <label className="form-label">CTA Label</label>
                        <input
                          type="text"
                          className="form-control"
                          value={settings.ctaLabel}
                          onChange={(e) => update('ctaLabel', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="mb-3">
                        <label className="form-label">CTA Link</label>
                        <input
                          type="text"
                          className="form-control"
                          value={settings.ctaLink}
                          onChange={(e) => update('ctaLink', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="mb-0">Section Visibility & Titles</h5>
            </div>
            <div className="card-body">
              {sectionKeys.map((key) => (
                <div className="mb-3" key={key}>
                  <div className="form-check mb-1">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={!!settings.sections[key]}
                      onChange={() => toggleSection(key)}
                      id={`section-${key}`}
                    />
                    <label className="form-check-label fw-medium" htmlFor={`section-${key}`}>
                      {key.replace('featured', 'Featured ')}
                    </label>
                  </div>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={settings.sectionTitles[key] || ''}
                    onChange={(e) => update(`sectionTitles.${key}`, e.target.value)}
                    placeholder="Section title"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="mb-0">Homepage Banners</h5>
            </div>
            <div className="card-body">
              {(settings.banners || []).map((banner, i) => (
                <div key={i} className="border rounded p-2 mb-2">
                  <div className="mb-2">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Title"
                      value={banner.title || ''}
                      onChange={(e) => updateBanner(i, 'title', e.target.value)}
                    />
                  </div>
                  <div className="mb-2">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Link"
                      value={banner.link || ''}
                      onChange={(e) => updateBanner(i, 'link', e.target.value)}
                    />
                  </div>
                  <ImageUpload
                    label="Banner Image"
                    value={banner.image || ''}
                    onChange={(url) => updateBanner(i, 'image', url)}
                  />
                  <button type="button" className="btn btn-sm btn-outline-danger mt-2" onClick={() => removeBanner(i)}>
                    Remove Banner
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-sm btn-light" onClick={addBanner}>
                + Add Banner
              </button>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="mb-0">Featured Items</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4">{renderFeaturedSelector('Featured Tours', 'featuredTours', tours)}</div>
                <div className="col-md-4">{renderFeaturedSelector('Featured Hotels', 'featuredHotels', hotels)}</div>
                <div className="col-md-4">{renderFeaturedSelector('Featured Flights', 'featuredFlights', flights)}</div>
                <div className="col-md-4">{renderFeaturedSelector('Featured Cars', 'featuredCars', cars)}</div>
                <div className="col-md-4">{renderFeaturedSelector('Featured Activities', 'featuredActivities', activities)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="mb-0">Navigation Links</h5>
            </div>
            <div className="card-body">
              {(settings.navLinks || []).map((link, i) => (
                <div key={i} className="row g-2 mb-2 align-items-end">
                  <div className="col-5">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Label"
                      value={link.label}
                      onChange={(e) => updateListItem(settings.navLinks || [], i, 'label', e.target.value, 'navLinks')}
                    />
                  </div>
                  <div className="col-5">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Path"
                      value={link.path}
                      onChange={(e) => updateListItem(settings.navLinks || [], i, 'path', e.target.value, 'navLinks')}
                    />
                  </div>
                  <div className="col-2">
                    <button className="btn btn-sm btn-outline-danger w-100" onClick={() => removeListItem('navLinks', i)}>
                      ×
                    </button>
                  </div>
                </div>
              ))}
              <button className="btn btn-sm btn-light" onClick={() => addListItem('navLinks')}>
                + Add Link
              </button>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="mb-0">Footer</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Footer Text</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={settings.footerText || ''}
                  onChange={(e) => update('footerText', e.target.value)}
                />
              </div>
              <label className="form-label">Footer Links</label>
              {(settings.footerLinks || []).map((link, i) => (
                <div key={i} className="row g-2 mb-2 align-items-end">
                  <div className="col-5">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Label"
                      value={link.label}
                      onChange={(e) => updateListItem(settings.footerLinks || [], i, 'label', e.target.value, 'footerLinks')}
                    />
                  </div>
                  <div className="col-5">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Path"
                      value={link.path}
                      onChange={(e) => updateListItem(settings.footerLinks || [], i, 'path', e.target.value, 'footerLinks')}
                    />
                  </div>
                  <div className="col-2">
                    <button className="btn btn-sm btn-outline-danger w-100" onClick={() => removeListItem('footerLinks', i)}>
                      ×
                    </button>
                  </div>
                </div>
              ))}
              <button className="btn btn-sm btn-light" onClick={() => addListItem('footerLinks')}>
                + Add Link
              </button>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="mb-0">Social Links</h5>
            </div>
            <div className="card-body">
              <div className="row">
                {['facebook', 'instagram', 'twitter', 'linkedin', 'youtube'].map((platform) => (
                  <div className="col-md-4 mb-3" key={platform}>
                    <label className="form-label text-capitalize">{platform}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={(settings.socialLinks && settings.socialLinks[platform]) || ''}
                      onChange={(e) => updateSocial(platform, e.target.value)}
                      placeholder={`https://${platform}.com/...`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHomepageSettings;
