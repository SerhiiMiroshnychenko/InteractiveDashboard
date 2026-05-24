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

/**
 * Built-in beautiful template datasets (Ukrainian translation & themes)
 * so users can immediately query and test the dashboard with realistic values.
 */
export const SAMPLE_DATASETS = [
  {
    id: "sales",
    title: "📊 Продажі товарів (Магазин)",
    description: "Набір даних про продажі, категорії товарів, дохід, кількість та регіони.",
    csv: `Товар,Категорія,Дата,Регіон,Кількість,Ціна,Дохід,Оплата
Смартфон X1,Електроніка,2026-05-01,Київ,12,15000,180000,Карта
Ультрабук Pro,Електроніка,2026-05-02,Львів,5,32000,160000,Карта
Кавомашина 5000,Побут,2026-05-02,Одеса,8,8500,68000,Готівка
Електрочайник Glass,Побут,2026-05-03,Харків,20,1200,24000,Готівка
Бездротові навушники,Електроніка,2026-05-04,Київ,45,2500,112500,Карта
Ортопедична подушка,Будинок,2026-05-05,Львів,15,1800,27000,Готівка
Смарт-годинник Active,Електроніка,2026-05-06,Одеса,30,4200,126000,Карта
Ковдра всесезонна,Будинок,2026-05-07,Дніпро,10,2400,24000,Готівка
Робот-пилосос RoboVac,Побут,2026-05-08,Київ,7,11000,77000,Карта
Зволожувач повітря,Побут,2026-05-09,Харків,18,1500,27000,Готівка
Шкіряне крісло,Будинок,2026-05-10,Дніпро,3,9500,28500,Карта
Фітнес-трекер Slim,Електроніка,2026-05-11,Львів,25,1100,27500,Готівка
Блендер Смарт,Побут,2026-05-12,Одеса,14,3100,43400,Карта
Настільна лампа LED,Будинок,2026-05-13,Київ,22,850,18700,Готівка
`,
  },
  {
    id: "weather",
    title: "🌤️ Погодні моніторинги в Україні",
    description: "Метеорологічні показники (температура, вологість, опади, тиск та вітер) по днях.",
    csv: `Дата,Місто,Температура,Вологість,Опади_мм,Тиск_гПа,Вітер_мс,Стан
2026-05-15,Київ,18.5,62,0.0,1015,4.2,Сонячно
2026-05-15,Львів,16.0,78,3.4,1011,5.5,Дощ
2026-05-15,Одеса,21.2,55,0.0,1016,3.8,Ясно
2026-05-16,Київ,19.0,58,0.0,1017,3.1,Хмарно
2026-05-16,Львів,15.2,85,12.2,1008,6.1,Злива
2026-05-16,Одеса,22.0,52,0.0,1015,4.0,Сонячно
2026-05-17,Київ,16.5,72,2.1,1012,4.8,Переменна хмарність
2026-05-17,Львів,14.0,80,4.5,1010,4.2,Дощ
2026-05-17,Одеса,20.5,61,0.0,1014,5.0,Хмарно
2026-05-18,Київ,17.2,60,0.0,1016,3.5,Сонячно
2026-05-18,Львів,18.0,65,0.0,1015,3.0,Сонячно
2026-05-18,Одеса,23.5,48,0.0,1018,2.7,Ясно
`,
  },
  {
    id: "education",
    title: "🎓 Результати успішності студентів",
    description: "Дані про предмети, оцінки, відвідуваність, тривалість підготовки.",
    csv: `Студент,Спеціальність,Курс,Предмет,Оцінка,Відвідуваність_відсотки,Годин_самопідготовки
Олексій Коваленко,Комп'ютерні Науки,2,Математичний Аналіз,88,95,12
Марія Шевченко,Економіка,3,Мікроекономіка,94,100,16
Дмитро Петренко,Комп'ютерні Науки,2,Програмування C++,76,82,8
Юлія Бондар,Економіка,3,Маркетинг,91,92,10
Артем Кравченко,Комп'ютерні Науки,1,Вступ до ІТ,95,98,14
Ірина Бойко,Менеджмент,1,Основи Менеджменту,82,88,7
Андрій Мельник,Фінанси,4,Корпоративні Фінанси,65,75,9
Анна Савченко,Економіка,3,Макроекономіка,89,96,11
Павло Ткаченко,Комп'ютерні Науки,2,Бази Даних,83,90,10
Тетяна Волошина,Менеджмент,2,Управління HR,92,97,13
Святослав Олійник,Комп'ютерні Науки,4,Штучний Інтелект,97,99,22
Катерина Мороз,Фінанси,1,Економічна Теорія,71,80,5
`,
  }
];
