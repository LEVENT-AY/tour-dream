import React, { useState } from 'react';
import { createServiceRequest, type ServiceType } from '../../services/firebaseServices';

interface ServiceRequestFormProps {
  serviceType: ServiceType;
  serviceId: string;
  serviceTitle: string;
}

interface FormState {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  requestedDate: string;
  guestsCount: string;
  message: string;
}

const ServiceRequestForm: React.FC<ServiceRequestFormProps> = ({
  serviceType,
  serviceId,
  serviceTitle,
}) => {
  const [form, setForm] = useState<FormState>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    requestedDate: '',
    guestsCount: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === '_hp_name') {
      setHoneypot(value);
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const validate = (): string | null => {
    const name = form.customerName.trim();
    if (!name) return 'Please enter your full name.';
    const email = form.customerEmail.trim();
    const phone = form.customerPhone.trim();
    if (!email && !phone) {
      return 'Please provide a phone number or email so we can reach you.';
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address.';
    }
    if (phone && phone.length < 6) {
      return 'Please enter a valid phone number.';
    }
    if (form.guestsCount && Number(form.guestsCount) < 1) {
      return 'Guests count must be at least 1.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await createServiceRequest({
        serviceType,
        serviceId,
        serviceTitle,
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim() || undefined,
        customerPhone: form.customerPhone.trim() || undefined,
        requestedDate: form.requestedDate || undefined,
        guestsCount: form.guestsCount ? Number(form.guestsCount) : undefined,
        message: form.message.trim() || undefined,
      });
      setSuccess('Your request has been sent! Our team will contact you shortly.');
      setForm({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        requestedDate: '',
        guestsCount: '',
        message: '',
      });
    } catch (err) {
      console.error('Error submitting service request:', err);
      setError('Something went wrong. Please try again or contact us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card shadow-none border mt-4">
      <div className="card-body">
        <h5 className="mb-1">Send Booking Request</h5>
        <p className="text-muted small mb-3">
          No online payment needed now. Our team will review your request and contact you.
        </p>
        {success && (
          <div className="alert alert-success py-2 fs-14" role="alert">
            {success}
          </div>
        )}
        {error && (
          <div className="alert alert-danger py-2 fs-14" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
            <input
              type="text"
              name="_hp_name"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="customerName" className="form-label fs-14">
              Full Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              id="customerName"
              name="customerName"
              className="form-control"
              placeholder="Your full name"
              value={form.customerName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="customerPhone" className="form-label fs-14">
                Phone
              </label>
              <input
                type="tel"
                id="customerPhone"
                name="customerPhone"
                className="form-control"
                placeholder="Phone number"
                value={form.customerPhone}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="customerEmail" className="form-label fs-14">
                Email
              </label>
              <input
                type="email"
                id="customerEmail"
                name="customerEmail"
                className="form-control"
                placeholder="Email address"
                value={form.customerEmail}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="mb-2">
            <small className="text-muted">
              Provide a phone number or email so we can contact you <span className="text-danger">*</span>
            </small>
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="requestedDate" className="form-label fs-14">
                Preferred Date
              </label>
              <input
                type="date"
                id="requestedDate"
                name="requestedDate"
                className="form-control"
                value={form.requestedDate}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="guestsCount" className="form-label fs-14">
                Guests
              </label>
              <input
                type="number"
                id="guestsCount"
                name="guestsCount"
                className="form-control"
                placeholder="Number of guests"
                min={1}
                value={form.guestsCount}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="message" className="form-label fs-14">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              className="form-control"
              rows={3}
              placeholder="Tell us more about your request..."
              value={form.message}
              onChange={handleChange}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Sending...
              </>
            ) : (
              'Send Request'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ServiceRequestForm;
