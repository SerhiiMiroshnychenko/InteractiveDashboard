import { DatasetSummary, ColumnMetadata } from "../types";
import { Database, Hash, BarChart, TrendingUp, DollarSign } from "lucide-react";

interface KpiSummaryCardsProps {
  summary: DatasetSummary;
}

export default function KpiSummaryCards({ summary }: KpiSummaryCardsProps) {
  // Extract all numeric columns to build cards
  const numericColumns = summary.columns.filter((c) => c.type === "numeric");
  const categoricalColumns = summary.columns.filter((c) => c.type === "categorical");

  // Select up to 3 numeric columns for display
  const primaryNumericSpecs = numericColumns.slice(0, 3);

  // Helper to format values elegantly
  const formatKpiValue = (val: number | undefined, name: string) => {
    if (val === undefined) return "0";
    const lowercaseName = name.toLowerCase();
    
    // Format monetary values nicely
    if (lowercaseName.includes("ціна") || lowercaseName.includes("ціні") || lowercaseName.includes("дохід") || lowercaseName.includes("сума") || lowercaseName.includes("price") || lowercaseName.includes("sales") || lowercaseName.includes("revenue")) {
      return new Intl.NumberFormat("uk-UA", { style: "currency", currency: "UAH", maximumFractionDigits: 0 }).format(val);
    }
    
    // Percentage format
    if (lowercaseName.includes("відсоток") || lowercaseName.includes("процент") || lowercaseName.includes("percent") || lowercaseName.includes("відвідуваність")) {
      return `${Math.round(val)}%`;
    }

    // Default numeric formatting
    return new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 1 }).format(val);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Total records card */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl flex items-center gap-4 hover:shadow-sm transition-shadow">
        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block line-clamp-1">
            Усього рядків data
          </span>
          <span className="text-xl font-bold text-slate-900 dark:text-white">
            {new Intl.NumberFormat("uk-UA").format(summary.rowCount)}
          </span>
        </div>
      </div>

      {/* Columns count card */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl flex items-center gap-4 hover:shadow-sm transition-shadow">
        <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
          <Hash className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block line-clamp-1">
            Колонок у файлі
          </span>
          <span className="text-xl font-bold text-slate-900 dark:text-white">
            {summary.columns.length}
          </span>
        </div>
      </div>

      {/* Dynamic numeric KPI summary cards */}
      {primaryNumericSpecs.map((col, index) => {
        const isSalesOrRevenue = col.name.toLowerCase().match(/(дохід|ціна|сума|revenue|sales|income|price)/i);
        const colColorClass = index % 2 === 0 
          ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" 
          : "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400";

        return (
          <div 
            key={col.name} 
            className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl flex items-center gap-4 hover:shadow-sm transition-shadow"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colColorClass}`}>
              {isSalesOrRevenue ? <DollarSign className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block truncate" title={col.name}>
                {isSalesOrRevenue ? `Усього: ${col.name}` : `Середнє: ${col.name}`}
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-white truncate block">
                {formatKpiValue(isSalesOrRevenue ? col.sum : col.average, col.name)}
              </span>
            </div>
          </div>
        );
      })}

      {/* If less than 2 numeric columns, show categories info */}
      {primaryNumericSpecs.length < 2 && categoricalColumns.length > 0 && (
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl flex items-center gap-4 hover:shadow-sm transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-pink-50 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0">
            <BarChart className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block line-clamp-1">
              Категоріальних колонок
            </span>
            <span className="text-xl font-bold text-slate-900 dark:text-white font-mono">
              {categoricalColumns.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
