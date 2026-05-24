import { useState, useEffect } from "react";
import { DatasetSummary } from "./types";
import { FileSpreadsheet, BarChart2, Table, LogOut, AlertCircle, Sun, Moon } from "lucide-react";
import UploadZone from "./components/UploadZone";
import KpiSummaryCards from "./components/KpiSummaryCards";
import DataPreviewTable from "./components/DataPreviewTable";
import DynamicCharts from "./components/DynamicCharts";

export default function App() {
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab ] = useState<"charts" | "table">("charts");
  const [darkMode, setDarkMode] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Unload current dataset and return to file picker
  const handleResetData = () => {
    setSummary(null);
    setError(null);
    setIsLoading(false);
    setActiveTab("charts");
  };

  const handleDataParsed = (data: DatasetSummary) => {
    setSummary(data);
    setIsLoading(false);
    setError(null);
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <div className={`min-h-screen bg-slate-50/50 dark:bg-slate-950 font-sans transition-colors duration-200 ${darkMode ? "dark" : ""}`}>
      
      {/* Dynamic Header navbar */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-150 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white shadow-sm flex items-center justify-center">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight block">
                BI Panel
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold leading-none mt-0.5">
                Інтерактивна аналітика
              </span>
            </div>
          </div>

          {/* Controls & Reset Action */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
              title="Перемкнути кольорову тему"
            >
              {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {summary && (
              <button
                onClick={handleResetData}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 dark:border-red-900/30 text-rose-600 dark:text-rose-450 text-xs font-semibold bg-red-50/30 hover:bg-red-50 dark:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Завантажити інший файл</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Workspace Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        
        {/* Visual Error banner */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8 p-4 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 text-red-700 dark:text-red-400 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold">Ой! Сталася помилка</h4>
              <p className="text-xs text-red-650 dark:text-red-400/80 mt-1 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* State 1: Upload picking zone */}
        {!summary ? (
          <UploadZone
            onDataParsed={handleDataParsed}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            setError={setError}
          />
        ) : (
          
          /* State 2: Fully populated interactive dashboard workspace */
          <div className="space-y-8 animate-fade-in">
            
            {/* Active file metrics summary strip card */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-emerald-5 w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-850 dark:text-white truncate">
                    {summary.fileName}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Всього знайдено <strong className="text-slate-700 dark:text-slate-300">{summary.rowCount.toLocaleString("uk-UA")}</strong> рядків та <strong className="text-slate-700 dark:text-slate-300">{summary.columns.length}</strong> колонок. Колоночні типи визначено автоматично.
                  </p>
                </div>
              </div>

              {/* Sub navbar tabs choice */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/40 dark:border-slate-700 shrink-0 self-start sm:self-auto">
                <button
                  onClick={() => setActiveTab("charts")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    activeTab === "charts"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-200"
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Графіки</span>
                </button>
                <button
                  onClick={() => setActiveTab("table")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    activeTab === "table"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-slate-200"
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Таблиця</span>
                </button>
              </div>
            </div>

            {/* Smart facts summary KPI cards metric */}
            <KpiSummaryCards summary={summary} />

            {/* Selected Tab content layout */}
            <div className="transition-all duration-300">
              {activeTab === "charts" && <DynamicCharts summary={summary} />}
              {activeTab === "table" && <DataPreviewTable summary={summary} />}
            </div>

          </div>
        )}
      </main>

      {/* Standard Footer */}
      <footer className="border-t border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 mt-20 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
        <p>© 2026 Інтерактивна інформаційна панель. Працює локально на клієнті.</p>
      </footer>
    </div>
  );
}
