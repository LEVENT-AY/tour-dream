import React from 'react';
import { Select } from 'antd';

const { Option } = Select;

export interface OptionType {
  label: string;
  value: string | number;
}

interface CustomDropdownProps {
  options: OptionType[];
  defaultValue?: OptionType | null; // Change to expect an object
  value?: OptionType | null;
  className?: string;
  placeholder?: string;
  modal?: boolean;
  onChange?: (selected: OptionType | null) => void;
}

const CustomSelect: React.FC<CustomDropdownProps> = ({
  options,
  defaultValue,
  value,
  className,
  placeholder,
  modal,
  onChange,
}) => {
  // Determine the popup container based on the `modal` prop
  const getPopupContainer = modal
    ? () =>
        (document.getElementsByClassName('modal')[0] as HTMLElement) ||
        document.body
    : undefined;

  return (
    <Select
      defaultValue={defaultValue} // Pass the object directly
      value={value}
      className={className}
      placeholder={placeholder}
      style={{ width: '100%' }}
      getPopupContainer={getPopupContainer}
      labelInValue // Required for handling objects in `defaultValue` and `onChange`
      onChange={onChange}
    >
      {options.map((option) => (
        <Option key={option.value} value={option.value}>
          {option.label}
        </Option>
      ))}
    </Select>
  );
};

export default CustomSelect;
