import { area, curveMonotoneX, line, scaleLinear, scalePoint } from "d3";

type ThroughputDatum = {
  label: string;
  processed: number;
  anchored: number;
};

type ThroughputAreaChartProps = {
  data: ThroughputDatum[];
};

const chartWidth = 680;
const chartHeight = 260;
const margin = { top: 24, right: 22, bottom: 40, left: 44 };

export function ThroughputAreaChart({ data }: ThroughputAreaChartProps) {
  const innerWidth = chartWidth - margin.left - margin.right;
  const innerHeight = chartHeight - margin.top - margin.bottom;
  const yMax = Math.max(...data.flatMap((item) => [item.processed, item.anchored]), 1);
  const x = scalePoint()
    .domain(data.map((item) => item.label))
    .range([0, innerWidth])
    .padding(0.35);
  const y = scaleLinear().domain([0, yMax]).nice().range([innerHeight, 0]);

  const processedArea = area<ThroughputDatum>()
    .x((item) => x(item.label) ?? 0)
    .y0(innerHeight)
    .y1((item) => y(item.processed))
    .curve(curveMonotoneX)(data);
  const processedLine = line<ThroughputDatum>()
    .x((item) => x(item.label) ?? 0)
    .y((item) => y(item.processed))
    .curve(curveMonotoneX)(data);
  const anchoredLine = line<ThroughputDatum>()
    .x((item) => x(item.label) ?? 0)
    .y((item) => y(item.anchored))
    .curve(curveMonotoneX)(data);

  return (
    <div className="rounded-[20px] border border-[#E4EEF9] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-[#0C2B49]">Processing Trend</h2>
          <p className="mt-1 text-sm font-semibold text-[#64748b]">
            Demo trend derived from current totals until backend time-series exists.
          </p>
        </div>
        <div className="flex gap-3 text-xs font-black text-[#64748b]">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0985E7]" />
            Processed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#14B8A6]" />
            On-chain
          </span>
        </div>
      </div>

      <svg
        aria-label="Processing trend area chart"
        className="mt-4 h-auto w-full overflow-visible"
        role="img"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      >
        <defs>
          <linearGradient id="processedAreaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0985E7" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#0985E7" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {y.ticks(4).map((tick) => (
            <g key={tick} transform={`translate(0, ${y(tick)})`}>
              <line stroke="#E4EEF9" strokeDasharray="4 6" x1={0} x2={innerWidth} />
              <text
                dy="0.32em"
                fill="#94A3B8"
                fontSize="11"
                fontWeight="800"
                textAnchor="end"
                x={-12}
              >
                {tick}
              </text>
            </g>
          ))}
          {processedArea ? <path d={processedArea} fill="url(#processedAreaGradient)" /> : null}
          {processedLine ? (
            <path d={processedLine} fill="none" stroke="#0985E7" strokeLinecap="round" strokeWidth="4" />
          ) : null}
          {anchoredLine ? (
            <path d={anchoredLine} fill="none" stroke="#14B8A6" strokeDasharray="7 8" strokeLinecap="round" strokeWidth="3" />
          ) : null}
          {data.map((item) => {
            const pointX = x(item.label) ?? 0;

            return (
              <g key={item.label}>
                <circle cx={pointX} cy={y(item.processed)} fill="#0985E7" r="5" stroke="white" strokeWidth="3" />
                <text
                  fill="#64748B"
                  fontSize="12"
                  fontWeight="900"
                  textAnchor="middle"
                  x={pointX}
                  y={innerHeight + 28}
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
