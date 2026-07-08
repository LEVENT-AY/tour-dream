import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import Breadcrumb from '../../core/common/Breadcrumb/breadcrumb';
import { useAuth } from '../../core/contexts/AuthContext';
import { app } from '../../firebase';
import { getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { createServiceRequest, type ManualPaymentStatus, type PreferredPaymentMethod } from '../../core/services/firebaseServices';
import type { DuffelOffer } from '../../core/services/duffelApi';
import { all_routes } from '../router/all_routes';
import BuyerInfoForm, { type BuyerInfoValues } from './components/BuyerInfoForm';
import PaymentMethods from './components/PaymentMethods';
import ProductSummary, { type ProductSummaryData } from './components/ProductSummary';

const storage = getStorage(app);
const MANUAL_SELECTION_KEY = 'manualHotelSelection';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

type CheckoutMode = 'hotel' | 'flight';

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
  image?: string;
  sourceName?: string;
  sourceUrl?: string;
  bookingMode?: string;
  selectedBoardType?: string;
};

type HotelCheckoutData = {
  id: string;
  title: string;
  location: string;
  image: string;
  sourceName: string;
  sourceUrl: string;
  boardType: string;
  bookingMode: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  rooms: number;
  children: number;
  nights: number;
  priceFrom: number;
  priceCurrency: string;
  priceUnit: string;
  totalAmount: number | null;
  paymentReady: boolean;
};

const readManualSelection = (): ManualHotelSelection | null => {
  try {
    const raw = sessionStorage.getItem(MANUAL_SELECTION_KEY);
    return raw ? (JSON.parse(raw) as ManualHotelSelection) : null;
  } catch {
    return null;
  }
};

const readFlightOffer = (): DuffelOffer | null => {
  try {
    const raw = sessionStorage.getItem('duffelOffer');
    return raw ? (JSON.parse(raw) as DuffelOffer) : null;
  } catch {
    return null;
  }
};

const formatDate = (value?: string) => {
  if (!value) return '';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('DD MMM YYYY') : value;
};

const formatDateTime = (value?: string) => {
  if (!value) return '';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('DD MMM YYYY, HH:mm') : value;
};

const formatDuration = (value?: string) => {
  if (!value) return '';
  return value.replace('PT', '').replace('H', 'h ').replace('M', 'm').trim();
};

const formatMoney = (amount?: number | string | null, currency?: string, suffix?: string) => {
  const numericAmount = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(Number(numericAmount)) || Number(numericAmount) <= 0) return '';
  return `${numericAmount} ${currency || ''}${suffix ? ` / ${suffix}` : ''}`.trim();
};

const formatStops = (stops?: number) => {
  if (typeof stops !== 'number') return '';
  if (stops === 0) return 'Direct';
  return `${stops} stop${stops > 1 ? 's' : ''}`;
};

const buildHotelCheckoutData = (searchParams: URLSearchParams): HotelCheckoutData | null => {
  const selection = readManualSelection();
  const title = searchParams.get('hotelName') || selection?.title || '';
  const location = searchParams.get('destination') || selection?.location || selection?.city || '';
  const priceFrom = Number(searchParams.get('priceFrom') || selection?.priceFrom || selection?.price || 0);
  const priceCurrency = searchParams.get('priceCurrency') || selection?.priceCurrency || '';
  const priceUnit = searchParams.get('priceUnit') || selection?.priceUnit || 'night';
  const checkInDate = searchParams.get('checkInDate') || '';
  const checkOutDate = searchParams.get('checkOutDate') || '';
  const nightsFromDates = dayjs(checkOutDate).diff(dayjs(checkInDate), 'day');
  const nights = Math.max(1, Number.isFinite(nightsFromDates) && nightsFromDates > 0 ? nightsFromDates : 1);
  const adults = Math.max(1, Number(searchParams.get('adults') || 1));
  const rooms = Math.max(1, Number(searchParams.get('rooms') || 1));
  const children = Math.max(0, Number(searchParams.get('children') || 0));
  const totalAmount = priceFrom > 0 && priceCurrency ? priceFrom * nights * rooms : null;

  if (!title) return null;

  return {
    id: searchParams.get('hotelId') || selection?.id || title,
    title,
    location,
    image: selection?.image || '',
    sourceName: searchParams.get('sourceName') || selection?.sourceName || '',
    sourceUrl: searchParams.get('sourceUrl') || selection?.sourceUrl || '',
    boardType: searchParams.get('selectedBoardType') || selection?.selectedBoardType || '',
    bookingMode: searchParams.get('bookingMode') || selection?.bookingMode || 'pay_now',
    checkInDate,
    checkOutDate,
    adults,
    rooms,
    children,
    nights,
    priceFrom,
    priceCurrency,
    priceUnit,
    totalAmount,
    paymentReady: priceFrom > 0 && Boolean(priceCurrency),
  };
};

const uploadReceipt = async (file: File): Promise<string> => {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `receipts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);
  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed', () => {}, reject, () => resolve(uploadTask.snapshot.ref.fullPath));
  });
};

const buildFlightProductSummary = (offer: DuffelOffer): ProductSummaryData => {
  const firstSlice = offer.slices[0];
  const lastSlice = offer.slices[offer.slices.length - 1];
  const lines = offer.slices.map((slice) =>
    `${slice.origin} -> ${slice.destination} • ${formatDateTime(slice.departureTime)} • ${formatStops(slice.stops)}`
  );

  return {
    mode: 'flight',
    title: `${firstSlice?.origin || ''} -> ${lastSlice?.destination || ''}`.trim(),
    location: offer.airline ? `${offer.airline}${offer.airlineIata ? ` (${offer.airlineIata})` : ''}` : '',
    badgeLabel: 'Flight Checkout',
    priceLabel: `${offer.totalCurrency} ${offer.totalAmount}`,
    totalLabel: `${offer.totalCurrency} ${offer.totalAmount}`,
    note: 'Flight fare is subject to availability until payment is verified.',
    fields: [
      { label: 'Departure', value: formatDateTime(firstSlice?.departureTime) || 'Not provided' },
      { label: 'Arrival', value: formatDateTime(lastSlice?.arrivalTime) || 'Not provided' },
      { label: 'Duration', value: formatDuration(firstSlice?.duration) || 'Not provided' },
      { label: 'Stops', value: formatStops(firstSlice?.stops) || 'Not provided' },
      { label: 'Cabin', value: offer.cabinClass || 'Not provided' },
      { label: 'Passengers', value: '1 passenger' },
      { label: 'Offer expires', value: formatDateTime(offer.expiresAt) || 'Not provided' },
    ],
    lines,
  };
};

const buildHotelProductSummary = (hotel: HotelCheckoutData): ProductSummaryData => ({
  mode: 'hotel',
  title: hotel.title,
  location: hotel.location,
  image: hotel.image,
  badgeLabel: 'Hotel Checkout',
  priceLabel: formatMoney(hotel.priceFrom, hotel.priceCurrency, hotel.priceUnit) || 'Price available soon',
  totalLabel: hotel.totalAmount ? formatMoney(hotel.totalAmount, hotel.priceCurrency) : 'Price available soon',
  note: hotel.paymentReady
    ? 'Booking is confirmed after payment verification.'
    : 'Price will be available soon. Payment is blocked until a valid hotel price is configured.',
  fields: [
    { label: 'Check-in', value: formatDate(hotel.checkInDate) || 'Not provided' },
    { label: 'Check-out', value: formatDate(hotel.checkOutDate) || 'Not provided' },
    { label: 'Nights', value: String(hotel.nights) },
    { label: 'Rooms', value: String(hotel.rooms) },
    { label: 'Guests', value: `${hotel.adults} adult${hotel.adults > 1 ? 's' : ''}${hotel.children > 0 ? `, ${hotel.children} child${hotel.children > 1 ? 'ren' : ''}` : ''}` },
    ...(hotel.boardType ? [{ label: 'Board', value: hotel.boardType }] : []),
    { label: 'Payment mode', value: 'Manual payment verification' },
  ],
});

const UnifiedCheckoutPage = ({ mode }: { mode: CheckoutMode }) => {
  const routes = all_routes;
  const [searchParams] = useSearchParams();
  const { userProfile } = useAuth();

  const hotel = useMemo(() => (mode === 'hotel' ? buildHotelCheckoutData(searchParams) : null), [mode, searchParams]);
  const flightOffer = useMemo(() => (mode === 'flight' ? readFlightOffer() : null), [mode]);
  const product = useMemo(() => {
    if (mode === 'hotel' && hotel) return buildHotelProductSummary(hotel);
    if (mode === 'flight' && flightOffer) return buildFlightProductSummary(flightOffer);
    return null;
  }, [flightOffer, hotel, mode]);

  const [buyerInfo, setBuyerInfo] = useState<BuyerInfoValues>({
    fullName: userProfile?.displayName || '',
    email: userProfile?.email || '',
    phone: userProfile?.phone || '',
    country: '',
    notes: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<PreferredPaymentMethod | ''>('');
  const [paymentReference, setPaymentReference] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptError, setReceiptError] = useState('');
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof BuyerInfoValues, string>>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState('');
  const [uploadedReceiptPath, setUploadedReceiptPath] = useState('');

  useEffect(() => {
    setBuyerInfo((current) => ({
      ...current,
      fullName: current.fullName || userProfile?.displayName || '',
      email: current.email || userProfile?.email || '',
      phone: current.phone || userProfile?.phone || '',
    }));
  }, [userProfile]);

  const title = mode === 'hotel' ? 'Hotel Checkout' : 'Flight Checkout';
  const breadcrumbs = [
    { label: mode === 'hotel' ? 'Hotel' : 'Flight', link: routes.allService1, active: false },
    { label: title, active: true },
  ];

  const canSubmitHotelPayment = mode !== 'hotel' || Boolean(hotel?.paymentReady);
  const amountLabel = useMemo(() => {
    if (mode === 'hotel' && hotel?.totalAmount) return formatMoney(hotel.totalAmount, hotel.priceCurrency);
    if (mode === 'flight' && flightOffer) return `${flightOffer.totalCurrency} ${flightOffer.totalAmount}`;
    return '';
  }, [flightOffer, hotel, mode]);

  const submitLabel = submitting ? 'Submitting payment...' : 'Submit Payment for Verification';

  const updateBuyerField = (field: keyof BuyerInfoValues, value: string) => {
    setBuyerInfo((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: '' }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof BuyerInfoValues, string>> = {};
    if (!buyerInfo.fullName.trim()) nextErrors.fullName = 'Full name is required.';
    if (!buyerInfo.email.trim()) nextErrors.email = 'Email is required.';
    else if (!EMAIL_PATTERN.test(buyerInfo.email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (!buyerInfo.phone.trim()) nextErrors.phone = 'Phone / WhatsApp is required.';
    if (mode === 'hotel' && !canSubmitHotelPayment) {
      setSubmitError('This hotel cannot accept payment yet because the payable price is missing.');
    }
    if (!paymentMethod) {
      setSubmitError('Select a payment method to continue.');
    }
    if ((paymentMethod === 'wafa_cash' || paymentMethod === 'bank_transfer') && !receiptFile && !uploadedReceiptPath) {
      setReceiptError('Upload a receipt so our team can verify the payment.');
    }
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0
      && Boolean(paymentMethod)
      && (paymentMethod !== 'wafa_cash' && paymentMethod !== 'bank_transfer' || Boolean(receiptFile || uploadedReceiptPath))
      && (mode !== 'hotel' || canSubmitHotelPayment);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');
    setReceiptError('');

    if (!validate()) return;

    setSubmitting(true);

    let receiptPath = uploadedReceiptPath;
    let receiptFileName = receiptFile?.name || '';
    let receiptContentType = receiptFile?.type || '';
    let paymentStatus: ManualPaymentStatus = 'payment_submitted';

    try {
      if (receiptFile && !receiptPath) {
        receiptPath = await uploadReceipt(receiptFile);
        setUploadedReceiptPath(receiptPath);
      }

      if (mode === 'hotel' && hotel) {
        await createServiceRequest({
          serviceType: 'hotel',
          serviceId: hotel.id,
          serviceTitle: `Hotel Checkout - ${hotel.title}`,
          customerName: buyerInfo.fullName.trim(),
          customerEmail: buyerInfo.email.trim(),
          customerPhone: buyerInfo.phone.trim(),
          guestsCount: hotel.adults,
          message: buyerInfo.notes.trim() || undefined,
          preferredPaymentMethod: paymentMethod as PreferredPaymentMethod,
          paymentStatus,
          paymentReference: paymentReference.trim() || undefined,
          paymentMode: 'manual_payment',
          bookingMode: 'pay_now',
          bookingStatus: 'pending_admin_confirmation',
          requestType: 'hotel_payment',
          receiptPath: receiptPath || undefined,
          receiptFileName: receiptFileName || undefined,
          receiptContentType: receiptContentType || undefined,
          provider: 'manual',
          offerSnapshot: {
            type: 'manual_hotel_payment',
            hotelId: hotel.id,
            accommodationName: hotel.title,
            city: hotel.location,
            sourceName: hotel.sourceName,
            sourceUrl: hotel.sourceUrl,
            checkInDate: hotel.checkInDate,
            checkOutDate: hotel.checkOutDate,
            adults: hotel.adults,
            rooms: hotel.rooms,
            children: hotel.children,
            boardType: hotel.boardType,
            priceFrom: hotel.priceFrom,
            priceCurrency: hotel.priceCurrency,
            priceUnit: hotel.priceUnit,
            totalAmount: hotel.totalAmount,
            buyerCountry: buyerInfo.country.trim() || undefined,
          },
        });
      } else if (mode === 'flight' && flightOffer) {
        const firstSlice = flightOffer.slices[0];
        const lastSlice = flightOffer.slices[flightOffer.slices.length - 1];
        await createServiceRequest({
          serviceType: 'flight',
          serviceId: flightOffer.offerId,
          serviceTitle: `Flight Checkout - ${firstSlice?.origin || ''} -> ${lastSlice?.destination || ''}`.trim(),
          customerName: buyerInfo.fullName.trim(),
          customerEmail: buyerInfo.email.trim(),
          customerPhone: buyerInfo.phone.trim(),
          guestsCount: 1,
          message: buyerInfo.notes.trim() || undefined,
          preferredPaymentMethod: paymentMethod as PreferredPaymentMethod,
          paymentStatus,
          paymentReference: paymentReference.trim() || undefined,
          paymentMode: 'manual_payment',
          receiptPath: receiptPath || undefined,
          receiptFileName: receiptFileName || undefined,
          receiptContentType: receiptContentType || undefined,
          departureCity: firstSlice?.origin || undefined,
          arrivalCity: lastSlice?.destination || undefined,
          departureDate: firstSlice?.departureTime || undefined,
          passengers: 1,
          preferredClass: flightOffer.cabinClass || undefined,
          provider: 'duffel',
          offerSnapshot: {
            ...flightOffer,
            buyerCountry: buyerInfo.country.trim() || undefined,
          },
        });
        sessionStorage.removeItem('duffelOffer');
      } else {
        throw new Error('Checkout details are missing.');
      }

      setSubmittedId('submitted');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to submit payment right now.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!product) {
    return (
      <div>
        <Breadcrumb title={title} breadcrumbs={breadcrumbs} backgroundClass={mode === 'hotel' ? 'breadcrumb-bg-01' : 'breadcrumb-bg-05'} />
        <div className="content content-two">
          <div className="container">
            <div className="unified-checkout-empty">
              <h3>Checkout details not found</h3>
              <p>The selected {mode === 'hotel' ? 'hotel' : 'flight offer'} is no longer available in this session.</p>
              <Link to={mode === 'hotel' ? routes.hotelMap : routes.flightGrid} className="btn btn-primary">
                {mode === 'hotel' ? 'Browse hotels' : 'Search flights'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (submittedId) {
    return (
      <div>
        <Breadcrumb title="Payment Submitted" breadcrumbs={breadcrumbs} backgroundClass={mode === 'hotel' ? 'breadcrumb-bg-01' : 'breadcrumb-bg-05'} />
        <div className="content content-two">
          <div className="container">
            <div className="unified-checkout-empty unified-checkout-empty--success">
              <h3>Payment submitted for verification</h3>
              <p>
                {mode === 'hotel'
                  ? 'Your hotel payment was submitted. Booking will be confirmed after payment verification.'
                  : 'Your flight payment was submitted. Booking will be confirmed after payment verification.'}
              </p>
              <div className="unified-checkout-success-copy">
                <p>Wafa Cash and Bank Transfer submissions are reviewed manually by the DreamsTour team.</p>
                <p>No instant confirmation is issued until payment verification is complete.</p>
              </div>
              <div className="d-flex flex-wrap gap-2 justify-content-center">
                <Link to={mode === 'hotel' ? routes.hotelMap : routes.flightGrid} className="btn btn-primary">
                  {mode === 'hotel' ? 'Back to hotels' : 'Search more flights'}
                </Link>
                <Link to={routes.allService1} className="btn btn-light">
                  Back to home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb title={title} breadcrumbs={breadcrumbs} backgroundClass={mode === 'hotel' ? 'breadcrumb-bg-01' : 'breadcrumb-bg-05'} />
      <div className="content content-two">
        <div className="container">
          <form className="unified-checkout" onSubmit={handleSubmit}>
            <div className="row g-4">
              <div className="col-xl-7">
                <div className="unified-checkout-stack">
                  <ProductSummary product={product} />
                  <BuyerInfoForm values={buyerInfo} errors={formErrors} onChange={updateBuyerField} />
                  <PaymentMethods
                    amountLabel={amountLabel}
                    selectedMethod={paymentMethod}
                    paymentReference={paymentReference}
                    receiptFileName={receiptFile?.name || ''}
                    receiptError={receiptError}
                    onSelectMethod={(method) => {
                      setPaymentMethod(method);
                      setSubmitError('');
                      setReceiptError('');
                    }}
                    onChangeReference={setPaymentReference}
                    onChangeReceipt={(file) => {
                      setReceiptFile(file);
                      setReceiptError('');
                    }}
                  />
                </div>
              </div>
              <div className="col-xl-5">
                <div className="unified-checkout-sidebar">
                  <div className="unified-checkout-card unified-checkout-card--review">
                    <div className="unified-checkout-card__header">
                      <div>
                        <p className="unified-checkout-card__eyebrow">Review & Complete</p>
                        <h3 className="unified-checkout-card__title">Final review</h3>
                      </div>
                    </div>
                    <div className="unified-checkout-review">
                      <div className="unified-checkout-total unified-checkout-total--standalone">
                        {product.totalLabel ? (
                          <div className="unified-checkout-total__row unified-checkout-total__row--primary">
                            <span>Total due</span>
                            <strong>{product.totalLabel}</strong>
                          </div>
                        ) : null}
                      </div>
                      <p className="unified-checkout-note">
                        Payment pending verification. Booking will be confirmed after payment verification.
                      </p>
                      {mode === 'flight' ? (
                        <p className="unified-checkout-note">Flight fare is subject to availability until payment is verified.</p>
                      ) : null}
                      {mode === 'hotel' && !canSubmitHotelPayment ? (
                        <div className="unified-checkout-alert">
                          Price required before payment. This hotel needs a valid payable price before checkout can be submitted.
                        </div>
                      ) : null}
                      {submitError ? <div className="alert alert-danger py-2 mb-3">{submitError}</div> : null}
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg w-100"
                        disabled={submitting || !canSubmitHotelPayment || paymentMethod === 'card'}
                      >
                        {submitLabel}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UnifiedCheckoutPage;
