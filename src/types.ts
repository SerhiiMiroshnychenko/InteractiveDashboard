export type ColumnDataType = "numeric" | "categorical" | "boolean" | "datetime" | "id" | "text";

export interface ColumnMetadata {
  name: string;
  type: ColumnDataType;
  sampleValues: any[];
  uniqueCount: number;
  nullCount: number;
  // Numeric-specific stats
  min?: number;
  max?: number;
  average?: number;
  sum?: number;
  // Categorical frequency map
  frequencies?: Record<string, number>;
}

export interface DatasetSummary {
  fileName: string;
  fileSizeInBytes: number;
  rowCount: number;
  columns: ColumnMetadata[];
  records: Record<string, any>[];
  hasHeader: boolean;
}

export type ChartType = "bar" | "line" | "area" | "pie" | "scatter" | "radar";
export type AggregationType = "sum" | "average" | "count" | "min" | "max";

export interface ChartConfig {
  id: string;
  type: ChartType;
  title: string;
  xAxisKey: string;
  yAxisKey: string;
  groupByKey?: string;
  aggregation: AggregationType;
  colorScheme: string;
}
