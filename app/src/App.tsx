import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import "./App.css";
import { machineOptions, storeOptions } from "./data/catalog";

type PlayRecord = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  storeName: string;
  machineName: string;
  investment: number;
  recovery: number;
  expectedValue: number;
  note: string;
};

type RecordForm = {
  date: string;
  startTime: string;
  endTime: string;
  storeName: string;
  machineName: string;
  investment: string;
  recovery: string;
  expectedValue: string;
  note: string;
};

type ViewMode = "home" | "updates";

const storageKey = "shushi-play-records";

const updateItems = [
  {
    date: "2026-05-24",
    title: "収支入力の叩き台を追加",
    body: "カレンダー、日別一覧、スマホ向け入力画面、店舗名と機種名の候補を追加しました。",
  },
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

function createForm(date: string): RecordForm {
  return {
    date,
    startTime: "",
    endTime: "",
    storeName: "",
    machineName: "",
    investment: "",
    recovery: "",
    expectedValue: "",
    note: "",
  };
}

function toNumber(value: string) {
  const normalized = value.replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function profit(record: Pick<PlayRecord, "investment" | "recovery">) {
  return record.recovery - record.investment;
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

export function App() {
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [records, setRecords] = useState<PlayRecord[]>(loadRecords);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [form, setForm] = useState<RecordForm>(() => createForm(todayKey()));
  const [viewMode, setViewMode] = useState<ViewMode>("home");

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
  const monthProfit = monthRecords.reduce((total, record) => total + profit(record), 0);

  function moveMonth(amount: number) {
    setCurrentMonth(
      (month) => new Date(month.getFullYear(), month.getMonth() + amount, 1),
    );
  }

  function openEditor(date = selectedDate) {
    setForm(createForm(date));
    setIsEditorOpen(true);
  }

  function updateForm(key: keyof RecordForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const newRecord: PlayRecord = {
      id: crypto.randomUUID(),
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      storeName: form.storeName.trim(),
      machineName: form.machineName.trim(),
      investment: toNumber(form.investment),
      recovery: toNumber(form.recovery),
      expectedValue: toNumber(form.expectedValue),
      note: form.note.trim(),
    };

    const nextRecords = [...records, newRecord];
    setRecords(nextRecords);
    saveRecords(nextRecords);
    setSelectedDate(newRecord.date);
    const [year, month] = newRecord.date.split("-").map(Number);
    setCurrentMonth(new Date(year, month - 1, 1));
    setIsEditorOpen(false);
  }

  function deleteRecord(recordId: string) {
    const nextRecords = records.filter((record) => record.id !== recordId);
    setRecords(nextRecords);
    saveRecords(nextRecords);
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
            <span>時間</span>
            <strong>{selectedHours.toFixed(1)}時間</strong>
          </div>
        </section>

        <section className="record-list">
          {selectedRecords.length === 0 ? (
            <div className="empty-state">
              <p>この日の記録はまだありません。</p>
            </div>
          ) : (
            selectedRecords.map((record) => (
              <article className="record-item" key={record.id}>
                <div className="record-head">
                  <div>
                    <h3>{record.machineName}</h3>
                    <p>{record.storeName}</p>
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
                    <dt>投資</dt>
                    <dd>{currency(record.investment)}</dd>
                  </div>
                  <div>
                    <dt>回収</dt>
                    <dd>{currency(record.recovery)}</dd>
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
                  onClick={() => deleteRecord(record.id)}
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
                <p className="eyebrow">入力</p>
                <h2>稼働記録</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setIsEditorOpen(false)} title="閉じる">
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
                    value={form.startTime}
                    onChange={(event) => updateForm("startTime", event.target.value)}
                  />
                </label>
                <label>
                  終了時刻
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(event) => updateForm("endTime", event.target.value)}
                  />
                </label>
              </div>

              <label>
                店舗
                <input
                  list="store-options"
                  value={form.storeName}
                  onChange={(event) => updateForm("storeName", event.target.value)}
                  placeholder="店舗名を入力"
                  required
                />
              </label>

              <label>
                機種
                <input
                  list="machine-options"
                  value={form.machineName}
                  onChange={(event) => updateForm("machineName", event.target.value)}
                  placeholder="機種名を入力"
                  required
                />
              </label>

              <div className="form-pair">
                <label>
                  投資額
                  <input
                    inputMode="numeric"
                    min="0"
                    type="number"
                    value={form.investment}
                    onChange={(event) => updateForm("investment", event.target.value)}
                    placeholder="0"
                    required
                  />
                </label>
                <label>
                  回収額
                  <input
                    inputMode="numeric"
                    min="0"
                    type="number"
                    value={form.recovery}
                    onChange={(event) => updateForm("recovery", event.target.value)}
                    placeholder="0"
                    required
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

              <div className="live-result">
                <span>収支</span>
                <strong className={classForAmount(toNumber(form.recovery) - toNumber(form.investment))}>
                  {signedCurrency(toNumber(form.recovery) - toNumber(form.investment))}
                </strong>
              </div>

              <button className="save-button" type="submit">
                保存
              </button>
            </form>

            <datalist id="store-options">
              {storeOptions.map((store) => (
                <option key={store} value={store} />
              ))}
            </datalist>
            <datalist id="machine-options">
              {machineOptions.map((machine) => (
                <option key={machine} value={machine} />
              ))}
            </datalist>
          </section>
        </div>
      )}
    </main>
  );
}
