interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  disabled?: boolean;
}

export default function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  unit = '',
  disabled = false,
}: SliderProps) {
  const id = `slider-${label?.replace(/\s+/g, '-').toLowerCase() ?? 'default'}`;

  return (
    <div className="w-full">
      {label && (
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor={id} className="text-xs font-medium text-slate-700">
            {label}
          </label>
          <span className="text-xs font-semibold text-slate-900">
            {value}
            {unit}
          </span>
        </div>
      )}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}
