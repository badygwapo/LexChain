import { scaleBand, scaleLinear } from "d3";

type PipelineDatum = {
  label: string;
  value: number;
  color: string;
};

type PipelineBarChartProps = {
  data: PipelineDatum[];
  total: number;
};

const chartWidth = 680;
const chartHeight = 260;
const margin = { top: 18, right: 90, bottom: 28, left: 112 };

export function PipelineBarChart({ data, total }: PipelineBarChartProps) {
  const innerWidth = chartWidth - margin.left - margin.right;
  const innerHeight = chartHeight - margin.top - margin.bottom;
  const xMax = Math.max(total, ...data.map((item) => item.value), 1);

  const y = scaleBand()
    .domain(data.map((item) => item.label))
    .range([0, innerHeight])
    .padding(0.42);

  const x = scaleLinear().domain([0, xMax]).nice().range([0, innerWidth]);
  const ticks = x.ticks(4);

  return (
    <div className="rounded-[20px] border border-[#E4EEF9] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[#0C2B49]">Document Pipeline</h2>
          <p className="mt-1 text-sm font-semibold text-[#64748b]">
            Processing, anchoring, and review load.
          </p>
        </div>
        <div className="rounded-full bg-[#EAF6FF] px-3 py-1 text-xs font-black text-[#0770c4]">
          {total.toLocaleString()} total
        </div>
      </div>

      <svg
        aria-label="Document pipeline bar chart"
        className="mt-4 h-auto w-full overflow-visible"
        role="img"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      >
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {ticks.map((tick) => (
            <g key={tick} transform={`translate(${x(tick)}, 0)`}>
              <line stroke="#E4EEF9" strokeDasharray="4 6" y1={0} y2={innerHeight} />
              <text
                fill="#94A3B8"
                fontSize="11"
                fontWeight="800"
                textAnchor="middle"
                y={innerHeight + 22}
              >
                {tick}
              </text>
            </g>
          ))}

          {data.map((item) => {
            const barY = y(item.label) ?? 0;
            const barWidth = x(item.value);
            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;

            return (
              <g key={item.label}>
                <text
                  dy="0.32em"
                  fill="#0C2B49"
                  fontSize="13"
                  fontWeight="900"
                  textAnchor="end"
                  x={-16}
                  y={barY + y.bandwidth() / 2}
                >
                  {item.label}
                </text>
                <rect
                  fill="#F5FAFF"
                  height={y.bandwidth()}
                  rx={14}
                  width={innerWidth}
                  x={0}
                  y={barY}
                />
                <rect
                  fill={item.color}
                  height={y.bandwidth()}
                  rx={14}
                  width={barWidth}
                  x={0}
                  y={barY}
                />
                <text
                  fill="#0C2B49"
                  fontSize="13"
                  fontWeight="900"
                  textAnchor="start"
                  x={Math.min(innerWidth + 12, barWidth + 12)}
                  y={barY + y.bandwidth() / 2}
                  dy="0.32em"
                >
                  {item.value.toLocaleString()} ({percentage}%)
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
