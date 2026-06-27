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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const validate = (): string | null => {
    const name = form.customerName.trim();
    if (!name) return 'Please enter your name.';
    const email = form.customerEmail.trim();
    const phone = form.customerPhone.trim();
    if (!email && !phone) {
      return 'Please enter a phone number or email address.';
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address.';
    }
    if (form.guestsCount && Number(form.guestsCount) < 1) {
      return 'Guests count must be at least 1.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setSuccess('Request submitted successfully. We will contact you soon.');
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
      setError('Failed to submit request. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card shadow-none border mt-4">
      <div className="card-body">
        <h5 className="mb-3">Request this {serviceType}</h5>
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
          <div className="mb-3">
            <label htmlFor="customerName" className="form-label fs-14">
              Full Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              id="customerName"
              name="customerName"
              className="form-control"
              placeholder="Your name"
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
                Submitting...
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
