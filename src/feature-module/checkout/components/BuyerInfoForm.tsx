type BuyerInfoValues = {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  notes: string;
};

type BuyerInfoFormProps = {
  values: BuyerInfoValues;
  errors: Partial<Record<keyof BuyerInfoValues, string>>;
  onChange: (field: keyof BuyerInfoValues, value: string) => void;
};

const BuyerInfoForm = ({ values, errors, onChange }: BuyerInfoFormProps) => (
  <div className="unified-checkout-card">
    <div className="unified-checkout-card__header">
      <div>
        <p className="unified-checkout-card__eyebrow">Buyer Information</p>
        <h3 className="unified-checkout-card__title">Who should we contact?</h3>
      </div>
    </div>

    <div className="row g-3">
      <div className="col-md-6">
        <label className="form-label fs-14">
          Full name <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
          value={values.fullName}
          onChange={(event) => onChange('fullName', event.target.value)}
          placeholder="Full name"
        />
        {errors.fullName ? <div className="invalid-feedback">{errors.fullName}</div> : null}
      </div>
      <div className="col-md-6">
        <label className="form-label fs-14">
          Email <span className="text-danger">*</span>
        </label>
        <input
          type="email"
          className={`form-control ${errors.email ? 'is-invalid' : ''}`}
          value={values.email}
          onChange={(event) => onChange('email', event.target.value)}
          placeholder="Email address"
        />
        {errors.email ? <div className="invalid-feedback">{errors.email}</div> : null}
      </div>
      <div className="col-md-6">
        <label className="form-label fs-14">
          Phone / WhatsApp <span className="text-danger">*</span>
        </label>
        <input
          type="tel"
          className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
          value={values.phone}
          onChange={(event) => onChange('phone', event.target.value)}
          placeholder="Phone or WhatsApp number"
        />
        {errors.phone ? <div className="invalid-feedback">{errors.phone}</div> : null}
      </div>
      <div className="col-md-6">
        <label className="form-label fs-14">Country / Nationality</label>
        <input
          type="text"
          className={`form-control ${errors.country ? 'is-invalid' : ''}`}
          value={values.country}
          onChange={(event) => onChange('country', event.target.value)}
          placeholder="Country or nationality"
        />
        {errors.country ? <div className="invalid-feedback">{errors.country}</div> : null}
      </div>
      <div className="col-12">
        <label className="form-label fs-14">Notes</label>
        <textarea
          className="form-control"
          rows={4}
          value={values.notes}
          onChange={(event) => onChange('notes', event.target.value)}
          placeholder="Any useful booking or payment notes..."
        />
      </div>
    </div>
  </div>
);

export type { BuyerInfoValues };
export default BuyerInfoForm;
