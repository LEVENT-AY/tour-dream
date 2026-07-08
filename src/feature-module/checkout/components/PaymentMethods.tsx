import type { PreferredPaymentMethod } from '../../../core/services/firebaseServices';

type PaymentMethodsProps = {
  amountLabel?: string;
  selectedMethod: PreferredPaymentMethod | '';
  paymentReference: string;
  receiptFileName: string;
  receiptError: string;
  cardEnabled?: boolean;
  onSelectMethod: (method: PreferredPaymentMethod) => void;
  onChangeReference: (value: string) => void;
  onChangeReceipt: (file: File | null) => void;
};

const FINANCE_PLACEHOLDER_COPY =
  'Payment destination details will appear here once DreamsTour finance settings are configured. You can still submit your receipt for verification.';

const METHOD_COPY: Record<'wafa_cash' | 'bank_transfer', { title: string; body: string }> = {
  wafa_cash: {
    title: 'Wafa Cash instructions',
    body: 'Select Wafa Cash, send the amount shown in the summary, then upload the receipt or screenshot for manual verification.',
  },
  bank_transfer: {
    title: 'Bank transfer instructions',
    body: 'Transfer the amount shown in the summary, keep your transfer receipt, and upload it here so our team can verify the payment.',
  },
};

const PaymentMethods = ({
  amountLabel,
  selectedMethod,
  paymentReference,
  receiptFileName,
  receiptError,
  cardEnabled = false,
  onSelectMethod,
  onChangeReference,
  onChangeReceipt,
}: PaymentMethodsProps) => {
  const selectedConfig =
    selectedMethod === 'wafa_cash' || selectedMethod === 'bank_transfer'
      ? METHOD_COPY[selectedMethod]
      : null;

  return (
    <div className="unified-checkout-card">
      <div className="unified-checkout-card__header">
        <div>
          <p className="unified-checkout-card__eyebrow">Payment Method</p>
          <h3 className="unified-checkout-card__title">Complete payment</h3>
          <p className="unified-checkout-card__subtext">
            Payment pending verification. Booking will be confirmed after payment verification.
          </p>
        </div>
      </div>

      <div className="unified-checkout-methods">
        <button
          type="button"
          className={`unified-checkout-method ${selectedMethod === 'wafa_cash' ? 'is-selected' : ''}`}
          onClick={() => onSelectMethod('wafa_cash')}
        >
          <span className="unified-checkout-method__title">Wafa Cash</span>
          <span className="unified-checkout-method__desc">Manual verification</span>
        </button>
        <button
          type="button"
          className={`unified-checkout-method ${selectedMethod === 'bank_transfer' ? 'is-selected' : ''}`}
          onClick={() => onSelectMethod('bank_transfer')}
        >
          <span className="unified-checkout-method__title">Bank Transfer</span>
          <span className="unified-checkout-method__desc">Manual verification</span>
        </button>
        <button
          type="button"
          className={`unified-checkout-method ${selectedMethod === 'card' ? 'is-selected' : ''} ${cardEnabled ? '' : 'is-disabled'}`}
          onClick={() => {
            if (cardEnabled) onSelectMethod('card');
          }}
          disabled={!cardEnabled}
          aria-disabled={!cardEnabled}
        >
          <span className="unified-checkout-method__title">Card Payment</span>
          <span className="unified-checkout-method__desc">{cardEnabled ? 'Available' : 'Coming soon'}</span>
        </button>
      </div>

      {selectedMethod === 'card' && !cardEnabled ? (
        <div className="unified-checkout-alert">
          Card Payment is coming soon and cannot be selected for this checkout yet.
        </div>
      ) : null}

      {selectedConfig ? (
        <div className="unified-checkout-instructions">
          <h4>{selectedConfig.title}</h4>
          <p>{selectedConfig.body}</p>
          {amountLabel ? (
            <div className="unified-checkout-instructions__amount">
              <span>Amount to verify</span>
              <strong>{amountLabel}</strong>
            </div>
          ) : null}
          <p className="mb-0">{FINANCE_PLACEHOLDER_COPY}</p>
        </div>
      ) : null}

      {(selectedMethod === 'wafa_cash' || selectedMethod === 'bank_transfer') ? (
        <div className="row g-3 mt-1">
          <div className="col-12">
            <label className="form-label fs-14">
              Upload receipt <span className="text-danger">*</span>
            </label>
            <input
              type="file"
              className={`form-control ${receiptError ? 'is-invalid' : ''}`}
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={(event) => onChangeReceipt(event.target.files?.[0] || null)}
            />
            {receiptFileName ? <p className="fs-12 text-muted mt-2 mb-0">Selected receipt: {receiptFileName}</p> : null}
            {receiptError ? <div className="invalid-feedback">{receiptError}</div> : null}
          </div>
          <div className="col-12">
            <label className="form-label fs-14">
              Payment reference <span className="text-muted fw-normal">(optional)</span>
            </label>
            <input
              type="text"
              className="form-control"
              value={paymentReference}
              onChange={(event) => onChangeReference(event.target.value)}
              maxLength={120}
              placeholder="Transfer reference, Wafa Cash code, or short note"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PaymentMethods;
