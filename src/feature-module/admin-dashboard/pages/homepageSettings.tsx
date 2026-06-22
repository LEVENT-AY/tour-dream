import React, { useEffect, useState } from 'react';
import {
  DEFAULT_HOMEPAGE_SETTINGS,
  fetchActivities,
  fetchCars,
  fetchChalets,
  fetchFlights,
  fetchHomepageSettings,
  fetchHotels,
  fetchResorts,
  fetchTours,
  normalizeHeaderNavigationItem,
  normalizeHomepageSettings,
  normalizeWebsiteSettingsPath,
  updateHomepageSettings,
  type HeaderNavigationChild,
  type HeaderNavigationItem,
  type HomepageSettings,
  type PublicTemplateCategory,
} from '../../../core/services/firebaseServices';
import ImageUpload from '../components/ImageUpload';

type LinkItem = { label: string; path: string };
type BannerItem = { image: string; link: string; title?: string };
type TemplateOption = { key: string; label: string; route: string; component: string; note?: string };
type TemplateCategoryConfig = {
  key: PublicTemplateCategory;
  label: string;
  helper: string;
  options: TemplateOption[];
  applyStatus: 'stored-only' | 'safe-route-ready';
};
type SectionTabKey =
  | 'overview'
  | 'branding'
  | 'header'
  | 'templates'
  | 'homepage'
  | 'featured'
  | 'footer'
  | 'advanced';

const TEMPLATE_CATEGORY_CONFIGS: TemplateCategoryConfig[] = [
  {
    key: 'home',
    label: 'Active Homepage Template',
    helper: 'Controls which public homepage template is marked active for the website shell.',
    applyStatus: 'stored-only',
    options: [
      { key: 'home-service-one', label: 'Home Service One', route: '/', component: 'HomeServiceOne', note: 'Current canonical home template.' },
      { key: 'home-service-two', label: 'Home Service Two', route: '/index-2', component: 'HomeServiceTwo' },
      { key: 'home-one', label: 'Home One', route: '/index-3', component: 'HomeOne' },
      { key: 'home-two', label: 'Home Two', route: '/index-4', component: 'HomeTwo' },
      { key: 'home-three', label: 'Home Three', route: '/index-5', component: 'HomeThree' },
      { key: 'home-four', label: 'Home Four', route: '/index-6', component: 'HomeFour' },
      { key: 'home-five', label: 'Home Five', route: '/index-7', component: 'HomeFive' },
      { key: 'home-six', label: 'Home Six', route: '/index-8', component: 'HomeSix' },
      { key: 'home-seven', label: 'Home Seven', route: '/index-9', component: 'HomeSeven' },
      { key: 'home-ten', label: 'Home Ten', route: '/index-10', component: 'HomeTen' },
      { key: 'home-eleven', label: 'Home Eleven', route: '/index-11', component: 'HomeEleven' },
      { key: 'home-twelve', label: 'Home Twelve', route: '/index-12', component: 'HomeTwelve' },
    ],
  },
  {
    key: 'hotel',
    label: 'Active Hotel Listing Layout',
    helper: 'Choose the preferred hotel discovery layout.',
    applyStatus: 'stored-only',
    options: [
      { key: 'hotel-grid', label: 'Hotel Grid', route: '/hotel/hotel-grid', component: 'HotelGrid' },
      { key: 'hotel-list', label: 'Hotel List', route: '/hotel/hotel-list', component: 'HotelList' },
      { key: 'hotel-map', label: 'Hotel Map', route: '/hotel/hotel-map', component: 'HotelMap' },
    ],
  },
  {
    key: 'tour',
    label: 'Active Tour Listing Layout',
    helper: 'Choose the preferred tour discovery layout.',
    applyStatus: 'stored-only',
    options: [
      { key: 'tour-grid', label: 'Tour Grid', route: '/tour/tour-grid', component: 'TourGrid' },
      { key: 'tour-list', label: 'Tour List', route: '/tour/tour-list', component: 'TourList' },
      { key: 'tour-map', label: 'Tour Map', route: '/tour/tour-map', component: 'TourMap' },
    ],
  },
  {
    key: 'car',
    label: 'Active Car Listing Layout',
    helper: 'Choose the preferred car discovery layout.',
    applyStatus: 'stored-only',
    options: [
      { key: 'car-grid', label: 'Car Grid', route: '/car/car-grid', component: 'CarGrid' },
      { key: 'car-list', label: 'Car List', route: '/car/car-list', component: 'CarList' },
      { key: 'car-map', label: 'Car Map', route: '/car/car-map', component: 'CarMap' },
    ],
  },
  {
    key: 'activity',
    label: 'Active Activity Listing Layout',
    helper: 'Choose the preferred activity discovery layout.',
    applyStatus: 'stored-only',
    options: [
      { key: 'activity-grid', label: 'Activity Grid', route: '/activity/activity-grid', component: 'ActivityGrid' },
      { key: 'activity-list', label: 'Activity List', route: '/activity/activity-list', component: 'ActivityList' },
      { key: 'activity-map', label: 'Activity Map', route: '/activity/activity-map', component: 'ActivityMap' },
    ],
  },
  {
    key: 'flight',
    label: 'Active Flight Listing Layout',
    helper: 'Choose the preferred flight discovery layout.',
    applyStatus: 'stored-only',
    options: [
      { key: 'flight-grid', label: 'Flight Grid', route: '/flight/flight-grid', component: 'FlightGrid' },
      { key: 'flight-list', label: 'Flight List', route: '/flight/flight-list', component: 'FlightList' },
    ],
  },
  {
    key: 'resort',
    label: 'Active Resort Listing Layout',
    helper: 'Resort listings currently expose a dedicated grid route.',
    applyStatus: 'stored-only',
    options: [{ key: 'resort-grid', label: 'Resort Grid', route: '/resort/resort-grid', component: 'ResortGrid' }],
  },
  {
    key: 'chalet',
    label: 'Active Chalet Listing Layout',
    helper: 'Chalet listings currently expose a dedicated grid route.',
    applyStatus: 'stored-only',
    options: [{ key: 'chalet-grid', label: 'Chalet Grid', route: '/chalet/chalet-grid', component: 'ChaletGrid' }],
  },
  {
    key: 'bus',
    label: 'Active Bus Layout',
    helper: 'Bus pages already have multiple list layouts.',
    applyStatus: 'stored-only',
    options: [
      { key: 'bus-list', label: 'Bus List', route: '/bus/bus-list', component: 'BusList' },
      { key: 'bus-left-sidebar', label: 'Bus Left Sidebar', route: '/bus/bus-left-sidebar', component: 'BusListLeftSidebar' },
      { key: 'bus-right-sidebar', label: 'Bus Right Sidebar', route: '/bus/bus-right-sidebar', component: 'BusListRightSidebar' },
    ],
  },
  {
    key: 'cruise',
    label: 'Active Cruise Layout',
    helper: 'Cruise pages already have grid, list, and map routes.',
    applyStatus: 'stored-only',
    options: [
      { key: 'cruise-grid', label: 'Cruise Grid', route: '/cruise/cruise-grid', component: 'CuriseGrid' },
      { key: 'cruise-list', label: 'Cruise List', route: '/cruise/cruise-list', component: 'CruiseList' },
      { key: 'cruise-map', label: 'Cruise Map', route: '/cruise/cruise-map', component: 'CruiseMap' },
    ],
  },
  {
    key: 'guide',
    label: 'Active Guide Layout',
    helper: 'Guide listings currently expose a single grid route.',
    applyStatus: 'stored-only',
    options: [{ key: 'guide-grid', label: 'Guide Grid', route: '/guide/guide-grid', component: 'GuideGrid' }],
  },
  {
    key: 'visa',
    label: 'Active Visa Layout',
    helper: 'Visa pages already have grid and list routes.',
    applyStatus: 'stored-only',
    options: [
      { key: 'visa-grid', label: 'Visa Grid', route: '/visa/visa-grid', component: 'VisaGrid' },
      { key: 'visa-list', label: 'Visa List', route: '/visa/visa-list', component: 'VisaList' },
    ],
  },
];

const DEFAULT_HEADER_NAVIGATION: HeaderNavigationItem[] = [
  { id: 'home', label: 'Home', url: '/', visible: true, type: 'link' },
  {
    id: 'hotels',
    label: 'Hotels',
    visible: true,
    type: 'dropdown',
    imageUrl: 'assets/img/menu/hotel.jpg',
    children: [
      { label: 'Hotel Grid', url: '/hotel/hotel-grid', visible: true },
      { label: 'Chalet Grid', url: '/chalet/chalet-grid', visible: true },
      { label: 'Resort Grid', url: '/resort/resort-grid', visible: true },
    ],
  },
  {
    id: 'tours',
    label: 'Tours',
    visible: true,
    type: 'dropdown',
    imageUrl: 'assets/img/menu/tour.jpg',
    children: [
      { label: 'Tour Grid', url: '/tour/tour-grid', visible: true },
      { label: 'Tour List', url: '/tour/tour-list', visible: true },
    ],
  },
  {
    id: 'transport',
    label: 'Transport',
    visible: true,
    type: 'dropdown',
    imageUrl: 'assets/img/menu/flight.jpg',
    children: [
      { label: 'Flight Grid', url: '/flight/flight-grid', visible: true },
      { label: 'Car Grid', url: '/car/car-grid', visible: true },
      { label: 'Bus List', url: '/bus/bus-list', visible: true },
      { label: 'Cruise Grid', url: '/cruise/cruise-grid', visible: true },
    ],
  },
  {
    id: 'experiences',
    label: 'Experiences',
    visible: true,
    type: 'dropdown',
    imageUrl: 'assets/img/menu/activity.jpg',
    children: [
      { label: 'Activities', url: '/activity/activity-grid', visible: true },
      { label: 'Guides', url: '/guide/guide-grid', visible: true },
      { label: 'Visa Services', url: '/visa/visa-grid', visible: true },
    ],
  },
  { id: 'contact', label: 'Contact', url: '/contact-us', visible: true, type: 'link' },
];

const SOCIAL_PLATFORMS = ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube'] as const;

const SECTION_TABS: Array<{ key: SectionTabKey; label: string; icon: string; description: string }> = [
  { key: 'overview', label: 'Overview', icon: 'isax-status-up', description: 'Snapshot of current website controls.' },
  { key: 'branding', label: 'Branding & Contact', icon: 'isax-brush-2', description: 'Brand identity, logo, and contact details.' },
  { key: 'header', label: 'Header Navigation', icon: 'isax-hierarchy', description: 'Visual header menu editor and advanced JSON.' },
  { key: 'templates', label: 'Templates & Layouts', icon: 'isax-element-4', description: 'Store active template and layout selections.' },
  { key: 'homepage', label: 'Homepage', icon: 'isax-home-2', description: 'Hero, sections, and banner controls.' },
  { key: 'featured', label: 'Featured Content', icon: 'isax-star', description: 'Curate featured tours, hotels, flights, cars, and activities.' },
  { key: 'footer', label: 'Footer & Social', icon: 'isax-global', description: 'Footer copy, links, and social presence.' },
  { key: 'advanced', label: 'Advanced', icon: 'isax-code', description: 'Compatibility details and raw debugging tools.' },
];

const EMPTY_NAV_LINK: LinkItem = { label: '', path: '' };
const EMPTY_BANNER: BannerItem = { image: '', link: '', title: '' };
const EMPTY_CHILD: HeaderNavigationChild = { label: '', url: '', visible: true };

const cloneHeaderNavigation = (items: HeaderNavigationItem[]): HeaderNavigationItem[] =>
  items.map((item) => ({
    ...item,
    children: (item.children || []).map((child) => ({ ...child })),
  }));

const stringifyNavigation = (items: HeaderNavigationItem[]) => JSON.stringify(items, null, 2);

const toDisplayTitle = (value: string) =>
  value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const isValidInternalPath = (value: string) => {
  const normalized = normalizeWebsiteSettingsPath(value);
  return !normalized || normalized.startsWith('/') || normalized.startsWith('http://') || normalized.startsWith('https://') || normalized.startsWith('//');
};

const parseNavigationJson = (raw: string) => {
  const parsed = raw.trim() ? (JSON.parse(raw) as HeaderNavigationItem[]) : [];
  if (!Array.isArray(parsed)) {
    throw new Error('Header navigation must be a JSON array.');
  }

  const normalized = parsed
    .map((item, index) => normalizeHeaderNavigationItem(item, index))
    .filter((item): item is HeaderNavigationItem => !!item);

  return normalized;
};

const overviewTemplateSummary = (settings: HomepageSettings) =>
  TEMPLATE_CATEGORY_CONFIGS.filter((category) => category.options.length > 0).map((category) => {
    const selectedKey = settings.publicTemplates?.[category.key] || category.options[0].key;
    const selected = category.options.find((option) => option.key === selectedKey) || category.options[0];
    return {
      category,
      selected,
    };
  });

const AdminHomepageSettings: React.FC = () => {
  const [settings, setSettings] = useState<HomepageSettings>(DEFAULT_HOMEPAGE_SETTINGS);
  const [headerNavigationEditor, setHeaderNavigationEditor] = useState<HeaderNavigationItem[]>([]);
  const [headerNavigationText, setHeaderNavigationText] = useState('[]');
  const [activeTab, setActiveTab] = useState<SectionTabKey>('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [tours, setTours] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [resorts, setResorts] = useState<any[]>([]);
  const [chalets, setChalets] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [homepage, tourData, hotelData, flightData, carData, activityData, resortData, chaletData] = await Promise.all([
          fetchHomepageSettings(),
          fetchTours(),
          fetchHotels(),
          fetchFlights(),
          fetchCars(),
          fetchActivities(),
          fetchResorts(),
          fetchChalets(),
        ]);
        const normalized = normalizeHomepageSettings(homepage || DEFAULT_HOMEPAGE_SETTINGS);
        const navigation = cloneHeaderNavigation(normalized.headerNavigation || []);
        setSettings(normalized);
        setHeaderNavigationEditor(navigation);
        setHeaderNavigationText(stringifyNavigation(navigation));
        setLastSavedAt((homepage as any)?.updatedAt?.toDate?.()?.toISOString?.() || null);
        setTours(tourData);
        setHotels(hotelData);
        setFlights(flightData);
        setCars(carData);
        setActivities(activityData);
        setResorts(resortData);
        setChalets(chaletData);
      } catch (error) {
        console.error(error);
        setMessage('Failed to load website settings.');
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
      let cursor = next;
      for (let index = 0; index < keys.length - 1; index += 1) {
        cursor[keys[index]] = { ...cursor[keys[index]] };
        cursor = cursor[keys[index]];
      }
      cursor[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const syncNavigationEditor = (nextNavigation: HeaderNavigationItem[]) => {
    setHeaderNavigationEditor(nextNavigation);
    setHeaderNavigationText(stringifyNavigation(nextNavigation));
  };

  const updateTemplateSelection = (category: PublicTemplateCategory, value: string) => {
    update('publicTemplates', {
      ...(settings.publicTemplates || {}),
      [category]: value,
    });
  };

  const updateSectionToggle = (key: keyof HomepageSettings['sections']) => {
    update(`sections.${key}`, !settings.sections[key]);
  };

  const updateListItem = (listKey: 'navLinks' | 'footerLinks', index: number, field: keyof LinkItem, value: string) => {
    const current = [...((settings[listKey] || []) as LinkItem[])];
    current[index] = { ...current[index], [field]: value };
    update(listKey, current);
  };

  const addListItem = (listKey: 'navLinks' | 'footerLinks') => {
    const current = [...((settings[listKey] || []) as LinkItem[])];
    current.push({ ...EMPTY_NAV_LINK });
    update(listKey, current);
  };

  const removeListItem = (listKey: 'navLinks' | 'footerLinks', index: number) => {
    const current = ((settings[listKey] || []) as LinkItem[]).filter((_, itemIndex) => itemIndex !== index);
    update(listKey, current);
  };

  const updateSocialLink = (platform: string, value: string) => {
    update('socialLinks', {
      ...(settings.socialLinks || {}),
      [platform]: value,
    });
  };

  const updateBanner = (index: number, field: keyof BannerItem, value: string) => {
    const banners = [...(settings.banners || [])];
    banners[index] = { ...banners[index], [field]: value };
    update('banners', banners);
  };

  const addBanner = () => update('banners', [...(settings.banners || []), { ...EMPTY_BANNER }]);
  const removeBanner = (index: number) => update('banners', (settings.banners || []).filter((_, itemIndex) => itemIndex !== index));

  const updateNavigationItem = (index: number, patch: Partial<HeaderNavigationItem>) => {
    const next = cloneHeaderNavigation(headerNavigationEditor);
    next[index] = { ...next[index], ...patch };
    if (patch.type === 'link') {
      next[index].children = [];
    }
    syncNavigationEditor(next);
  };

  const moveNavigationItem = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= headerNavigationEditor.length) return;
    const next = cloneHeaderNavigation(headerNavigationEditor);
    const [item] = next.splice(index, 1);
    next.splice(targetIndex, 0, item);
    syncNavigationEditor(next);
  };

  const addNavigationItem = () => {
    syncNavigationEditor([
      ...cloneHeaderNavigation(headerNavigationEditor),
      {
        id: `nav-${headerNavigationEditor.length + 1}`,
        label: '',
        url: '',
        visible: true,
        type: 'link',
        children: [],
      },
    ]);
  };

  const removeNavigationItem = (index: number) => {
    syncNavigationEditor(headerNavigationEditor.filter((_, itemIndex) => itemIndex !== index));
  };

  const updateNavigationChild = (itemIndex: number, childIndex: number, patch: Partial<HeaderNavigationChild>) => {
    const next = cloneHeaderNavigation(headerNavigationEditor);
    const children = [...(next[itemIndex].children || [])];
    children[childIndex] = { ...children[childIndex], ...patch };
    next[itemIndex] = { ...next[itemIndex], children };
    syncNavigationEditor(next);
  };

  const addNavigationChild = (itemIndex: number) => {
    const next = cloneHeaderNavigation(headerNavigationEditor);
    const children = [...(next[itemIndex].children || []), { ...EMPTY_CHILD }];
    next[itemIndex] = { ...next[itemIndex], type: 'dropdown', children };
    syncNavigationEditor(next);
  };

  const removeNavigationChild = (itemIndex: number, childIndex: number) => {
    const next = cloneHeaderNavigation(headerNavigationEditor);
    const children = (next[itemIndex].children || []).filter((_, index) => index !== childIndex);
    next[itemIndex] = { ...next[itemIndex], children };
    syncNavigationEditor(next);
  };

  const loadDefaultHeaderMenu = () => {
    const defaults = cloneHeaderNavigation(DEFAULT_HEADER_NAVIGATION);
    syncNavigationEditor(defaults);
    setMessage('Default header menu loaded. Save settings to publish it.');
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const parsedHeaderNavigation = parseNavigationJson(headerNavigationText);

      const invalidNavLink = (settings.navLinks || []).find(
        (link) => link.label?.trim() && !isValidInternalPath(link.path)
      );
      if (invalidNavLink) {
        throw new Error(`Navigation link "${invalidNavLink.label}" must start with / for internal routes.`);
      }

      const invalidFooterLink = (settings.footerLinks || []).find(
        (link) => link.label?.trim() && !isValidInternalPath(link.path)
      );
      if (invalidFooterLink) {
        throw new Error(`Footer link "${invalidFooterLink.label}" must start with / for internal routes.`);
      }

      const payload = normalizeHomepageSettings({
        ...settings,
        navLinks: (settings.navLinks || [])
          .map((link) => ({
            label: (link.label || '').trim(),
            path: normalizeWebsiteSettingsPath(link.path),
          }))
          .filter((link) => link.label && link.path),
        footerLinks: (settings.footerLinks || [])
          .map((link) => ({
            label: (link.label || '').trim(),
            path: normalizeWebsiteSettingsPath(link.path),
          }))
          .filter((link) => link.label && link.path),
        banners: (settings.banners || [])
          .map((banner) => ({
            title: (banner.title || '').trim(),
            link: normalizeWebsiteSettingsPath(banner.link),
            image: banner.image || '',
          }))
          .filter((banner) => banner.image || banner.title || banner.link),
        ctaLink: normalizeWebsiteSettingsPath(settings.ctaLink),
        headerNavigation: parsedHeaderNavigation,
      });

      await updateHomepageSettings(payload);
      syncNavigationEditor(parsedHeaderNavigation);
      setSettings(payload);
      setLastSavedAt(new Date().toISOString());
      setMessage('Website Control Center saved successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Save failed');
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

  const templateOverview = overviewTemplateSummary(settings);
  const headerMode = headerNavigationEditor.length > 0 ? 'Custom menu' : 'Fallback menu';
  const selectedCounts = {
    tours: settings.featuredTours.length,
    hotels: settings.featuredHotels.length,
    flights: settings.featuredFlights.length,
    cars: settings.featuredCars.length,
    activities: settings.featuredActivities.length,
  };

  const featuredCollections = [
    {
      key: 'featuredTours' as const,
      label: 'Tours',
      description: 'Pick the tour listings featured on supported homepage sections.',
      options: tours,
    },
    {
      key: 'featuredHotels' as const,
      label: 'Hotels',
      description: 'Pick the hotel listings featured on supported homepage sections.',
      options: hotels,
    },
    {
      key: 'featuredFlights' as const,
      label: 'Flights',
      description: 'Pick the flight listings featured on supported homepage sections.',
      options: flights,
    },
    {
      key: 'featuredCars' as const,
      label: 'Cars',
      description: 'Pick the car listings featured on supported homepage sections.',
      options: cars,
    },
    {
      key: 'featuredActivities' as const,
      label: 'Activities',
      description: 'Pick the activity listings featured on supported homepage sections.',
      options: activities,
    },
  ] as const;

  const settingsAlertClass = message?.toLowerCase().includes('fail') || message?.toLowerCase().includes('must')
    ? 'alert-danger'
    : 'alert-success';

  return (
    <div data-testid="website-control-center">
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle">Admin Website Control Center</span>
            <span className="badge bg-light text-muted border">V1</span>
          </div>
          <h3 className="mb-1">Website Settings</h3>
          <p className="text-muted mb-0">
            Manage template selections, navigation, branding, homepage content, and footer settings from the existing
            <code className="ms-1">siteSettings/homepage</code> document.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {lastSavedAt && <small className="text-muted">Last saved {new Date(lastSavedAt).toLocaleString()}</small>}
          <button className="btn btn-primary d-flex align-items-center" onClick={handleSave} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" />}
            <i className="isax isax-save-2 me-2" />
            Save Settings
          </button>
        </div>
      </div>

      {message && <div className={`alert ${settingsAlertClass}`}>{message}</div>}

      <div className="row g-4">
        <div className="col-xl-3">
          <div className="card border-0 shadow-sm sticky-top" style={{ top: '96px' }}>
            <div className="card-header bg-white border-0 pb-0">
              <h5 className="mb-1">Control Center</h5>
              <small className="text-muted">Move section by section instead of editing one long page.</small>
            </div>
            <div className="card-body">
              <div className="nav flex-column nav-pills gap-2" role="tablist" aria-label="Website control sections">
                {SECTION_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`btn text-start d-flex align-items-start gap-3 ${activeTab === tab.key ? 'btn-primary' : 'btn-light border'}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <i className={`isax ${tab.icon} fs-18 mt-1`} />
                    <span>
                      <span className="d-block fw-semibold">{tab.label}</span>
                      <small className={activeTab === tab.key ? 'text-white-50' : 'text-muted'}>{tab.description}</small>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-9">
          {activeTab === 'overview' && (
            <div className="d-flex flex-column gap-4">
              <div className="row g-3">
                <div className="col-md-6 col-xl-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <p className="text-muted mb-2">Header navigation</p>
                      <h5 className="mb-1">{headerMode}</h5>
                      <small className="text-muted">{headerNavigationEditor.filter((item) => item.visible !== false).length} visible top-level items</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-xl-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <p className="text-muted mb-2">Homepage template</p>
                      <h5 className="mb-1">{toDisplayTitle(settings.publicTemplates?.home || 'home-service-one')}</h5>
                      <small className="text-muted">Stored selection for the public home shell</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-xl-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <p className="text-muted mb-2">Featured selections</p>
                      <h5 className="mb-1">
                        {selectedCounts.tours + selectedCounts.hotels + selectedCounts.flights + selectedCounts.cars + selectedCounts.activities}
                      </h5>
                      <small className="text-muted">Items chosen across all supported featured blocks</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 col-xl-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <p className="text-muted mb-2">Footer status</p>
                      <h5 className="mb-1">{settings.footerText ? 'Configured' : 'Using fallback'}</h5>
                      <small className="text-muted">{Object.values(settings.socialLinks || {}).filter(Boolean).length} social links entered</small>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white">
                  <h5 className="mb-1">Active selections summary</h5>
                  <small className="text-muted">This shows what is currently stored, even when canonical route switching is not yet applied.</small>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    {templateOverview.map(({ category, selected }) => (
                      <div className="col-md-6" key={category.key}>
                        <div className="border rounded-3 p-3 h-100 bg-light">
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <div className="fw-semibold">{category.label}</div>
                            <span className={`badge ${category.applyStatus === 'stored-only' ? 'bg-warning-subtle text-warning' : 'bg-success-subtle text-success'}`}>
                              {category.applyStatus === 'stored-only' ? 'Storage only' : 'Safe route ready'}
                            </span>
                          </div>
                          <div className="mb-1">{selected.label}</div>
                          <small className="text-muted d-block">Key: {selected.key}</small>
                          <small className="text-muted d-block">Route: {selected.route}</small>
                          <small className="text-muted d-block">Component: {selected.component}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white">
                  <h5 className="mb-1">Operational notes</h5>
                  <small className="text-muted">Public site safety is preserved when settings are empty or partially configured.</small>
                </div>
                <div className="card-body">
                  <div className="alert alert-warning mb-3">
                    Template selections are stored now for admin control and reporting. Canonical category route switching remains pending so
                    the public site keeps its current behavior unless an existing consumer already reads these values.
                  </div>
                  <div className="alert alert-info mb-0">
                    Homepage hero, section titles, banner content, footer links, and social links only appear on public templates that already consume them.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'branding' && (
            <div className="row g-4">
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-header bg-white">
                    <h5 className="mb-1">Branding</h5>
                    <small className="text-muted">Shared brand identity used by public header/footer integrations.</small>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label">Site Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={settings.siteName || ''}
                        onChange={(event) => update('siteName', event.target.value)}
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
                    <div className="alert alert-light border mt-3 mb-0">
                      Existing upload and direct URL behavior is preserved. No base64 or new upload flow is introduced here.
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-header bg-white">
                    <h5 className="mb-1">Contact details</h5>
                    <small className="text-muted">Shared contact values used by supported header and footer surfaces.</small>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={settings.contactEmail || ''}
                        onChange={(event) => update('contactEmail', event.target.value)}
                        placeholder="info@example.com"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Phone</label>
                      <input
                        type="text"
                        className="form-control"
                        value={settings.contactPhone || ''}
                        onChange={(event) => update('contactPhone', event.target.value)}
                        placeholder="+1 56565 56594"
                      />
                    </div>
                    <div className="mb-0">
                      <label className="form-label">Address</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={settings.contactAddress || ''}
                        onChange={(event) => update('contactAddress', event.target.value)}
                        placeholder="Office or support address"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'header' && (
            <div className="d-flex flex-column gap-4">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-2">
                  <div>
                    <h5 className="mb-1">Header navigation editor</h5>
                    <small className="text-muted">Visual editor first, advanced JSON only for compatibility and debugging.</small>
                  </div>
                  <div className="d-flex gap-2">
                    <button type="button" className="btn btn-light border" onClick={loadDefaultHeaderMenu}>
                      Load Default Header Menu
                    </button>
                    <button type="button" className="btn btn-primary" onClick={addNavigationItem} data-testid="header-nav-add-item">
                      Add Menu Item
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  {headerNavigationEditor.length === 0 && (
                    <div className="alert alert-light border mb-3">
                      No custom header menu is stored. The public website will continue using the fallback menu until you save a custom one.
                    </div>
                  )}

                  <div className="d-flex flex-column gap-3" data-testid="header-nav-editor">
                    {headerNavigationEditor.map((item, index) => (
                      <div key={item.id || `nav-item-${index}`} className="border rounded-3 p-3 bg-light">
                        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-2 mb-3">
                          <div>
                            <div className="fw-semibold">Menu Item {index + 1}</div>
                            <small className="text-muted">Empty labels are ignored publicly and hidden items do not render.</small>
                          </div>
                          <div className="d-flex gap-2">
                            <button type="button" className="btn btn-sm btn-light border" onClick={() => moveNavigationItem(index, -1)} disabled={index === 0}>
                              Up
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-light border"
                              onClick={() => moveNavigationItem(index, 1)}
                              disabled={index === headerNavigationEditor.length - 1}
                            >
                              Down
                            </button>
                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeNavigationItem(index)}>
                              Remove
                            </button>
                          </div>
                        </div>

                        <div className="row g-3">
                          <div className="col-md-4">
                            <label className="form-label">Label</label>
                            <input
                              type="text"
                              className="form-control"
                              value={item.label || ''}
                              onChange={(event) => updateNavigationItem(index, { label: event.target.value })}
                              placeholder="Flights"
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">Type</label>
                            <select
                              className="form-select"
                              value={item.type || 'link'}
                              onChange={(event) => updateNavigationItem(index, { type: event.target.value as HeaderNavigationItem['type'] })}
                            >
                              <option value="link">Link</option>
                              <option value="dropdown">Dropdown</option>
                            </select>
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">URL</label>
                            <input
                              type="text"
                              className={`form-control ${item.url && !isValidInternalPath(item.url) ? 'is-invalid' : ''}`}
                              value={item.url || ''}
                              onChange={(event) => updateNavigationItem(index, { url: event.target.value === '/index' ? '/' : event.target.value })}
                              placeholder={item.type === 'dropdown' ? '/flight/flight-grid' : '/contact-us'}
                            />
                            <small className="text-muted">Internal links should start with <code>/</code>. Home is normalized to <code>/</code>.</small>
                          </div>
                          <div className="col-md-2">
                            <label className="form-label d-block">Visible</label>
                            <div className="form-check form-switch mt-2">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={item.visible !== false}
                                onChange={(event) => updateNavigationItem(index, { visible: event.target.checked })}
                              />
                            </div>
                          </div>

                          {item.type === 'dropdown' && (
                            <>
                              <div className="col-md-6">
                                <ImageUpload
                                  label="Dropdown image"
                                  value={item.imageUrl || ''}
                                  onChange={(url) => updateNavigationItem(index, { imageUrl: url })}
                                />
                              </div>
                              <div className="col-12">
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                  <div>
                                    <div className="fw-semibold">Dropdown children</div>
                                    <small className="text-muted">Invalid or empty child rows are ignored publicly.</small>
                                  </div>
                                  <button type="button" className="btn btn-sm btn-light border" onClick={() => addNavigationChild(index)}>
                                    Add Child
                                  </button>
                                </div>

                                <div className="d-flex flex-column gap-2">
                                  {(item.children || []).map((child, childIndex) => (
                                    <div key={`${item.id || index}-child-${childIndex}`} className="border rounded-3 p-3 bg-white">
                                      <div className="row g-2 align-items-end">
                                        <div className="col-md-4">
                                          <label className="form-label small">Child Label</label>
                                          <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={child.label || ''}
                                            onChange={(event) => updateNavigationChild(index, childIndex, { label: event.target.value })}
                                            placeholder="Flight Grid"
                                          />
                                        </div>
                                        <div className="col-md-5">
                                          <label className="form-label small">Child URL</label>
                                          <input
                                            type="text"
                                            className={`form-control form-control-sm ${child.url && !isValidInternalPath(child.url) ? 'is-invalid' : ''}`}
                                            value={child.url || ''}
                                            onChange={(event) => updateNavigationChild(index, childIndex, { url: event.target.value === '/index' ? '/' : event.target.value })}
                                            placeholder="/flight/flight-grid"
                                          />
                                        </div>
                                        <div className="col-md-1">
                                          <div className="form-check form-switch mt-4">
                                            <input
                                              className="form-check-input"
                                              type="checkbox"
                                              checked={child.visible !== false}
                                              onChange={(event) => updateNavigationChild(index, childIndex, { visible: event.target.checked })}
                                            />
                                          </div>
                                        </div>
                                        <div className="col-md-2">
                                          <button type="button" className="btn btn-sm btn-outline-danger w-100" onClick={() => removeNavigationChild(index, childIndex)}>
                                            Remove
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white">
                  <h5 className="mb-1">Advanced JSON</h5>
                  <small className="text-muted">Kept for debugging and backward compatibility with the existing <code>headerNavigation</code> field.</small>
                </div>
                <div className="card-body">
                  <textarea
                    className="form-control font-monospace"
                    rows={14}
                    value={headerNavigationText}
                    onChange={(event) => setHeaderNavigationText(event.target.value)}
                    data-testid="header-nav-json"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white">
                <h5 className="mb-1">Templates & layouts</h5>
                <small className="text-muted">
                  Store active template keys under <code>publicTemplates</code> without deleting any existing public demo routes.
                </small>
              </div>
              <div className="card-body">
                <div className="alert alert-warning">
                  The selections below are stored safely today. Public canonical route switching remains pending for category layouts, so current public routes stay stable.
                </div>
                <div className="row g-3" data-testid="template-selection-controls">
                  {TEMPLATE_CATEGORY_CONFIGS.map((category) => {
                    const value = settings.publicTemplates?.[category.key] || category.options[0]?.key || '';
                    return (
                      <div className="col-12" key={category.key}>
                        <div className="border rounded-3 p-3 h-100 bg-light">
                          <div className="row g-3 align-items-end">
                            <div className="col-lg-4">
                              <label className="form-label">{category.label}</label>
                              <select
                                className="form-select"
                                value={value}
                                onChange={(event) => updateTemplateSelection(category.key, event.target.value)}
                              >
                                {category.options.map((option) => (
                                  <option key={option.key} value={option.key}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-lg-8">
                              <div className="row g-2">
                                {category.options.map((option) => (
                                  <div className="col-md-6 col-xl-4" key={option.key}>
                                    <div className={`border rounded-3 p-2 h-100 ${value === option.key ? 'border-primary bg-white' : 'bg-white'}`}>
                                      <div className="fw-semibold">{option.label}</div>
                                      <small className="text-muted d-block">Key: {option.key}</small>
                                      <small className="text-muted d-block">Route: {option.route}</small>
                                      <small className="text-muted d-block">Component: {option.component}</small>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <small className="text-muted d-block mt-2">{category.helper}</small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'homepage' && (
            <div className="d-flex flex-column gap-4">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white">
                  <h5 className="mb-1">Homepage hero</h5>
                  <small className="text-muted">Supported public templates may consume these values. Restored template styling is intentionally not redesigned here.</small>
                </div>
                <div className="card-body">
                  <div className="alert alert-info">
                    Template support varies. If the selected template does not consume a field, the public site will continue using its built-in presentation.
                  </div>
                  <div className="row g-4">
                    <div className="col-lg-6">
                      <div className="mb-3">
                        <label className="form-label">Hero Title</label>
                        <input
                          type="text"
                          className="form-control"
                          value={settings.heroTitle}
                          onChange={(event) => update('heroTitle', event.target.value)}
                          placeholder="Adventure starts here"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Hero Subtitle</label>
                        <textarea
                          className="form-control"
                          rows={4}
                          value={settings.heroSubtitle}
                          onChange={(event) => update('heroSubtitle', event.target.value)}
                          placeholder="A short supporting message for the homepage hero."
                        />
                      </div>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">CTA Label</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.ctaLabel}
                            onChange={(event) => update('ctaLabel', event.target.value)}
                            placeholder="Discover Now"
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">CTA Link</label>
                          <input
                            type="text"
                            className="form-control"
                            value={settings.ctaLink}
                            onChange={(event) => update('ctaLink', event.target.value === '/index' ? '/' : event.target.value)}
                            placeholder="/tour/tour-grid"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <ImageUpload label="Hero Background Image" value={settings.heroImage} onChange={(url) => update('heroImage', url)} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white">
                  <h5 className="mb-1">Section visibility & titles</h5>
                  <small className="text-muted">Toggle supported homepage sections and rename their labels without touching public template markup.</small>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    {(Object.keys(settings.sections) as Array<keyof HomepageSettings['sections']>).map((sectionKey) => (
                      <div className="col-md-6 col-xl-4" key={sectionKey}>
                        <div className="border rounded-3 p-3 bg-light h-100">
                          <div className="form-check form-switch mb-2">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={!!settings.sections[sectionKey]}
                              onChange={() => updateSectionToggle(sectionKey)}
                              id={`section-${sectionKey}`}
                            />
                            <label className="form-check-label fw-semibold" htmlFor={`section-${sectionKey}`}>
                              {toDisplayTitle(sectionKey)}
                            </label>
                          </div>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={settings.sectionTitles[sectionKey] || ''}
                            onChange={(event) => update(`sectionTitles.${sectionKey}`, event.target.value)}
                            placeholder={toDisplayTitle(sectionKey)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white d-flex align-items-center justify-content-between">
                  <div>
                    <h5 className="mb-1">Homepage banners</h5>
                    <small className="text-muted">Optional banner content for templates that consume homepage banner data.</small>
                  </div>
                  <button type="button" className="btn btn-light border" onClick={addBanner}>
                    Add Banner
                  </button>
                </div>
                <div className="card-body">
                  {(settings.banners || []).length === 0 && (
                    <div className="alert alert-light border mb-0">No banners configured yet.</div>
                  )}
                  <div className="d-flex flex-column gap-3">
                    {(settings.banners || []).map((banner, index) => (
                      <div key={`banner-${index}`} className="border rounded-3 p-3 bg-light">
                        <div className="row g-3">
                          <div className="col-lg-4">
                            <label className="form-label">Banner Title</label>
                            <input
                              type="text"
                              className="form-control"
                              value={banner.title || ''}
                              onChange={(event) => updateBanner(index, 'title', event.target.value)}
                              placeholder="Seasonal offer"
                            />
                          </div>
                          <div className="col-lg-4">
                            <label className="form-label">Banner Link</label>
                            <input
                              type="text"
                              className="form-control"
                              value={banner.link || ''}
                              onChange={(event) => updateBanner(index, 'link', event.target.value)}
                              placeholder="/tour/tour-grid"
                            />
                          </div>
                          <div className="col-lg-4 d-flex align-items-end justify-content-end">
                            <button type="button" className="btn btn-outline-danger" onClick={() => removeBanner(index)}>
                              Remove Banner
                            </button>
                          </div>
                          <div className="col-12">
                            <ImageUpload label="Banner Image" value={banner.image || ''} onChange={(url) => updateBanner(index, 'image', url)} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'featured' && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white">
                <h5 className="mb-1">Featured content</h5>
                <small className="text-muted">Curate which live items appear in supported featured blocks.</small>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  {featuredCollections.map((collection) => {
                    const selected = (settings[collection.key] as string[]) || [];
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
                            size={6}
                            value={selected}
                            onChange={(event) => {
                              const values = Array.from(event.target.selectedOptions).map((option) => option.value);
                              update(collection.key as string, values);
                            }}
                          >
                            {collection.options.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.title || option.name}
                              </option>
                            ))}
                          </select>
                          <small className="text-muted d-block mt-2">Hold Ctrl or Cmd to select multiple entries.</small>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="row g-3 mt-1">
                  <div className="col-md-6">
                    <div className="border rounded-3 p-3 bg-light h-100">
                      <div className="fw-semibold mb-1">Lodging inventory snapshot</div>
                      <small className="text-muted d-block">Hotels available: {hotels.length}</small>
                      <small className="text-muted d-block">Resorts available: {resorts.length}</small>
                      <small className="text-muted d-block">Chalets available: {chalets.length}</small>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="border rounded-3 p-3 bg-light h-100">
                      <div className="fw-semibold mb-1">Featured content behavior</div>
                      <small className="text-muted d-block">Save behavior is preserved on the existing homepage settings document.</small>
                      <small className="text-muted d-block">Templates that do not consume a featured block keep their existing public output.</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'footer' && (
            <div className="row g-4">
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-header bg-white">
                    <h5 className="mb-1">Footer copy & links</h5>
                    <small className="text-muted">Control footer text and optional footer links where the footer binding is mounted.</small>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label">Footer Text</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={settings.footerText || ''}
                        onChange={(event) => update('footerText', event.target.value)}
                        placeholder="Copyright 2026. All Rights Reserved,"
                      />
                    </div>

                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <label className="form-label mb-0">Footer Links</label>
                      <button type="button" className="btn btn-sm btn-light border" onClick={() => addListItem('footerLinks')}>
                        Add Footer Link
                      </button>
                    </div>
                    {(settings.footerLinks || []).map((link, index) => (
                      <div key={`footer-link-${index}`} className="border rounded-3 p-3 mb-3 bg-light">
                        <div className="row g-2 align-items-end">
                          <div className="col-5">
                            <label className="form-label small">Label</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={link.label}
                              onChange={(event) => updateListItem('footerLinks', index, 'label', event.target.value)}
                              placeholder="Privacy Policy"
                            />
                          </div>
                          <div className="col-5">
                            <label className="form-label small">Path</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={link.path}
                              onChange={(event) => updateListItem('footerLinks', index, 'path', event.target.value)}
                              placeholder="/pages/privacy-policy"
                            />
                          </div>
                          <div className="col-2">
                            <button type="button" className="btn btn-sm btn-outline-danger w-100" onClick={() => removeListItem('footerLinks', index)}>
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-header bg-white">
                    <h5 className="mb-1">Social & reusable contact values</h5>
                    <small className="text-muted">Footer contact areas reuse the branding/contact values you entered earlier.</small>
                  </div>
                  <div className="card-body">
                    <div className="alert alert-light border">
                      Contact phone, email, and address are reused from the Branding & Contact section so you only maintain them in one place.
                    </div>
                    <div className="row g-3">
                      {SOCIAL_PLATFORMS.map((platform) => (
                        <div className="col-md-6" key={platform}>
                          <label className="form-label text-capitalize">{platform}</label>
                          <input
                            type="text"
                            className="form-control"
                            value={(settings.socialLinks && settings.socialLinks[platform]) || ''}
                            onChange={(event) => updateSocialLink(platform, event.target.value)}
                            placeholder={`https://${platform}.com/...`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="d-flex flex-column gap-4">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white">
                  <h5 className="mb-1">Compatibility fields</h5>
                  <small className="text-muted">Optional extra public links remain supported for legacy consumers.</small>
                </div>
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <label className="form-label mb-0">Optional navigation links</label>
                    <button type="button" className="btn btn-sm btn-light border" onClick={() => addListItem('navLinks')}>
                      Add Link
                    </button>
                  </div>
                  {(settings.navLinks || []).map((link, index) => (
                    <div key={`nav-link-${index}`} className="border rounded-3 p-3 mb-3 bg-light">
                      <div className="row g-2 align-items-end">
                        <div className="col-5">
                          <label className="form-label small">Label</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={link.label}
                            onChange={(event) => updateListItem('navLinks', index, 'label', event.target.value)}
                            placeholder="Contact"
                          />
                        </div>
                        <div className="col-5">
                          <label className="form-label small">Path</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={link.path}
                            onChange={(event) => updateListItem('navLinks', index, 'path', event.target.value)}
                            placeholder="/contact-us"
                          />
                        </div>
                        <div className="col-2">
                          <button type="button" className="btn btn-sm btn-outline-danger w-100" onClick={() => removeListItem('navLinks', index)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="alert alert-info mb-0">
                    This screen preserves the existing save path and fallback behavior. Empty settings continue to fall back to the current public site defaults.
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white">
                  <h5 className="mb-1">Template inventory report</h5>
                  <small className="text-muted">Actual discovered public route/component pairs currently available in the app.</small>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Key</th>
                          <th>Route</th>
                          <th>Component</th>
                        </tr>
                      </thead>
                      <tbody>
                        {TEMPLATE_CATEGORY_CONFIGS.flatMap((category) =>
                          category.options.map((option) => (
                            <tr key={`${category.key}-${option.key}`}>
                              <td>{category.key}</td>
                              <td><code>{option.key}</code></td>
                              <td><code>{option.route}</code></td>
                              <td><code>{option.component}</code></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHomepageSettings;
