# Paystack Partnership Setup

This guide walks you through accepting **welfare partnerships** (one-time) and **daily partnership subscriptions** (recurring card charges) via Paystack.

## What is already built

| Flow | Member action | Paystack method |
|---|---|---|
| **One-time partnership** | Dashboard banner → donate amount | `transaction/initialize` → redirect → verify |
| **Daily subscription** | My Daily Partnership → set daily amount | Setup charge saves card → daily `charge_authorization` |

Currency: **GHS** (amounts sent to Paystack in pesewas).

---

## Step 1 — Paystack account

1. Sign in at [paystack.com](https://paystack.com).
2. Complete business verification for **live** payments (test mode works immediately with test keys).
3. Go to **Settings → API Keys & Webhooks**.
4. Copy your **Secret Key** (`sk_test_...` for testing, `sk_live_...` for production).

---

## Step 2 — Run database migrations

In Supabase **SQL Editor**, run these migrations if not already applied:

- `016_welfare_partnerships.sql`
- `018_welfare_partnership_arm.sql`
- `026_partnership_subscriptions.sql`
- `027_partnership_subscription_cron.sql` (template only — cron enabled in Step 6)
- `028_partnership_subscription_goals.sql`

---

## Step 3 — Supabase Edge Function secrets

Supabase Dashboard → **Project Settings → Edge Functions → Secrets**

| Secret | Example | Required |
|---|---|---|
| `PAYSTACK_SECRET_KEY` | `sk_test_xxxxxxxx` | Yes |
| `APP_URL` | `https://your-domain.com` | Yes — must match your deployed frontend |
| `SUPABASE_URL` | Auto-set when deploying | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | From project API settings | Yes |
| `PARTNERSHIP_CRON_SECRET` | Random string (optional) | Optional alternative to service role for cron |

**Important:** `APP_URL` must be your public site URL (no trailing slash). Paystack redirects users to:

- One-time: `{APP_URL}/partnership/complete?reference=...`
- Daily setup: `{APP_URL}/partnership/subscription-complete?reference=...`

For local testing with Paystack test mode, use a tunnel (ngrok) or deploy to staging — Paystack cannot redirect to `localhost`.

---

## Step 4 — Deploy Paystack edge functions

From the project root (with [Supabase CLI](https://supabase.com/docs/guides/cli) linked to your project):

```bash
cd archeivers-fellowship

npx supabase functions deploy create-partnership-subscription
npx supabase functions deploy verify-partnership-subscription
npx supabase functions deploy charge-partnership-subscriptions
npx supabase functions deploy manage-partnership-subscription
npx supabase functions deploy initiate-welfare-partnership
npx supabase functions deploy verify-welfare-partnership
npx supabase functions deploy paystack-webhook
```

Or run the helper script:

```bash
bash scripts/deploy-paystack.sh
```

---

## Step 5 — Paystack webhook (recommended)

In Paystack Dashboard → **Settings → API Keys & Webhooks → Webhook URL**:

```
https://<your-project-ref>.supabase.co/functions/v1/paystack-webhook
```

Enable at minimum: **`charge.success`**

The webhook backs up payment confirmation if a user closes the browser before the callback page loads.

---

## Step 6 — Daily subscription cron

Daily charges run via `charge-partnership-subscriptions` at **6:00 AM UTC**.

1. Supabase Dashboard → **Database → Extensions** — enable `pg_cron` and `pg_net`.
2. SQL Editor — run (replace placeholders):

```sql
SELECT cron.schedule(
  'partnership-subscription-daily-charge',
  '0 6 * * *',
  $$
    SELECT net.http_post(
      url := 'https://<project-ref>.supabase.co/functions/v1/charge-partnership-subscriptions',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <service_role_key>'
      )
    );
  $$
);
```

To test manually:

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/charge-partnership-subscriptions" \
  -H "Authorization: Bearer <service_role_key>"
```

---

## Step 7 — Frontend environment

`.env` (local) and Vercel/hosting env vars:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

No Paystack public key is needed in the frontend — all Paystack calls go through edge functions.

---

## Step 8 — Test end-to-end

### Test cards (Paystack test mode)

| Card | Number | OTP |
|---|---|---|
| Success | `4084084084084081` | `123456` |
| Declined | `4084084084084085` | `123456` |

### One-time partnership

1. Sign in as any role.
2. Use the partnership banner on your dashboard.
3. Enter amount → Pay with test card.
4. Confirm redirect to `/partnership/complete` and success message.
5. Admin/Welfare: check **Welfare Sponsors** page.

### Daily subscription

1. Go to **My Daily Partnership** (sidebar on any portal).
2. Set daily amount (min 1 GHS) → Pay setup charge.
3. Confirm redirect to `/partnership/subscription-complete` and **Active** status.
4. Optionally invoke `charge-partnership-subscriptions` manually to simulate the next day.

---

## Step 9 — Go live

1. Swap `PAYSTACK_SECRET_KEY` to your **live** secret key in Supabase secrets.
2. Set `APP_URL` to your production domain.
3. Update Paystack webhook URL if the project ref changed.
4. Run a small real GHS payment to confirm settlement.

---

## Troubleshooting

| Issue | Fix |
|---|---|
| "Paystack is not configured" | Set `PAYSTACK_SECRET_KEY` in Supabase secrets and redeploy functions |
| Payment succeeds but app shows failed | Check `APP_URL` matches your site; verify webhook is configured |
| Callback 401 error | Ensure `verify-welfare-partnership` has `verify_jwt = false` in `config.toml` and redeploy |
| Subscription stuck on "Setup pending" | User abandoned Paystack — delete row or have admin cancel; retry setup |
| Daily charges not running | Confirm pg_cron job from Step 6 is scheduled |

---

## Where members pay

- **One-time:** Partnership banner on dashboards → `/partnership/complete`
- **Daily:** Sidebar **My Daily Partnership** → `/partnership/subscription-complete`
- **Admin view:** Welfare Sponsors, Daily Subscriptions (admin + welfare portals)
