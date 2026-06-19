import { useState } from "react";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { addDays, format } from "date-fns";

const { RangePicker } = DatePicker;

interface CommonDateRangeProps {
  onApply?: (start: Date, end: Date) => void;
  fromLabel?: string;
  toLabel?: string;
}

const CommonDateRange = ({ onApply, fromLabel, toLabel }: CommonDateRangeProps) => {
  const today = new Date();
  const tomorrow = addDays(today, 1);

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(tomorrow);

  const [open, setOpen] = useState(false);

  const handleChange = (dates: any) => {
    if (!dates) return;

    const start = dates[0].toDate();
    const end = dates[1].toDate();

    setStartDate(start);
    setEndDate(end);

    onApply?.(start, end);
  };
const disabledDate = (current: any) => {
  return current && current < dayjs().startOf("day");
};
  return (
    <div className="date-custom-multipicker">

      {/* Hidden AntD RangePicker */}
      <RangePicker
        open={open}
        onOpenChange={(o) => setOpen(o)}
        value={[dayjs(startDate), dayjs(endDate)]}
        onChange={handleChange}
        format="DD-MM-YYYY"
         disabledDate={disabledDate}
        style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
        getPopupContainer={(trigger) => trigger.parentElement!}
      />

      {/* Your Custom Form UI */}
      <span
        onClick={() => setOpen(true)}
        style={{ display: "contents", cursor: "pointer" }}
      >
        <div className="form-item border-start">
          <label className="form-label fs-14 text-default mb-1">
            {fromLabel}
          </label>
          <input
            type="text"
            className="form-control"
            value={format(startDate, "dd-MM-yyyy")}
            readOnly
          />
          <p className="fs-12 mb-0">{format(startDate, "EEEE")}</p>
        </div>

        <div className="form-item">
          <label className="form-label fs-14 text-default mb-1">
            {toLabel}
          </label>
          <input
            type="text"
            className="form-control"
            value={format(endDate, "dd-MM-yyyy")}
            readOnly
          />
          <p className="fs-12 mb-0">{format(endDate, "EEEE")}</p>
        </div>
      </span>
    </div>
  );
};

export default CommonDateRange;
