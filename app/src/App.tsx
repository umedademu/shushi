import { Check, ChevronLeft, ChevronRight, Download, Pencil, Plus, Search, Star, Trash2, Upload, X } from "lucide-react";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import "./App.css";
import { machineOptions, storeOptions } from "./data/catalog";

type PlayRecord = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  storeName: string;
  machineName: string;
  rateId?: string;
  rateName?: string;
  rateKind?: RateKind;
  rateUnitPrice?: number;
  rateExchangeCountPer100Yen?: number;
  rateSavedCount?: number;
  rateReplayFeePercent?: number;
  investment: number;
  recovery: number;
  savedInvestment?: number;
  savedRecovery?: number;
  expectedValue: number;
  note: string;
};

type RateKind = "pachinko" | "slot";

type RateOption = {
  id: string;
  storeName: string;
  kind: RateKind;
  name: string;
  unitPrice: number;
  exchangeCountPer100Yen: number;
  savedCount: number;
  replayFeePercent: number;
};

type RateForm = {
  kind: RateKind;
  name: string;
  unitPrice: string;
  exchangeCountPer100Yen: string;
  savedCount: string;
  replayFeePercent: string;
};

type RecordForm = {
  date: string;
  startTime: string;
  endTime: string;
  storeName: string;
  machineName: string;
  rateId: string;
  rateName: string;
  investment: string;
  recovery: string;
  savedInvestment: string;
  savedRecovery: string;
  expectedValue: string;
  note: string;
};

type ViewMode = "home" | "updates";
type OptionField = "storeName" | "machineName";
type ChartMode = "month" | "year" | "life" | "store" | "machine";

type ChartPoint = {
  key: string;
  label: string;
  value: number;
  count: number;
};

const storageKey = "shushi-play-records";
const rateOptionKey = "shushi-store-rate-options";
const favoriteStoreKey = "shushi-favorite-stores";
const favoriteMachineKey = "shushi-favorite-machines";

const updateItems = [
  {
    date: "2026-05-24",
    title: "収支入力の叩き台を追加",
    body: "カレンダー、日別一覧、スマホ向け入力画面、店舗名と機種名の候補を追加しました。",
  },
  {
    date: "2026-05-24",
    title: "時刻入力を5分刻みに変更",
    body: "開始時刻と終了時刻を5分単位で入力しやすいようにしました。",
  },
  {
    date: "2026-05-24",
    title: "時刻の初期値を追加",
    body: "その日の初回入力は開始時刻を10:00にし、終了時刻には現在時刻を入れるようにしました。",
  },
  {
    date: "2026-05-24",
    title: "店舗と機種の選択画面を追加",
    body: "店舗名と機種名を、スマホでも押して選べる検索付きの選択画面に変更しました。",
  },
  {
    date: "2026-05-24",
    title: "お気に入り候補を追加",
    body: "店舗名と機種名にお気に入りを付けて、選択画面の上に出せるようにしました。",
  },
  {
    date: "2026-05-24",
    title: "店舗別レート設定を追加",
    body: "店舗ごとにパチンコやスロットのレート候補を作り、収支入力時に選べるようにしました。",
  },
  {
    date: "2026-05-24",
    title: "レート編集と貯玉保存を追加",
    body: "レート候補を後から編集できるようにし、貯玉も保存して入力時に確認できるようにしました。",
  },
  {
    date: "2026-05-24",
    title: "貯玉投資と貯玉回収を追加",
    body: "収支入力で現金とは別に、貯玉の投資数と回収数を保存できるようにしました。",
  },
  {
    date: "2026-05-24",
    title: "貯玉残高の自動更新を追加",
    body: "稼働記録を保存すると、選択したレートの現在貯玉が投資と回収に合わせて増減するようにしました。",
  },
  {
    date: "2026-05-24",
    title: "CSVの取り込みと書き出しを追加",
    body: "収支記録をCSVで出力できるようにし、pRecordから出したCSVも取り込めるようにしました。",
  },
  {
    date: "2026-05-24",
    title: "稼働記録の編集を追加",
    body: "日別の記録カード全体を押して、保存済みの稼働記録を編集できるようにしました。",
  },
  {
    date: "2026-05-24",
    title: "pRecordの貯玉取り込みを改善",
    body: "pRecordのCSVから貯玉稼働を取り込む時に、投資額・回収額・収支・貯玉から貯玉投資と貯玉回収を推定するようにしました。",
  },
  {
    date: "2026-05-24",
    title: "CSV取り込み時の同日置き換えを追加",
    body: "CSVに含まれる日付の既存記録は、追加ではなくCSV側の記録へ丸ごと置き換えるようにしました。",
  },
  {
    date: "2026-05-24",
    title: "収支グラフを追加",
    body: "月別、年別、生涯収支、店舗別、機種別に切り替えられる収支グラフを追加しました。",
  },
];

const chartModes: Array<{ key: ChartMode; label: string }> = [
  { key: "month", label: "月別" },
  { key: "year", label: "年別" },
  { key: "life", label: "生涯" },
  { key: "store", label: "店舗別" },
  { key: "machine", label: "機種別" },
];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function todayKey() {
  return toDateKey(new Date());
}

function currentTimeKey() {
  const now = new Date();
  const minutes = Math.floor(now.getMinutes() / 5) * 5;
  return `${pad(now.getHours())}:${pad(minutes)}`;
}

function monthLabel(date: Date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function displayDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-");
  return `${Number(year)}年${Number(month)}月${Number(day)}日`;
}

function currency(value: number) {
  return `${value.toLocaleString("ja-JP")}円`;
}

function signedCurrency(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${currency(value)}`;
}

function loadRecords(): PlayRecord[] {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecords(records: PlayRecord[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(records));
}

function isRateKind(value: unknown): value is RateKind {
  return value === "pachinko" || value === "slot";
}

function loadRateOptions(): RateOption[] {
  try {
    const raw = window.localStorage.getItem(rateOptionKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        const storeName = String(item?.storeName ?? "").trim();
        const name = String(item?.name ?? "").trim();
        const kind = item?.kind;

        if (!storeName || !name || !isRateKind(kind)) {
          return null;
        }

        return {
          id: String(item?.id || crypto.randomUUID()),
          storeName,
          kind,
          name,
          unitPrice: Number(item?.unitPrice) || 0,
          exchangeCountPer100Yen: Number(item?.exchangeCountPer100Yen) || 0,
          savedCount: Number(item?.savedCount) || 0,
          replayFeePercent: Number(item?.replayFeePercent) || 0,
        };
      })
      .filter((item): item is RateOption => Boolean(item));
  } catch {
    return [];
  }
}

function saveRateOptions(options: RateOption[]) {
  window.localStorage.setItem(rateOptionKey, JSON.stringify(options));
}

function loadStringList(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((value) => String(value).trim()).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function saveStringList(key: string, values: string[]) {
  window.localStorage.setItem(key, JSON.stringify(values));
}

function createForm(date: string, isFirstRecordForDay = false): RecordForm {
  return {
    date,
    startTime: isFirstRecordForDay ? "10:00" : "",
    endTime: currentTimeKey(),
    storeName: "",
    machineName: "",
    rateId: "",
    rateName: "",
    investment: "",
    recovery: "",
    savedInvestment: "",
    savedRecovery: "",
    expectedValue: "",
    note: "",
  };
}

function createFormFromRecord(record: PlayRecord): RecordForm {
  return {
    date: record.date,
    startTime: record.startTime,
    endTime: record.endTime,
    storeName: record.storeName,
    machineName: record.machineName,
    rateId: record.rateId ?? "",
    rateName: record.rateName ?? "",
    investment: String(record.investment || ""),
    recovery: String(record.recovery || ""),
    savedInvestment: String(record.savedInvestment || ""),
    savedRecovery: String(record.savedRecovery || ""),
    expectedValue: String(record.expectedValue || ""),
    note: record.note,
  };
}

function createRateForm(kind: RateKind = "pachinko"): RateForm {
  if (kind === "slot") {
    return {
      kind,
      name: "20スロ",
      unitPrice: "21.73",
      exchangeCountPer100Yen: "5",
      savedCount: "0",
      replayFeePercent: "0",
    };
  }

  return {
    kind,
    name: "4パチ",
    unitPrice: "4",
    exchangeCountPer100Yen: "25",
    savedCount: "0",
    replayFeePercent: "0",
  };
}

function createRateFormFromRate(rate: RateOption): RateForm {
  return {
    kind: rate.kind,
    name: rate.name,
    unitPrice: String(rate.unitPrice),
    exchangeCountPer100Yen: String(rate.exchangeCountPer100Yen),
    savedCount: String(rate.savedCount),
    replayFeePercent: String(rate.replayFeePercent),
  };
}

function toNumber(value: string) {
  const normalized = value.replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function savedProfit(record: Pick<PlayRecord, "savedInvestment" | "savedRecovery">) {
  return (record.savedRecovery ?? 0) - (record.savedInvestment ?? 0);
}

function savedUnitValue(
  record: Pick<PlayRecord, "rateExchangeCountPer100Yen" | "rateUnitPrice">,
) {
  if (record.rateExchangeCountPer100Yen && record.rateExchangeCountPer100Yen > 0) {
    return 100 / record.rateExchangeCountPer100Yen;
  }

  return record.rateUnitPrice && record.rateUnitPrice > 0 ? record.rateUnitPrice : 0;
}

function rateUnitValue(rate: Pick<RateOption, "exchangeCountPer100Yen" | "unitPrice">) {
  if (rate.exchangeCountPer100Yen > 0) {
    return 100 / rate.exchangeCountPer100Yen;
  }

  return rate.unitPrice;
}

function profit(
  record: Pick<
    PlayRecord,
    | "investment"
    | "recovery"
    | "savedInvestment"
    | "savedRecovery"
    | "rateExchangeCountPer100Yen"
    | "rateUnitPrice"
  >,
) {
  const cashProfit = record.recovery - record.investment;
  const savedValue = savedProfit(record) * savedUnitValue(record);
  return Math.round(cashProfit + savedValue);
}

function savedCount(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("ja-JP")}玉`;
}

function plainSavedCount(value: number) {
  return `${value.toLocaleString("ja-JP")}玉`;
}

function durationHours(startTime: string, endTime: string) {
  if (!startTime || !endTime) {
    return 0;
  }

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  let start = startHour * 60 + startMinute;
  let end = endHour * 60 + endMinute;

  if (end < start) {
    end += 24 * 60;
  }

  return Math.max(0, (end - start) / 60);
}

function recordsProfit(records: PlayRecord[]) {
  return records.reduce((total, record) => total + profit(record), 0);
}

function chartPoint(key: string, label: string, records: PlayRecord[]): ChartPoint {
  return {
    key,
    label,
    value: recordsProfit(records),
    count: records.length,
  };
}

function monthChart(records: PlayRecord[], date: Date): ChartPoint[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const key = `${year}-${pad(month + 1)}-${pad(day)}`;
    return chartPoint(key, `${day}日`, records.filter((record) => record.date === key));
  });
}

function yearChart(records: PlayRecord[], date: Date): ChartPoint[] {
  const year = date.getFullYear();

  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const key = `${year}-${pad(month)}`;
    return chartPoint(
      key,
      `${month}月`,
      records.filter((record) => record.date.startsWith(`${key}-`)),
    );
  });
}

function lifeChart(records: PlayRecord[]): ChartPoint[] {
  const grouped = new Map<string, PlayRecord[]>();
  records.forEach((record) => {
    const year = record.date.slice(0, 4);
    grouped.set(year, [...(grouped.get(year) ?? []), record]);
  });

  return Array.from(grouped.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([year, yearRecords]) => chartPoint(year, `${year}年`, yearRecords));
}

function groupChart(records: PlayRecord[], field: "storeName" | "machineName"): ChartPoint[] {
  const grouped = new Map<string, PlayRecord[]>();
  records.forEach((record) => {
    const label = record[field] || "未設定";
    grouped.set(label, [...(grouped.get(label) ?? []), record]);
  });

  return Array.from(grouped.entries())
    .map(([label, groupedRecords]) => chartPoint(label, label, groupedRecords))
    .sort((left, right) => Math.abs(right.value) - Math.abs(left.value))
    .slice(0, 12);
}

function monthDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const slots: Array<string | null> = Array.from({ length: firstDay.getDay() }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    slots.push(toDateKey(new Date(year, month, day)));
  }

  while (slots.length % 7 !== 0) {
    slots.push(null);
  }

  return slots;
}

function classForAmount(value: number) {
  if (value > 0) {
    return "amount-positive";
  }
  if (value < 0) {
    return "amount-negative";
  }
  return "amount-even";
}

function normalizeOptionText(value: string) {
  return value.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
}

function rateKindLabel(kind: RateKind) {
  return kind === "pachinko" ? "パチンコ" : "スロット";
}

function rateUnitLabel(kind: RateKind) {
  return kind === "pachinko" ? "貸玉(1玉)" : "貸メダル(1枚)";
}

function rateExchangeUnitLabel(kind: RateKind) {
  return kind === "pachinko" ? "玉交換" : "枚交換";
}

function rateSavedLabel() {
  return "貯玉";
}

function rateSavedUnitLabel() {
  return "玉";
}

function rateSavedText(rate: Pick<RateOption, "savedCount">) {
  return `${rateSavedLabel()} ${rate.savedCount.toLocaleString("ja-JP")}${rateSavedUnitLabel()}`;
}

function rateSummary(
  rate: Pick<
    RateOption,
    "kind" | "unitPrice" | "exchangeCountPer100Yen" | "savedCount" | "replayFeePercent"
  >,
) {
  return `${rateKindLabel(rate.kind)} / 1${rate.kind === "pachinko" ? "玉" : "枚"}${rate.unitPrice.toLocaleString(
    "ja-JP",
  )}円 / 100円あたり${rate.exchangeCountPer100Yen.toLocaleString("ja-JP")}${rateExchangeUnitLabel(
    rate.kind,
  )} / ${rateSavedText(rate)} / 再プレイ${rate.replayFeePercent.toLocaleString("ja-JP")}%`;
}

const csvHeaders = [
  "日付",
  "開始時刻",
  "終了時刻",
  "店舗",
  "機種",
  "レート",
  "レート区分",
  "貸玉",
  "交換率",
  "保存時貯玉",
  "再プレイ手数料率",
  "現金投資",
  "現金回収",
  "現金収支",
  "貯玉投資",
  "貯玉回収",
  "貯玉差引",
  "期待値",
  "稼働時間",
  "メモ",
];

function escapeCsvValue(value: string | number | undefined) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function recordsToCsv(records: PlayRecord[]) {
  const rows = records
    .slice()
    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))
    .map((record) => [
      record.date,
      record.startTime,
      record.endTime,
      record.storeName,
      record.machineName,
      record.rateName ?? "",
      record.rateKind ? rateKindLabel(record.rateKind) : "",
      record.rateUnitPrice ?? "",
      record.rateExchangeCountPer100Yen ?? "",
      record.rateSavedCount ?? "",
      record.rateReplayFeePercent ?? "",
      record.investment,
      record.recovery,
      profit(record),
      record.savedInvestment ?? 0,
      record.savedRecovery ?? 0,
      savedProfit(record),
      record.expectedValue,
      durationHours(record.startTime, record.endTime).toFixed(1),
      record.note,
    ]);

  return `\uFEFF${[csvHeaders, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\r\n")}`;
}

function parseCsvRows(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          value += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        value += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value || row.length > 0) {
    row.push(value.replace(/\r$/, ""));
    rows.push(row);
  }

  return rows.filter((csvRow) => csvRow.some((cell) => cell.trim()));
}

function normalizeCsvHeader(value: string) {
  return value.replace(/^\uFEFF/, "").trim();
}

function rowValue(row: string[], headerIndex: Map<string, number>, names: string[]) {
  for (const name of names) {
    const index = headerIndex.get(name);
    if (index !== undefined) {
      return String(row[index] ?? "").trim();
    }
  }
  return "";
}

function normalizeDateValue(value: string) {
  const normalized = value.trim().replace(/\//g, "-");
  const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) {
    return "";
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) {
    return "";
  }

  return `${year}-${pad(month)}-${pad(day)}`;
}

function normalizeTimeValue(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) {
    return "";
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return "";
  }

  const roundedMinute = Math.round(minute / 5) * 5;
  if (roundedMinute === 60) {
    return `${pad((hour + 1) % 24)}:00`;
  }

  return `${pad(hour)}:${pad(roundedMinute)}`;
}

function endTimeFromDuration(startTime: string, hoursValue: string) {
  const hours = toNumber(hoursValue);
  if (!hours) {
    return startTime;
  }

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const start = startHour * 60 + startMinute;
  const durationMinutes = Math.round((hours * 60) / 5) * 5;
  const end = (start + durationMinutes) % (24 * 60);
  return `${pad(Math.floor(end / 60))}:${pad(end % 60)}`;
}

function parseRateKind(value: string): RateKind | undefined {
  const normalized = value.trim().toLowerCase();
  if (normalized === "pachinko" || normalized === "パチンコ") {
    return "pachinko";
  }
  if (normalized === "slot" || normalized === "スロット") {
    return "slot";
  }
  return undefined;
}

function roundSavedCount(value: number) {
  const rounded = Math.round(value);
  if (Math.abs(value - rounded) < 0.01) {
    return rounded;
  }

  return Number(value.toFixed(2));
}

function formatRateValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function inferPRecordRateValue(profitValue: number, savedDifference: number) {
  if (!savedDifference || !profitValue) {
    return null;
  }

  const rateValue = profitValue / savedDifference;
  if (!Number.isFinite(rateValue) || rateValue <= 0 || rateValue > 30) {
    return null;
  }

  const estimatedProfit = savedDifference * rateValue;
  if (Math.abs(estimatedProfit - profitValue) > 1) {
    return null;
  }

  return Number(rateValue.toFixed(6));
}

function pRecordRateName(rateValue: number) {
  if (Math.abs(rateValue - 20) < 0.05) {
    return "20スロ推定";
  }
  if (Math.abs(rateValue - 5) < 0.05) {
    return "5スロ推定";
  }
  if (Math.abs(rateValue - 4) < 0.05) {
    return "4パチ推定";
  }
  if (Math.abs(rateValue - 1) < 0.05) {
    return "1パチ推定";
  }

  return `${formatRateValue(rateValue)}円換算`;
}

function pRecordRateKind(rateValue: number): RateKind {
  return rateValue >= 5 ? "slot" : "pachinko";
}

function parseRecordsFromCsv(text: string) {
  const rows = parseCsvRows(text);
  if (rows.length < 2) {
    return { importedRecords: [], skippedCount: rows.length };
  }

  const headers = rows[0].map(normalizeCsvHeader);
  const headerIndex = new Map(headers.map((header, index) => [header, index]));
  const importedRecords: PlayRecord[] = [];
  let skippedCount = 0;

  rows.slice(1).forEach((row) => {
    const date = normalizeDateValue(rowValue(row, headerIndex, ["日付", "date"]));
    const storeName = rowValue(row, headerIndex, ["店舗", "storeName"]);
    const machineName = rowValue(row, headerIndex, ["機種", "machineName"]);

    if (!date || !storeName || !machineName) {
      skippedCount += 1;
      return;
    }

    const startTime = normalizeTimeValue(rowValue(row, headerIndex, ["開始時刻", "startTime"])) || "10:00";
    const endTime =
      normalizeTimeValue(rowValue(row, headerIndex, ["終了時刻", "endTime"])) ||
      endTimeFromDuration(startTime, rowValue(row, headerIndex, ["稼働時間"]));
    const csvInvestment = toNumber(rowValue(row, headerIndex, ["投資額"]));
    const csvRecovery = toNumber(rowValue(row, headerIndex, ["回収額"]));
    const csvProfit = toNumber(rowValue(row, headerIndex, ["収支"]));
    const pRecordSaved = toNumber(rowValue(row, headerIndex, ["貯玉"]));
    const pRecordRateValue = inferPRecordRateValue(csvProfit, pRecordSaved);
    const importedSavedInvestment = toNumber(rowValue(row, headerIndex, ["貯玉投資", "savedInvestment"]));
    const importedSavedRecovery = toNumber(rowValue(row, headerIndex, ["貯玉回収", "savedRecovery"]));
    const savedInvestment = pRecordRateValue
      ? roundSavedCount(csvInvestment / pRecordRateValue)
      : importedSavedInvestment || (pRecordSaved < 0 ? Math.abs(pRecordSaved) : 0);
    const savedRecovery = pRecordRateValue
      ? roundSavedCount(csvRecovery / pRecordRateValue)
      : importedSavedRecovery || (pRecordSaved > 0 ? pRecordSaved : 0);
    const rateKind =
      parseRateKind(rowValue(row, headerIndex, ["レート区分", "rateKind"])) ??
      (pRecordRateValue ? pRecordRateKind(pRecordRateValue) : undefined);
    const rateName = rowValue(row, headerIndex, ["レート", "rateName"]) || (pRecordRateValue ? pRecordRateName(pRecordRateValue) : "");
    const rateUnitPrice = toNumber(rowValue(row, headerIndex, ["貸玉", "rateUnitPrice"])) || pRecordRateValue || undefined;
    const rateExchangeCountPer100Yen =
      toNumber(rowValue(row, headerIndex, ["交換率", "rateExchangeCountPer100Yen"])) ||
      (pRecordRateValue ? 100 / pRecordRateValue : undefined);

    importedRecords.push({
      id: crypto.randomUUID(),
      date,
      startTime,
      endTime,
      storeName,
      machineName,
      rateName,
      rateKind,
      rateUnitPrice,
      rateExchangeCountPer100Yen,
      rateSavedCount: toNumber(rowValue(row, headerIndex, ["保存時貯玉", "rateSavedCount"])) || undefined,
      rateReplayFeePercent: toNumber(rowValue(row, headerIndex, ["再プレイ手数料率", "rateReplayFeePercent"])) || undefined,
      investment: pRecordRateValue ? 0 : toNumber(rowValue(row, headerIndex, ["現金投資", "投資額", "investment"])),
      recovery: pRecordRateValue ? 0 : toNumber(rowValue(row, headerIndex, ["現金回収", "回収額", "recovery"])),
      savedInvestment,
      savedRecovery,
      expectedValue: toNumber(rowValue(row, headerIndex, ["期待値", "expectedValue"])),
      note: rowValue(row, headerIndex, ["メモ", "note"]),
    });
  });

  return { importedRecords, skippedCount };
}

export function App() {
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [records, setRecords] = useState<PlayRecord[]>(loadRecords);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [form, setForm] = useState<RecordForm>(() => createForm(todayKey(), true));
  const [viewMode, setViewMode] = useState<ViewMode>("home");
  const [chartMode, setChartMode] = useState<ChartMode>("month");
  const [selectorField, setSelectorField] = useState<OptionField | null>(null);
  const [selectorQuery, setSelectorQuery] = useState("");
  const [favoriteStores, setFavoriteStores] = useState<string[]>(() => loadStringList(favoriteStoreKey));
  const [favoriteMachines, setFavoriteMachines] = useState<string[]>(() => loadStringList(favoriteMachineKey));
  const [rateOptions, setRateOptions] = useState<RateOption[]>(loadRateOptions);
  const [isRateSelectorOpen, setIsRateSelectorOpen] = useState(false);
  const [isRateEditorOpen, setIsRateEditorOpen] = useState(false);
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [rateForm, setRateForm] = useState<RateForm>(() => createRateForm());
  const [csvMessage, setCsvMessage] = useState("");

  const days = useMemo(() => monthDays(currentMonth), [currentMonth]);

  const selectedRecords = useMemo(
    () =>
      records
        .filter((record) => record.date === selectedDate)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [records, selectedDate],
  );

  const monthRecords = useMemo(() => {
    const prefix = `${currentMonth.getFullYear()}-${pad(currentMonth.getMonth() + 1)}-`;
    return records.filter((record) => record.date.startsWith(prefix));
  }, [currentMonth, records]);

  const selectedProfit = selectedRecords.reduce((total, record) => total + profit(record), 0);
  const selectedExpected = selectedRecords.reduce(
    (total, record) => total + record.expectedValue,
    0,
  );
  const selectedHours = selectedRecords.reduce(
    (total, record) => total + durationHours(record.startTime, record.endTime),
    0,
  );
  const selectedSavedProfit = selectedRecords.reduce(
    (total, record) => total + savedProfit(record),
    0,
  );
  const monthProfit = monthRecords.reduce((total, record) => total + profit(record), 0);
  const chartData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const chartTitle =
      chartMode === "month"
        ? `${monthLabel(currentMonth)}の日別収支`
        : chartMode === "year"
          ? `${year}年の月別収支`
          : chartMode === "life"
            ? "生涯収支"
            : chartMode === "store"
              ? "店舗別収支"
              : "機種別収支";
    const points =
      chartMode === "month"
        ? monthChart(records, currentMonth)
        : chartMode === "year"
          ? yearChart(records, currentMonth)
          : chartMode === "life"
            ? lifeChart(records)
            : chartMode === "store"
              ? groupChart(records, "storeName")
              : groupChart(records, "machineName");
    const activePoints = points.filter((point) => point.count > 0);
    const total = activePoints.reduce((sum, point) => sum + point.value, 0);
    const count = activePoints.reduce((sum, point) => sum + point.count, 0);
    const maxAbs = Math.max(...points.map((point) => Math.abs(point.value)), 1);
    const best = activePoints.reduce<ChartPoint | null>(
      (current, point) => (!current || point.value > current.value ? point : current),
      null,
    );
    const worst = activePoints.reduce<ChartPoint | null>(
      (current, point) => (!current || point.value < current.value ? point : current),
      null,
    );

    return { activePoints, best, count, maxAbs, points, title: chartTitle, total, worst };
  }, [chartMode, currentMonth, records]);
  const filteredOptions = useMemo(() => {
    if (!selectorField) {
      return [];
    }

    const options = selectorField === "storeName" ? storeOptions : machineOptions;
    const favorites = selectorField === "storeName" ? favoriteStores : favoriteMachines;
    const favoriteRank = new Map(favorites.map((option, index) => [option, index]));
    const query = normalizeOptionText(selectorQuery);
    const matches = query
      ? options.filter((option) => normalizeOptionText(option).includes(query))
      : options;

    return [...matches]
      .sort((left, right) => {
        const leftRank = favoriteRank.get(left);
        const rightRank = favoriteRank.get(right);
        const leftFavorite = leftRank !== undefined;
        const rightFavorite = rightRank !== undefined;

        if (leftFavorite && rightFavorite) {
          return leftRank - rightRank;
        }

        if (!leftFavorite && !rightFavorite) {
          return 0;
        }

        return leftFavorite ? -1 : 1;
      })
      .slice(0, 80);
  }, [favoriteMachines, favoriteStores, selectorField, selectorQuery]);
  const selectorTitle =
    selectorField === "storeName" ? "店舗を選択" : selectorField === "machineName" ? "機種を選択" : "";
  const selectorCount =
    selectorField === "storeName" ? storeOptions.length : selectorField === "machineName" ? machineOptions.length : 0;
  const selectedOption = selectorField ? form[selectorField] : "";
  const favoriteOptionSet = useMemo(() => {
    if (selectorField === "storeName") {
      return new Set(favoriteStores);
    }
    if (selectorField === "machineName") {
      return new Set(favoriteMachines);
    }
    return new Set<string>();
  }, [favoriteMachines, favoriteStores, selectorField]);
  const selectedStoreRates = useMemo(
    () => rateOptions.filter((rate) => rate.storeName === form.storeName),
    [form.storeName, rateOptions],
  );
  const selectedRate = useMemo(
    () => selectedStoreRates.find((rate) => rate.id === form.rateId) ?? null,
    [form.rateId, selectedStoreRates],
  );
  const editingRecord = useMemo(
    () => records.find((record) => record.id === editingRecordId) ?? null,
    [editingRecordId, records],
  );
  const canSave = Boolean(form.storeName && form.machineName && (selectedRate || editingRecord));
  const formCashProfit = toNumber(form.recovery) - toNumber(form.investment);
  const formSavedDifference = toNumber(form.savedRecovery) - toNumber(form.savedInvestment);
  const formSavedUnitValue = selectedRate ? rateUnitValue(selectedRate) : editingRecord ? savedUnitValue(editingRecord) : 0;
  const formTotalProfit = Math.round(formCashProfit + formSavedDifference * formSavedUnitValue);
  const selectedRateSavedBefore =
    selectedRate && editingRecord?.rateId === selectedRate.id
      ? selectedRate.savedCount - savedProfit(editingRecord)
      : selectedRate?.savedCount ?? null;
  const selectedRateSavedAfter =
    selectedRateSavedBefore !== null ? selectedRateSavedBefore + formSavedDifference : null;

  function exportRecordsToCsv() {
    if (records.length === 0) {
      setCsvMessage("書き出す記録がありません。");
      return;
    }

    const blob = new Blob([recordsToCsv(records)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `shushi-records-${todayKey()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setCsvMessage(`${records.length}件の記録を書き出しました。`);
  }

  async function readCsvFile(file: File) {
    const buffer = await file.arrayBuffer();
    const utf8Text = new TextDecoder("utf-8").decode(buffer);
    if (!utf8Text.includes("�")) {
      return utf8Text;
    }

    try {
      return new TextDecoder("shift-jis").decode(buffer);
    } catch {
      return utf8Text;
    }
  }

  async function importRecordsFromCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await readCsvFile(file);
      const { importedRecords, skippedCount } = parseRecordsFromCsv(text);
      if (importedRecords.length === 0) {
        setCsvMessage("取り込める記録が見つかりませんでした。");
        return;
      }

      const importedDates = new Set(importedRecords.map((record) => record.date));
      const replacedRecords = records.filter((record) => importedDates.has(record.date));
      const replacementAdjustments = new Map<string, number>();
      replacedRecords.forEach((record) => {
        if (!record.rateId) {
          return;
        }

        replacementAdjustments.set(
          record.rateId,
          (replacementAdjustments.get(record.rateId) ?? 0) - savedProfit(record),
        );
      });

      const nextRecords = [
        ...records.filter((record) => !importedDates.has(record.date)),
        ...importedRecords,
      ];
      setRecords(nextRecords);
      saveRecords(nextRecords);
      replacementAdjustments.forEach((amount, rateId) => updateRateSavedCount(rateId, amount));
      const firstRecord = importedRecords[0];
      setSelectedDate(firstRecord.date);
      const [year, month] = firstRecord.date.split("-").map(Number);
      setCurrentMonth(new Date(year, month - 1, 1));
      if (editingRecord && importedDates.has(editingRecord.date)) {
        closeEditor();
      }
      setCsvMessage(
        `${importedRecords.length}件の記録を取り込み、${importedDates.size}日分をCSVの内容に置き換えました。${replacedRecords.length ? `既存の${replacedRecords.length}件は置き換え済みです。` : ""}${skippedCount ? `${skippedCount}件は日付・店舗・機種が不足していたため除外しました。` : ""}`,
      );
    } catch {
      setCsvMessage("CSVの取り込みに失敗しました。");
    } finally {
      event.target.value = "";
    }
  }

  function moveMonth(amount: number) {
    setCurrentMonth(
      (month) => new Date(month.getFullYear(), month.getMonth() + amount, 1),
    );
  }

  function openEditor(date = selectedDate) {
    const isFirstRecordForDay = !records.some((record) => record.date === date);
    setEditingRecordId(null);
    setForm(createForm(date, isFirstRecordForDay));
    setIsEditorOpen(true);
  }

  function openRecordEditor(record: PlayRecord) {
    setSelectedDate(record.date);
    setEditingRecordId(record.id);
    setForm(createFormFromRecord(record));
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setIsEditorOpen(false);
    setEditingRecordId(null);
    setSelectorField(null);
    setSelectorQuery("");
    setIsRateSelectorOpen(false);
    setIsRateEditorOpen(false);
    setEditingRateId(null);
  }

  function updateForm(key: keyof RecordForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateRateForm(key: keyof RateForm, value: string) {
    setRateForm((current) => ({ ...current, [key]: value }));
  }

  function openOptionSelector(field: OptionField) {
    setSelectorField(field);
    setSelectorQuery("");
  }

  function closeOptionSelector() {
    setSelectorField(null);
    setSelectorQuery("");
  }

  function selectOption(value: string) {
    if (!selectorField) {
      return;
    }

    if (selectorField === "storeName") {
      setForm((current) => ({
        ...current,
        storeName: value,
        rateId: current.storeName === value ? current.rateId : "",
        rateName: current.storeName === value ? current.rateName : "",
      }));
    } else {
      updateForm(selectorField, value);
    }
    closeOptionSelector();
  }

  function openRateSelector() {
    if (!form.storeName) {
      return;
    }

    setIsRateSelectorOpen(true);
  }

  function closeRateSelector() {
    setIsRateSelectorOpen(false);
    setIsRateEditorOpen(false);
    setEditingRateId(null);
  }

  function openRateEditor(kind: RateKind) {
    setRateForm(createRateForm(kind));
    setEditingRateId(null);
    setIsRateEditorOpen(true);
  }

  function openRateEdit(rate: RateOption) {
    setRateForm(createRateFormFromRate(rate));
    setEditingRateId(rate.id);
    setIsRateEditorOpen(true);
  }

  function selectRate(rate: RateOption) {
    setForm((current) => ({
      ...current,
      rateId: rate.id,
      rateName: rate.name,
    }));
    closeRateSelector();
  }

  function deleteRateOption(rateId: string) {
    const nextOptions = rateOptions.filter((rate) => rate.id !== rateId);
    setRateOptions(nextOptions);
    saveRateOptions(nextOptions);

    if (form.rateId === rateId) {
      setForm((current) => ({ ...current, rateId: "", rateName: "" }));
    }
  }

  function updateRateSavedCount(rateId: string | undefined, amount: number) {
    if (!rateId || amount === 0) {
      return;
    }

    setRateOptions((current) => {
      let changed = false;
      const nextOptions = current.map((rate) => {
        if (rate.id !== rateId) {
          return rate;
        }

        changed = true;
        return {
          ...rate,
          savedCount: rate.savedCount + amount,
        };
      });

      if (changed) {
        saveRateOptions(nextOptions);
      }

      return changed ? nextOptions : current;
    });
  }

  function handleRateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const storeName = form.storeName.trim();
    const name = rateForm.name.trim();

    if (!storeName || !name) {
      return;
    }

    const nextRate: RateOption = {
      id: crypto.randomUUID(),
      storeName,
      kind: rateForm.kind,
      name,
      unitPrice: toNumber(rateForm.unitPrice),
      exchangeCountPer100Yen: toNumber(rateForm.exchangeCountPer100Yen),
      savedCount: toNumber(rateForm.savedCount),
      replayFeePercent: toNumber(rateForm.replayFeePercent),
    };

    if (editingRateId) {
      const nextOptions = rateOptions.map((rate) =>
        rate.id === editingRateId ? { ...nextRate, id: editingRateId } : rate,
      );
      setRateOptions(nextOptions);
      saveRateOptions(nextOptions);
      setForm((current) =>
        current.rateId === editingRateId
          ? { ...current, rateName: nextRate.name }
          : current,
      );
      setEditingRateId(null);
      setIsRateEditorOpen(false);
      return;
    }

    const nextOptions = [...rateOptions, nextRate];
    setRateOptions(nextOptions);
    saveRateOptions(nextOptions);
    setForm((current) => ({
      ...current,
      rateId: nextRate.id,
      rateName: nextRate.name,
    }));
    closeRateSelector();
  }

  function updateFavoriteList(current: string[], value: string) {
    return current.includes(value)
      ? current.filter((item) => item !== value)
      : [value, ...current];
  }

  function toggleFavorite(value: string) {
    if (selectorField === "storeName") {
      setFavoriteStores((current) => {
        const next = updateFavoriteList(current, value);
        saveStringList(favoriteStoreKey, next);
        return next;
      });
    }

    if (selectorField === "machineName") {
      setFavoriteMachines((current) => {
        const next = updateFavoriteList(current, value);
        saveStringList(favoriteMachineKey, next);
        return next;
      });
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const storeName = form.storeName.trim();
    const machineName = form.machineName.trim();

    if (!storeName || !machineName || (!selectedRate && !editingRecord)) {
      return;
    }

    const rateSnapshot = selectedRate
      ? {
          rateId: selectedRate.id,
          rateName: selectedRate.name,
          rateKind: selectedRate.kind,
          rateUnitPrice: selectedRate.unitPrice,
          rateExchangeCountPer100Yen: selectedRate.exchangeCountPer100Yen,
          rateSavedCount: selectedRateSavedBefore ?? selectedRate.savedCount,
          rateReplayFeePercent: selectedRate.replayFeePercent,
        }
      : form.rateId && editingRecord
        ? {
            rateId: editingRecord.rateId,
            rateName: editingRecord.rateName,
            rateKind: editingRecord.rateKind,
            rateUnitPrice: editingRecord.rateUnitPrice,
            rateExchangeCountPer100Yen: editingRecord.rateExchangeCountPer100Yen,
            rateSavedCount: editingRecord.rateSavedCount,
            rateReplayFeePercent: editingRecord.rateReplayFeePercent,
          }
        : {};

    const nextRecord: PlayRecord = {
      id: editingRecord?.id ?? crypto.randomUUID(),
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      storeName,
      machineName,
      ...rateSnapshot,
      investment: toNumber(form.investment),
      recovery: toNumber(form.recovery),
      savedInvestment: toNumber(form.savedInvestment),
      savedRecovery: toNumber(form.savedRecovery),
      expectedValue: toNumber(form.expectedValue),
      note: form.note.trim(),
    };

    const nextRecords = editingRecord
      ? records.map((record) => (record.id === editingRecord.id ? nextRecord : record))
      : [...records, nextRecord];
    setRecords(nextRecords);
    saveRecords(nextRecords);
    if (editingRecord) {
      updateRateSavedCount(editingRecord.rateId, -savedProfit(editingRecord));
    }
    updateRateSavedCount(nextRecord.rateId, savedProfit(nextRecord));
    setSelectedDate(nextRecord.date);
    const [year, month] = nextRecord.date.split("-").map(Number);
    setCurrentMonth(new Date(year, month - 1, 1));
    closeEditor();
  }

  function deleteRecord(recordId: string) {
    const deletedRecord = records.find((record) => record.id === recordId);
    const nextRecords = records.filter((record) => record.id !== recordId);
    setRecords(nextRecords);
    saveRecords(nextRecords);

    if (deletedRecord) {
      updateRateSavedCount(deletedRecord.rateId, -savedProfit(deletedRecord));
    }

    if (editingRecordId === recordId) {
      closeEditor();
    }
  }

  if (viewMode === "updates") {
    return (
      <main className="app-shell">
        <section className="phone-frame">
          <header className="top-bar">
            <button className="icon-button" type="button" onClick={() => setViewMode("home")} title="戻る">
              <ChevronLeft size={20} />
            </button>
            <div>
              <p className="eyebrow">更新情報</p>
              <h1>変更内容</h1>
            </div>
            <div className="top-spacer" />
          </header>

          <section className="updates-list">
            {updateItems.map((item) => (
              <article className="update-item" key={item.title}>
                <time>{item.date}</time>
                <h2>{item.title}</h2>
                <p>{item.body}</p>
              </article>
            ))}
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="phone-frame">
        <header className="top-bar">
          <div>
            <p className="eyebrow">shushi</p>
            <h1>収支管理</h1>
          </div>
          <button className="icon-button primary" type="button" onClick={() => openEditor()} title="収支を入力">
            <Pencil size={20} />
          </button>
        </header>

        <section className="month-panel">
          <div className="month-header">
            <button className="icon-button" type="button" onClick={() => moveMonth(-1)} title="前の月">
              <ChevronLeft size={20} />
            </button>
            <div>
              <p className="month-label">{monthLabel(currentMonth)}</p>
              <p className={`month-total ${classForAmount(monthProfit)}`}>
                {signedCurrency(monthProfit)}
              </p>
            </div>
            <button className="icon-button" type="button" onClick={() => moveMonth(1)} title="次の月">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="week-row">
            {["日", "月", "火", "水", "木", "金", "土"].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {days.map((dateKey, index) => {
              if (!dateKey) {
                return <div className="day-cell empty" key={`empty-${index}`} />;
              }

              const dayRecords = records.filter((record) => record.date === dateKey);
              const dayProfit = dayRecords.reduce((total, record) => total + profit(record), 0);
              const isSelected = dateKey === selectedDate;
              const isToday = dateKey === todayKey();
              const dayNumber = Number(dateKey.split("-")[2]);

              return (
                <button
                  className={`day-cell ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`}
                  key={dateKey}
                  type="button"
                  onClick={() => setSelectedDate(dateKey)}
                >
                  <span>{dayNumber}</span>
                  {dayRecords.length > 0 && (
                    <small className={classForAmount(dayProfit)}>
                      {dayProfit > 0 ? "+" : ""}
                      {Math.round(dayProfit / 1000)}k
                    </small>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="day-summary">
          <div>
            <p className="eyebrow">選択日</p>
            <h2>{displayDate(selectedDate)}</h2>
          </div>
          <button className="text-button" type="button" onClick={() => openEditor()}>
            <Plus size={18} />
            追加
          </button>
        </section>

        <section className="summary-grid">
          <div>
            <span>収支</span>
            <strong className={classForAmount(selectedProfit)}>
              {signedCurrency(selectedProfit)}
            </strong>
          </div>
          <div>
            <span>期待値</span>
            <strong>{currency(selectedExpected)}</strong>
          </div>
          <div>
            <span>貯玉</span>
            <strong className={classForAmount(selectedSavedProfit)}>
              {savedCount(selectedSavedProfit)}
            </strong>
          </div>
          <div>
            <span>時間</span>
            <strong>{selectedHours.toFixed(1)}時間</strong>
          </div>
        </section>

        <section className="chart-panel">
          <header className="chart-header">
            <div>
              <p className="eyebrow">分析</p>
              <h2>収支グラフ</h2>
            </div>
            <strong className={classForAmount(chartData.total)}>
              {signedCurrency(chartData.total)}
            </strong>
          </header>

          <div className="chart-tabs" aria-label="収支グラフの切り替え">
            {chartModes.map((mode) => (
              <button
                className={`chart-tab ${chartMode === mode.key ? "is-active" : ""}`}
                key={mode.key}
                type="button"
                onClick={() => setChartMode(mode.key)}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div className="chart-title-row">
            <span>{chartData.title}</span>
            <strong>{chartData.count}件</strong>
          </div>

          {chartData.count === 0 ? (
            <div className="chart-empty">表示できる記録がありません。</div>
          ) : (
            <>
              <div className="chart-highlights">
                <div>
                  <span>最大プラス</span>
                  <strong className={classForAmount(chartData.best?.value ?? 0)}>
                    {chartData.best ? `${chartData.best.label} ${signedCurrency(chartData.best.value)}` : "-"}
                  </strong>
                </div>
                <div>
                  <span>最大マイナス</span>
                  <strong className={classForAmount(chartData.worst?.value ?? 0)}>
                    {chartData.worst ? `${chartData.worst.label} ${signedCurrency(chartData.worst.value)}` : "-"}
                  </strong>
                </div>
              </div>

              <div className="chart-list">
                {chartData.points.map((point) => {
                  const width = point.value === 0 ? 0 : Math.max(4, (Math.abs(point.value) / chartData.maxAbs) * 100);

                  return (
                    <div className="chart-row" key={point.key}>
                      <div className="chart-row-head">
                        <span>{point.label}</span>
                        <strong className={classForAmount(point.value)}>
                          {signedCurrency(point.value)}
                        </strong>
                      </div>
                      <div className="chart-bar-track" aria-hidden="true">
                        <span
                          className={`chart-bar-fill ${classForAmount(point.value)}`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <small>{point.count}件</small>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <section className="csv-panel">
          <div className="csv-buttons">
            <button className="text-button" type="button" onClick={() => csvInputRef.current?.click()}>
              <Upload size={18} />
              CSV取込
            </button>
            <button className="text-button" type="button" onClick={exportRecordsToCsv}>
              <Download size={18} />
              CSV出力
            </button>
          </div>
          <input
            ref={csvInputRef}
            accept=".csv,text/csv"
            className="csv-input"
            type="file"
            onChange={importRecordsFromCsv}
          />
          {csvMessage && <p>{csvMessage}</p>}
        </section>

        <section className="record-list">
          {selectedRecords.length === 0 ? (
            <div className="empty-state">
              <p>この日の記録はまだありません。</p>
            </div>
          ) : (
            selectedRecords.map((record) => (
              <article
                aria-label={`${record.machineName}の記録を編集`}
                className="record-item record-editable"
                key={record.id}
                role="button"
                tabIndex={0}
                onClick={() => openRecordEditor(record)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openRecordEditor(record);
                  }
                }}
              >
                <div className="record-head">
                  <div>
                    <h3>{record.machineName}</h3>
                    <p>
                      {record.storeName}
                      {record.rateName ? ` / ${record.rateName}` : ""}
                    </p>
                  </div>
                  <strong className={classForAmount(profit(record))}>
                    {signedCurrency(profit(record))}
                  </strong>
                </div>
                <dl className="record-stats">
                  <div>
                    <dt>時間</dt>
                    <dd>
                      {record.startTime} - {record.endTime}
                    </dd>
                  </div>
                  <div>
                    <dt>現金投資</dt>
                    <dd>{currency(record.investment)}</dd>
                  </div>
                  <div>
                    <dt>現金回収</dt>
                    <dd>{currency(record.recovery)}</dd>
                  </div>
                  <div>
                    <dt>貯玉投資</dt>
                    <dd>{plainSavedCount(record.savedInvestment ?? 0)}</dd>
                  </div>
                  <div>
                    <dt>貯玉回収</dt>
                    <dd>{plainSavedCount(record.savedRecovery ?? 0)}</dd>
                  </div>
                  <div>
                    <dt>貯玉差引</dt>
                    <dd className={classForAmount(savedProfit(record))}>
                      {savedCount(savedProfit(record))}
                    </dd>
                  </div>
                  <div>
                    <dt>期待値</dt>
                    <dd>{currency(record.expectedValue)}</dd>
                  </div>
                </dl>
                {record.note && <p className="record-note">{record.note}</p>}
                <button
                  className="delete-button"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteRecord(record.id);
                  }}
                  title="記録を削除"
                >
                  <Trash2 size={16} />
                  削除
                </button>
              </article>
            ))
          )}
        </section>

        <button className="updates-button" type="button" onClick={() => setViewMode("updates")}>
          更新情報を見る
        </button>
      </section>

      {isEditorOpen && (
        <div className="editor-backdrop">
          <section className="editor-sheet" aria-label="収支入力">
            <header className="editor-header">
              <div>
                <p className="eyebrow">{editingRecord ? "編集" : "入力"}</p>
                <h2>{editingRecord ? "稼働記録を編集" : "稼働記録"}</h2>
              </div>
              <button className="icon-button" type="button" onClick={closeEditor} title="閉じる">
                <X size={20} />
              </button>
            </header>

            <form className="record-form" onSubmit={handleSubmit}>
              <label>
                日付
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => updateForm("date", event.target.value)}
                  required
                />
              </label>

              <div className="form-pair">
                <label>
                  開始時刻
                  <input
                    type="time"
                    step="300"
                    value={form.startTime}
                    onChange={(event) => updateForm("startTime", event.target.value)}
                  />
                </label>
                <label>
                  終了時刻
                  <input
                    type="time"
                    step="300"
                    value={form.endTime}
                    onChange={(event) => updateForm("endTime", event.target.value)}
                  />
                </label>
              </div>

              <div className="choice-field">
                <span>店舗</span>
                <button
                  className={`select-button ${form.storeName ? "" : "is-empty"}`}
                  type="button"
                  onClick={() => openOptionSelector("storeName")}
                >
                  <span>{form.storeName || "店舗を選択"}</span>
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="choice-field">
                <span>レート</span>
                <button
                  className={`select-button rate-select-button ${selectedRate ? "" : "is-empty"}`}
                  type="button"
                  onClick={openRateSelector}
                  disabled={!form.storeName}
                >
                  {selectedRate ? (
                    <span className="rate-select-label">
                      <strong>{selectedRate.name}</strong>
                      <small>{rateSummary(selectedRate)}</small>
                    </span>
                  ) : (
                    <span>{!form.storeName ? "店舗を先に選択" : "レートを選択"}</span>
                  )}
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="choice-field">
                <span>機種</span>
                <button
                  className={`select-button ${form.machineName ? "" : "is-empty"}`}
                  type="button"
                  onClick={() => openOptionSelector("machineName")}
                >
                  <span>{form.machineName || "機種を選択"}</span>
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="form-pair">
                <label>
                  現金投資
                  <input
                    inputMode="numeric"
                    min="0"
                    type="number"
                    value={form.investment}
                    onChange={(event) => updateForm("investment", event.target.value)}
                    placeholder="0"
                  />
                </label>
                <label>
                  現金回収
                  <input
                    inputMode="numeric"
                    min="0"
                    type="number"
                    value={form.recovery}
                    onChange={(event) => updateForm("recovery", event.target.value)}
                    placeholder="0"
                  />
                </label>
              </div>

              <div className="form-pair">
                <label>
                  貯玉投資
                  <input
                    inputMode="numeric"
                    min="0"
                    type="number"
                    value={form.savedInvestment}
                    onChange={(event) => updateForm("savedInvestment", event.target.value)}
                    placeholder="0"
                  />
                </label>
                <label>
                  貯玉回収
                  <input
                    inputMode="numeric"
                    min="0"
                    type="number"
                    value={form.savedRecovery}
                    onChange={(event) => updateForm("savedRecovery", event.target.value)}
                    placeholder="0"
                  />
                </label>
              </div>

              <label>
                期待値
                <input
                  inputMode="numeric"
                  type="number"
                  value={form.expectedValue}
                  onChange={(event) => updateForm("expectedValue", event.target.value)}
                  placeholder="0"
                />
              </label>

              <label>
                メモ
                <textarea
                  value={form.note}
                  onChange={(event) => updateForm("note", event.target.value)}
                  placeholder="必要ならメモ"
                  rows={3}
                />
              </label>

              <div className="live-result result-stack">
                <div>
                  <span>現金収支</span>
                  <strong className={classForAmount(formCashProfit)}>
                    {signedCurrency(formCashProfit)}
                  </strong>
                </div>
                <div>
                  <span>貯玉差引</span>
                  <strong className={classForAmount(formSavedDifference)}>
                    {savedCount(formSavedDifference)}
                  </strong>
                </div>
                <div>
                  <span>総合収支</span>
                  <strong className={classForAmount(formTotalProfit)}>
                    {signedCurrency(formTotalProfit)}
                  </strong>
                </div>
                {selectedRateSavedAfter !== null && (
                  <div>
                    <span>保存後の貯玉</span>
                    <strong>{plainSavedCount(selectedRateSavedAfter)}</strong>
                  </div>
                )}
              </div>

              <button className="save-button" type="submit" disabled={!canSave}>
                {editingRecord ? "更新" : "保存"}
              </button>
            </form>

            {selectorField && (
              <div className="option-backdrop">
                <section className="option-sheet" aria-label={selectorTitle}>
                  <header className="option-header">
                    <div>
                      <p className="eyebrow">選択</p>
                      <h2>{selectorTitle}</h2>
                    </div>
                    <button className="icon-button" type="button" onClick={closeOptionSelector} title="閉じる">
                      <X size={20} />
                    </button>
                  </header>

                  <label className="option-search">
                    <Search size={18} />
                    <input
                      autoFocus
                      value={selectorQuery}
                      onChange={(event) => setSelectorQuery(event.target.value)}
                      placeholder="検索"
                    />
                  </label>

                  <p className="option-count">
                    {filteredOptions.length} / {selectorCount}
                  </p>

                  <div className="option-list">
                    {filteredOptions.length === 0 ? (
                      <p className="option-empty">該当する候補はありません。</p>
                    ) : (
                      filteredOptions.map((option) => {
                        const isSelected = option === selectedOption;
                        const isFavorite = favoriteOptionSet.has(option);

                        return (
                          <div
                            className={`option-row ${isSelected ? "is-selected" : ""}`}
                            key={option}
                          >
                            <button
                              className={`favorite-button ${isFavorite ? "is-active" : ""}`}
                              type="button"
                              onClick={() => toggleFavorite(option)}
                              title={isFavorite ? "お気に入りから外す" : "お気に入りに追加"}
                              aria-label={`${option}を${isFavorite ? "お気に入りから外す" : "お気に入りに追加"}`}
                            >
                              <Star size={18} />
                            </button>
                            <button
                              className="option-pick"
                              type="button"
                              onClick={() => selectOption(option)}
                            >
                              <span>{option}</span>
                              {isSelected && <Check size={18} />}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>
              </div>
            )}

            {isRateSelectorOpen && (
              <div className="option-backdrop">
                <section className="option-sheet rate-sheet" aria-label="レートを選択">
                  <header className="option-header">
                    <div>
                      <p className="eyebrow">選択</p>
                      <h2>レートを選択</h2>
                    </div>
                    <button className="icon-button" type="button" onClick={closeRateSelector} title="閉じる">
                      <X size={20} />
                    </button>
                  </header>

                  <div className="rate-action-row">
                    <button className="text-button" type="button" onClick={() => openRateEditor("pachinko")}>
                      <Plus size={18} />
                      パチンコ追加
                    </button>
                    <button className="text-button" type="button" onClick={() => openRateEditor("slot")}>
                      <Plus size={18} />
                      スロット追加
                    </button>
                  </div>

                  <p className="option-count">
                    {form.storeName} / {selectedStoreRates.length}件
                  </p>

                  <div className="option-list">
                    {selectedStoreRates.length === 0 ? (
                      <p className="option-empty">
                        この店舗のレートはまだありません。
                      </p>
                    ) : (
                      selectedStoreRates.map((rate) => {
                        const isSelected = rate.id === form.rateId;

                        return (
                          <div
                            className={`option-row rate-option-row ${isSelected ? "is-selected" : ""}`}
                            key={rate.id}
                          >
                            <button
                              className="option-pick rate-option-pick"
                              type="button"
                              onClick={() => selectRate(rate)}
                            >
                              <span>
                                <strong>{rate.name}</strong>
                                <small>{rateSummary(rate)}</small>
                              </span>
                              {isSelected && <Check size={18} />}
                            </button>
                            <button
                              className="rate-edit-button"
                              type="button"
                              onClick={() => openRateEdit(rate)}
                              title="レートを編集"
                              aria-label={`${rate.name}を編集`}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              className="rate-delete-button"
                              type="button"
                              onClick={() => deleteRateOption(rate.id)}
                              title="レートを削除"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>
              </div>
            )}

            {isRateEditorOpen && (
              <div className="option-backdrop rate-editor-backdrop">
                <section className="option-sheet rate-editor-sheet" aria-label="レート設定">
                  <header className="option-header">
                    <div>
                      <p className="eyebrow">設定</p>
                      <h2>{editingRateId ? "レート編集" : "レート設定"}</h2>
                    </div>
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => {
                        setIsRateEditorOpen(false);
                        setEditingRateId(null);
                      }}
                      title="閉じる"
                    >
                      <X size={20} />
                    </button>
                  </header>

                  <form className="record-form" onSubmit={handleRateSubmit}>
                    <div className="rate-kind-switch" aria-label="区分">
                      <button
                        className={`rate-kind-button ${rateForm.kind === "pachinko" ? "is-active" : ""}`}
                        type="button"
                        onClick={() => setRateForm(createRateForm("pachinko"))}
                      >
                        パチンコ
                      </button>
                      <button
                        className={`rate-kind-button ${rateForm.kind === "slot" ? "is-active" : ""}`}
                        type="button"
                        onClick={() => setRateForm(createRateForm("slot"))}
                      >
                        スロット
                      </button>
                    </div>

                    <label>
                      レート名
                      <input
                        value={rateForm.name}
                        onChange={(event) => updateRateForm("name", event.target.value)}
                        placeholder="4パチ"
                        required
                      />
                    </label>

                    <div className="form-pair">
                      <label>
                        {rateUnitLabel(rateForm.kind)}
                        <input
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          type="number"
                          value={rateForm.unitPrice}
                          onChange={(event) => updateRateForm("unitPrice", event.target.value)}
                          required
                        />
                      </label>
                      <label>
                        交換率(100円辺り)
                        <input
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          type="number"
                          value={rateForm.exchangeCountPer100Yen}
                          onChange={(event) => updateRateForm("exchangeCountPer100Yen", event.target.value)}
                          required
                        />
                      </label>
                    </div>

                    <div className="form-pair">
                      <label>
                        {rateSavedLabel()}
                        <input
                          inputMode="numeric"
                          min="0"
                          type="number"
                          value={rateForm.savedCount}
                          onChange={(event) => updateRateForm("savedCount", event.target.value)}
                          placeholder="0"
                        />
                      </label>
                      <label>
                        再プレイ手数料率(%)
                        <input
                          inputMode="decimal"
                          min="0"
                          step="0.1"
                          type="number"
                          value={rateForm.replayFeePercent}
                          onChange={(event) => updateRateForm("replayFeePercent", event.target.value)}
                        />
                      </label>
                    </div>

                    <div className="rate-preview">
                      <span>{rateKindLabel(rateForm.kind)}</span>
                      <strong>
                        {rateForm.name || "未入力"} / {rateUnitLabel(rateForm.kind)} {rateForm.unitPrice || 0}円
                      </strong>
                      <p>
                        100円あたり {rateForm.exchangeCountPer100Yen || 0}
                        {rateExchangeUnitLabel(rateForm.kind)} / {rateSavedLabel()}{" "}
                        {Number(rateForm.savedCount || 0).toLocaleString("ja-JP")}
                        {rateSavedUnitLabel()} / 再プレイ {rateForm.replayFeePercent || 0}%
                      </p>
                    </div>

                    <button className="save-button" type="submit">
                      {editingRateId ? "更新" : "設定完了"}
                    </button>
                  </form>
                </section>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
