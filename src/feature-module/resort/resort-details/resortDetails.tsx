import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import Reviews from '../../../core/common/reviews/reviews';
import { all_routes } from '../../router/all_routes';
import { fetchResortById } from '../../../core/services/firebaseServices';
import LodgingStickyContent from '../../lodging/LodgingStickyContent';
import { isPublicListing, normalizeResortDetails } from '../../../core/services/listingDetailModels';

const ResortDetails = () => {
  const routes = all_routes;
  const [searchParams] = useSearchParams();
  const [resortData, setResortData] = useState<any>(null);
  const [loading, setLoading] = useState(Boolean(searchParams.get('id')));
  const [notFound, setNotFound] = useState(false);
  const resortId = searchParams.get('id');

  useEffect(() => {
    let isMounted = true;

    const loadResort = async () => {
      if (!resortId) return;
      setLoading(true);
      try {
        const data = await fetchResortById(resortId);
        if (isMounted) {
          if (data && isPublicListing(data)) {
            setResortData(data);
            setNotFound(false);
          } else {
            setResortData(null);
            setNotFound(true);
          }
        }
      } catch (error) {
        if (isMounted) {
          setResortData(null);
          setNotFound(true);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadResort();

    return () => {
      isMounted = false;
    };
  }, [resortId]);

  const displayResort: any = resortData ? normalizeResortDetails(resortData) : {
    id: 'resort-demo',
    title: 'Seaside Resort',
    name: 'Seaside Resort',
    image: 'assets/img/hotels/hotel-large-01.jpg',
    gallery: ['assets/img/hotels/hotel-large-01.jpg'],
    description: 'Resort details will appear here when a real listing id is provided.',
    location: 'Ocean Bay',
    price: 520,
    propertyType: 'resort',
    listingCategory: 'lodging',
  };

  if (resortId && loading) {
    return (
      <div className="content">
        <div className="container">
          <div className="text-center py-5">Loading resort listing...</div>
        </div>
      </div>
    );
  }

  if (resortId && !loading && notFound) {
    return (
      <div className="content">
        <div className="container">
          <div className="alert alert-warning mb-0">
            The selected resort listing could not be found or is not published yet.
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbs = [
    { label: 'Resort Details', active: false, link: routes.home1 },
    { label: 'Resort', active: false },
    { label: 'Resort Details', active: true },
  ];

  return (
    <div>
      <Breadcrumb title={displayResort.title || displayResort.name || 'Resort Details'} breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-01" />
      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-xl-8">
              <div className="card border-0 mb-4">
                <div className="card-body">
                  <ImageWithBasePath src={displayResort.mainImage || displayResort.image || displayResort.gallery?.[0]} className="img-fluid rounded mb-3" alt={displayResort.title || 'Resort'} />
                  <div className="d-flex align-items-center justify-content-between flex-wrap mb-2">
                    <div>
                      <h4 className="mb-1">{displayResort.title || displayResort.name}</h4>
                      <p className="text-muted mb-0">{displayResort.location || 'Location unavailable'}</p>
                    </div>
                    <span className="badge bg-info text-capitalize">{displayResort.propertyType || 'resort'}</span>
                  </div>
                  <p className="mb-3">{displayResort.description || 'No description available yet.'}</p>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {(displayResort.amenities || []).map((amenity: string, index: number) => (
                      <span key={`${amenity}-${index}`} className="badge bg-light text-dark">{amenity}</span>
                    ))}
                  </div>
                  {displayResort.rating ? <p className="mb-0">Rating: {displayResort.rating}</p> : null}
                </div>
              </div>
              <div className="card border-0 mb-4">
                <div className="card-body">
                  <h5 className="mb-3">Gallery</h5>
                  <div className="row g-3">
                    {(displayResort.gallery || [displayResort.image]).filter(Boolean).map((image: string, index: number) => (
                      <div className="col-md-4" key={`${image}-${index}`}>
                        <Link to="#">
                          <ImageWithBasePath src={image} className="img-fluid rounded" alt={`Resort ${index + 1}`} />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Reviews />
            </div>
            <div className="col-xl-4">
              <LodgingStickyContent listingType="resort" lodging={displayResort} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResortDetails;
