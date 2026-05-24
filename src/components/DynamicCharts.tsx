import { useState, useMemo } from "react";
import { DatasetSummary, ChartType, AggregationType } from "../types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { BarChart3, LineChart as LineIcon, AreaChart as AreaIcon, PieChart as PieIcon, Sliders, Palette, RefreshCw, BarChart4 } from "lucide-react";

interface DynamicChartsProps {
  summary: DatasetSummary;
}

// 5 Color Palette Schemes
const PALETTES: Record<string, string[]> = {
  ocean: ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"],
  emerald: ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"],
  indigo: ["#4f46e5", "#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe"],
  sunset: ["#ea580c", "#f97316", "#fb923c", "#fdba74", "#fed7aa"],
  cosmic: ["#8b5cf6", "#a78bfa", "#c084fc", "#e9d5ff", "#f3e8ff", "#ac92fa", "#6366f1"],
};

export default function DynamicCharts({ summary }: DynamicChartsProps) {
  // 1. Chart Configuration States
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [xAxisKey, setXAxisKey] = useState<string>(summary.columns[0]?.name || "");
  
  // Find first numeric column as sensible default for Y Axis
  const numericColumns = useMemo(() => summary.columns.filter(c => c.type === "numeric"), [summary.columns]);
  const nonNumericColumns = useMemo(() => summary.columns.filter(c => c.type !== "numeric"), [summary.columns]);

  const [yAxisKey, setYAxisKey] = useState<string>(
    numericColumns[0]?.name || summary.columns[1]?.name || ""
  );
  
  const [groupByKey, setGroupByKey] = useState<string>("");
  const [aggregation, setAggregation] = useState<AggregationType>("sum");
  const [colorScheme, setColorScheme] = useState<string>("cosmic");

  // Set X-axis default intelligently if it's currently empty
  useState(() => {
    // Prefer categorical or date fields for X-axis
    const bestX = summary.columns.find(c => c.type === "categorical" || c.type === "datetime") || summary.columns[0];
    if (bestX && !xAxisKey) {
      setXAxisKey(bestX.name);
    }
  });

  // Reset parameters when columns update
  const handleReset = () => {
    const bestX = summary.columns.find(c => c.type === "categorical" || c.type === "datetime") || summary.columns[0];
    if (bestX) setXAxisKey(bestX.name);
    if (numericColumns[0]) setYAxisKey(numericColumns[0].name);
    setGroupByKey("");
    setAggregation("sum");
    setChartType("bar");
  };

  /**
   * 2. Dynamically group, filter and aggregate data for charts
   */
  const chartData = useMemo(() => {
    if (!xAxisKey) return [];

    const rawRecords = summary.records;
    
    // Helper to get number value securely
    const getNum = (obj: any, key: string): number => {
      const v = obj[key];
      if (v === null || v === undefined) return 0;
      const cleaned = String(v).replace(/[\$,%]/g, "").trim();
      const n = Number(cleaned);
      return isNaN(n) ? 0 : n;
    };

    // If GroupBy is active, we group in nesting structure
    if (groupByKey && groupByKey !== xAxisKey) {
      // Create nested grouping maps: XValue -> GroupValue -> list of records
      const xGroupMap: Record<string, Record<string, any[]>> = {};
      const uniqueGroupKeys = new Set<string>();

      rawRecords.forEach(row => {
        const xVal = String(row[xAxisKey] ?? "Пусто");
        const gVal = String(row[groupByKey] ?? "Інше");
        uniqueGroupKeys.add(gVal);

        if (!xGroupMap[xVal]) {
          xGroupMap[xVal] = {};
        }
        if (!xGroupMap[xVal][gVal]) {
          xGroupMap[xVal][gVal] = [];
        }
        xGroupMap[xVal][gVal].push(row);
      });

      // Construct aggregate objects mapping to Recharts format:
      // [ { name: "Lviv", "Smartphones": 1500, "Laptops": 3000 }, ... ]
      return Object.entries(xGroupMap).map(([xValue, groups]) => {
        const resultRow: Record<string, any> = { name: xValue };
        
        Object.entries(groups).forEach(([gValue, recordsList]) => {
          let aggregatedVal = 0;

          if (aggregation === "count") {
            aggregatedVal = recordsList.length;
          } else {
            const numVals = recordsList.map(r => getNum(r, yAxisKey));
            
            if (aggregation === "sum") {
              aggregatedVal = numVals.reduce((sum, v) => sum + v, 0);
            } else if (aggregation === "average") {
              const sum = numVals.reduce((sum, v) => sum + v, 0);
              aggregatedVal = numVals.length > 0 ? sum / numVals.length : 0;
            } else if (aggregation === "min") {
              aggregatedVal = numVals.length > 0 ? Math.min(...numVals) : 0;
            } else if (aggregation === "max") {
              aggregatedVal = numVals.length > 0 ? Math.max(...numVals) : 0;
            }
          }

          resultRow[gValue] = Math.round(aggregatedVal * 100) / 100;
        });

        return resultRow;
      });
    } else {
      // Basic flat X-Axis group aggregation: XValue -> list of records
      const xMap: Record<string, any[]> = {};
      rawRecords.forEach(row => {
        const xVal = String(row[xAxisKey] ?? "Пусто");
        if (!xMap[xVal]) {
          xMap[xVal] = [];
        }
        xMap[xVal].push(row);
      });

      return Object.entries(xMap).map(([xValue, recordsList]) => {
        let aggregatedVal = 0;

        if (aggregation === "count") {
          aggregatedVal = recordsList.length;
        } else {
          const numVals = recordsList.map(r => getNum(r, yAxisKey));

          if (aggregation === "sum") {
            aggregatedVal = numVals.reduce((sum, v) => sum + v, 0);
          } else if (aggregation === "average") {
            const sum = numVals.reduce((sum, v) => sum + v, 0);
            aggregatedVal = numVals.length > 0 ? sum / numVals.length : 0;
          } else if (aggregation === "min") {
            aggregatedVal = numVals.length > 0 ? Math.min(...numVals) : 0;
          } else if (aggregation === "max") {
            aggregatedVal = numVals.length > 0 ? Math.max(...numVals) : 0;
          }
        }

        return {
          name: xValue,
          value: Math.round(aggregatedVal * 100) / 100,
        };
      });
    }
  }, [summary.records, xAxisKey, yAxisKey, groupByKey, aggregation]);

  // Derive unique series labels when grouping is active
  const dynamicSeriesKeys = useMemo(() => {
    if (!groupByKey || groupByKey === xAxisKey || chartData.length === 0) return [];
    const keys = new Set<string>();
    chartData.forEach(row => {
      Object.keys(row).forEach(k => {
        if (k !== "name") keys.add(k);
      });
    });
    return Array.from(keys);
  }, [chartData, groupByKey, xAxisKey]);

  // Color mapper helper
  const activePalette = PALETTES[colorScheme] || PALETTES.cosmic;

  return (
    <div id="dynamic-charts-view" className="space-y-6">
      {/* Visual Configuration Panel (Top - Full Width) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 md:p-6 space-y-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-500" />
            <span className="font-bold text-slate-900 dark:text-white text-sm">Параметри графіка</span>
          </div>
          <button
            onClick={handleReset}
            className="text-[10px] font-bold text-slate-500 hover:text-blue-500 flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Скинути
          </button>
        </div>

        {/* 1. Chart selector buttons */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
            Тип відображення
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => setChartType("bar")}
              className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 border text-xs font-medium cursor-pointer transition-all ${
                chartType === "bar"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 hover:bg-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Стовпчики</span>
            </button>
            <button
              onClick={() => setChartType("line")}
              className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 border text-xs font-medium cursor-pointer transition-all ${
                chartType === "line"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 hover:bg-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              <LineIcon className="w-4 h-4" />
              <span>Лінії</span>
            </button>
            <button
              onClick={() => setChartType("area")}
              className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 border text-xs font-medium cursor-pointer transition-all ${
                chartType === "area"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 hover:bg-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              <AreaIcon className="w-4 h-4" />
              <span>Область</span>
            </button>
            <button
              onClick={() => setChartType("pie")}
              className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 border text-xs font-medium cursor-pointer transition-all ${
                chartType === "pie"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 hover:bg-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              <PieIcon className="w-4 h-4" />
              <span>Круг</span>
            </button>
            <button
              onClick={() => setChartType("radar")}
              className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 border text-xs font-medium cursor-pointer transition-all ${
                chartType === "radar"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 hover:bg-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              <BarChart4 className="w-4 h-4" />
              <span>Радар</span>
            </button>
            <button
              onClick={() => setChartType("scatter")}
              className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 border text-xs font-medium cursor-pointer transition-all ${
                chartType === "scatter"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 hover:bg-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Точковий</span>
            </button>
          </div>
        </div>

        {/* 2. X Axis Config */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
            Вісь X (Категорія / Дата)
          </label>
          <select
            value={xAxisKey}
            onChange={(e) => setXAxisKey(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-shadow cursor-pointer"
          >
            {summary.columns.map(c => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>
        </div>

        {/* 3. Y Axis Config */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
            Вісь Y (Числовий показник)
          </label>
          <select
            value={yAxisKey}
            onChange={(e) => setYAxisKey(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-shadow cursor-pointer"
          >
            {numericColumns.map(c => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.type})
              </option>
            ))}
            {/* Fallback to non-numeric if somehow none are found */}
            {numericColumns.length === 0 && summary.columns.map(c => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* 4. GroupBy (optional) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider flex items-center justify-between">
            <span>Групування серій (Сегмент)</span>
            <span className="text-[9px] text-blue-500 font-bold bg-blue-50 dark:bg-blue-900/30 px-1 py-0.5 rounded">Опція</span>
          </label>
          <select
            value={groupByKey}
            onChange={(e) => setGroupByKey(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-shadow cursor-pointer"
          >
            <option value="">Без групування (Плоский графік)</option>
            {nonNumericColumns.map(c => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>
        </div>

        {/* 5. Aggregation selection */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
            Функція агрегації
          </label>
          <div className="grid grid-cols-2 gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg">
            {(["sum", "average", "count", "max"] as AggregationType[]).map((agg) => (
              <button
                key={agg}
                onClick={() => setAggregation(agg)}
                className={`py-1.5 px-2 rounded-md text-[10px] uppercase tracking-wide font-bold transition-all cursor-pointer ${
                  aggregation === agg
                    ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {agg === "sum" ? "Сума" : agg === "average" ? "Середнє" : agg === "count" ? "Кількість" : "Максимум"}
              </button>
            ))}
          </div>
        </div>

        {/* 6. Color Scheme Selection */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider flex items-center gap-1">
            <Palette className="w-3.5 h-3.5" /> Кольорова гама
          </span>
          <div className="flex gap-2">
            {Object.keys(PALETTES).map((pal) => (
              <button
                key={pal}
                onClick={() => setColorScheme(pal)}
                className={`w-6 h-6 rounded-full border cursor-pointer flex items-center justify-center transition-all ${
                  colorScheme === pal
                    ? "ring-2 ring-blue-500 border-white scale-110"
                    : "border-slate-250 dark:border-slate-700"
                }`}
                style={{
                  background: `linear-gradient(135deg, ${PALETTES[pal][0]} 30%, ${PALETTES[pal][1]} 80%)`,
                }}
                title={pal}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Interactive Chart Visualization Screen (Bottom - Full Width) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 md:p-6 flex flex-col min-h-[500px] shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white capitalize">
              {chartType === "pie" ? "Кругова діаграма" : chartType === "radar" ? "Радарний пеленг" : "Графічний переріз показників"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Аналіз <strong className="text-slate-700 dark:text-slate-300">{yAxisKey}</strong> за віссю <strong className="text-slate-700 dark:text-slate-300">{xAxisKey}</strong> 
              {groupByKey && ` з розподілом на ${groupByKey}`} ({aggregation === "sum" ? "сума" : aggregation === "average" ? "середнє значення" : aggregation === "count" ? "підрахунок рядків" : "максимальне значення"}).
            </p>
          </div>
        </div>

        {/* Render area */}
        <div className="flex-1 w-full min-h-[300px] h-[350px]">
          {chartData.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <span className="text-xs italic">Очікування коректних даних... Оберіть вісь X та Y.</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {(() => {
                const CommonGrid = () => <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:opacity-10" />;
                const CustomTooltip = ({ active, payload, label }: any) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white/95 dark:bg-slate-800/95 border border-slate-100 dark:border-slate-700/80 p-3 rounded-lg shadow-md backdrop-blur-xs font-mono text-[11px] text-slate-700 dark:text-slate-200">
                        <p className="font-bold font-sans text-xs border-b border-slate-100 dark:border-slate-700 pb-1 mb-1 text-slate-900 dark:text-white">
                          {label}
                        </p>
                        {payload.map((entry: any, index: number) => (
                          <div key={index} className="flex items-center justify-between gap-4 mt-1">
                            <span className="flex items-center gap-1.5 font-sans">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                              {entry.name || yAxisKey}:
                            </span>
                            <span className="font-semibold text-right text-slate-950 dark:text-white">
                              {entry.value.toLocaleString("uk-UA")}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                };

                // Compile charts depending on selected layout type
                switch (chartType) {
                  case "line":
                    return (
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                        <CommonGrid />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                        
                        {groupByKey && dynamicSeriesKeys.length > 0 ? (
                          dynamicSeriesKeys.map((key, i) => (
                            <Line
                              key={key}
                              type="monotone"
                              dataKey={key}
                              stroke={activePalette[i % activePalette.length]}
                              strokeWidth={2.5}
                              activeDot={{ r: 6 }}
                            />
                          ))
                        ) : (
                          <Line
                            type="monotone"
                            dataKey="value"
                            name={yAxisKey}
                            stroke={activePalette[0]}
                            strokeWidth={3}
                            activeDot={{ r: 7 }}
                          />
                        )}
                      </LineChart>
                    );

                  case "area":
                    return (
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                        <defs>
                          {activePalette.map((col, idx) => (
                            <linearGradient key={col} id={`grad_${idx}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={col} stopOpacity={0.4} />
                              <stop offset="95%" stopColor={col} stopOpacity={0.02} />
                            </linearGradient>
                          ))}
                        </defs>
                        <CommonGrid />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                        
                        {groupByKey && dynamicSeriesKeys.length > 0 ? (
                          dynamicSeriesKeys.map((key, i) => (
                            <Area
                              key={key}
                              type="monotone"
                              dataKey={key}
                              stroke={activePalette[i % activePalette.length]}
                              fill={`url(#grad_${i % activePalette.length})`}
                              strokeWidth={2}
                            />
                          ))
                        ) : (
                          <Area
                            type="monotone"
                            dataKey="value"
                            name={yAxisKey}
                            stroke={activePalette[0]}
                            fill="url(#grad_0)"
                            strokeWidth={2.5}
                          />
                        )}
                      </AreaChart>
                    );

                  case "pie":
                    return (
                      <PieChart margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="45%"
                          innerRadius={chartData.length > 8 ? 40 : 65}
                          outerRadius={chartData.length > 8 ? 85 : 110}
                          paddingAngle={2}
                          dataKey={groupByKey ? undefined : "value"} // uses aggregated values otherwise
                          valueKey="value"
                          nameKey="name"
                          label={summary.rowCount < 25}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={activePalette[index % activePalette.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    );

                  case "radar":
                    return (
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                        <PolarGrid stroke="#f1f5f9" className="dark:opacity-10" />
                        <PolarAngleAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke="#94a3b8" fontSize={8} />
                        {groupByKey && dynamicSeriesKeys.length > 0 ? (
                          dynamicSeriesKeys.slice(0, 3).map((key, i) => (
                            <Radar
                              key={key}
                              name={key}
                              dataKey={key}
                              stroke={activePalette[i % activePalette.length]}
                              fill={activePalette[i % activePalette.length]}
                              fillOpacity={0.2}
                            />
                          ))
                        ) : (
                          <Radar
                            name={yAxisKey}
                            dataKey="value"
                            stroke={activePalette[0]}
                            fill={activePalette[0]}
                            fillOpacity={0.25}
                          />
                        )}
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapped style={{ fontSize: 10 }} />
                      </RadarChart>
                    );

                  case "scatter":
                    return (
                      <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:opacity-10" />
                        <XAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} />
                        <YAxis type="number" dataKey="value" stroke="#94a3b8" fontSize={11} name={yAxisKey} />
                        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                        <Scatter name={yAxisKey} data={chartData} fill={activePalette[0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={activePalette[index % activePalette.length]} />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    );

                  case "bar":
                  default:
                    return (
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                        <CommonGrid />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                        
                        {groupByKey && dynamicSeriesKeys.length > 0 ? (
                          dynamicSeriesKeys.map((key, i) => (
                            <Bar
                              key={key}
                              dataKey={key}
                              fill={activePalette[i % activePalette.length]}
                              radius={[4, 4, 0, 0]}
                            />
                          ))
                        ) : (
                          <Bar
                            dataKey="value"
                            name={yAxisKey}
                            fill={activePalette[0]}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={60}
                          >
                            {/* Colorful cells for categories if there's no secondary group mapping */}
                            {chartData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={activePalette[index % activePalette.length]} />
                            ))}
                          </Bar>
                        )}
                      </BarChart>
                    );
                }
              })()}
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
