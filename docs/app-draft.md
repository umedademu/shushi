# App Draft Memo

## Current Draft

The first draft focuses on mobile use, while still keeping the layout usable on desktop.

Implemented draft behavior:

- Show a monthly calendar.
- Start with today selected.
- Open the income entry form from the top-right edit icon.
- Save multiple play records for one day.
- Store records in the browser for now.
- Use store names and machine names from the existing halldata data as selectable options.
- Show a simple update information page inside the app.
- Make start and end time inputs use 5-minute steps.
- Set start time to 10:00 for the first record of a day.
- Set end time to the current time when opening the entry form.
- Replace free input for stores and machines with a searchable selection sheet for mobile use.
- Refresh selectable data from halldata to 353 stores and 336 machines.
- Add favorites for stores and machines, saved in the browser and shown first in the selection sheets.
- Add store-specific rate choices for pachinko and slot play.
- Require choosing a rate choice when saving a new play record.
- Edit existing rate choices from the rate selection sheet.
- Save the current saved ball count for each store-specific rate.
- Show exchange rate and saved balls in the play entry rate field.
- Save cash investment and cash recovery separately from saved-ball investment and saved-ball recovery.
- Automatically update the selected rate's saved-ball count when a play record is saved.
- Restore that saved-ball count adjustment when a play record is deleted.
- Export play records as CSV.
- Import CSV files exported from this app or from pRecord.
- Edit a saved play record by selecting its daily record card.
- Estimate saved-ball investment and recovery from pRecord CSV rows when profit and saved-ball difference can determine a rate value.
- Replace existing records for dates that are included in an imported CSV.
- Show profit charts by month, year, lifetime, store, and machine.
- Show saved-ball change as "貯玉増減", and show slot saved counts with the medal unit.
- Show the profit chart as a line chart instead of a bar chart.
- Show store and machine profit charts as horizontal bar lists.
- Keep store and machine chart bars in a separate center area so they do not cover labels or amounts.
- Show expected value together with profit in the charts.
- Show expected value as a second line in line charts and as a second bar in store and machine rows.
- Show expected values with plus/minus signs and amount colors.
- Keep line charts visually light, with thinner lines and points only on days that have records.
- Use the top-right edit icon as the only entry point for adding a play record.
- Remove the duplicated selected-day add card and tighten the desktop layout.
- Show the desktop view as a wider single column.
- Show daily calendar profit in plain yen units with comma separators instead of k units.
- Show selected-day details in the order: summary, play record cards, then profit chart.
- Show positive profit and positive saved-ball changes in blue, while keeping selected calendar day values readable.
- Move the monthly chart to the previous or next month with buttons that stay linked to the main calendar month.
- Bulk edit past records for one store by assigning all pachinko records or all slot records to selected store rates.
- Show rate details such as exchange rate, saved balls, and replay fee when choosing a rate in bulk editing.
- Add a store information view with favorite, registered, and self-registered store tabs.
- Show each store's saved-ball summary with yen conversion, monthly profit, total profit, record count, play hours, and last play date.
- Show a saved-ball total across all stores on the store list, including yen conversion, pachinko count, and slot count.
- Open a store detail view to edit rate settings, directly update saved-ball counts, start a new play entry for that store, review past records, and review machines played at that store.
- Place rate addition buttons inside the store detail rate and saved-ball section, with labels that clearly say they add pachinko or slot rates.
- Use bottom tabs for the main app areas: monthly calendar, profit analysis, store information, machine information, and other data operations.
- Add actual profit bars on top of the monthly, yearly, and lifetime chart views, while keeping cumulative profit and expected value as lines.
- Show pRecord-style chart helpers: right-side yen scale labels, guide lines, and a compact performance summary for the current chart range.

## Main Layout

The main app is split into five bottom tabs:

- Monthly calendar: selected month calendar, selected-day summary, and selected-day play records.
- Profit analysis: the profit chart views.
- Store information: store list, store detail, rate settings, and saved-ball management.
- Machine information: machines played, grouped by machine name.
- Other: CSV import, CSV export, bulk editing, and update information.

## Saved Fields

Each play record currently stores:

- Date
- Start time
- End time
- Store name
- Machine name
- Selected rate name
- Rate category
- Lending unit price
- Exchange count per 100 yen
- Saved-ball count at the time of entry
- Replay fee percentage
- Cash investment amount
- Cash recovery amount
- Saved-ball investment count
- Saved-ball recovery count
- Expected value
- Memo

Cash profit, saved-ball change, total profit, and play time are calculated from the saved values. Total profit includes saved-ball change converted by the selected or imported exchange value.

## Charts

The profit analysis tab includes a line-style profit chart with five views:

- Monthly view: cumulative daily profit for the displayed month.
- Yearly view: cumulative monthly profit for the displayed year.
- Lifetime view: cumulative yearly profit across all records.
- Store view: profit grouped by store in a horizontal bar list.
- Machine view: profit grouped by machine in a horizontal bar list.

The monthly chart uses the same displayed month as the main calendar. Moving the month from either place updates both sections. Monthly, yearly, and lifetime charts also show actual profit bars for each period: daily bars in monthly view, monthly bars in yearly view, and yearly bars in lifetime view.

Expected value is shown together with profit. Trend views show expected value as a second line, while store and machine views show each store or machine name on the left and profit and expected value bars on the right. Trend charts use right-side yen scale labels and guide lines so the current result is easier to read against the zero line. In the store and machine views, the row label, bar area, and amount are separated so long positive or negative bars do not cover text.

Under the trend chart, the app shows a pRecord-style performance summary for the current range, including play count, win rate, wins, losses, draws, play hours, total investment, total recovery, highest investment, highest recovery, hourly profit, and expected value average.

## Rate Settings

Rate choices are currently saved per store in the browser.

Each rate choice stores:

- Store name
- Category: pachinko or slot
- Rate name, such as 4-pachi, 1-pachi, 20-slot, or 5-slot
- Lending unit price
- Exchange count per 100 yen
- Current saved-ball count
- Replay fee percentage

When a play record is saved, the selected rate settings are copied into that record so past records do not change if the store rate is edited later.

Saved balls are updated automatically from each play record:

- Saved-ball investment decreases the selected rate's current saved-ball count.
- Saved-ball recovery increases the selected rate's current saved-ball count.
- Deleting a play record reverses the same saved-ball change.
- Editing a play record reverses the old saved-ball change and applies the new one.
- Bulk editing past records reverses the old rate's saved-ball change and applies it to the newly selected rate.
- Store detail can also directly overwrite the current saved-ball count for a store-specific rate. This is meant for manual correction when the real balance is known.

## Store Information

The app now has a store information view inspired by pRecord's store tab.

Current scope:

- Favorite stores: stores marked by the user.
- Registered stores: stores from the app's imported store list.
- Self-registered stores: stores that appear only in records, rates, or favorites.
- Store cards show saved balls with yen conversion, monthly profit, total profit, total expected value, record count, play hours, and the latest play date.
- The store list shows total saved balls across all stores. Yen conversion is shown as the main value because pachinko balls and slot medals are different units, while the pachinko and slot counts are shown as separate details.
- Store detail shows rate and saved-ball editing, a button to start a play entry for that store, past play records, and machines played at that store.
- Rate addition actions live inside the rate and saved-ball section so their purpose is clear.

Address, opening hours, parking, entrance rules, installed machine lists from external data, and event information are intentionally left for a later phase.

## Notes

`precord_data.csv` is a local export and should not be committed to the public repository.

CSV import replaces existing records for any date included in the CSV, while leaving dates not included in the CSV unchanged. pRecord CSV rows are imported when date, store, and machine are present. When pRecord has a saved-ball difference and profit value, the app estimates a rate value from those numbers and stores cash investment/recovery as 0 while filling saved-ball investment/recovery from pRecord investment/recovery.

The current browser-only storage is for the draft stage. For PC and smartphone sync, move the same data shape to Cloudflare D1 later.
