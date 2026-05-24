import React, { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Sparkles, HelpCircle } from "lucide-react";
import { DatasetSummary } from "../types";
import { parseCsvString, SAMPLE_DATASETS } from "../utils/csvAnalyzer";

interface UploadZoneProps {
  onDataParsed: (summary: DatasetSummary) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export default function UploadZone({
  onDataParsed,
  isLoading,
  setIsLoading,
  setError,
}: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    if (!file) return;
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      setError("Будь ласка, завантажте коректний CSV файл (.csv).");
      return;
    }

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const result = await parseCsvString(text, file.name, file.size);
        onDataParsed(result);
      } catch (err: any) {
        console.error("Помилка парсингу:", err);
        setError(`Помилка під час зчитування файлу: ${err.message || err}`);
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Не вдалося зачитати файл.");
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const loadSampleDataset = async (sampleId: string) => {
    setIsLoading(true);
    setError(null);
    const sample = SAMPLE_DATASETS.find((s) => s.id === sampleId);
    if (!sample) return;

    try {
      // Simulate slight processing for smooth visuals
      setTimeout(async () => {
        const fakeBlobSize = sample.csv.length;
        const result = await parseCsvString(sample.csv, `${sample.id}_data.csv`, fakeBlobSize);
        onDataParsed(result);
      }, 500);
    } catch (err: any) {
      setError(`Не вдалося завантажити приклад: ${err.message}`);
      setIsLoading(false);
    }
  };

  return (
    <div id="upload-zone-container" className="max-w-4xl mx-auto space-y-8">
      {/* Hero Welcome banner */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/50 rounded-full text-blue-600 text-xs font-semibold uppercase tracking-wider shadow-xs dark:from-slate-800/50 dark:to-indigo-950/20 dark:border-indigo-900/30">
          <Sparkles className="w-3.5 h-3.5" />
          Аналітика Наступного Покоління
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Інтерактивна <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">інформаційна панель</span>
        </h1>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto font-normal">
          Перетворіть ваші CSV-таблиці на живі інтуїтивні графіки. Інтелектуальний алгоритм автоматично визначить типи колонок, а наш ШІ аналітик допоможе розкрити приховані інсайти.
        </p>
      </div>

      {/* Main Drag & Drop Zone */}
      <div
        id="drop-area"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 p-8 md:p-12 text-center bg-white dark:bg-slate-900/40 ${
          isDragActive
            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/10 scale-[0.99]"
            : "border-slate-200 hover:border-blue-400 hover:bg-slate-50/30 dark:border-slate-800 dark:hover:border-slate-700"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Decorative ambient gradient */}
        <div className="absolute inset-0 bg-radial-at-t from-blue-400/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <div className="max-w-md mx-auto space-y-5">
          <div className="mx-auto w-14 h-14 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 group-hover:scale-110 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 dark:group-hover:border-blue-900/30 transition-all duration-300 text-slate-400 group-hover:text-blue-500">
            <Upload className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              {isLoading ? "Обробка файлу..." : "Перетягніть ваш CSV сюди"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              або натисніть для огляду файлової системи (макс. розмір до 50MB)
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Підтримка форматів .csv з роздільником кома чи крапка з комою</span>
          </div>
        </div>
      </div>

      {/* Structured Sample Datasets Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            Немає файлу під рукою? Спробуйте готові приклади:
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SAMPLE_DATASETS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => loadSampleDataset(sample.id)}
              disabled={isLoading}
              className="text-left p-5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-400 dark:hover:border-slate-700 hover:shadow-md transition-all duration-300 cursor-pointer group flex flex-col justify-between h-full"
            >
              <div className="space-y-2 mb-4">
                <span className="text-base font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-500 transition-colors">
                  {sample.title}
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {sample.description}
                </p>
              </div>
              <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center gap-1">
                <span>Завантажити шаблон</span>
                <span className="group-hover:translate-x-1 duration-200 transition-transform">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
