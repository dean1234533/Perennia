interface DualRangeSliderProps {
  min: number
  max: number
  valueMin: number
  valueMax: number
  onChange: (min: number, max: number) => void
  step?: number
}

/** Two overlaid native range inputs — no external deps, keyboard-accessible
 *  out of the box, styled to match Perennia's gold/champagne language. */
export function DualRangeSlider({ min, max, valueMin, valueMax, onChange, step = 1 }: DualRangeSliderProps) {
  const pctMin = ((valueMin - min) / (max - min)) * 100
  const pctMax = ((valueMax - min) / (max - min)) * 100

  return (
    <div className="relative h-8 w-full">
      <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-white/10" />
      <div
        className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-gold to-champagne"
        style={{ left: `${pctMin}%`, right: `${100 - pctMax}%` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={valueMin}
        onChange={(e) => onChange(Math.min(Number(e.target.value), valueMax - step), valueMax)}
        className="range-thumb pointer-events-none absolute top-1/2 h-0 w-full -translate-y-1/2 appearance-none bg-transparent"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={valueMax}
        onChange={(e) => onChange(valueMin, Math.max(Number(e.target.value), valueMin + step))}
        className="range-thumb pointer-events-none absolute top-1/2 h-0 w-full -translate-y-1/2 appearance-none bg-transparent"
      />
      <style>{`
        .range-thumb::-webkit-slider-thumb {
          pointer-events: auto;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: linear-gradient(135deg, #f5d78e, #d4a256);
          border: 2px solid #0c1433;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          cursor: pointer;
        }
        .range-thumb::-moz-range-thumb {
          pointer-events: auto;
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: linear-gradient(135deg, #f5d78e, #d4a256);
          border: 2px solid #0c1433;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}
