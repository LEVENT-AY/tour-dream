import ImageWithBasePath from '../../../core/common/imageWithBasePath';

export type SummaryField = {
  label: string;
  value: string;
};

export type ProductSummaryData = {
  mode: 'hotel' | 'flight';
  title: string;
  location?: string;
  image?: string;
  priceLabel?: string;
  totalLabel?: string;
  badgeLabel?: string;
  note?: string;
  fields: SummaryField[];
  lines?: string[];
};

type ProductSummaryProps = {
  product: ProductSummaryData;
};

const ProductSummary = ({ product }: ProductSummaryProps) => (
  <div className="unified-checkout-card unified-checkout-card--summary">
    <div className="unified-checkout-card__header">
      <div>
        <p className="unified-checkout-card__eyebrow">Product Information</p>
        <h3 className="unified-checkout-card__title">{product.title}</h3>
        {product.location ? <p className="unified-checkout-card__subtext">{product.location}</p> : null}
      </div>
      {product.badgeLabel ? <span className="unified-checkout-pill">{product.badgeLabel}</span> : null}
    </div>

    {product.image ? (
      <div className="unified-checkout-media">
        <ImageWithBasePath src={product.image} alt={product.title} className="img-fluid" />
      </div>
    ) : null}

    <div className="unified-checkout-summary">
      {product.fields.length > 0 ? (
        <div className="unified-checkout-summary__grid">
          {product.fields.map((field) => (
            <div className="unified-checkout-summary__item" key={`${field.label}-${field.value}`}>
              <span>{field.label}</span>
              <strong>{field.value}</strong>
            </div>
          ))}
        </div>
      ) : null}

      {product.lines?.length ? (
        <div className="unified-checkout-summary__lines">
          {product.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      ) : null}

      {(product.priceLabel || product.totalLabel) ? (
        <div className="unified-checkout-total">
          {product.priceLabel ? (
            <div className="unified-checkout-total__row">
              <span>Price</span>
              <strong>{product.priceLabel}</strong>
            </div>
          ) : null}
          {product.totalLabel ? (
            <div className="unified-checkout-total__row unified-checkout-total__row--primary">
              <span>Total due</span>
              <strong>{product.totalLabel}</strong>
            </div>
          ) : null}
        </div>
      ) : null}

      {product.note ? <p className="unified-checkout-note">{product.note}</p> : null}
    </div>
  </div>
);

export default ProductSummary;
