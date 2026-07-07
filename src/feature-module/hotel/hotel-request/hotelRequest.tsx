import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import { createServiceRequest } from '../../../core/services/firebaseServices';
import { getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { app } from '../../../firebase';
import dayjs from 'dayjs';
import type { PreferredPaymentMethod, ManualPaymentStatus } from '../../../core/services/firebaseServices';

const storage = getStorage(app);

const PAYMENT_METHODS: { value: PreferredPaymentMethod; label: string }[] = [
  { value: 'wafa_cash', label: 'Wafa Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

type ManualHotelSelection = {
  id?: string;
  title?: string;
  city?: string;
  location?: string;
  country?: string;
  address?: string;
  price?: number;
  priceFrom?: number;
  priceCurrency?: string;
  priceUnit?: string;
  priceNote?: string;
  rating?: number;
  image?: string;
  amenities?: string[];
  sourceName?: string;
  sourceUrl?: string;
  bookingMode?: string;
  selectedBoardType?: string;
};

const MANUAL_SELECTION_KEY = 'manualHotelSelection';

const readManualSelection = (): ManualHotelSelection | null => {
  try {
    const raw = sessionStorage.getItem(MANUAL_SELECTION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ManualHotelSelection;
  } catch {
    return null;
  }
};

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
  const provider = searchParams.get('provider') || '';
  const stayId = searchParams.get('stayId') || '';
  const name = searchParams.get('name') || '';
  const city = searchParams.get('city') || '';
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const nights = searchParams.get('nights') || '0';
  const amount = searchParams.get('amount') || '';
  const currency = searchParams.get('currency') || '';
  const priceFrom = searchParams.get('priceFrom') || '';
  const priceCurrency = searchParams.get('priceCurrency') || '';
  const priceUnit = searchParams.get('priceUnit') || '';
  const sourceName = searchParams.get('sourceName') || '';
  const sourceUrl = searchParams.get('sourceUrl') || '';
  const selectedBoardType = searchParams.get('selectedBoardType') || '';
  const hotelId = searchParams.get('hotelId') || '';
  const hotelName = searchParams.get('hotelName') || name || '';
  const children = searchParams.get('children') || '0';
  const childAges = searchParams.get('childAges') || '';
  const adults = searchParams.get('adults') || '2';
  const rooms = searchParams.get('rooms') || '1';
  const destination = searchParams.get('destination') || city || name || 'Tunisia';
  const checkInDate = searchParams.get('checkInDate') || checkIn;
  const checkOutDate = searchParams.get('checkOutDate') || checkOut;
  const manualHotelSelection = useMemo(() => (provider === 'manual' ? readManualSelection() : null), [provider]);
  const bookingMode = searchParams.get('bookingMode') || manualHotelSelection?.bookingMode || '';
  const paymentMode = searchParams.get('paymentMode') || '';
  const isManualMode = provider === 'manual';
  const isDuffelMode = !isManualMode && !!(stayId || name);
  const isPayNowMode = isManualMode && (bookingMode === 'pay_now' || paymentMode === 'manual_payment');
  const resolvedManualPrice = Number(manualHotelSelection?.priceFrom ?? manualHotelSelection?.price ?? (priceFrom ? Number(priceFrom) : 0));
  const resolvedManualCurrency = manualHotelSelection?.priceCurrency || priceCurrency;
  const hasPayableAmount = isPayNowMode && resolvedManualPrice > 0 && Boolean(resolvedManualCurrency);
  const pageTitle = isPayNowMode ? 'Hotel Payment' : 'Review Hotel Request';

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${pageTitle} | DreamsTour Tunisia`;
    return () => {
      document.title = previousTitle;
    };
  }, [pageTitle]);

  const manualTitle = manualHotelSelection?.title || hotelName || destination;
  const manualCity = manualHotelSelection?.city || destination;
  const manualLocation = manualHotelSelection?.location || manualCity;
  const manualPriceLabel = (() => {
    const resolvedPrice = resolvedManualPrice > 0 ? resolvedManualPrice : null;
    const resolvedCurrency = resolvedManualCurrency;
    const resolvedUnit = manualHotelSelection?.priceUnit || priceUnit;
    if (typeof resolvedPrice === 'number' && resolvedPrice > 0) {
      return `From ${resolvedPrice}${resolvedCurrency ? ` ${resolvedCurrency}` : ''}${resolvedUnit ? ` / ${resolvedUnit}` : ''}`;
    }
    if (isPayNowMode) return 'Price not configured yet';
    if (amount) return `${currency ? `${currency} ` : ''}${amount}`.trim();
    return 'Contact for pricing';
  })();
  const payableAmountValue = (() => {
    if (!hasPayableAmount) return null;
    const resolvedNights = (() => {
      const start = dayjs(checkInDate);
      const end = dayjs(checkOutDate);
      const diff = end.diff(start, 'day');
      return Number.isFinite(diff) && diff > 0 ? diff : Number(nights) || 1;
    })();
    const stayNights = Math.max(1, resolvedNights);
    const stayRooms = Math.max(1, Number(rooms) || 1);
    const basePrice = resolvedManualPrice;
    return basePrice > 0 ? basePrice * stayNights * stayRooms : 0;
  })();
  const stayNights = (() => {
    const start = dayjs(checkInDate);
    const end = dayjs(checkOutDate);
    const diff = end.diff(start, 'day');
    return Math.max(1, Number.isFinite(diff) && diff > 0 ? diff : Number(nights) || 1);
  })();

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [message, setMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PreferredPaymentMethod | ''>('');
  const [paymentReference, setPaymentReference] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptError, setReceiptError] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
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
    if (isPayNowMode && !hasPayableAmount) {
      setError('This hotel is configured for Pay Now, but the payment price has not been added yet.');
      return;
    }
    if (isPayNowMode && !customerPhone.trim()) {
      setError('Phone / WhatsApp is required for payment verification');
      return;
    }
    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }
    if (isPayNowMode && paymentMethod === 'card') {
      setError('Card payment is coming soon');
      return;
    }
    if ((paymentMethod === 'wafa_cash' || paymentMethod === 'bank_transfer') && !receiptFile) {
      setError('Please upload your payment receipt');
      return;
    }
    if (isPayNowMode && !consentAccepted) {
      setError('Please confirm that DreamsTour will verify the payment and booking availability');
      return;
    }

    setSubmitting(true);
    let uploadedReceiptPath = '';
    let uploadedReceiptFileName = '';
    let uploadedReceiptContentType = '';
    let paymentStatus: ManualPaymentStatus = isPayNowMode ? 'submitted' : (paymentMethod === 'card' ? 'not_requested' : 'receipt_pending');

    try {
      if (receiptFile) {
        uploadedReceiptFileName = receiptFile.name;
        uploadedReceiptContentType = receiptFile.type;
        uploadedReceiptPath = await uploadReceipt(receiptFile);
        paymentStatus = isPayNowMode ? 'submitted' : 'receipt_uploaded';
      }

      const offerSnapshot = isManualMode
        ? {
            type: isPayNowMode ? 'manual_hotel_payment' : (manualHotelSelection ? 'manual_hotel' : 'manual_request'),
            provider: 'manual',
            hotelId: manualHotelSelection?.id || hotelId || stayId || '',
            accommodationName: manualTitle,
            city: manualCity,
            location: manualLocation,
            country: manualHotelSelection?.country || 'Tunisia',
            address: manualHotelSelection?.address || '',
            price: manualHotelSelection?.price ?? amount ?? '',
            priceFrom: manualHotelSelection?.priceFrom ?? priceFrom ?? '',
            priceCurrency: manualHotelSelection?.priceCurrency || priceCurrency || '',
            priceUnit: manualHotelSelection?.priceUnit || priceUnit || '',
            priceNote: manualHotelSelection?.priceNote || '',
            rating: manualHotelSelection?.rating ?? 0,
            image: manualHotelSelection?.image || '',
            amenities: Array.isArray(manualHotelSelection?.amenities) ? manualHotelSelection?.amenities : [],
            destination,
            checkInDate: checkInDate || '',
            checkOutDate: checkOutDate || '',
            adults: Number(adults) || 2,
            rooms: Number(rooms) || 1,
            children: Number(children) || 0,
            childAges: childAges || '',
            sourceName: manualHotelSelection?.sourceName || sourceName || '',
            sourceUrl: manualHotelSelection?.sourceUrl || sourceUrl || '',
            selectedBoardType: manualHotelSelection?.selectedBoardType || selectedBoardType || '',
            bookingMode: bookingMode || manualHotelSelection?.bookingMode || '',
            paymentMode: isPayNowMode ? 'manual_payment' : undefined,
          } as Record<string, unknown>
        : {
            type: 'stay',
            stayId,
            accommodationName: name,
            city,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            nights: Number(nights),
            totalAmount: amount,
            currency,
            adults: Number(adults) || 2,
            rooms: Number(rooms) || 1,
            provider: 'duffel',
          } as Record<string, unknown>;

      await createServiceRequest({
        serviceType: 'hotel',
        serviceId: isManualMode ? (manualHotelSelection?.id || stayId || `manual-hotel-request-${destination}`) : (stayId || 'hotel-request'),
        serviceTitle: isManualMode ? (isPayNowMode ? `Hotel Payment - ${manualTitle}` : `Hotel Request - ${destination}`) : (name || 'Hotel Request'),
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim() || undefined,
        message: message.trim() || undefined,
        preferredPaymentMethod: paymentMethod as PreferredPaymentMethod,
        paymentStatus,
        paymentMode: isPayNowMode ? 'manual_payment' : undefined,
        bookingMode: isPayNowMode ? 'pay_now' : (isManualMode ? 'request_only' : undefined),
        bookingStatus: isPayNowMode ? 'pending_admin_confirmation' : undefined,
        requestType: isPayNowMode ? 'hotel_payment' : 'hotel_request',
        paymentReference: paymentReference.trim() || undefined,
        receiptPath: uploadedReceiptPath || undefined,
        receiptFileName: uploadedReceiptFileName || undefined,
        receiptContentType: uploadedReceiptContentType || undefined,
        provider: isManualMode ? 'manual' : 'duffel',
        guestsCount: Number(adults) || 2,
        offerSnapshot,
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
        <Breadcrumb title={isPayNowMode ? 'Payment Submitted' : 'Hotel Request Sent'} breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-01" />
        <div className="content">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="card shadow-none border mt-4">
                  <div className="card-body text-center py-5">
                    <div className="mb-3"><i className="isax isax-tick-circle text-success" style={{ fontSize: '4rem' }}></i></div>
                    <h4 className="mb-2">{isPayNowMode ? 'Payment Submitted' : 'Hotel Request Sent'}</h4>
                    <p className="text-muted mb-0">
                      {isPayNowMode
                        ? <>Your payment request for <strong>{manualTitle}</strong> has been submitted. DreamsTour will verify the payment and confirm your booking.</>
                        : <>Your request for <strong>{isManualMode ? manualTitle : (name || destination)}</strong> has been submitted. Our team will review it and contact you shortly.</>}
                    </p>
                    <div className="bg-light rounded p-3 mt-3 text-start">
                      <h6 className="fs-14 mb-2">{isPayNowMode ? 'What happens next?' : 'What happens next?'}</h6>
                      <ul className="fs-13 mb-0 ps-3">
                        {isPayNowMode ? (
                          <>
                            <li>Our team verifies your payment and checks booking availability.</li>
                            <li>We contact you via phone or WhatsApp if anything needs clarification.</li>
                            <li>Your booking is only confirmed after manual verification.</li>
                            <li>No card payment is collected on the website.</li>
                          </>
                        ) : (
                          <>
                            <li>Our team reviews your request and confirms availability.</li>
                            <li>We contact you via phone or WhatsApp with the details.</li>
                            <li>Payment instructions (Wafa Cash or bank transfer) will be shared after confirmation.</li>
                            <li>No card payment is collected on the website.</li>
                          </>
                        )}
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
      <Breadcrumb title={pageTitle} breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-01" />
      <div className="content">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card shadow-none border mt-4">
                <div className="card-body">
                  <h5 className="mb-3">{pageTitle}</h5>

                  {isManualMode && (
                    isPayNowMode ? (
                    <div className="bg-light rounded p-3 mb-3">
                      <h6 className="fs-14 fw-semibold mb-2">Payment Summary</h6>
                      <div className="row g-2 fs-14">
                          <div className="col-md-6"><span className="text-muted">Hotel:</span> {manualTitle}</div>
                          <div className="col-md-6"><span className="text-muted">Location:</span> {manualCity}</div>
                          {!!manualHotelSelection?.address && <div className="col-md-12"><span className="text-muted">Address:</span> {manualHotelSelection.address}</div>}
                          <div className="col-md-6"><span className="text-muted">Check-in:</span> {checkInDate || 'Not provided'}</div>
                          <div className="col-md-6"><span className="text-muted">Check-out:</span> {checkOutDate || 'Not provided'}</div>
                          <div className="col-md-6"><span className="text-muted">Nights:</span> {stayNights}</div>
                          <div className="col-md-6"><span className="text-muted">Rooms:</span> {rooms}</div>
                          <div className="col-md-6"><span className="text-muted">Adults:</span> {adults}</div>
                          <div className="col-md-6"><span className="text-muted">Children:</span> {children}</div>
                          <div className="col-md-6"><span className="text-muted">Price per night:</span> <strong>{resolvedManualPrice > 0 && resolvedManualCurrency ? `${resolvedManualPrice} ${resolvedManualCurrency}`.trim() : 'Price not configured yet'}</strong></div>
                          <div className="col-md-6"><span className="text-muted">Payable amount:</span> <strong>{payableAmountValue ? `${payableAmountValue} ${resolvedManualCurrency || ''}`.trim() : 'Pending admin price'}</strong></div>
                          <div className="col-md-6"><span className="text-muted">Provider:</span> <span className="badge bg-secondary">{sourceName || manualHotelSelection?.sourceName || 'manual'}</span></div>
                          {selectedBoardType && <div className="col-md-6"><span className="text-muted">Board:</span> {selectedBoardType}</div>}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-light rounded p-3 mb-3">
                        <h6 className="fs-14 fw-semibold mb-2">Request Details</h6>
                        <div className="row g-2 fs-14">
                          <div className="col-md-6"><span className="text-muted">Hotel:</span> {manualTitle}</div>
                          <div className="col-md-6"><span className="text-muted">Location:</span> {manualCity}</div>
                          {!!manualHotelSelection?.address && <div className="col-md-12"><span className="text-muted">Address:</span> {manualHotelSelection.address}</div>}
                          <div className="col-md-6"><span className="text-muted">Check-in:</span> {checkInDate || 'Not provided'}</div>
                          <div className="col-md-6"><span className="text-muted">Check-out:</span> {checkOutDate || 'Not provided'}</div>
                          <div className="col-md-6"><span className="text-muted">Guests:</span> {adults} Adult(s){Number(children) > 0 ? `, ${children} Child(ren)` : ''}</div>
                          <div className="col-md-6"><span className="text-muted">Rooms:</span> {rooms}</div>
                          <div className="col-md-6"><span className="text-muted">Price:</span> <strong>{manualPriceLabel}</strong></div>
                          <div className="col-md-6"><span className="text-muted">Provider:</span> <span className="badge bg-secondary">{sourceName || 'manual'}</span></div>
                          {selectedBoardType && <div className="col-md-6"><span className="text-muted">Board:</span> {selectedBoardType}</div>}
                        </div>
                      </div>
                    )
                  )}

                  {!isManualMode && isDuffelMode && (
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

                  {!isManualMode && !isDuffelMode && (
                    <div className="bg-light rounded p-3 mb-3">
                      <h6 className="fs-14 fw-semibold mb-2">Hotel Request</h6>
                      <div className="row g-2 fs-14">
                        <div className="col-md-6"><span className="text-muted">Destination:</span> {destination}</div>
                        <div className="col-md-6"><span className="text-muted">Check-in:</span> {checkInDate || 'Not provided'}</div>
                        <div className="col-md-6"><span className="text-muted">Check-out:</span> {checkOutDate || 'Not provided'}</div>
                        <div className="col-md-6"><span className="text-muted">Guests:</span> {adults} Adult(s)</div>
                        <div className="col-md-6"><span className="text-muted">Rooms:</span> {rooms}</div>
                        <div className="col-md-6"><span className="text-muted">Provider:</span> <span className="badge bg-secondary">manual</span></div>
                      </div>
                    </div>
                  )}

                  {isPayNowMode && !hasPayableAmount ? (
                    <div className="alert alert-warning py-3 mb-3">
                      <strong>This hotel is configured for Pay Now, but the payment price has not been added yet.</strong>
                      <div className="mt-1">Admin must add a price before payment can be submitted.</div>
                    </div>
                  ) : null}

                  <div className="bg-info bg-opacity-10 border border-info border-opacity-25 rounded p-3 mb-3">
                    <h6 className="fs-14 fw-semibold mb-1">{isPayNowMode ? 'Manual payment verification' : 'Manual payment after confirmation'}</h6>
                    <p className="fs-13 text-muted mb-0">
                      {isPayNowMode
                        ? 'Pay now using Wafa Cash or Bank Transfer. DreamsTour will verify the payment and confirm your booking after manual review.'
                        : 'Submit your request first. Our team will confirm availability and contact you with Wafa Cash or bank transfer instructions. No card payment is collected on the website.'}
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
                        <label className="form-label fs-14">Phone / WhatsApp {isPayNowMode ? <span className="text-danger">*</span> : null}</label>
                        <input type="tel" className="form-control" placeholder="Phone number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required={isPayNowMode} />
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
                          className={`border rounded p-3 flex-fill ${paymentMethod === 'card' ? 'border-secondary bg-light text-muted' : ''}`}
                          style={{ minWidth: 140, opacity: 0.7, cursor: 'not-allowed' }}
                          aria-disabled="true"
                        >
                          <div className="fw-medium">Card</div>
                          <small className="text-muted">Coming soon</small>
                        </div>
                        {PAYMENT_METHODS.map((pm) => (
                          <div
                            key={pm.value}
                            className={`border rounded p-3 cursor-pointer flex-fill ${paymentMethod === pm.value ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                            onClick={() => { setPaymentMethod(pm.value); setReceiptError(''); }}
                            style={{ cursor: 'pointer', minWidth: 140 }}
                          >
                            <div className="fw-medium">{pm.label}</div>
                            <small className="text-muted">{isPayNowMode ? 'Upload payment receipt' : 'Upload payment receipt'}</small>
                          </div>
                        ))}
                      </div>
                    </div>

                    {hasPayableAmount && (paymentMethod === 'wafa_cash' || paymentMethod === 'bank_transfer') && (
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

                    {isPayNowMode && hasPayableAmount && (
                      <div className="mb-3">
                        <label className="form-label fs-14">Payment reference or note <span className="text-muted fw-normal">(optional)</span></label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Transfer reference, Wafa Cash code, or note"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          maxLength={120}
                        />
                      </div>
                    )}

                    {isPayNowMode && hasPayableAmount && (
                      <div className="form-check mb-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="paymentConsent"
                          checked={consentAccepted}
                          onChange={(e) => setConsentAccepted(e.target.checked)}
                        />
                        <label className="form-check-label fs-14" htmlFor="paymentConsent">
                          I understand my booking will be confirmed after DreamsTour verifies the payment and hotel availability.
                        </label>
                      </div>
                    )}

                    <button type="submit" className="btn btn-primary w-100" disabled={submitting || (isPayNowMode && !hasPayableAmount)}>
                      {submitting
                        ? <><span className="spinner-border spinner-border-sm me-2" />Sending...</>
                        : (isPayNowMode ? (hasPayableAmount ? 'Submit Payment' : 'Pay Now') : 'Send Request')}
                    </button>
                    {isPayNowMode && !hasPayableAmount ? (
                      <p className="fs-12 text-muted text-center mt-2 mb-0">Price required before payment</p>
                    ) : null}
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
