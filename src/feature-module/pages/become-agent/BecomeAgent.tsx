import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/contexts/AuthContext';
import { submitAgentApplication } from '../../../core/services/firebaseServices';

interface FormData {
  businessName: string;
  businessType: string;
  businessAddress: string;
  taxNumber: string;
  phone: string;
  description: string;
}

const BecomeAgent: React.FC = () => {
  const { currentUser, userProfile, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>({
    businessName: '',
    businessType: '',
    businessAddress: '',
    taxNumber: '',
    phone: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser || !userProfile) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100 bg-light p-3">
        <div className="card shadow-sm" style={{ maxWidth: '480px', width: '100%' }}>
          <div className="card-body text-center p-5">
            <h3 className="mb-3">Become an Agent</h3>
            <p className="text-muted">Please sign in to submit your agent application.</p>
            <button className="btn btn-primary" onClick={() => navigate('/login')}>
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.businessName.trim() || !form.businessType.trim() || !form.businessAddress.trim()) {
      setError('Business name, type, and address are required.');
      return;
    }

    setSubmitting(true);
    try {
      await submitAgentApplication({
        userId: currentUser.uid,
        email: userProfile.email || currentUser.email || '',
        displayName: userProfile.displayName || currentUser.displayName || '',
        businessName: form.businessName.trim(),
        businessType: form.businessType.trim(),
        businessAddress: form.businessAddress.trim(),
        taxNumber: form.taxNumber.trim(),
        phone: form.phone.trim(),
        description: form.description.trim(),
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100 bg-light p-3">
        <div className="card shadow-sm" style={{ maxWidth: '540px', width: '100%' }}>
          <div className="card-body text-center p-5">
            <div className="mb-4">
              <i className="isax isax-tick-circle fs-48 text-success" />
            </div>
            <h3 className="mb-3">Application Submitted</h3>
            <p className="text-muted">
              Your agent application is pending review. You will be notified once an administrator approves or rejects it.
            </p>
            <button className="btn btn-primary mt-3" onClick={() => navigate('/')}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light py-5 min-vh-100">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-sm">
              <div className="card-body p-4 p-md-5">
                <h2 className="mb-2">Become an Agent</h2>
                <p className="text-muted mb-4">
                  Fill out your business details below. Your application will be reviewed by our admin team.
                </p>

                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Business Name *</label>
                      <input
                        type="text"
                        name="businessName"
                        className="form-control"
                        value={form.businessName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Business Type *</label>
                      <select
                        name="businessType"
                        className="form-select"
                        value={form.businessType}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select type</option>
                        <option value="Tour Operator">Tour Operator</option>
                        <option value="Travel Agency">Travel Agency</option>
                        <option value="Hotel / Resort">Hotel / Resort</option>
                        <option value="Car Rental">Car Rental</option>
                        <option value="Activity Provider">Activity Provider</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Business Address *</label>
                      <input
                        type="text"
                        name="businessAddress"
                        className="form-control"
                        value={form.businessAddress}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Tax Number</label>
                      <input
                        type="text"
                        name="taxNumber"
                        className="form-control"
                        value={form.taxNumber}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        className="form-control"
                        value={form.phone}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea
                        name="description"
                        className="form-control"
                        rows={4}
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Tell us about your business and the services you offer."
                      />
                    </div>
                  </div>
                  <div className="mt-4 d-flex gap-2">
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Application'
                      )}
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeAgent;
