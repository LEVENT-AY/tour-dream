import { useState } from "react";

type Location = {
  value: string;
  subValue?: string;
};

type Props = {
  label: string;
  defaultValue: string;
  defaultSubValue: string;
  locations: Location[];
  onChange?: (value: string) => void;
  value?: string;
  subValue?: string;
};

export default function BookingDropdown({
  label,
  defaultValue,
  defaultSubValue,
  locations,
  onChange,
  value: controlledValue,
  subValue: controlledSubValue,
}: Props) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [internalSubValue, setInternalSubValue] = useState(defaultSubValue);

  const displayValue = controlledValue !== undefined ? controlledValue : internalValue;
  const displaySubValue = controlledSubValue !== undefined ? controlledSubValue : internalSubValue;

  const handleSelect = (loc: Location) => {
    setInternalValue(loc.value);
    setInternalSubValue(loc.subValue??"");
    onChange?.(loc.value);
  };

  return (
    <div className="booking-dropdown">

      <label className="form-label fs-14 text-default mb-1">{label}</label>

      <input
        type="text"
        className="form-control value-input"
        value={displayValue}
        readOnly
      />
    {displaySubValue ? (
      <p className="fs-12 mb-0">{displaySubValue}</p>
    ):(<p className="fs-12 mb-0">{defaultSubValue}</p>)}

      <div className="dropdown-menu dropdown-md p-0">
        <ul>
          {locations.map((loc, i) => (
            <li className="border-bottom" key={i}>
              <a
                href="#"
                className="dropdown-item"
                onClick={(e) => {
                  e.preventDefault();
                  handleSelect(loc);
                }}
              >
                <div className="fs-16 fw-medium text-dark">
                  {loc.value}
                </div>
                <p>{loc.subValue}</p>
              </a>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
