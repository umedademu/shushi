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
- Replay fee percentage
- Investment amount
- Recovery amount
- Expected value
- Memo

Profit and play time are calculated from the saved values.

## Rate Settings

Rate choices are currently saved per store in the browser.

Each rate choice stores:

- Store name
- Category: pachinko or slot
- Rate name, such as 4-pachi, 1-pachi, 20-slot, or 5-slot
- Lending unit price
- Exchange count per 100 yen
- Replay fee percentage

When a play record is saved, the selected rate settings are copied into that record so past records do not change if the store rate is edited later.

## Notes

`precord_data.csv` is a local export and should not be committed to the public repository.

The current browser-only storage is for the draft stage. For PC and smartphone sync, move the same data shape to Cloudflare D1 later.
