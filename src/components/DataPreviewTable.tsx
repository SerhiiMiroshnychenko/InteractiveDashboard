import { useState, useMemo } from "react";
import { DatasetSummary, ColumnDataType } from "../types";
import { ChevronDown, ChevronUp, Search, Calendar, ChevronLeft, ChevronRight, Hash, Quote, ToggleLeft, Binary, FileText } from "lucide-react";

interface DataPreviewTableProps {
  summary: DatasetSummary;
}

export default function DataPreviewTable({ summary }: DataPreviewTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Render icons for specific data types
  const renderDataTypeBadge = (type: ColumnDataType) => {
    switch (type) {
      case "numeric":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] rounded font-semibold border border-emerald-100 dark:border-emerald-900/40">
            <Hash className="w-2.5 h-2.5" /> Число
          </span>
        );
      case "categorical":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 text-[10px] rounded font-semibold border border-blue-100 dark:border-blue-900/40">
            <Quote className="w-2.5 h-2.5" /> Категорія
          </span>
        );
      case "boolean":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 text-[10px] rounded font-semibold border border-purple-100 dark:border-purple-900/40">
            <ToggleLeft className="w-2.5 h-2.5" /> Логічний
          </span>
        );
      case "datetime":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 text-[10px] rounded font-semibold border border-amber-100 dark:border-amber-900/40">
            <Calendar className="w-2.5 h-2.5" /> Дата
          </span>
        );
      case "id":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 text-[10px] rounded font-semibold border border-rose-100 dark:border-rose-900/40">
            <Binary className="w-2.5 h-2.5" /> ID
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300 text-[10px] rounded font-semibold border border-gray-100 dark:border-gray-750">
            <FileText className="w-2.5 h-2.5" /> Текст
          </span>
        );
    }
  };

  // Sort and Search records
  const processedRecords = useMemo(() => {
    let result = [...summary.records];

    // 1. Text Search across all columns
    if (searchTerm.trim() !== "") {
      const query = searchTerm.toLowerCase();
      result = result.filter((row) => {
        return Object.values(row).some((val) =>
          String(val).toLowerCase().includes(query)
        );
      });
    }

    // 2. Sort key action
    if (sortKey) {
      result.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];

        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        const isNum = !isNaN(Number(valA)) && !isNaN(Number(valB));
        
        if (isNum) {
          return sortDirection === "asc"
            ? Number(valA) - Number(valB)
            : Number(valB) - Number(valA);
        } else {
          return sortDirection === "asc"
            ? String(valA).localeCompare(String(valB))
            : String(valB).localeCompare(String(valA));
        }
      });
    }

    return result;
  }, [summary.records, searchTerm, sortKey, sortDirection]);

  // Handle header sorting actions
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // Calculate pages
  const totalRows = processedRecords.length;
  const totalPages = Math.ceil(totalRows / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRecords = processedRecords.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div id="data-preview-table-container" className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs space-y-4 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            📋 Специфікація та перегляд таблиці
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Показано {totalRows} рядків {searchTerm && "(відфільтровано)"} з {summary.rowCount} загальних. Клацніть заголовок для сортування.
          </p>
        </div>

        {/* Search & Page control settings */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Шукати значення..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full md:w-60 pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750/70 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white transition-all outline-none"
            />
          </div>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-350 outline-none cursor-pointer"
          >
            <option value={10}>10 рядків</option>
            <option value={20}>20 рядків</option>
            <option value={50}>50 рядків</option>
          </select>
        </div>
      </div>

      {/* Main Table View Wrapper */}
      <div className="border border-slate-100 dark:border-slate-800 rounded-lg overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-350 border-collapse">
          <thead className="bg-slate-50/70 dark:bg-slate-800/45 text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 font-semibold select-none">
            <tr>
              {summary.columns.map((col) => (
                <th
                  key={col.name}
                  onClick={() => handleSort(col.name)}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group align-middle min-w-[140px]"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate max-w-[120px]" title={col.name}>
                        {col.name}
                      </span>
                      <span className="text-slate-400 shrink-0">
                        {sortKey === col.name ? (
                          sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronUp className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />
                        )}
                      </span>
                    </div>
                    {renderDataTypeBadge(col.type)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedRecords.length > 0 ? (
              paginatedRecords.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors"
                >
                  {summary.columns.map((col) => {
                    const rawVal = row[col.name];
                    let displayVal = rawVal;
                    
                    if (rawVal === null || rawVal === undefined || rawVal === "") {
                      displayVal = <span className="text-slate-300 dark:text-slate-600 italic">null</span>;
                    } else if (typeof rawVal === "boolean") {
                      displayVal = rawVal ? "так/true" : "ні/false";
                    } else if (col.type === "numeric") {
                      displayVal = typeof rawVal === "number" ? rawVal.toLocaleString("uk-UA") : String(rawVal);
                    } else {
                      displayVal = String(rawVal);
                    }

                    return (
                      <td key={col.name} className="px-4 py-3 font-mono text-[11px] truncate max-w-[180px]" title={String(rawVal)}>
                        {displayVal}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={summary.columns.length}
                  className="px-4 py-8 text-center text-slate-400 italic"
                >
                  Дані не відповідають умовам запиту введеного пошуку.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Structured Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-150 dark:border-slate-800 pt-4 text-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Сторінка <strong className="text-slate-700 dark:text-slate-300">{currentPage}</strong> з {" "}
            <strong className="text-slate-700 dark:text-slate-300">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {/* Limit page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = currentPage;
              if (currentPage < 3) pageNum = i + 1;
              else if (currentPage > totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;

              if (pageNum < 1 || pageNum > totalPages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-7 h-7 font-semibold rounded-lg text-xs transition-colors ${
                    currentPage === pageNum
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
