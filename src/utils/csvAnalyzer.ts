import Papa from "papaparse";
import { DatasetSummary, ColumnMetadata, ColumnDataType } from "../types";

/**
 * Heuristically infers the data type of a column based on its non-null values
 */
export function inferColumnType(values: any[]): ColumnDataType {
  if (values.length === 0) return "text";

  // Check Boolean
  const booleanValues = new Set(["true", "false", "yes", "no", "1", "0", "так", "ні", "y", "n"]);
  const isBoolean = values.every(v => {
    if (v === null || v === undefined || v === "") return true;
    const str = String(v).toLowerCase().trim();
    return booleanValues.has(str);
  });
  if (isBoolean && values.some(v => v !== null && v !== "")) {
    return "boolean";
  }

  // Check Numeric
  let numericCount = 0;
  let validCount = 0;
  values.forEach(v => {
    if (v === null || v === undefined || v === "") return;
    validCount++;
    const strValue = String(v).replace(/[\$,%]/g, "").trim();
    if (!isNaN(Number(strValue)) && strValue !== "") {
      numericCount++;
    }
  });
  if (validCount > 0 && numericCount / validCount > 0.85) {
    return "numeric";
  }

  // Check Datetime
  let datetimeCount = 0;
  // Simple check for standard date formats: YYYY-MM-DD, DD.MM.YYYY, MM/DD/YYYY, etc
  const dateRegex = /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$|^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$|^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
  values.forEach(v => {
    if (v === null || v === undefined || v === "") return;
    const str = String(v).trim();
    if (dateRegex.test(str)) {
      datetimeCount++;
    } else {
      const ts = Date.parse(str);
      if (!isNaN(ts) && str.length > 5 && isNaN(Number(str))) {
        datetimeCount++;
      }
    }
  });
  if (validCount > 0 && datetimeCount / validCount > 0.8) {
    return "datetime";
  }

  // Check unique counts to distinguish IDs/Texts from Categorical
  const rawUnique = new Set(values.map(v => String(v).trim().toLowerCase()));
  const uniqueRatio = rawUnique.size / values.length;

  if (values.length > 5 && uniqueRatio > 0.95) {
    // Check if ID (short, numeric, sequential, UUIDs) vs full text
    const avgLength = values.reduce((sum, v) => sum + String(v).length, 0) / values.length;
    if (avgLength < 16) {
      return "id";
    }
    return "text";
  }

  return "categorical";
}

/**
 * Processes and analyzes raw parsed records to produce rich metadata structures.
 */
export function analyzeParsedData(
  fileName: string,
  fileSizeInBytes: number,
  records: Record<string, any>[]
): DatasetSummary {
  if (records.length === 0) {
    return {
      fileName,
      fileSizeInBytes,
      rowCount: 0,
      columns: [],
      records: [],
      hasHeader: true,
    };
  }

  // Identify all keys (columns) present across parsed data rows
  const allKeys = Array.from(
    new Set(records.flatMap(row => Object.keys(row)))
  ).filter(k => k.trim() !== "");

  const columns: ColumnMetadata[] = allKeys.map(colName => {
    const rawValues = records.map(r => r[colName]);
    const validValues = rawValues.filter(
      v => v !== null && v !== undefined && v !== ""
    );

    const type = inferColumnType(validValues);
    const uniqueValues = Array.from(new Set(validValues));
    const uniqueCount = uniqueValues.length;
    const nullCount = records.length - validValues.length;

    const metadata: ColumnMetadata = {
      name: colName,
      type,
      sampleValues: validValues.slice(0, 5),
      uniqueCount,
      nullCount,
    };

    // Calculate metadata statistics depending on inferred types
    if (type === "numeric") {
      let sum = 0;
      let min = Infinity;
      let max = -Infinity;
      let numericValsCount = 0;

      validValues.forEach(v => {
        const cleanedStr = String(v).replace(/[\$,%]/g, "").trim();
        const num = Number(cleanedStr);
        if (!isNaN(num)) {
          sum += num;
          if (num < min) min = num;
          if (num > max) max = num;
          numericValsCount++;
        }
      });

      if (numericValsCount > 0) {
        metadata.sum = Math.round(sum * 100) / 100;
        metadata.min = min;
        metadata.max = max;
        metadata.average = Math.round((sum / numericValsCount) * 100) / 100;
      }
    } else if (type === "categorical" || type === "boolean") {
      const freqs: Record<string, number> = {};
      validValues.forEach(v => {
        const str = String(v).trim();
        freqs[str] = (freqs[str] || 0) + 1;
      });
      metadata.frequencies = freqs;
    }

    return metadata;
  });

  return {
    fileName,
    fileSizeInBytes,
    rowCount: records.length,
    columns,
    records,
    hasHeader: true,
  };
}

/**
 * Parses a local CSV string utilizing PapaParse.
 */
export function parseCsvString(
  content: string,
  fileName: string,
  fileSize: number
): Promise<DatasetSummary> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, any>>(content, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        try {
          const summary = analyzeParsedData(fileName, fileSize, results.data);
          resolve(summary);
        } catch (e) {
          reject(e);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}


