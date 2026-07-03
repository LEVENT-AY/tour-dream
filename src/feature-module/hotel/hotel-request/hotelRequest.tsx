import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import { createServiceRequest } from '../../../core/services/firebaseServices';
import { getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { app } from '../../../firebase';
import type { PreferredPaymentMethod, ManualPaymentStatus } from '../../../core/services/firebaseServices';

const storage = getStorage(app);

const PAYMENT_METHODS: { value: PreferredPaymentMethod; label: string }[] = [
  { value: 'wafa_cash', label: 'Wafa Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

const uploadReceipt = async (file: File): Promise<string> => {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `receipts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);
  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      () => {},
      (err) => reject(err),
      () => resolve(uploadTask.snapshot.ref.fullPath),
    );
  });
};

const HotelRequest = () => {
  const [searchParams] = useSearchParams();
  const stayId = searchParams.get('stayId') || '';
  const name = searchParams.get('name') || '';
  const city = searchParams.get('city') || '';
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const nights = searchParams.get('nights') || '0';
  const amount = searchParams.get('amount') || '';
  const currency = searchParams.get('currency') || '';
  const adults = searchParams.get('adults') || '1';
  const rooms = searchParams.get('rooms') || '1';

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [message, setMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PreferredPaymentMethod | ''>('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptError, setReceiptError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setReceiptError('');
    if (!customerName.trim() || !customerEmail.trim()) {
      setError('Name and email are required');
      return;
    }
    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }
    if ((paymentMethod === 'wafa_cash' || paymentMethod === 'bank_transfer') && !receiptFile) {
      setError('Please upload your payment receipt');
      return;
    }
    setSubmitting(true);
    let uploadedReceiptPath = '';
    let uploadedReceiptFileName = '';
    let uploadedReceiptContentType = '';
    let paymentStatus: ManualPaymentStatus = paymentMethod === 'card' ? 'not_requested' : 'receipt_pending';

    try {
      if (receiptFile) {
        uploadedReceiptFileName = receiptFile.name;
        uploadedReceiptContentType = receiptFile.type;
        uploadedReceiptPath = await uploadReceipt(receiptFile);
        paymentStatus = 'receipt_uploaded';
      }

      await createServiceRequest({
        serviceType: 'hotel',
        serviceId: stayId || 'hotel-request',
        serviceTitle: name || 'Hotel Request',
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim() || undefined,
        message: message.trim() || undefined,
        preferredPaymentMethod: paymentMethod as PreferredPaymentMethod,
        paymentStatus,
        receiptPath: uploadedReceiptPath || undefined,
        receiptFileName: uploadedReceiptFileName || undefined,
        receiptContentType: uploadedReceiptContentType || undefined,
        provider: 'duffel',
        guestsCount: Number(adults) || 1,
        offerSnapshot: {
          type: 'stay',
          stayId,
          accommodationName: name,
          city,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          nights: Number(nights),
          totalAmount: amount,
          currency,
          adults: Number(adults),
          rooms: Number(rooms),
          provider: 'duffel',
        } as Record<string, unknown>,
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Hotel request error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: 'Hotel', link: '/hotel/hotel-grid', active: false },
    { label: 'Request', active: true },
  ];

  if (submitted) {
    return (
      <div>
        <Breadcrumb title="Hotel Request Sent" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-01" />
        <div className="content">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="card shadow-none border mt-4">
                  <div className="card-body text-center py-5">
                    <div className="mb-3"><i className="isax isax-tick-circle text-success" style={{ fontSize: '4rem' }}></i></div>
                    <h4 className="mb-2">Hotel Request Sent</h4>
                    <p className="text-muted mb-0">Your request for <strong>{name}</strong> has been submitted. Our team will review it and contact you shortly.</p>
                    <div className="bg-light rounded p-3 mt-3 text-start">
                      <h6 className="fs-14 mb-2">What happens next?</h6>
                      <ul className="fs-13 mb-0 ps-3">
                        <li>Our team reviews your request and confirms availability.</li>
                        <li>We contact you via phone or WhatsApp with the details.</li>
                        <li>Payment instructions (Wafa Cash or bank transfer) will be shared after confirmation.</li>
                        <li>No card payment is collected on the website.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb title="Review Hotel Request" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-01" />
      <div className="content">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card shadow-none border mt-4">
                <div className="card-body">
                  <h5 className="mb-3">Review Hotel Request</h5>

                  {name && (
                    <div className="bg-light rounded p-3 mb-3">
                      <h6 className="fs-14 fw-semibold mb-2">Stay Details</h6>
                      <div className="row g-2 fs-14">
                        <div className="col-md-6"><span className="text-muted">Hotel:</span> {name}</div>
                        {city && <div className="col-md-6"><span className="text-muted">Location:</span> {city}</div>}
                        <div className="col-md-6"><span className="text-muted">Check-in:</span> {checkIn}</div>
                        <div className="col-md-6"><span className="text-muted">Check-out:</span> {checkOut}</div>
                        <div className="col-md-6"><span className="text-muted">Nights:</span> {nights}</div>
                        <div className="col-md-6"><span className="text-muted">Guests:</span> {adults} Adult(s)</div>
                        <div className="col-md-6"><span className="text-muted">Rooms:</span> {rooms}</div>
                        {amount && <div className="col-md-6"><span className="text-muted">Price:</span> <strong>{currency} {amount}</strong></div>}
                        <div className="col-md-6"><span className="text-muted">Provider:</span> <span className="badge bg-secondary">duffel</span></div>
                      </div>
                    </div>
                  )}

                  <div className="bg-info bg-opacity-10 border border-info border-opacity-25 rounded p-3 mb-3">
                    <h6 className="fs-14 fw-semibold mb-1">Manual payment after confirmation</h6>
                    <p className="fs-13 text-muted mb-0">
                      Submit your request first. Our team will confirm availability and contact you with Wafa Cash or bank transfer instructions. No card payment is collected on the website.
                    </p>
                  </div>

                  {error && <div className="alert alert-danger py-2 fs-14">{error}</div>}

                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label fs-14">Full Name <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" placeholder="Your full name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fs-14">Email <span className="text-danger">*</span></label>
                        <input type="email" className="form-control" placeholder="Email address" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} required />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fs-14">Phone / WhatsApp</label>
                        <input type="tel" className="form-control" placeholder="Phone number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fs-14">Notes</label>
                      <textarea className="form-control" rows={3} placeholder="Any special requests or notes..." value={message} onChange={(e) => setMessage(e.target.value)} />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fs-14">Payment method <span className="text-danger">*</span></label>
                      <div className="d-flex flex-wrap gap-2">
                        <div
                          className={`border rounded p-3 cursor-pointer flex-fill ${paymentMethod === 'card' ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                          onClick={() => { setPaymentMethod('card'); setReceiptFile(null); setReceiptError(''); }}
                          style={{ cursor: 'pointer', minWidth: 140 }}
                        >
                          <div className="fw-medium">Card</div>
                          <small className="text-muted">Secure card payment coming soon</small>
                        </div>
                        {PAYMENT_METHODS.map((pm) => (
                          <div
                            key={pm.value}
                            className={`border rounded p-3 cursor-pointer flex-fill ${paymentMethod === pm.value ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                            onClick={() => { setPaymentMethod(pm.value); setReceiptError(''); }}
                            style={{ cursor: 'pointer', minWidth: 140 }}
                          >
                            <div className="fw-medium">{pm.label}</div>
                            <small className="text-muted">Upload payment receipt</small>
                          </div>
                        ))}
                      </div>
                    </div>

                    {(paymentMethod === 'wafa_cash' || paymentMethod === 'bank_transfer') && (
                      <div className="mb-3">
                        <label className="form-label fs-14">Upload receipt <span className="text-danger">*</span></label>
                        <input
                          type="file"
                          className={`form-control ${receiptError ? 'is-invalid' : ''}`}
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={(e) => { setReceiptFile(e.target.files?.[0] || null); setReceiptError(''); }}
                        />
                        <small className="text-muted">Upload a screenshot or photo of your payment receipt (JPG, PNG, GIF, WebP, max 5MB).</small>
                        {receiptError && <div className="invalid-feedback">{receiptError}</div>}
                      </div>
                    )}

                    <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
                      {submitting ? <><span className="spinner-border spinner-border-sm me-2" />Sending...</> : 'Send Request'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelRequest;
