# Updates

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
