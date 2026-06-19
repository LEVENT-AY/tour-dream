import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import Sidebar from '../../../core/common/sidebar/sidebar';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { useAuth } from '../../../core/contexts/AuthContext';
import { fetchUserWishlist, removeFromWishlist, type WishlistItem } from '../../../core/services/firebaseServices';

const formatPrice = (item: WishlistItem) => {
  if (typeof item.price !== 'number') return 'Not set';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: item.currency || 'USD',
    maximumFractionDigits: 0,
  }).format(item.price);
};

const UserWishlist = () => {
  const routes = all_routes;
  const { userProfile, loading: authLoading } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');

  const breadcrumbs = [
    { label: 'Wishlist', link: routes.allService1, active: false },
    { label: 'Wishlist', active: true },
  ];

  useEffect(() => {
    if (!userProfile?.uid) return;
    let isMounted = true;
    setLoading(true);

    fetchUserWishlist(userProfile.uid)
      .then((data) => {
        if (isMounted) setItems(data);
      })
      .catch((error) => {
        console.error('Failed to load wishlist:', error);
        if (isMounted) setItems([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userProfile?.uid]);

  const handleRemove = async (itemId: string) => {
    if (!userProfile?.uid) return;
    setSavingId(itemId);
    try {
      await removeFromWishlist(userProfile.uid, itemId);
      setItems((prev) => prev.filter((item) => item.itemId !== itemId));
    } catch (error) {
      console.error('Failed to remove wishlist item:', error);
    } finally {
      setSavingId('');
    }
  };

  if (authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return <div className="alert alert-danger m-4">Unable to load customer profile.</div>;
  }

  return (
    <div>
      <Breadcrumb title="Wishlist" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-04" />
      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-xl-3 col-lg-4">
              <Sidebar />
            </div>
            <div className="col-xl-9 col-lg-8">
              <div className="card mb-0">
                <div className="card-body">
                  <h6 className="mb-2">My Wishlist</h6>
                  <p className="fs-14 text-gray-6 mb-0">{items.length} saved items</p>
                  <div className="mt-3">
                    <Link to={routes.userDashboard} className="btn btn-light btn-sm">Back to Dashboard</Link>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                {loading ? (
                  <div className="text-gray-6">Loading your saved items...</div>
                ) : items.length === 0 ? (
                  <div className="alert alert-light mb-0">No saved items yet.</div>
                ) : (
                  <div className="row g-3">
                    {items.map((item) => (
                      <div className="col-12" key={item.id || item.itemId}>
                        <div className="border rounded p-3 d-flex align-items-center justify-content-between flex-wrap gap-3">
                          <div className="d-flex align-items-center gap-3">
                            <span className="avatar avatar-lg flex-shrink-0 overflow-hidden bg-light rounded">
                              <ImageWithBasePath src={item.itemImage || 'assets/img/hotels/hotel-01.jpg'} alt={item.itemTitle} className="w-100 h-100 object-fit-cover" fallbackSrc="assets/img/hotels/hotel-01.jpg" />
                            </span>
                            <div>
                              <p className="mb-1 text-gray-6 text-uppercase small">{item.itemType}</p>
                              <h6 className="mb-1">{item.itemTitle}</h6>
                              <p className="mb-0 text-gray-6">{item.location || 'Location not set'}</p>
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="fw-medium mb-2">{formatPrice(item)}</div>
                            <button type="button" className="btn btn-light btn-sm" onClick={() => handleRemove(item.itemId)} disabled={savingId === item.itemId}>
                              {savingId === item.itemId ? 'Removing...' : 'Remove'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserWishlist;
