// Numeric +/− stepper used for weights and reps
export default function Stepper({ value, onChange, step = 1, min = 0, label }) {
  return (
    <div className="flex items-center gap-3">
      {label && <span className="text-gray-500 text-sm w-16">{label}</span>}
      <button
        onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))}
        className="min-tap w-12 h-12 rounded-full bg-gray-100 text-xl font-bold text-gray-700 flex items-center justify-center active:bg-gray-200"
        aria-label="Decrease"
      >−</button>
      <span className="w-16 text-center text-xl font-semibold text-gray-900">
        {step < 1 ? (+value).toFixed(1) : value}
        {label === 'kg' || label?.includes('kg') ? '' : ''}
      </span>
      <button
        onClick={() => onChange(+(value + step).toFixed(2))}
        className="min-tap w-12 h-12 rounded-full bg-teal-700 text-xl font-bold text-white flex items-center justify-center active:bg-teal-600"
        aria-label="Increase"
      >+</button>
    </div>
  )
}
