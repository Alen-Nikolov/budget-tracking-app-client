"use client";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Doughnut } from "react-chartjs-2";
import type { CategoryTotal } from "@/lib/types";

// Registered locally (not globally) so only this chart shows labels on the arcs.
ChartJS.register(ArcElement, Tooltip, Legend);

export default function ExpenseDoughnut({ data, total }: { data: CategoryTotal[]; total: number }) {
  if (data.length === 0) return <p className="hint">No expenses in this range.</p>;

  const colours = data.map((d) => d.categoryColour);
  return (
    <div className="chart">
      <Doughnut
        plugins={[ChartDataLabels]}
        data={{
          labels: data.map((d) => d.categoryName),
          datasets: [{ data: data.map((d) => d.total), backgroundColor: colours, borderWidth: 2 }],
        }}
        options={{
          maintainAspectRatio: false,
          cutout: "45%",
          plugins: {
            legend: { position: "bottom" },
            tooltip: {
              callbacks: {
                label: (c) => ` ${c.label}: ${Number(c.raw).toFixed(2)} (${((Number(c.raw) / total) * 100).toFixed(1)}%)`,
              },
            },
            datalabels: {
              formatter: (v: number, ctx) => `${ctx.chart.data.labels?.[ctx.dataIndex]}\n${v.toFixed(2)}`,
              color: "#fff",
              textShadowColor: "rgba(0,0,0,0.75)",
              textShadowBlur: 4,
              textStrokeColor: "rgba(0,0,0,0.35)",
              textStrokeWidth: 2,
              font: { weight: "bold", size: 11 },
              textAlign: "center",
              // Hide labels on slivers too thin to hold text.
              display: (ctx) => Number(ctx.dataset.data[ctx.dataIndex]) / total > 0.04,
            },
          },
        }}
      />
    </div>
  );
}
