import React from 'react';

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  unit?: string;
};

export default function Knob({ label, value, min, max, step = 1, onChange, unit }: Props) {
  return (
    <label className="knob">
      <span>{label}: {Math.round(value)}{unit ?? ''}</span>
      <input
        type="range"
        role="slider"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

