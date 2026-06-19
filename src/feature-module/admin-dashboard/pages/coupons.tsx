import React, { useEffect, useMemo, useState } from 'react';
import {
  fetchCoupons,
  addCoupon,
  updateCoupon,
  deleteCoupon,
  type Coupon,
} from '../../../core/services/firebaseServices';

const emptyCoupon: Coupon = {
  code: '',
  discountType: 'percentage',
  discountValue: 0,
  startDate: '',
  endDate: '',
  usageLimit: 0,
  active: true,
  applicableServices: [],
};

const AdminCoupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Coupon>(emptyCoupon);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchCoupons();
      setCoupons(data);
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
    return coupons.filter((c) =>
      `${c.code} ${c.applicableServices?.join(' ')}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [coupons, search]);

  const openAdd = () => {
    setForm(emptyCoupon);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setForm({ ...emptyCoupon, ...coupon });
    setEditingId(coupon.id || null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setDeleteId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form };
      delete (payload as any).id;
      if (editingId) {
        await updateCoupon(editingId, payload);
      } else {
        await addCoupon(payload);
      }
      await load();
      closeModal();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCoupon(deleteId);
      setDeleteId(null);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      await updateCoupon(coupon.id!, { active: !coupon.active });
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const updateTag = (tag: string, add: boolean) => {
    const current = form.applicableServices || [];
    if (add && !current.includes(tag)) {
      setForm({ ...form, applicableServices: [...current, tag] });
    } else if (!add) {
      setForm({ ...form, applicableServices: current.filter((t) => t !== tag) });
    }
  };

  const serviceOptions = ['tours', 'hotels', 'flights', 'cars', 'activities', 'resorts', 'chalets'];

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
        <h3 className="mb-0">Coupons</h3>
        <button className="btn btn-primary d-flex align-items-center" onClick={openAdd}>
          <i className="isax isax-add me-2" />
          Add Coupon
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-body d-flex flex-wrap gap-3">
          <div className="flex-grow-1" style={{ minWidth: '240px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search coupons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Valid From</th>
                  <th>Valid Until</th>
                  <th>Usage Limit</th>
                  <th>Active</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      <span className="spinner-border spinner-border-sm text-primary me-2" />
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">
                      No coupons found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c.id}>
                      <td className="fw-medium">{c.code}</td>
                      <td>
                        {c.discountType === 'percentage' ? `${c.discountValue}%` : `$${c.discountValue}`}
                      </td>
                      <td>{c.startDate || '—'}</td>
                      <td>{c.endDate || '—'}</td>
                      <td>{c.usageLimit || 'Unlimited'}</td>
                      <td>
                        <button
                          className={`btn btn-sm ${c.active ? 'btn-success' : 'btn-secondary'}`}
                          onClick={() => toggleActive(c)}
                        >
                          {c.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-light me-2" onClick={() => openEdit(c)}>
                          <i className="isax isax-edit-2" />
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(c.id!)}>
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

      {modalOpen && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">{editingId ? 'Edit' : 'Add'} Coupon</h5>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Code</label>
                      <input
                        type="text"
                        className="form-control"
                        value={form.code}
                        onChange={(e) => setForm({ ...form, code: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Discount Type</label>
                      <select
                        className="form-select"
                        value={form.discountType}
                        onChange={(e) => setForm({ ...form, discountType: e.target.value as any })}
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Discount Value</label>
                      <input
                        type="number"
                        className="form-control"
                        value={form.discountValue}
                        onChange={(e) => setForm({ ...form, discountValue: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Usage Limit</label>
                      <input
                        type="number"
                        className="form-control"
                        value={form.usageLimit}
                        onChange={(e) => setForm({ ...form, usageLimit: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={form.startDate}
                        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={form.endDate}
                        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label">Applicable Services</label>
                      <div className="d-flex flex-wrap gap-2">
                        {serviceOptions.map((s) => (
                          <label key={s} className="form-check-inline border rounded px-2 py-1">
                            <input
                              className="form-check-input me-1"
                              type="checkbox"
                              checked={(form.applicableServices || []).includes(s)}
                              onChange={(e) => updateTag(s, e.target.checked)}
                            />
                            <span className="text-capitalize">{s}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="col-12 mb-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={form.active}
                          onChange={(e) => setForm({ ...form, active: e.target.checked })}
                          id="coupon-active"
                        />
                        <label className="form-check-label" htmlFor="coupon-active">
                          Active
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving && <span className="spinner-border spinner-border-sm me-2" />}
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button type="button" className="btn-close" onClick={() => setDeleteId(null)} />
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this coupon? This action cannot be undone.</p>
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

export default AdminCoupons;
