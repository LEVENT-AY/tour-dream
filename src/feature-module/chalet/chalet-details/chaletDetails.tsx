import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import Reviews from '../../../core/common/reviews/reviews';
import { all_routes } from '../../router/all_routes';
import { fetchChaletById } from '../../../core/services/firebaseServices';
import LodgingStickyContent from '../../lodging/LodgingStickyContent';
import { isPublicListing, normalizeChaletDetails } from '../../../core/services/listingDetailModels';

const ChaletDetails = () => {
  const routes = all_routes;
  const [searchParams] = useSearchParams();
  const [chaletData, setChaletData] = useState<any>(null);
  const [loading, setLoading] = useState(Boolean(searchParams.get('id')));
  const [notFound, setNotFound] = useState(false);
  const chaletId = searchParams.get('id');

  useEffect(() => {
    let isMounted = true;

    const loadChalet = async () => {
      if (!chaletId) return;
      setLoading(true);
      try {
        const data = await fetchChaletById(chaletId);
        if (isMounted) {
          if (data && isPublicListing(data)) {
            setChaletData(data);
            setNotFound(false);
          } else {
            setChaletData(null);
            setNotFound(true);
          }
        }
      } catch (error) {
        if (isMounted) {
          setChaletData(null);
          setNotFound(true);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadChalet();

    return () => {
      isMounted = false;
    };
  }, [chaletId]);

  const displayChalet: any = chaletData ? normalizeChaletDetails(chaletData) : {
    id: 'chalet-demo',
    title: 'Mountain Chalet',
    name: 'Mountain Chalet',
    image: 'assets/img/hotels/hotel-large-02.jpg',
    gallery: ['assets/img/hotels/hotel-large-02.jpg'],
    description: 'Chalet details will appear here when a real listing id is provided.',
    location: 'Alpine Valley',
    price: 450,
    propertyType: 'chalet',
    listingCategory: 'lodging',
  };

  if (chaletId && loading) {
    return (
      <div className="content">
        <div className="container">
          <div className="text-center py-5">Loading chalet listing...</div>
        </div>
      </div>
    );
  }

  if (chaletId && !loading && notFound) {
    return (
      <div className="content">
        <div className="container">
          <div className="alert alert-warning mb-0">
            The selected chalet listing could not be found or is not published yet.
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbs = [
    { label: 'Chalet Details', active: false, link: routes.home1 },
    { label: 'Chalet', active: false },
    { label: 'Chalet Details', active: true },
  ];

  return (
    <div>
      <Breadcrumb title={displayChalet.title || displayChalet.name || 'Chalet Details'} breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-01" />
      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-xl-8">
              <div className="card border-0 mb-4">
                <div className="card-body">
                  <ImageWithBasePath src={displayChalet.mainImage || displayChalet.image || displayChalet.gallery?.[0]} className="img-fluid rounded mb-3" alt={displayChalet.title || 'Chalet'} />
                  <div className="d-flex align-items-center justify-content-between flex-wrap mb-2">
                    <div>
                      <h4 className="mb-1">{displayChalet.title || displayChalet.name}</h4>
                      <p className="text-muted mb-0">{displayChalet.location || 'Location unavailable'}</p>
                    </div>
                    <span className="badge bg-info text-capitalize">{displayChalet.propertyType || 'chalet'}</span>
                  </div>
                  <p className="mb-3">{displayChalet.description || 'No description available yet.'}</p>
                  <div className="d-flex flex-wrap gap-3 mb-3">
                    <span className="badge bg-light text-dark">Capacity: {displayChalet.capacity ?? '—'}</span>
                    <span className="badge bg-light text-dark">Bedrooms: {displayChalet.bedrooms ?? '—'}</span>
                    <span className="badge bg-light text-dark">Bathrooms: {displayChalet.bathrooms ?? '—'}</span>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {(displayChalet.amenities || []).map((amenity: string, index: number) => (
                      <span key={`${amenity}-${index}`} className="badge bg-light text-dark">{amenity}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="card border-0 mb-4">
                <div className="card-body">
                  <h5 className="mb-3">Gallery</h5>
                  <div className="row g-3">
                    {(displayChalet.gallery || [displayChalet.image]).filter(Boolean).map((image: string, index: number) => (
                      <div className="col-md-4" key={`${image}-${index}`}>
                        <Link to="#">
                          <ImageWithBasePath src={image} className="img-fluid rounded" alt={`Chalet ${index + 1}`} />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Reviews />
            </div>
            <div className="col-xl-4">
              <LodgingStickyContent listingType="chalet" lodging={displayChalet} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChaletDetails;
