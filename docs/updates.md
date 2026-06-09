# Updates

## 2026-06-09

- Added Cloudflare D1 cloud storage for the app state.
- Added a public Cloudflare Worker endpoint for reading and saving the shared personal data.
- Added automatic first-load migration from browser storage to cloud storage when the cloud data is empty.
- Added cloud status, manual cloud load, and manual device-to-cloud save controls to the Other tab.

## 2026-05-24

- Added the first mobile-first draft of the profit tracking app.
- Added a monthly calendar that starts with today selected.
- Added an entry form for date, start time, end time, store, machine, investment, recovery, expected value, and memo.
- Added store and machine suggestions based on the existing halldata data.
- Added a simple update information view inside the web app.
- Changed start and end time inputs to use 5-minute steps.
- Added default time values: first record starts at 10:00, and end time starts at the current time.
- Rebuilt store and machine options from halldata, expanding them to 353 stores and 336 machines.
- Changed store and machine entry to searchable selection sheets for mobile use.
- Added favorite stores and machines so marked options appear first in the selection sheets.
- Added store-specific rate choices for pachinko and slot play.
- Made new play records store the selected rate settings together with the result.
- Added editing for existing rate choices.
- Added manual saved-ball counts to each rate choice.
- Improved the play entry rate display so exchange rate and saved balls are visible before saving.
- Added saved-ball investment and saved-ball recovery fields to the play entry form.
- Added automatic saved-ball balance updates when saving or deleting play records.
- Added a saved-ball balance preview to the play entry form.
- Renamed the cash amount fields to cash investment and cash recovery.
- Added CSV import and export for play records, including pRecord CSV import support.
- Added editing for saved play records by selecting a daily record card.
- Made saved-ball balances adjust by the difference between the old and updated play record.
- Improved pRecord CSV import so saved-ball play can be restored from investment, recovery, profit, and saved-ball difference.
- Added total profit display to the entry form so saved-ball value is included in the yen result.
- Changed CSV import so dates included in the CSV replace existing records for those same dates.
- Added profit charts with monthly, yearly, lifetime, store, and machine views.
- Renamed the saved-ball difference display to "貯玉増減" and showed slot saved counts with the medal unit.
- Changed the profit chart from a bar-style display to a line chart.
- Changed store and machine profit charts to vertical bar charts.
- Removed the duplicated selected-day add card and tightened the desktop layout.
- Changed desktop display to a wider single column and changed calendar daily profit from k units to plain yen units.
- Changed selected-day display order to summary, play record cards, then profit chart.
- Changed positive profit and positive saved-ball change displays to blue and improved selected calendar day readability.
- Added expected value to profit charts: line charts show a second line, and store or machine charts show adjacent bars.
- Changed expected value displays to use plus/minus signs and amount colors, and changed store or machine charts to horizontal bar rows.
- Changed daily calendar profit to use comma-separated plain yen numbers.
- Added previous and next month buttons to the monthly chart, linked to the main calendar month.
- Added bulk editing to assign one store's past pachinko or slot records to selected store rates.
- Prevented store and machine chart bars from overlapping labels or amount text.
- Changed bulk editing rate choices to show exchange rate, saved balls, and replay fee details.
- Added a store information view with favorite, registered, and self-registered tabs.
- Added store detail pages where saved-ball counts and rate settings can be edited directly, with past records and played machines shown for that store.
- Added yen conversion to the saved-ball display in the store list and store detail.
- Moved the pachinko and slot rate addition buttons into the rate and saved-ball section and clarified their labels.
- Added a total saved-ball summary to the store list, with yen conversion plus pachinko and slot unit totals.
- Added total expected value to each store card in the store list.
- Removed the registered/self-registered label from the top of store cards.
- Changed the app to a bottom-tab layout with monthly calendar, profit analysis, store information, machine information, and other data operation tabs.
- Refined the line chart design with thinner lines and points only on days with play records.
- Added actual profit bars to monthly, yearly, and lifetime charts so each period's result can be compared against the cumulative profit line.
- Added pRecord-style chart details: right-side yen scale labels, guide lines for monthly and yearly trend charts, and a period performance summary with counts, win rate, investment, recovery, hourly profit, and expected value average.
- Simplified the profit analysis screen toward pRecord's layout by removing the amount-heavy legend and highest/lowest cards, then showing the main period result beside the performance heading with average amount and expected value totals inside the summary.
- Changed monthly chart and performance headings from "this month" wording to numeric year-month labels, kept the performance heading visible on empty months, and removed duplicated analysis headings above the chart.
- Added the yen unit to the large performance result amount in the profit analysis summary.
- Changed profit chart grid lines and right-side scale labels to use pRecord-style clean yen intervals that adapt to the visible range.
- Adjusted the profit analysis layout for phone and desktop widths so the numeric month heading, large result amount, and summary cards fit more cleanly.
- Removed the large top headings from the main tabs and moved the profit entry button into the calendar month navigation row.
