import React, { useEffect, useMemo, useState } from 'react';
import { fetchReviews, updateReviewStatus, deleteReview, type Review } from '../../../core/services/firebaseServices';

const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'hidden'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchReviews();
      setReviews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      const text = `${r.userName || ''} ${r.itemTitle || ''} ${r.comment || ''}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const status = r.status || 'pending';
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reviews, search, statusFilter]);

  const setStatus = async (id: string, status: 'approved' | 'hidden') => {
    try {
      await updateReviewStatus(id, status);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteReview(deleteId);
      setDeleteId(null);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
        <h3 className="mb-0">Reviews</h3>
      </div>

      <div className="card mb-4">
        <div className="card-body d-flex flex-wrap gap-3">
          <div className="flex-grow-1" style={{ minWidth: '240px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search reviews..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            style={{ width: '180px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Customer</th>
                  <th>Listing</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      <span className="spinner-border spinner-border-sm text-primary me-2" />
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      No reviews found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id}>
                      <td>{r.userName || r.userEmail || '—'}</td>
                      <td>
                        <div className="fw-medium">{r.itemTitle || '—'}</div>
                        <div className="small text-muted text-capitalize">{r.itemType || '—'}</div>
                      </td>
                      <td>
                        <span className="badge bg-warning text-dark">{'★'.repeat(Math.min(r.rating || 0, 5))}</span>
                      </td>
                      <td style={{ maxWidth: '300px' }}>
                        <div className="text-truncate">{r.comment || '—'}</div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            r.status === 'approved' ? 'bg-success' : r.status === 'hidden' ? 'bg-secondary' : 'bg-warning text-dark'
                          }`}
                        >
                          {r.status || 'pending'}
                        </span>
                      </td>
                      <td className="text-end">
                        {r.status !== 'approved' && (
                          <button className="btn btn-sm btn-success me-2" onClick={() => setStatus(r.id!, 'approved')}>
                            Approve
                          </button>
                        )}
                        {r.status !== 'hidden' && (
                          <button className="btn btn-sm btn-secondary me-2" onClick={() => setStatus(r.id!, 'hidden')}>
                            Hide
                          </button>
                        )}
                        <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(r.id!)}>
                          <i className="isax isax-trash" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {deleteId && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button type="button" className="btn-close" onClick={() => setDeleteId(null)} />
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this review? This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setDeleteId(null)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
