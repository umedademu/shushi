# Storage Strategy Memo

## Current Direction

This app will start as a personal pachinko/pachislo profit tracking tool, with a possible later path toward SaaS.

## Personal Phase

For personal use with PC and smartphone sync, local browser storage alone is not enough because data stays on each device/browser.

Cloudflare D1 is currently the better fit than Supabase for this project because:

- Supabase Free usage is already over the database size quota in the current account.
- Cloudflare D1 is unused in the current Cloudflare account.
- Workers & Pages usage is currently 0.
- D1 free limits should be enough for personal profit tracking data.

Recommended personal-phase architecture:

```text
Vercel frontend
Cloudflare Worker API
Cloudflare D1 database
```

Authentication can stay simple at first, such as an admin token or passcode, because this phase is only for personal use.

## SaaS Phase

When opening the app to many users, add proper authentication and store records per user.

Each profit/loss record should have a `user_id` or equivalent owner field so data can be separated per account.

At that point, review whether to continue with Cloudflare D1 plus an auth service, or move to a more integrated stack such as Supabase if paid usage is acceptable.

## Notes From Account Checks

- Supabase account is on Free plan and database size quota was exceeded.
- Cloudflare D1 has no databases yet.
- Cloudflare Workers & Pages has no projects yet and current request usage was 0.
- Cloudflare R2 is already used by another app, but this project should not need R2 for basic income/expense records.
