import {
  BarChart3,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Gamepad2,
  Pencil,
  Plus,
  Search,
  Settings,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { ChangeEvent, CSSProperties, FormEvent, useMemo, useRef, useState } from "react";
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

type RateSnapshot = Pick<
  PlayRecord,
  | "rateId"
  | "rateName"
  | "rateKind"
  | "rateUnitPrice"
  | "rateExchangeCountPer100Yen"
  | "rateSavedCount"
  | "rateReplayFeePercent"
>;

type ViewMode = "home" | "analysis" | "stores" | "machines" | "other" | "updates";
type OptionField = "storeName" | "machineName";
type ChartMode = "month" | "year" | "life" | "store" | "machine";
type StoreTab = "favorite" | "registered" | "custom";

type ChartPoint = {
  key: string;
  label: string;
  value: number;
  expectedValue: number;
  count: number;
};

type ChartPlotPoint = ChartPoint & {
  plotValue: number;
  expectedPlotValue: number;
};

type StoreMachineSummary = {
  name: string;
  count: number;
  profit: number;
  expectedValue: number;
  lastDate: string;
};

type StoreInfo = {
  name: string;
  isFavorite: boolean;
  isRegistered: boolean;
  records: PlayRecord[];
  rates: RateOption[];
  monthProfit: number;
  totalProfit: number;
  totalExpectedValue: number;
  totalHours: number;
  lastDate: string;
  savedText: string;
  machines: StoreMachineSummary[];
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
  {
    date: "2026-05-24",
    title: "貯玉増減の表示を調整",
    body: "貯玉の差し引き表示を貯玉増減に変更し、スロットの貯玉数は枚で表示するようにしました。",
  },
  {
    date: "2026-05-24",
    title: "収支グラフを折れ線に変更",
    body: "収支の流れが見やすいように、グラフ表示を棒から折れ線へ変更しました。",
  },
  {
    date: "2026-05-24",
    title: "店舗別と機種別を縦棒に変更",
    body: "店舗別と機種別の収支グラフは、比較しやすい縦棒グラフで表示するようにしました。",
  },
  {
    date: "2026-05-24",
    title: "PC表示の余白を調整",
    body: "重複していた選択日カードをなくし、PC表示でサマリーとグラフが右側に自然に並ぶようにしました。",
  },
  {
    date: "2026-05-24",
    title: "PC表示を幅広の1列に変更",
    body: "PC表示でも縦1列にし、カレンダーの日別収支はk表記ではなく円単位の数字で表示するようにしました。",
  },
  {
    date: "2026-05-24",
    title: "日別表示の順番を変更",
    body: "カレンダー下の表示を、日別集計、稼働カード、収支グラフの順に並ぶようにしました。",
  },
  {
    date: "2026-05-24",
    title: "プラス収支の色を調整",
    body: "プラス収支と貯玉プラスの表示を青系にし、選択中の日付でも数字が読みやすいようにしました。",
  },
  {
    date: "2026-05-24",
    title: "収支グラフに期待値を追加",
    body: "収支グラフに期待値も重ねて表示し、折れ線では別色の線、縦棒では隣の棒で比較できるようにしました。",
  },
  {
    date: "2026-05-24",
    title: "店舗別と機種別を横棒に変更",
    body: "店舗別と機種別の収支グラフを横棒表示にし、店舗名や機種名の右側で収支と期待値を比較できるようにしました。",
  },
  {
    date: "2026-05-24",
    title: "カレンダー収支をカンマ区切りに変更",
    body: "カレンダーの日別収支を、+60,240 のようにカンマ付きで表示するようにしました。",
  },
  {
    date: "2026-05-24",
    title: "月別グラフの月移動を追加",
    body: "月別グラフにも前月・次月ボタンを追加し、メインカレンダーの月表示と連動するようにしました。",
  },
  {
    date: "2026-05-24",
    title: "過去記録の一括編集を追加",
    body: "指定した店舗の過去記録に対して、パチンコとスロットのレートをまとめて付け替えられるようにしました。",
  },
  {
    date: "2026-05-26",
    title: "一括編集のレート選択を見やすく変更",
    body: "一括編集でレートを選ぶ時に、レート名だけでなく交換率・貯玉・再プレイ率も見えるようにしました。",
  },
  {
    date: "2026-05-26",
    title: "店舗情報画面を追加",
    body: "店舗一覧から店舗ごとの貯玉、収支、過去記録、打った機種を確認し、レートと貯玉を直接編集できるようにしました。",
  },
  {
    date: "2026-05-26",
    title: "店舗一覧の貯玉表示を調整",
    body: "店舗一覧と店舗詳細の貯玉表示に、玉数や枚数だけでなく円換算も表示するようにしました。",
  },
  {
    date: "2026-05-26",
    title: "店舗詳細のレート追加を調整",
    body: "レート追加ボタンをレートと貯玉の欄へ移し、パチンコのレート追加・スロットのレート追加という文言に変更しました。",
  },
  {
    date: "2026-05-26",
    title: "全店舗の貯玉合計を追加",
    body: "店舗一覧に、全店舗の貯玉を円換算・パチンコ玉数・スロット枚数で確認できる合計欄を追加しました。",
  },
  {
    date: "2026-05-26",
    title: "店舗一覧に累計期待値を追加",
    body: "店舗一覧の各店舗カードで、その店舗の累計期待値も確認できるようにしました。",
  },
  {
    date: "2026-05-26",
    title: "店舗カードの表示を調整",
    body: "店舗一覧カード上部の登録店舗・自登録店舗の分類表示を削除し、店舗名から見えるようにしました。",
  },
  {
    date: "2026-05-26",
    title: "下部タブ型の画面構成に変更",
    body: "画面下にカレンダー、収支分析、店舗情報、機種情報、その他のタブを追加し、グラフやCSV操作を専用画面へ分けました。",
  },
  {
    date: "2026-05-26",
    title: "折れ線グラフの見た目を調整",
    body: "収支分析の折れ線を細くし、稼働がない日の点を表示しないようにして、グラフをすっきり見せるようにしました。",
  },
  {
    date: "2026-05-26",
    title: "収支グラフに実収支の棒を追加",
    body: "月別、年別、生涯の収支グラフで、累計収支の折れ線に加えて期間ごとの実収支を棒で重ねて見られるようにしました。",
  },
  {
    date: "2026-05-26",
    title: "収支グラフの成績表示を強化",
    body: "グラフの右側に円目盛りを出し、月別では10日・20日・30日の目安線を追加しました。さらに回数、勝率、投資、回収、時給などの成績欄も確認できるようにしました。",
  },
  {
    date: "2026-05-26",
    title: "収支分析をpRecord風に整理",
    body: "グラフ上の金額付き凡例と最高・最低カードをなくし、グラフ下に今月の成績と大きな合計収支、平均額や期待値合計を含む成績表を表示する形にしました。",
  },
  {
    date: "2026-05-26",
    title: "月別グラフの見出しを年月表示に変更",
    body: "月別の収支グラフと成績の見出しを、今月ではなく2026年05月のような年月表示に変更し、収支分析画面上部の重複見出しも削除しました。",
  },
];

const chartModes: Array<{ key: ChartMode; label: string }> = [
  { key: "month", label: "月別" },
  { key: "year", label: "年別" },
  { key: "life", label: "生涯" },
  { key: "store", label: "店舗別" },
  { key: "machine", label: "機種別" },
];

const storeTabs: Array<{ key: StoreTab; label: string }> = [
  { key: "favorite", label: "お気に入り" },
  { key: "registered", label: "登録店舗" },
  { key: "custom", label: "自登録店舗" },
];

const chartSvgWidth = 360;
const chartSvgHeight = 190;
const chartPadding = {
  top: 18,
  right: 58,
  bottom: 24,
  left: 18,
};

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

function numericMonthLabel(date: Date) {
  return `${date.getFullYear()}年${pad(date.getMonth() + 1)}月`;
}

function currency(value: number) {
  return `${value.toLocaleString("ja-JP")}円`;
}

function signedCurrency(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${currency(value)}`;
}

function signedPlainAmount(value: number) {
  const rounded = Math.round(value);
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toLocaleString("ja-JP")}`;
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

function recordInvestmentValue(record: PlayRecord) {
  return Math.round(record.investment + (record.savedInvestment ?? 0) * savedUnitValue(record));
}

function recordRecoveryValue(record: PlayRecord) {
  return Math.round(record.recovery + (record.savedRecovery ?? 0) * savedUnitValue(record));
}

function savedUnitLabel(kind?: RateKind | "mixed" | null) {
  if (kind === "slot") {
    return "枚";
  }
  if (kind === "mixed") {
    return "玉/枚";
  }
  return "玉";
}

function savedCount(value: number, kind?: RateKind | "mixed" | null) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("ja-JP")}${savedUnitLabel(kind)}`;
}

function plainSavedCount(value: number, kind?: RateKind | "mixed" | null) {
  return `${value.toLocaleString("ja-JP")}${savedUnitLabel(kind)}`;
}

function recordsSavedUnitKind(records: PlayRecord[]): RateKind | "mixed" | undefined {
  const kinds = Array.from(
    new Set(records.map((record) => record.rateKind).filter((kind): kind is RateKind => Boolean(kind))),
  );
  if (kinds.length === 1) {
    return kinds[0];
  }
  if (kinds.length > 1) {
    return "mixed";
  }
  return undefined;
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

function recordsExpectedValue(records: PlayRecord[]) {
  return records.reduce((total, record) => total + record.expectedValue, 0);
}

function chartRecordsForMode(records: PlayRecord[], mode: ChartMode, date: Date) {
  if (mode === "month") {
    const prefix = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-`;
    return records.filter((record) => record.date.startsWith(prefix));
  }

  if (mode === "year") {
    return records.filter((record) => record.date.startsWith(`${date.getFullYear()}-`));
  }

  return records;
}

function chartPoint(key: string, label: string, records: PlayRecord[]): ChartPoint {
  return {
    key,
    label,
    value: recordsProfit(records),
    expectedValue: recordsExpectedValue(records),
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

function chartPointPath(points: Array<ChartPlotPoint & { x: number; y: number }>) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function horizontalPosition(value: number, minValue: number, maxValue: number) {
  const range = maxValue - minValue || 1;
  return Math.min(100, Math.max(0, ((value - minValue) / range) * 100));
}

function horizontalBarStyle(value: number, minValue: number, maxValue: number): CSSProperties {
  const zero = horizontalPosition(0, minValue, maxValue);
  const end = horizontalPosition(value, minValue, maxValue);
  const width = value === 0 ? 1 : Math.max(1.5, Math.abs(end - zero));

  return {
    left: `${Math.min(zero, end)}%`,
    width: `${width}%`,
  };
}

function horizontalZeroStyle(minValue: number, maxValue: number): CSSProperties {
  return {
    left: `${horizontalPosition(0, minValue, maxValue)}%`,
  };
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

function rateSavedUnitLabel(kind?: RateKind) {
  return savedUnitLabel(kind);
}

function rateSavedText(rate: Pick<RateOption, "kind" | "savedCount">) {
  return `${rateSavedLabel()} ${rate.savedCount.toLocaleString("ja-JP")}${rateSavedUnitLabel(rate.kind)}`;
}

function storeSavedSummaryText(
  rate: Pick<
    RateOption,
    "name" | "kind" | "savedCount" | "exchangeCountPer100Yen" | "unitPrice"
  >,
) {
  const savedValue = Math.round(rate.savedCount * rateUnitValue(rate));
  return `${rate.name} ${plainSavedCount(rate.savedCount, rate.kind)}（${currency(savedValue)}）`;
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

function createRateSnapshot(rate: RateOption, savedCount = rate.savedCount): RateSnapshot {
  return {
    rateId: rate.id,
    rateName: rate.name,
    rateKind: rate.kind,
    rateUnitPrice: rate.unitPrice,
    rateExchangeCountPer100Yen: rate.exchangeCountPer100Yen,
    rateSavedCount: savedCount,
    rateReplayFeePercent: rate.replayFeePercent,
  };
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
  "貯玉増減",
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
  const [isBulkEditorOpen, setIsBulkEditorOpen] = useState(false);
  const [bulkStoreName, setBulkStoreName] = useState("");
  const [bulkPachinkoRateId, setBulkPachinkoRateId] = useState("");
  const [bulkSlotRateId, setBulkSlotRateId] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");
  const [storeTab, setStoreTab] = useState<StoreTab>("favorite");
  const [storeQuery, setStoreQuery] = useState("");
  const [selectedStoreInfoName, setSelectedStoreInfoName] = useState<string | null>(null);
  const [rateEditorStoreName, setRateEditorStoreName] = useState<string | null>(null);
  const [savedCountDrafts, setSavedCountDrafts] = useState<Record<string, string>>({});
  const [storeMessage, setStoreMessage] = useState("");

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
  const selectedSavedUnitKind = recordsSavedUnitKind(selectedRecords);
  const monthProfit = monthRecords.reduce((total, record) => total + profit(record), 0);
  const chartData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const isTrend = chartMode === "month" || chartMode === "year" || chartMode === "life";
    const chartTitle =
      chartMode === "month"
        ? `${numericMonthLabel(currentMonth)}の収支グラフ`
        : chartMode === "year"
          ? `${year}年の累計収支`
          : chartMode === "life"
            ? "生涯累計収支"
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
    const expectedTotal = activePoints.reduce((sum, point) => sum + point.expectedValue, 0);
    const count = activePoints.reduce((sum, point) => sum + point.count, 0);
    const statsRecords = chartRecordsForMode(records, chartMode, currentMonth);
    const statsResults = statsRecords.map((record) => profit(record));
    const expectedInputRecords = statsRecords.filter((record) => record.expectedValue !== 0);
    const statsCount = statsRecords.length;
    const statsTotal = statsResults.reduce((sum, value) => sum + value, 0);
    const statsHours = statsRecords.reduce(
      (sum, record) => sum + durationHours(record.startTime, record.endTime),
      0,
    );
    const statsTitle =
      chartMode === "month"
        ? `${numericMonthLabel(currentMonth)}の成績`
        : chartMode === "year"
          ? `${year}年の成績`
          : chartMode === "life"
            ? "生涯の成績"
            : chartMode === "store"
              ? "全店舗の成績"
              : "全機種の成績";
    const stats = {
      averageProfit: statsCount ? statsTotal / statsCount : 0,
      count: statsCount,
      drawCount: statsResults.filter((value) => value === 0).length,
      expectedAverage: expectedInputRecords.length
        ? recordsExpectedValue(expectedInputRecords) / expectedInputRecords.length
        : 0,
      expectedDrawCount: expectedInputRecords.filter((record) => record.expectedValue === 0).length,
      expectedInputCount: expectedInputRecords.length,
      expectedLoseCount: expectedInputRecords.filter((record) => record.expectedValue < 0).length,
      expectedTotal: recordsExpectedValue(statsRecords),
      expectedWinCount: expectedInputRecords.filter((record) => record.expectedValue > 0).length,
      hourlyProfit: statsHours > 0 ? statsTotal / statsHours : 0,
      hours: statsHours,
      loseCount: statsResults.filter((value) => value < 0).length,
      maxInvestment: statsRecords.reduce(
        (max, record) => Math.max(max, recordInvestmentValue(record)),
        0,
      ),
      maxRecovery: statsRecords.reduce(
        (max, record) => Math.max(max, recordRecoveryValue(record)),
        0,
      ),
      savedProfit: statsRecords.reduce((sum, record) => sum + savedProfit(record), 0),
      savedUnitKind: recordsSavedUnitKind(statsRecords),
      savedValue: Math.round(
        statsRecords.reduce(
          (sum, record) => sum + savedProfit(record) * savedUnitValue(record),
          0,
        ),
      ),
      title: statsTitle,
      totalProfit: statsTotal,
      totalInvestment: statsRecords.reduce(
        (sum, record) => sum + recordInvestmentValue(record),
        0,
      ),
      totalRecovery: statsRecords.reduce(
        (sum, record) => sum + recordRecoveryValue(record),
        0,
      ),
      winCount: statsResults.filter((value) => value > 0).length,
      winRate: statsCount
        ? (statsResults.filter((value) => value > 0).length / statsCount) * 100
        : 0,
    };
    let runningTotal = 0;
    let runningExpectedTotal = 0;
    const linePoints = points
      .map<ChartPlotPoint>((point) => {
        runningTotal += isTrend ? point.value : 0;
        runningExpectedTotal += isTrend ? point.expectedValue : 0;
        return {
          ...point,
          plotValue: isTrend ? runningTotal : point.value,
          expectedPlotValue: isTrend ? runningExpectedTotal : point.expectedValue,
        };
      })
      .filter((point) => isTrend || point.count > 0);
    const plotValues = linePoints.flatMap((point) =>
      isTrend
        ? [point.plotValue, point.expectedPlotValue, point.value]
        : [point.plotValue, point.expectedPlotValue],
    );
    const rawMin = Math.min(0, ...plotValues);
    const rawMax = Math.max(0, ...plotValues);
    const rangePadding = rawMin === rawMax ? 1000 : (rawMax - rawMin) * 0.12;
    const plotMin = rawMin - rangePadding;
    const plotMax = rawMax + rangePadding;
    const barValues = linePoints.flatMap((point) => [point.value, point.expectedValue]);
    const barMin = Math.min(0, ...barValues);
    const barMax = Math.max(0, ...barValues);

    return {
      activePoints,
      barMax,
      barMin,
      count,
      expectedTotal,
      isTrend,
      linePoints,
      plotMax,
      plotMin,
      points,
      stats,
      title: chartTitle,
      total,
    };
  }, [chartMode, currentMonth, records]);
  const chartGeometry = useMemo(() => {
    const innerWidth = chartSvgWidth - chartPadding.left - chartPadding.right;
    const innerHeight = chartSvgHeight - chartPadding.top - chartPadding.bottom;
    const range = chartData.plotMax - chartData.plotMin || 1;
    const toY = (value: number) =>
      chartPadding.top + ((chartData.plotMax - value) / range) * innerHeight;
    const coordinates = chartData.linePoints.map((point, index) => {
      const x =
        chartData.linePoints.length <= 1
          ? chartPadding.left + innerWidth / 2
          : chartPadding.left + (innerWidth / (chartData.linePoints.length - 1)) * index;
      return {
        ...point,
        expectedY: toY(point.expectedPlotValue),
        x,
        y: toY(point.plotValue),
      };
    });
    const guideCoordinates = coordinates.filter((point) => {
      const pointNumber = Number(point.label.replace(/\D/g, ""));
      if (chartMode === "month") {
        return [10, 20, 30].includes(pointNumber);
      }
      if (chartMode === "year") {
        return [3, 6, 9, 12].includes(pointNumber);
      }
      return false;
    });
    const linePath = chartPointPath(coordinates);
    const expectedLinePath = chartPointPath(
      coordinates.map((point) => ({
        ...point,
        y: point.expectedY,
      })),
    );
    const zeroY = toY(0);
    const step =
      coordinates.length > 1 ? innerWidth / (coordinates.length - 1) : innerWidth;
    const barWidth = Math.min(16, Math.max(4, step * 0.46));
    const barCoordinates = coordinates.map((point) => {
      const valueY = toY(point.value);
      const isEven = point.value === 0;
      const height = isEven ? 2 : Math.abs(valueY - zeroY);
      const y = isEven ? zeroY - 1 : Math.min(valueY, zeroY);
      const minX = chartPadding.left;
      const maxX = chartSvgWidth - chartPadding.right - barWidth;
      const x = Math.min(maxX, Math.max(minX, point.x - barWidth / 2));

      return {
        ...point,
        barHeight: height,
        barWidth,
        barX: x,
        barY: y,
      };
    });
    const areaPath =
      coordinates.length > 0
        ? `${linePath} L ${coordinates[coordinates.length - 1].x} ${zeroY} L ${coordinates[0].x} ${zeroY} Z`
        : "";

    return {
      areaPath,
      barCoordinates,
      coordinates,
      expectedLinePath,
      guideCoordinates,
      linePath,
      zeroY,
    };
  }, [chartData, chartMode]);
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
  const storeInfoList = useMemo<StoreInfo[]>(() => {
    const registeredStoreSet = new Set(storeOptions);
    const favoriteStoreSet = new Set(favoriteStores);
    const monthPrefix = `${currentMonth.getFullYear()}-${pad(currentMonth.getMonth() + 1)}-`;
    const storeNames = Array.from(
      new Set(
        [
          ...storeOptions,
          ...records.map((record) => record.storeName),
          ...rateOptions.map((rate) => rate.storeName),
          ...favoriteStores,
        ]
          .map((name) => name.trim())
          .filter(Boolean),
      ),
    ).sort((left, right) => left.localeCompare(right, "ja"));

    return storeNames.map((storeName) => {
      const storeRecords = records
        .filter((record) => record.storeName === storeName)
        .sort((left, right) =>
          `${right.date} ${right.startTime}`.localeCompare(`${left.date} ${left.startTime}`),
        );
      const storeRates = rateOptions.filter((rate) => rate.storeName === storeName);
      const monthStoreRecords = storeRecords.filter((record) => record.date.startsWith(monthPrefix));
      const savedRates = storeRates.filter((rate) => rate.savedCount !== 0);
      const visibleSavedRates = (savedRates.length > 0 ? savedRates : storeRates).slice(0, 3);
      const savedText =
        visibleSavedRates.length > 0
          ? visibleSavedRates.map((rate) => storeSavedSummaryText(rate)).join(" / ")
          : "貯玉なし";
      const machineGroups = new Map<string, PlayRecord[]>();
      storeRecords.forEach((record) => {
        if (!record.machineName) {
          return;
        }
        machineGroups.set(record.machineName, [...(machineGroups.get(record.machineName) ?? []), record]);
      });
      const machines = Array.from(machineGroups.entries())
        .map<StoreMachineSummary>(([machineName, machineRecords]) => ({
          name: machineName,
          count: machineRecords.length,
          profit: recordsProfit(machineRecords),
          expectedValue: recordsExpectedValue(machineRecords),
          lastDate: machineRecords
            .map((record) => record.date)
            .sort((left, right) => right.localeCompare(left))[0],
        }))
        .sort((left, right) => right.lastDate.localeCompare(left.lastDate) || right.count - left.count);

      return {
        name: storeName,
        isFavorite: favoriteStoreSet.has(storeName),
        isRegistered: registeredStoreSet.has(storeName),
        records: storeRecords,
        rates: storeRates,
        monthProfit: recordsProfit(monthStoreRecords),
        totalProfit: recordsProfit(storeRecords),
        totalExpectedValue: recordsExpectedValue(storeRecords),
        totalHours: storeRecords.reduce(
          (total, record) => total + durationHours(record.startTime, record.endTime),
          0,
        ),
        lastDate: storeRecords[0]?.date ?? "",
        savedText,
        machines,
      };
    });
  }, [currentMonth, favoriteStores, rateOptions, records]);
  const filteredStoreInfoList = useMemo(() => {
    const query = normalizeOptionText(storeQuery);
    const byTab = storeInfoList.filter((store) => {
      if (storeTab === "favorite") {
        return store.isFavorite;
      }
      if (storeTab === "registered") {
        return store.isRegistered;
      }
      return !store.isRegistered;
    });
    const byQuery = query
      ? byTab.filter((store) => normalizeOptionText(store.name).includes(query))
      : byTab;

    return byQuery.sort((left, right) => {
      const leftHasData = left.records.length > 0 || left.rates.length > 0 || left.isFavorite;
      const rightHasData = right.records.length > 0 || right.rates.length > 0 || right.isFavorite;

      if (leftHasData !== rightHasData) {
        return leftHasData ? -1 : 1;
      }

      return left.name.localeCompare(right.name, "ja");
    });
  }, [storeInfoList, storeQuery, storeTab]);
  const selectedStoreInfo = useMemo(
    () => storeInfoList.find((store) => store.name === selectedStoreInfoName) ?? null,
    [selectedStoreInfoName, storeInfoList],
  );
  const machineInfoList = useMemo(() => {
    const grouped = new Map<string, PlayRecord[]>();
    records.forEach((record) => {
      if (!record.machineName) {
        return;
      }
      grouped.set(record.machineName, [...(grouped.get(record.machineName) ?? []), record]);
    });

    return Array.from(grouped.entries())
      .map(([machineName, machineRecords]) => ({
        count: machineRecords.length,
        expectedValue: recordsExpectedValue(machineRecords),
        lastDate: machineRecords
          .map((record) => record.date)
          .sort((left, right) => right.localeCompare(left))[0],
        name: machineName,
        profit: recordsProfit(machineRecords),
        storeCount: new Set(machineRecords.map((record) => record.storeName)).size,
      }))
      .sort((left, right) => right.lastDate.localeCompare(left.lastDate) || right.count - left.count);
  }, [records]);
  const storeSavedTotals = useMemo(() => {
    const activeRates = rateOptions.filter((rate) => rate.savedCount !== 0);
    return {
      pachinkoCount: activeRates
        .filter((rate) => rate.kind === "pachinko")
        .reduce((total, rate) => total + rate.savedCount, 0),
      rateCount: activeRates.length,
      slotCount: activeRates
        .filter((rate) => rate.kind === "slot")
        .reduce((total, rate) => total + rate.savedCount, 0),
      storeCount: new Set(activeRates.map((rate) => rate.storeName)).size,
      yenValue: Math.round(
        activeRates.reduce((total, rate) => total + rate.savedCount * rateUnitValue(rate), 0),
      ),
    };
  }, [rateOptions]);
  const bulkStoreOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...records.map((record) => record.storeName),
            ...rateOptions.map((rate) => rate.storeName),
          ]
            .map((storeName) => storeName.trim())
            .filter(Boolean),
        ),
      ).sort((left, right) => left.localeCompare(right, "ja")),
    [rateOptions, records],
  );
  const bulkStoreRates = useMemo(
    () => rateOptions.filter((rate) => rate.storeName === bulkStoreName),
    [bulkStoreName, rateOptions],
  );
  const bulkPachinkoRates = useMemo(
    () => bulkStoreRates.filter((rate) => rate.kind === "pachinko"),
    [bulkStoreRates],
  );
  const bulkSlotRates = useMemo(
    () => bulkStoreRates.filter((rate) => rate.kind === "slot"),
    [bulkStoreRates],
  );
  const bulkPachinkoTargetCount = useMemo(
    () =>
      records.filter(
        (record) => record.storeName === bulkStoreName && record.rateKind === "pachinko",
      ).length,
    [bulkStoreName, records],
  );
  const bulkSlotTargetCount = useMemo(
    () =>
      records.filter(
        (record) => record.storeName === bulkStoreName && record.rateKind === "slot",
      ).length,
    [bulkStoreName, records],
  );
  const bulkPachinkoRate = useMemo(
    () => bulkPachinkoRates.find((rate) => rate.id === bulkPachinkoRateId) ?? null,
    [bulkPachinkoRateId, bulkPachinkoRates],
  );
  const bulkSlotRate = useMemo(
    () => bulkSlotRates.find((rate) => rate.id === bulkSlotRateId) ?? null,
    [bulkSlotRateId, bulkSlotRates],
  );
  const bulkEditableCount =
    (bulkPachinkoRate ? bulkPachinkoTargetCount : 0) + (bulkSlotRate ? bulkSlotTargetCount : 0);
  const canBulkApply = Boolean(bulkStoreName && bulkEditableCount > 0);
  const editingRecord = useMemo(
    () => records.find((record) => record.id === editingRecordId) ?? null,
    [editingRecordId, records],
  );
  const formSavedUnitKind = selectedRate?.kind ?? editingRecord?.rateKind;
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

  function openEditorForStore(storeName: string) {
    const isFirstRecordForDay = !records.some((record) => record.date === selectedDate);
    setViewMode("home");
    setEditingRecordId(null);
    setForm({
      ...createForm(selectedDate, isFirstRecordForDay),
      storeName,
    });
    setIsEditorOpen(true);
  }

  function openRecordEditor(record: PlayRecord) {
    setSelectedDate(record.date);
    setEditingRecordId(record.id);
    setForm(createFormFromRecord(record));
    setIsEditorOpen(true);
  }

  function openRecordEditorFromStore(record: PlayRecord) {
    setViewMode("home");
    openRecordEditor(record);
  }

  function changeMainTab(nextMode: ViewMode) {
    if (nextMode !== "stores") {
      setSelectedStoreInfoName(null);
      setStoreMessage("");
    }
    setViewMode(nextMode);
  }

  function selectStoreInfo(storeName: string) {
    setSelectedStoreInfoName(storeName);
    setStoreMessage("");
  }

  function closeStoreDetail() {
    setSelectedStoreInfoName(null);
    setStoreMessage("");
  }

  function closeEditor() {
    setIsEditorOpen(false);
    setEditingRecordId(null);
    setSelectorField(null);
    setSelectorQuery("");
    setIsRateSelectorOpen(false);
    setIsRateEditorOpen(false);
    setEditingRateId(null);
    setRateEditorStoreName(null);
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
    setRateEditorStoreName(null);
  }

  function closeRateEditor() {
    setIsRateEditorOpen(false);
    setEditingRateId(null);
    setRateEditorStoreName(null);
  }

  function openBulkEditor() {
    const selectedStore = selectedRecords[0]?.storeName;
    const nextStore =
      bulkStoreName && bulkStoreOptions.includes(bulkStoreName)
        ? bulkStoreName
        : selectedStore && bulkStoreOptions.includes(selectedStore)
          ? selectedStore
          : bulkStoreOptions[0] ?? "";

    setBulkStoreName(nextStore);
    setBulkPachinkoRateId("");
    setBulkSlotRateId("");
    setBulkMessage("");
    setIsBulkEditorOpen(true);
  }

  function closeBulkEditor() {
    setIsBulkEditorOpen(false);
    setBulkMessage("");
  }

  function updateBulkStore(value: string) {
    setBulkStoreName(value);
    setBulkPachinkoRateId("");
    setBulkSlotRateId("");
    setBulkMessage("");
  }

  function openRateEditor(kind: RateKind, storeName = form.storeName) {
    setRateForm(createRateForm(kind));
    setEditingRateId(null);
    setRateEditorStoreName(storeName.trim() || null);
    setIsRateEditorOpen(true);
  }

  function openRateEdit(rate: RateOption) {
    setRateForm(createRateFormFromRate(rate));
    setEditingRateId(rate.id);
    setRateEditorStoreName(rate.storeName);
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

  function updateRateSavedCounts(adjustments: Map<string, number>) {
    const activeAdjustments = Array.from(adjustments.entries()).filter(([, amount]) => amount !== 0);
    if (activeAdjustments.length === 0) {
      return;
    }

    const adjustmentMap = new Map(activeAdjustments);
    setRateOptions((current) => {
      let changed = false;
      const nextOptions = current.map((rate) => {
        const amount = adjustmentMap.get(rate.id) ?? 0;
        if (amount === 0) {
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

  function updateRateSavedCount(rateId: string | undefined, amount: number) {
    if (!rateId || amount === 0) {
      return;
    }

    updateRateSavedCounts(new Map([[rateId, amount]]));
  }

  function updateRateSavedCountDirect(rate: RateOption) {
    const nextSavedCount = toNumber(savedCountDrafts[rate.id] ?? String(rate.savedCount));
    setRateOptions((current) => {
      const nextOptions = current.map((item) =>
        item.id === rate.id ? { ...item, savedCount: nextSavedCount } : item,
      );
      saveRateOptions(nextOptions);
      return nextOptions;
    });
    setSavedCountDrafts((current) => {
      const { [rate.id]: _removed, ...rest } = current;
      return rest;
    });
    setStoreMessage(`${rate.name}の貯玉を${plainSavedCount(nextSavedCount, rate.kind)}に更新しました。`);
  }

  function handleRateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const storeName = (rateEditorStoreName ?? form.storeName).trim();
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
      setStoreMessage(`${storeName}の${nextRate.name}を更新しました。`);
      closeRateEditor();
      return;
    }

    const nextOptions = [...rateOptions, nextRate];
    setRateOptions(nextOptions);
    saveRateOptions(nextOptions);
    if (isRateSelectorOpen) {
      setForm((current) => ({
        ...current,
        rateId: nextRate.id,
        rateName: nextRate.name,
      }));
      closeRateSelector();
    } else {
      setStoreMessage(`${storeName}に${nextRate.name}を追加しました。`);
      closeRateEditor();
    }
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

  function toggleStoreFavorite(storeName: string) {
    setFavoriteStores((current) => {
      const next = updateFavoriteList(current, storeName);
      saveStringList(favoriteStoreKey, next);
      return next;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const storeName = form.storeName.trim();
    const machineName = form.machineName.trim();

    if (!storeName || !machineName || (!selectedRate && !editingRecord)) {
      return;
    }

    const rateSnapshot = selectedRate
      ? createRateSnapshot(selectedRate, selectedRateSavedBefore ?? selectedRate.savedCount)
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

  function handleBulkSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canBulkApply) {
      setBulkMessage("対象になる記録がありません。");
      return;
    }

    const adjustments = new Map<string, number>();
    let pachinkoCount = 0;
    let slotCount = 0;

    const addAdjustment = (rateId: string | undefined, amount: number) => {
      if (!rateId || amount === 0) {
        return;
      }

      adjustments.set(rateId, (adjustments.get(rateId) ?? 0) + amount);
    };

    const nextRecords = records.map((record) => {
      if (record.storeName !== bulkStoreName) {
        return record;
      }

      const nextRate =
        record.rateKind === "pachinko"
          ? bulkPachinkoRate
          : record.rateKind === "slot"
            ? bulkSlotRate
            : null;

      if (!nextRate) {
        return record;
      }

      const savedDifference = savedProfit(record);
      addAdjustment(record.rateId, -savedDifference);
      addAdjustment(nextRate.id, savedDifference);

      if (nextRate.kind === "pachinko") {
        pachinkoCount += 1;
      } else {
        slotCount += 1;
      }

      return {
        ...record,
        ...createRateSnapshot(nextRate),
      };
    });

    const changedCount = pachinkoCount + slotCount;
    if (changedCount === 0) {
      setBulkMessage("対象になる記録がありません。");
      return;
    }

    setRecords(nextRecords);
    saveRecords(nextRecords);
    updateRateSavedCounts(adjustments);
    setCsvMessage(
      `${bulkStoreName}の過去記録を${changedCount}件更新しました。パチンコ${pachinkoCount}件、スロット${slotCount}件です。`,
    );
    closeBulkEditor();
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

  function renderRateEditorDialog() {
    return (
      <div className="option-backdrop rate-editor-backdrop">
        <section className="option-sheet rate-editor-sheet" aria-label="レート設定">
          <header className="option-header">
            <div>
              <p className="eyebrow">設定</p>
              <h2>{editingRateId ? "レート編集" : "レート設定"}</h2>
            </div>
            <button className="icon-button" type="button" onClick={closeRateEditor} title="閉じる">
              <X size={20} />
            </button>
          </header>

          <form className="record-form" onSubmit={handleRateSubmit}>
            {rateEditorStoreName && (
              <p className="rate-target-store">{rateEditorStoreName}</p>
            )}

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
                {rateSavedUnitLabel(rateForm.kind)} / 再プレイ {rateForm.replayFeePercent || 0}%
              </p>
            </div>

            <button className="save-button" type="submit">
              {editingRateId ? "更新" : "設定完了"}
            </button>
          </form>
        </section>
      </div>
    );
  }

  function renderBottomNav() {
    const tabs = [
      {
        key: "home",
        label: `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月`,
        icon: <CalendarDays size={19} />,
      },
      { key: "analysis", label: "収支分析", icon: <BarChart3 size={19} /> },
      { key: "stores", label: "店舗情報", icon: <Building2 size={19} /> },
      { key: "machines", label: "機種情報", icon: <Gamepad2 size={19} /> },
      { key: "other", label: "その他", icon: <Settings size={19} /> },
    ];

    return (
      <nav className="bottom-tabs" aria-label="画面切り替え">
        {tabs.map((tab) => (
          <button
            className={`bottom-tab ${viewMode === tab.key ? "is-active" : ""}`}
            key={tab.key}
            type="button"
            onClick={() => changeMainTab(tab.key as ViewMode)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    );
  }

  if (viewMode === "stores") {
    const tabCounts = {
      favorite: storeInfoList.filter((store) => store.isFavorite).length,
      registered: storeInfoList.filter((store) => store.isRegistered).length,
      custom: storeInfoList.filter((store) => !store.isRegistered).length,
    };

    return (
      <main className="app-shell">
        <section className="phone-frame store-frame">
          <header className="top-bar">
            {selectedStoreInfo ? (
              <button className="icon-button" type="button" onClick={closeStoreDetail} title="一覧へ戻る">
                <ChevronLeft size={20} />
              </button>
            ) : (
              <div className="top-spacer" />
            )}
            <div>
              <p className="eyebrow">店舗情報</p>
              <h1>{selectedStoreInfo ? selectedStoreInfo.name : "店舗一覧"}</h1>
            </div>
            <div className="top-spacer" />
          </header>

          {selectedStoreInfo ? (
            <div className="store-detail">
              <button className="text-button store-back-button" type="button" onClick={closeStoreDetail}>
                <ChevronLeft size={18} />
                一覧へ戻る
              </button>

              <section className="store-summary-panel">
                <div className="store-summary-head">
                  <div>
                    <p className="eyebrow">{selectedStoreInfo.isRegistered ? "登録店舗" : "自登録店舗"}</p>
                    <h2>{selectedStoreInfo.name}</h2>
                  </div>
                  <button
                    className={`favorite-button ${selectedStoreInfo.isFavorite ? "is-active" : ""}`}
                    type="button"
                    onClick={() => toggleStoreFavorite(selectedStoreInfo.name)}
                    title={selectedStoreInfo.isFavorite ? "お気に入りから外す" : "お気に入りに追加"}
                    aria-label={`${selectedStoreInfo.name}を${
                      selectedStoreInfo.isFavorite ? "お気に入りから外す" : "お気に入りに追加"
                    }`}
                  >
                    <Star size={20} />
                  </button>
                </div>

                <dl className="store-summary-grid">
                  <div>
                    <dt>{monthLabel(currentMonth)}収支</dt>
                    <dd className={classForAmount(selectedStoreInfo.monthProfit)}>
                      {signedCurrency(selectedStoreInfo.monthProfit)}
                    </dd>
                  </div>
                  <div>
                    <dt>累計収支</dt>
                    <dd className={classForAmount(selectedStoreInfo.totalProfit)}>
                      {signedCurrency(selectedStoreInfo.totalProfit)}
                    </dd>
                  </div>
                  <div>
                    <dt>貯玉</dt>
                    <dd>{selectedStoreInfo.savedText}</dd>
                  </div>
                  <div>
                    <dt>最終稼働日</dt>
                    <dd>{selectedStoreInfo.lastDate || "記録なし"}</dd>
                  </div>
                  <div>
                    <dt>稼働件数</dt>
                    <dd>{selectedStoreInfo.records.length}件</dd>
                  </div>
                  <div>
                    <dt>稼働時間</dt>
                    <dd>{selectedStoreInfo.totalHours.toFixed(1)}時間</dd>
                  </div>
                </dl>
              </section>

              <section className="store-action-panel">
                <button className="text-button" type="button" onClick={() => openEditorForStore(selectedStoreInfo.name)}>
                  <Pencil size={18} />
                  収支を入力
                </button>
              </section>

              {storeMessage && <p className="store-message">{storeMessage}</p>}

              <section className="store-section">
                <header className="store-section-head">
                  <div>
                    <p className="eyebrow">レート・貯玉</p>
                    <h2>レートと現在の貯玉</h2>
                  </div>
                </header>

                <div className="store-rate-actions">
                  <button className="text-button" type="button" onClick={() => openRateEditor("pachinko", selectedStoreInfo.name)}>
                    <Plus size={18} />
                    パチンコのレート追加
                  </button>
                  <button className="text-button" type="button" onClick={() => openRateEditor("slot", selectedStoreInfo.name)}>
                    <Plus size={18} />
                    スロットのレート追加
                  </button>
                </div>

                <div className="store-rate-list">
                  {selectedStoreInfo.rates.length === 0 ? (
                    <div className="empty-state">
                      <p>この店舗のレートはまだありません。</p>
                    </div>
                  ) : (
                    selectedStoreInfo.rates.map((rate) => (
                      <article className="store-rate-card" key={rate.id}>
                        <div className="store-rate-head">
                          <div>
                            <strong>{rate.name}</strong>
                            <small>{rateSummary(rate)}</small>
                          </div>
                          <div className="store-rate-buttons">
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
                        </div>

                        <div className="store-saved-row">
                          <label>
                            現在の貯玉
                            <input
                              inputMode="numeric"
                              min="0"
                              type="number"
                              value={savedCountDrafts[rate.id] ?? String(rate.savedCount)}
                              onChange={(event) =>
                                setSavedCountDrafts((current) => ({
                                  ...current,
                                  [rate.id]: event.target.value,
                                }))
                              }
                            />
                          </label>
                          <button className="text-button" type="button" onClick={() => updateRateSavedCountDirect(rate)}>
                            <Check size={18} />
                            保存
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>

              <section className="store-section">
                <header className="store-section-head">
                  <div>
                    <p className="eyebrow">設置機種</p>
                    <h2>この店舗で打った機種</h2>
                  </div>
                </header>

                <div className="store-machine-list">
                  {selectedStoreInfo.machines.length === 0 ? (
                    <div className="empty-state">
                      <p>この店舗で打った機種はまだありません。</p>
                    </div>
                  ) : (
                    selectedStoreInfo.machines.map((machine) => (
                      <article className="store-machine-row" key={machine.name}>
                        <div>
                          <strong>{machine.name}</strong>
                          <span>
                            {machine.count}件 / 最終 {machine.lastDate}
                          </span>
                        </div>
                        <div>
                          <strong className={classForAmount(machine.profit)}>
                            {signedCurrency(machine.profit)}
                          </strong>
                          <span className={classForAmount(machine.expectedValue)}>
                            期待値 {signedCurrency(machine.expectedValue)}
                          </span>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>

              <section className="store-section">
                <header className="store-section-head">
                  <div>
                    <p className="eyebrow">過去記録</p>
                    <h2>この店舗の稼働</h2>
                  </div>
                </header>

                <div className="store-record-list">
                  {selectedStoreInfo.records.length === 0 ? (
                    <div className="empty-state">
                      <p>この店舗の稼働記録はまだありません。</p>
                    </div>
                  ) : (
                    selectedStoreInfo.records.slice(0, 30).map((record) => (
                      <button
                        className="store-record-row"
                        key={record.id}
                        type="button"
                        onClick={() => openRecordEditorFromStore(record)}
                      >
                        <span>
                          <strong>{record.machineName}</strong>
                          <small>
                            {record.date} {record.startTime} - {record.endTime}
                            {record.rateName ? ` / ${record.rateName}` : ""}
                          </small>
                        </span>
                        <strong className={classForAmount(profit(record))}>
                          {signedCurrency(profit(record))}
                        </strong>
                      </button>
                    ))
                  )}
                </div>
              </section>

              <section className="store-section">
                <header className="store-section-head">
                  <div>
                    <p className="eyebrow">イベント</p>
                    <h2>イベント一覧</h2>
                  </div>
                </header>
                <div className="empty-state">
                  <p>イベント情報は今後追加予定です。</p>
                </div>
              </section>
            </div>
          ) : (
            <>
              <section className="store-total-panel">
                <header className="store-total-head">
                  <div>
                    <p className="eyebrow">全店舗合計</p>
                    <h2>全店舗合計の貯玉</h2>
                  </div>
                  <strong className={classForAmount(storeSavedTotals.yenValue)}>
                    {currency(storeSavedTotals.yenValue)}
                  </strong>
                </header>
                <dl className="store-total-grid">
                  <div>
                    <dt>パチンコ</dt>
                    <dd>{plainSavedCount(storeSavedTotals.pachinkoCount, "pachinko")}</dd>
                  </div>
                  <div>
                    <dt>スロット</dt>
                    <dd>{plainSavedCount(storeSavedTotals.slotCount, "slot")}</dd>
                  </div>
                  <div>
                    <dt>対象店舗</dt>
                    <dd>{storeSavedTotals.storeCount}店舗</dd>
                  </div>
                  <div>
                    <dt>対象レート</dt>
                    <dd>{storeSavedTotals.rateCount}件</dd>
                  </div>
                </dl>
              </section>

              <div className="store-tabs" aria-label="店舗の分類">
                {storeTabs.map((tab) => (
                  <button
                    className={`chart-tab ${storeTab === tab.key ? "is-active" : ""}`}
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setStoreTab(tab.key);
                      setStoreMessage("");
                    }}
                  >
                    {tab.label}
                    <span>{tabCounts[tab.key]}</span>
                  </button>
                ))}
              </div>

              <label className="store-search">
                <Search size={18} />
                <input
                  value={storeQuery}
                  onChange={(event) => setStoreQuery(event.target.value)}
                  placeholder="店舗を検索"
                />
              </label>

              <section className="store-list">
                {filteredStoreInfoList.length === 0 ? (
                  <div className="empty-state">
                    <p>表示できる店舗がありません。</p>
                  </div>
                ) : (
                  filteredStoreInfoList.map((store) => (
                    <article className="store-card" key={store.name}>
                      <button
                        className="store-card-main"
                        type="button"
                        onClick={() => selectStoreInfo(store.name)}
                      >
                        <div className="store-card-head">
                          <div>
                            <h2>{store.name}</h2>
                          </div>
                          <ChevronRight size={18} />
                        </div>
                        <dl className="store-card-stats">
                          <div>
                            <dt>{monthLabel(currentMonth)}</dt>
                            <dd className={classForAmount(store.monthProfit)}>
                              {signedCurrency(store.monthProfit)}
                            </dd>
                          </div>
                          <div>
                            <dt>累計</dt>
                            <dd className={classForAmount(store.totalProfit)}>
                              {signedCurrency(store.totalProfit)}
                            </dd>
                          </div>
                          <div>
                            <dt>累計期待値</dt>
                            <dd className={classForAmount(store.totalExpectedValue)}>
                              {signedCurrency(store.totalExpectedValue)}
                            </dd>
                          </div>
                          <div>
                            <dt>貯玉</dt>
                            <dd>{store.savedText}</dd>
                          </div>
                          <div>
                            <dt>最終</dt>
                            <dd>{store.lastDate || "記録なし"}</dd>
                          </div>
                        </dl>
                        <p className="store-card-foot">
                          {store.records.length}件 / {store.totalHours.toFixed(1)}時間
                        </p>
                      </button>
                      <button
                        className={`favorite-button store-favorite-button ${store.isFavorite ? "is-active" : ""}`}
                        type="button"
                        onClick={() => toggleStoreFavorite(store.name)}
                        title={store.isFavorite ? "お気に入りから外す" : "お気に入りに追加"}
                        aria-label={`${store.name}を${store.isFavorite ? "お気に入りから外す" : "お気に入りに追加"}`}
                      >
                        <Star size={19} />
                      </button>
                    </article>
                  ))
                )}
              </section>
            </>
          )}

          {isRateEditorOpen && renderRateEditorDialog()}
          {renderBottomNav()}
        </section>
      </main>
    );
  }

  function renderChartScorePanel() {
    return (
      <section className="chart-score-panel">
        <header className="chart-score-head">
          <h3>{chartData.stats.title}</h3>
          <strong className={classForAmount(chartData.stats.totalProfit)}>
            {signedCurrency(chartData.stats.totalProfit).replace("円", "")}
          </strong>
        </header>
        <div className="chart-score-grid">
          <div>
            <span>回数</span>
            <strong>{chartData.stats.count}回</strong>
          </div>
          <div>
            <span>投資合計</span>
            <strong>{currency(chartData.stats.totalInvestment)}</strong>
          </div>
          <div>
            <span>勝数</span>
            <strong>{chartData.stats.winCount}回</strong>
          </div>
          <div>
            <span>回収合計</span>
            <strong>{currency(chartData.stats.totalRecovery)}</strong>
          </div>
          <div>
            <span>負数</span>
            <strong>{chartData.stats.loseCount}回</strong>
          </div>
          <div>
            <span>平均額</span>
            <strong className={classForAmount(chartData.stats.averageProfit)}>
              {signedCurrency(Math.round(chartData.stats.averageProfit))}
            </strong>
          </div>
          <div>
            <span>引分</span>
            <strong>{chartData.stats.drawCount}回</strong>
          </div>
          <div>
            <span>最高投資</span>
            <strong>{currency(chartData.stats.maxInvestment)}</strong>
          </div>
          <div>
            <span>勝率</span>
            <strong>{chartData.stats.winRate.toFixed(1)}%</strong>
          </div>
          <div>
            <span>最高回収</span>
            <strong>{currency(chartData.stats.maxRecovery)}</strong>
          </div>
          <div>
            <span>時間</span>
            <strong>{chartData.stats.hours.toFixed(1)}時間</strong>
          </div>
          <div>
            <span>時給</span>
            <strong className={classForAmount(chartData.stats.hourlyProfit)}>
              {signedCurrency(Math.round(chartData.stats.hourlyProfit))}
            </strong>
          </div>
          <div>
            <span>貯玉合計</span>
            <strong className={classForAmount(chartData.stats.savedProfit)}>
              {savedCount(chartData.stats.savedProfit, chartData.stats.savedUnitKind)}
            </strong>
          </div>
          <div>
            <span>貯玉換算</span>
            <strong className={classForAmount(chartData.stats.savedValue)}>
              {signedCurrency(chartData.stats.savedValue)}
            </strong>
          </div>
          <div>
            <span>期待値勝数</span>
            <strong>{chartData.stats.expectedWinCount}回</strong>
          </div>
          <div>
            <span>期待値入力</span>
            <strong>{chartData.stats.expectedInputCount}回</strong>
          </div>
          <div>
            <span>期待値負数</span>
            <strong>{chartData.stats.expectedLoseCount}回</strong>
          </div>
          <div>
            <span>期待値合計</span>
            <strong className={classForAmount(chartData.stats.expectedTotal)}>
              {signedCurrency(chartData.stats.expectedTotal)}
            </strong>
          </div>
          <div>
            <span>期待値引分</span>
            <strong>{chartData.stats.expectedDrawCount}回</strong>
          </div>
          <div>
            <span>期待値平均</span>
            <strong className={classForAmount(chartData.stats.expectedAverage)}>
              {signedCurrency(Math.round(chartData.stats.expectedAverage))}
            </strong>
          </div>
        </div>
      </section>
    );
  }

  if (viewMode === "updates") {
    return (
      <main className="app-shell">
        <section className="phone-frame">
          <header className="top-bar">
            <button className="icon-button" type="button" onClick={() => setViewMode("other")} title="戻る">
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
      <section className="phone-frame dashboard-frame">
        {viewMode === "home" && (
        <div className="dashboard-left">
          <header className="top-bar">
            <div>
              <p className="eyebrow">shushi</p>
              <h1>収支管理</h1>
            </div>
            <button
              aria-label="収支を入力"
              className="icon-button primary"
              type="button"
              onClick={() => openEditor()}
              title="収支を入力"
            >
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
                        {signedPlainAmount(dayProfit)}
                      </small>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
        )}

        <div className="dashboard-right">
        {viewMode === "machines" && (
          <header className="top-bar">
            <div>
              <p className="eyebrow">機種情報</p>
              <h1>機種一覧</h1>
            </div>
            <div className="top-spacer" />
          </header>
        )}

        {viewMode === "other" && (
          <header className="top-bar">
            <div>
              <p className="eyebrow">その他</p>
              <h1>データ操作</h1>
            </div>
            <div className="top-spacer" />
          </header>
        )}

        {viewMode === "home" && (
        <section className="summary-grid">
          <div>
            <span>収支</span>
            <strong className={classForAmount(selectedProfit)}>
              {signedCurrency(selectedProfit)}
            </strong>
          </div>
          <div>
            <span>期待値</span>
            <strong className={classForAmount(selectedExpected)}>
              {signedCurrency(selectedExpected)}
            </strong>
          </div>
          <div>
            <span>貯玉増減</span>
            <strong className={classForAmount(selectedSavedProfit)}>
              {savedCount(selectedSavedProfit, selectedSavedUnitKind)}
            </strong>
          </div>
          <div>
            <span>時間</span>
            <strong>{selectedHours.toFixed(1)}時間</strong>
          </div>
        </section>
        )}

        {viewMode === "analysis" && (
        <section className="chart-panel">
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
            <div className="chart-title-main">
              {chartMode === "month" && (
                <button
                  aria-label="月別グラフを前の月へ"
                  className="chart-month-button"
                  type="button"
                  onClick={() => moveMonth(-1)}
                  title="前の月"
                >
                  <ChevronLeft size={16} />
                </button>
              )}
              <span>{chartData.title}</span>
              {chartMode === "month" && (
                <button
                  aria-label="月別グラフを次の月へ"
                  className="chart-month-button"
                  type="button"
                  onClick={() => moveMonth(1)}
                  title="次の月"
                >
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>

          {chartData.count === 0 ? (
            <>
              <div className="chart-empty">表示できる記録がありません。</div>
              {chartData.isTrend && renderChartScorePanel()}
            </>
          ) : (
            <>
              {chartData.isTrend ? (
                <>
                  <div className="chart-line-wrap">
                    <svg
                      aria-label={`${chartData.title}グラフ`}
                      className="chart-line"
                      role="img"
                      viewBox={`0 0 ${chartSvgWidth} ${chartSvgHeight}`}
                    >
                      <line
                        className="chart-grid-line"
                        x1={chartPadding.left}
                        x2={chartSvgWidth - chartPadding.right}
                        y1={chartPadding.top}
                        y2={chartPadding.top}
                      />
                      <line
                        className="chart-grid-line chart-grid-line-bottom"
                        x1={chartPadding.left}
                        x2={chartSvgWidth - chartPadding.right}
                        y1={chartSvgHeight - chartPadding.bottom}
                        y2={chartSvgHeight - chartPadding.bottom}
                      />
                      {chartGeometry.guideCoordinates.map((point) => (
                        <line
                          className="chart-guide-line"
                          key={`${point.key}-guide`}
                          x1={point.x}
                          x2={point.x}
                          y1={chartPadding.top}
                          y2={chartSvgHeight - chartPadding.bottom}
                        />
                      ))}
                      <line
                        className="chart-zero-line"
                        x1={chartPadding.left}
                        x2={chartSvgWidth - chartPadding.right}
                        y1={chartGeometry.zeroY}
                        y2={chartGeometry.zeroY}
                      />
                      <text
                        className="chart-y-label"
                        textAnchor="end"
                        x={chartSvgWidth - 4}
                        y={chartPadding.top + 4}
                      >
                        {signedCurrency(Math.round(chartData.plotMax))}
                      </text>
                      <text
                        className="chart-y-label chart-zero-label"
                        textAnchor="end"
                        x={chartSvgWidth - 4}
                        y={chartGeometry.zeroY + 4}
                      >
                        0円
                      </text>
                      <text
                        className="chart-y-label"
                        textAnchor="end"
                        x={chartSvgWidth - 4}
                        y={chartSvgHeight - chartPadding.bottom + 4}
                      >
                        {signedCurrency(Math.round(chartData.plotMin))}
                      </text>
                      {chartGeometry.areaPath && (
                        <path className="chart-line-area" d={chartGeometry.areaPath} />
                      )}
                      {chartGeometry.barCoordinates
                        .filter((point) => point.count > 0)
                        .map((point) => (
                          <rect
                            className={`chart-real-bar-column ${classForAmount(point.value)}`}
                            height={point.barHeight}
                            key={`${point.key}-real-bar`}
                            rx={2}
                            width={point.barWidth}
                            x={point.barX}
                            y={point.barY}
                          >
                            <title>
                              {point.label} 実収支 {signedCurrency(point.value)}
                            </title>
                          </rect>
                        ))}
                      {chartGeometry.linePath && (
                        <path className="chart-line-path" d={chartGeometry.linePath} />
                      )}
                      {chartGeometry.expectedLinePath && (
                        <path className="chart-expected-line-path" d={chartGeometry.expectedLinePath} />
                      )}
                      {chartGeometry.coordinates
                        .filter((point) => point.count > 0)
                        .map((point) => (
                          <g key={point.key}>
                            <circle
                              className={`chart-line-dot ${classForAmount(point.value)}`}
                              cx={point.x}
                              cy={point.y}
                              r={2.8}
                            >
                              <title>
                                {point.label} 収支 {signedCurrency(point.plotValue)}
                              </title>
                            </circle>
                            <circle
                              className="chart-expected-dot"
                              cx={point.x}
                              cy={point.expectedY}
                              r={2.4}
                            >
                              <title>
                                {point.label} 期待値 {signedCurrency(point.expectedPlotValue)}
                              </title>
                            </circle>
                          </g>
                        ))}
                    </svg>
                    <div className="chart-axis-labels">
                      {chartGeometry.guideCoordinates.length > 0 ? (
                        chartGeometry.guideCoordinates.map((point) => (
                          <span key={`${point.key}-axis`}>{point.label}</span>
                        ))
                      ) : (
                        <>
                          <span>{chartData.linePoints[0]?.label ?? ""}</span>
                          <span>{chartData.linePoints[chartData.linePoints.length - 1]?.label ?? ""}</span>
                        </>
                      )}
                    </div>
                    <div className="chart-legend chart-legend-compact" aria-label="グラフの凡例">
                      <span>
                        <i className="chart-legend-mark chart-legend-real" />
                        実収支
                      </span>
                      <span>
                        <i className="chart-legend-mark chart-legend-profit" />
                        累計収支
                      </span>
                      <span>
                        <i className="chart-legend-mark chart-legend-expected" />
                        累計期待値
                      </span>
                    </div>
                  </div>

                  {renderChartScorePanel()}

                  <div className="chart-list">
                    {chartData.points.map((point) => {
                      return (
                        <div className="chart-row" key={point.key}>
                          <div className="chart-row-head">
                            <span>{point.label}</span>
                            <strong className={classForAmount(point.value)}>
                              {signedCurrency(point.value)}
                            </strong>
                          </div>
                          <small>
                            期待値
                            <strong className={classForAmount(point.expectedValue)}>
                              {signedCurrency(point.expectedValue)}
                            </strong>
                            / {point.count}件
                          </small>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="chart-horizontal-list" aria-label={`${chartData.title}の横棒グラフ`}>
                  {chartData.points.map((point) => (
                    <div className="chart-horizontal-row" key={point.key}>
                      <div className="chart-horizontal-label">
                        <strong>{point.label}</strong>
                        <span>{point.count}件</span>
                      </div>
                      <div className="chart-horizontal-bars">
                        <div className="chart-horizontal-meter">
                          <span className="chart-horizontal-kind">収支</span>
                          <span className="chart-horizontal-track">
                            <span
                              className="chart-horizontal-zero"
                              style={horizontalZeroStyle(chartData.barMin, chartData.barMax)}
                            />
                            <span
                              className={`chart-horizontal-fill chart-profit-fill ${classForAmount(point.value)}`}
                              style={horizontalBarStyle(point.value, chartData.barMin, chartData.barMax)}
                            />
                          </span>
                          <strong className={`chart-horizontal-amount ${classForAmount(point.value)}`}>
                            {signedCurrency(point.value)}
                          </strong>
                        </div>
                        <div className="chart-horizontal-meter">
                          <span className="chart-horizontal-kind">期待値</span>
                          <span className="chart-horizontal-track">
                            <span
                              className="chart-horizontal-zero"
                              style={horizontalZeroStyle(chartData.barMin, chartData.barMax)}
                            />
                            <span
                              className={`chart-horizontal-fill chart-expected-fill ${classForAmount(point.expectedValue)}`}
                              style={horizontalBarStyle(point.expectedValue, chartData.barMin, chartData.barMax)}
                            />
                          </span>
                          <strong className={`chart-horizontal-amount ${classForAmount(point.expectedValue)}`}>
                            {signedCurrency(point.expectedValue)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
        )}

        {viewMode === "other" && (
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
            <button className="text-button" type="button" onClick={openBulkEditor}>
              <Pencil size={18} />
              一括編集
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
        )}

        {viewMode === "machines" && (
        <section className="store-section">
          <header className="store-section-head">
            <div>
              <p className="eyebrow">機種情報</p>
              <h2>打った機種</h2>
            </div>
          </header>

          <div className="store-machine-list">
            {machineInfoList.length === 0 ? (
              <div className="empty-state">
                <p>機種の記録はまだありません。</p>
              </div>
            ) : (
              machineInfoList.map((machine) => (
                <article className="store-machine-row" key={machine.name}>
                  <div>
                    <strong>{machine.name}</strong>
                    <span>
                      {machine.count}件 / {machine.storeCount}店舗 / 最終 {machine.lastDate}
                    </span>
                  </div>
                  <div>
                    <strong className={classForAmount(machine.profit)}>
                      {signedCurrency(machine.profit)}
                    </strong>
                    <span className={classForAmount(machine.expectedValue)}>
                      期待値 {signedCurrency(machine.expectedValue)}
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
        )}

        {viewMode === "home" && (
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
                    <dd>{plainSavedCount(record.savedInvestment ?? 0, record.rateKind)}</dd>
                  </div>
                  <div>
                    <dt>貯玉回収</dt>
                    <dd>{plainSavedCount(record.savedRecovery ?? 0, record.rateKind)}</dd>
                  </div>
                  <div>
                    <dt>貯玉増減</dt>
                    <dd className={classForAmount(savedProfit(record))}>
                      {savedCount(savedProfit(record), record.rateKind)}
                    </dd>
                  </div>
                  <div>
                    <dt>期待値</dt>
                    <dd className={classForAmount(record.expectedValue)}>
                      {signedCurrency(record.expectedValue)}
                    </dd>
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
        )}

        {viewMode === "other" && (
        <button className="updates-button" type="button" onClick={() => setViewMode("updates")}>
          更新情報を見る
        </button>
        )}
        </div>
        {renderBottomNav()}
      </section>

      {isBulkEditorOpen && (
        <div className="option-backdrop bulk-editor-backdrop">
          <section className="option-sheet bulk-editor-sheet" aria-label="一括編集">
            <header className="option-header">
              <div>
                <p className="eyebrow">一括編集</p>
                <h2>過去記録のレート変更</h2>
              </div>
              <button className="icon-button" type="button" onClick={closeBulkEditor} title="閉じる">
                <X size={20} />
              </button>
            </header>

            {bulkStoreOptions.length === 0 ? (
              <p className="option-empty">一括編集できる店舗がありません。</p>
            ) : (
              <form className="record-form" onSubmit={handleBulkSubmit}>
                <label>
                  店舗
                  <select
                    value={bulkStoreName}
                    onChange={(event) => updateBulkStore(event.target.value)}
                  >
                    {bulkStoreOptions.map((storeName) => (
                      <option key={storeName} value={storeName}>
                        {storeName}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="bulk-rate-card">
                  <div className="bulk-rate-head">
                    <span>パチンコ</span>
                    <strong>{bulkPachinkoTargetCount}件</strong>
                  </div>
                  <div className="bulk-rate-options">
                    <button
                      className={`bulk-rate-option ${bulkPachinkoRateId === "" ? "is-selected" : ""}`}
                      type="button"
                      onClick={() => {
                        setBulkPachinkoRateId("");
                        setBulkMessage("");
                      }}
                      disabled={bulkPachinkoTargetCount === 0}
                    >
                      <span>
                        <strong>変更しない</strong>
                        <small>この店舗のパチンコ記録はそのままにします。</small>
                      </span>
                      {bulkPachinkoRateId === "" && <Check size={18} />}
                    </button>
                    {bulkPachinkoRates.map((rate) => (
                      <button
                        className={`bulk-rate-option ${bulkPachinkoRateId === rate.id ? "is-selected" : ""}`}
                        key={rate.id}
                        type="button"
                        onClick={() => {
                          setBulkPachinkoRateId(rate.id);
                          setBulkMessage("");
                        }}
                        disabled={bulkPachinkoTargetCount === 0}
                      >
                        <span>
                          <strong>{rate.name}</strong>
                          <small>{rateSummary(rate)}</small>
                        </span>
                        {bulkPachinkoRateId === rate.id && <Check size={18} />}
                      </button>
                    ))}
                  </div>
                  <p>
                    {bulkPachinkoRates.length === 0
                      ? "この店舗にパチンコのレートが登録されていません。"
                      : "選んだレートを、この店舗のパチンコ記録へまとめて反映します。"}
                  </p>
                </div>

                <div className="bulk-rate-card">
                  <div className="bulk-rate-head">
                    <span>スロット</span>
                    <strong>{bulkSlotTargetCount}件</strong>
                  </div>
                  <div className="bulk-rate-options">
                    <button
                      className={`bulk-rate-option ${bulkSlotRateId === "" ? "is-selected" : ""}`}
                      type="button"
                      onClick={() => {
                        setBulkSlotRateId("");
                        setBulkMessage("");
                      }}
                      disabled={bulkSlotTargetCount === 0}
                    >
                      <span>
                        <strong>変更しない</strong>
                        <small>この店舗のスロット記録はそのままにします。</small>
                      </span>
                      {bulkSlotRateId === "" && <Check size={18} />}
                    </button>
                    {bulkSlotRates.map((rate) => (
                      <button
                        className={`bulk-rate-option ${bulkSlotRateId === rate.id ? "is-selected" : ""}`}
                        key={rate.id}
                        type="button"
                        onClick={() => {
                          setBulkSlotRateId(rate.id);
                          setBulkMessage("");
                        }}
                        disabled={bulkSlotTargetCount === 0}
                      >
                        <span>
                          <strong>{rate.name}</strong>
                          <small>{rateSummary(rate)}</small>
                        </span>
                        {bulkSlotRateId === rate.id && <Check size={18} />}
                      </button>
                    ))}
                  </div>
                  <p>
                    {bulkSlotRates.length === 0
                      ? "この店舗にスロットのレートが登録されていません。"
                      : "選んだレートを、この店舗のスロット記録へまとめて反映します。"}
                  </p>
                </div>

                <div className="bulk-preview">
                  <span>更新対象</span>
                  <strong>{bulkEditableCount}件</strong>
                  <p>レート区分がない記録は対象外です。貯玉増減は付け替え後のレート残高にも反映します。</p>
                </div>

                {bulkMessage && <p className="bulk-message">{bulkMessage}</p>}

                <button className="save-button" type="submit" disabled={!canBulkApply}>
                  一括更新
                </button>
              </form>
            )}
          </section>
        </div>
      )}

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
                  <span>貯玉増減</span>
                  <strong className={classForAmount(formSavedDifference)}>
                    {savedCount(formSavedDifference, formSavedUnitKind)}
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
                    <strong>{plainSavedCount(selectedRateSavedAfter, formSavedUnitKind)}</strong>
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
                      onClick={closeRateEditor}
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
                        {rateSavedUnitLabel(rateForm.kind)} / 再プレイ {rateForm.replayFeePercent || 0}%
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
