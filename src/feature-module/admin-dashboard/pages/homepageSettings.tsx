import React, { useEffect, useState } from 'react';
import {
  fetchHomepageSettings,
  updateHomepageSettings,
  fetchTours,
  fetchHotels,
  fetchFlights,
  fetchCars,
  fetchActivities,
  type HeaderNavigationItem,
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
  headerNavigation: [],
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
  const [headerNavigationText, setHeaderNavigationText] = useState('[]');
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
        setHeaderNavigationText(JSON.stringify((s?.headerNavigation || []) as HeaderNavigationItem[], null, 2));
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
    void load();
  }, []);

  const update = (path: string, value: any) => {
    setSettings((prev) => {
      const keys = path.split('.');
      const next: any = { ...prev };
      let cur = next;
      for (let i = 0; i < keys.length - 1; i += 1) {
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
      const parsedHeaderNavigation = headerNavigationText.trim()
        ? (JSON.parse(headerNavigationText) as HeaderNavigationItem[])
        : [];
      if (!Array.isArray(parsedHeaderNavigation)) {
        throw new Error('Header navigation must be a JSON array.');
      }
      await updateHomepageSettings({
        ...settings,
        headerNavigation: parsedHeaderNavigation,
      });
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

  const sectionConfigs: Array<{
    key: keyof HomepageSettings['sections'];
    label: string;
    description: string;
  }> = [
    {
      key: 'featuredTours',
      label: 'Featured Tours',
      description: 'Controls the tours section title and visibility on supported homepage templates.',
    },
    {
      key: 'featuredHotels',
      label: 'Featured Hotels',
      description: 'Controls the hotels section title and visibility on supported homepage templates.',
    },
    {
      key: 'featuredFlights',
      label: 'Featured Flights',
      description: 'Controls the flights section title and visibility on supported homepage templates.',
    },
    {
      key: 'featuredCars',
      label: 'Featured Cars',
      description: 'Controls the cars section title and visibility on supported homepage templates.',
    },
    {
      key: 'featuredActivities',
      label: 'Featured Activities',
      description: 'Controls the activities section title and visibility on supported homepage templates.',
    },
  ];

  const featuredCollections = [
    {
      key: 'featuredTours' as const,
      label: 'Tours',
      description: 'Pick which tour listings appear in the featured homepage block.',
      options: tours,
    },
    {
      key: 'featuredHotels' as const,
      label: 'Hotels',
      description: 'Pick which hotel listings appear in the featured homepage block.',
      options: hotels,
    },
    {
      key: 'featuredFlights' as const,
      label: 'Flights',
      description: 'Pick which flight listings appear in the featured homepage block.',
      options: flights,
    },
    {
      key: 'featuredCars' as const,
      label: 'Cars',
      description: 'Pick which car listings appear in the featured homepage block.',
      options: cars,
    },
    {
      key: 'featuredActivities' as const,
      label: 'Activities',
      description: 'Pick which activity listings appear in the featured homepage block.',
      options: activities,
    },
  ] as const;

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
          <div className="card h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">Branding</h5>
              <small className="text-muted d-block mt-1">Core brand identity used by the public website.</small>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Header Navigation (JSON)</label>
                <textarea
                  className="form-control font-monospace"
                  rows={8}
                  value={headerNavigationText}
                  onChange={(e) => setHeaderNavigationText(e.target.value)}
                  placeholder='[{"id":"hotel","label":"Hotel","url":"/hotel/hotel-grid","visible":true,"type":"dropdown","children":[{"label":"Hotel Grid","url":"/hotel/hotel-grid","visible":true}]}]'
                />
                <small className="text-muted d-block mt-1">
                  Optional. Leave empty to keep the current hardcoded public navigation as fallback.
                </small>
              </div>
              <div className="mb-3">
                <label className="form-label">Site Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.siteName || ''}
                  onChange={(e) => update('siteName', e.target.value)}
                  placeholder="DreamsTour"
                />
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <ImageUpload label="Logo" value={settings.logo || ''} onChange={(url) => update('logo', url)} />
                </div>
                <div className="col-md-6">
                  <ImageUpload label="Favicon" value={settings.favicon || ''} onChange={(url) => update('favicon', url)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">Contact Details</h5>
              <small className="text-muted d-block mt-1">Shared contact values used in supported header and footer areas.</small>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={settings.contactEmail || ''}
                  onChange={(e) => update('contactEmail', e.target.value)}
                  placeholder="info@example.com"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Phone</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.contactPhone || ''}
                  onChange={(e) => update('contactPhone', e.target.value)}
                  placeholder="+1 56565 56594"
                />
              </div>
              <div className="mb-0">
                <label className="form-label">Address</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={settings.contactAddress || ''}
                  onChange={(e) => update('contactAddress', e.target.value)}
                  placeholder="Office or support address"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="mb-0">Homepage Hero</h5>
              <small className="text-muted d-block mt-1">Controls the main hero content on supported homepage templates.</small>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-lg-6">
                  <div className="mb-3">
                    <label className="form-label">Hero Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.heroTitle}
                      onChange={(e) => update('heroTitle', e.target.value)}
                      placeholder="Adventure starts here"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Hero Subtitle</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={settings.heroSubtitle}
                      onChange={(e) => update('heroSubtitle', e.target.value)}
                      placeholder="A short supporting message for the homepage hero."
                    />
                  </div>
                </div>
                <div className="col-lg-6">
                  <ImageUpload
                    label="Hero Background Image"
                    value={settings.heroImage}
                    onChange={(url) => update('heroImage', url)}
                  />
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="mb-0">
                        <label className="form-label">CTA Label</label>
                        <input
                          type="text"
                          className="form-control"
                          value={settings.ctaLabel}
                          onChange={(e) => update('ctaLabel', e.target.value)}
                          placeholder="Discover Now"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-0">
                        <label className="form-label">CTA Link</label>
                        <input
                          type="text"
                          className="form-control"
                          value={settings.ctaLink}
                          onChange={(e) => update('ctaLink', e.target.value)}
                          placeholder="/tour/tour-grid"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="mb-0">Section Visibility & Titles</h5>
              <small className="text-muted d-block mt-1">Turn homepage sections on or off and adjust their labels in one place.</small>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {sectionConfigs.map((section) => (
                  <div className="col-md-6 col-xl-4" key={section.key}>
                    <div className="border rounded-3 p-3 h-100 bg-light">
                      <div className="form-check form-switch mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={!!settings.sections[section.key]}
                          onChange={() => toggleSection(section.key)}
                          id={`section-${section.key}`}
                        />
                        <label className="form-check-label fw-semibold" htmlFor={`section-${section.key}`}>
                          {section.label}
                        </label>
                      </div>
                      <p className="text-muted small mb-2">{section.description}</p>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={settings.sectionTitles[section.key] || ''}
                        onChange={(e) => update(`sectionTitles.${section.key}`, e.target.value)}
                        placeholder={section.label}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">Homepage Banners</h5>
              <small className="text-muted d-block mt-1">Add or edit rotating hero banners for supported layouts.</small>
            </div>
            <div className="card-body">
              {(settings.banners || []).map((banner, i) => (
                <div key={i} className="border rounded-3 p-3 mb-3">
                  <div className="mb-2">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Banner title"
                      value={banner.title || ''}
                      onChange={(e) => updateBanner(i, 'title', e.target.value)}
                    />
                  </div>
                  <div className="mb-2">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Banner link"
                      value={banner.link || ''}
                      onChange={(e) => updateBanner(i, 'link', e.target.value)}
                    />
                  </div>
                  <ImageUpload
                    label="Banner Image"
                    value={banner.image || ''}
                    onChange={(url) => updateBanner(i, 'image', url)}
                  />
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeBanner(i)}>
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

        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">Navigation Links</h5>
              <small className="text-muted d-block mt-1">Optional extra links shown in supported public navigation areas.</small>
            </div>
            <div className="card-body">
              {(settings.navLinks || []).map((link, i) => (
                <div key={i} className="border rounded-3 p-3 mb-3">
                  <div className="row g-2 align-items-end">
                    <div className="col-5">
                      <label className="form-label small">Label</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Contact"
                        value={link.label}
                        onChange={(e) => updateListItem(settings.navLinks || [], i, 'label', e.target.value, 'navLinks')}
                      />
                    </div>
                    <div className="col-5">
                      <label className="form-label small">Path</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="/contact"
                        value={link.path}
                        onChange={(e) => updateListItem(settings.navLinks || [], i, 'path', e.target.value, 'navLinks')}
                      />
                    </div>
                    <div className="col-2">
                      <button className="btn btn-sm btn-outline-danger w-100" onClick={() => removeListItem('navLinks', i)}>
                        &times;
                      </button>
                    </div>
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
          <div className="card h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">Footer</h5>
              <small className="text-muted d-block mt-1">Controls the public footer copy and footer links where the footer is mounted.</small>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Footer Text</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={settings.footerText || ''}
                  onChange={(e) => update('footerText', e.target.value)}
                  placeholder="Copyright 2026. All Rights Reserved,"
                />
              </div>
              <label className="form-label">Footer Links</label>
              {(settings.footerLinks || []).map((link, i) => (
                <div key={i} className="border rounded-3 p-3 mb-3">
                  <div className="row g-2 align-items-end">
                    <div className="col-5">
                      <label className="form-label small">Label</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Privacy"
                        value={link.label}
                        onChange={(e) => updateListItem(settings.footerLinks || [], i, 'label', e.target.value, 'footerLinks')}
                      />
                    </div>
                    <div className="col-5">
                      <label className="form-label small">Path</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="/privacy"
                        value={link.path}
                        onChange={(e) => updateListItem(settings.footerLinks || [], i, 'path', e.target.value, 'footerLinks')}
                      />
                    </div>
                    <div className="col-2">
                      <button className="btn btn-sm btn-outline-danger w-100" onClick={() => removeListItem('footerLinks', i)}>
                        &times;
                      </button>
                    </div>
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
              <h5 className="mb-0">Featured Items</h5>
              <small className="text-muted d-block mt-1">Choose the items that should appear in the featured homepage slots.</small>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {featuredCollections.map((collection) => {
                  const selected: string[] = (settings[collection.key] as string[]) || [];
                  return (
                    <div className="col-md-6 col-xl-4" key={collection.key}>
                      <div className="border rounded-3 p-3 h-100 bg-light">
                        <div className="d-flex align-items-start justify-content-between mb-2">
                          <div>
                            <div className="fw-semibold">{collection.label}</div>
                            <small className="text-muted">{collection.description}</small>
                          </div>
                          <span className="badge bg-primary">{selected.length} selected</span>
                        </div>
                        <select
                          multiple
                          className="form-select"
                          size={5}
                          value={selected}
                          onChange={(e) => {
                            const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
                            update(collection.key as string, opts);
                          }}
                        >
                          {collection.options.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.title || opt.name}
                            </option>
                          ))}
                        </select>
                        <small className="text-muted d-block mt-2">Hold Ctrl/Cmd to select multiple.</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="mb-0">Social Links</h5>
              <small className="text-muted d-block mt-1">These URLs are shown only where the public theme consumes social links.</small>
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
