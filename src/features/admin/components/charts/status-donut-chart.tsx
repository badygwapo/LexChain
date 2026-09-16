import { arc, pie } from "d3";
import type { PieArcDatum } from "d3";

type DonutDatum = {
  label: string;
  value: number;
  color: string;
};

type StatusDonutChartProps = {
  data: DonutDatum[];
  centerLabel: string;
  centerValue: string;
};

const size = 220;
const radius = 94;
const strokeWidth = 34;

export function StatusDonutChart({ data, centerLabel, centerValue }: StatusDonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const fallbackData = total > 0 ? data : [{ label: "No data", value: 1, color: "#E4EEF9" }];
  const arcs = pie<DonutDatum>()
    .value((item) => item.value)
    .sort(null)(fallbackData);
  const arcPath = arc<PieArcDatum<DonutDatum>>()
    .innerRadius(radius - strokeWidth)
    .outerRadius(radius)
    .cornerRadius(10);

  return (
    <div className="rounded-[20px] border border-[#E4EEF9] bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-black text-[#0C2B49]">Status Breakdown</h2>
        <p className="mt-1 text-sm font-semibold text-[#64748b]">
          Success, pending, and failed documents.
        </p>
      </div>

      <div className="mt-5 grid items-center gap-5 sm:grid-cols-[220px_1fr]">
        <div className="relative mx-auto h-[220px] w-[220px]">
          <svg
            aria-label="Document status donut chart"
            className="h-full w-full"
            role="img"
            viewBox={`0 0 ${size} ${size}`}
          >
            <g transform={`translate(${size / 2}, ${size / 2})`}>
              {arcs.map((item) => (
                <path
                  d={arcPath(item) ?? undefined}
                  fill={item.data.color}
                  key={item.data.label}
                />
              ))}
            </g>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-4xl font-black text-[#0C2B49]">{centerValue}</p>
            <p className="mt-1 text-[11px] font-black uppercase text-[#64748b]">{centerLabel}</p>
          </div>
        </div>

        <div className="space-y-3">
          {data.map((item) => {
            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;

            return (
              <div
                className="flex items-center justify-between gap-3 rounded-2xl bg-[#F8FBFF] px-4 py-3"
                key={item.label}
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-black text-[#0C2B49]">{item.label}</span>
                </div>
                <span className="text-sm font-black text-[#64748b]">
                  {item.value.toLocaleString()} ({percentage}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
