# Archeivers Fellowship — Church Management System

Full-stack church management platform for **Archeivers Fellowship**, built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- **5 role-based portals**: Master Admin, SCL, Welfare, Follow-up, Call Center
- **Member management** with Bro/Sis naming, photos, cell groups, and attendance
- **AI-powered reports** via Anthropic Claude (birthday messages, follow-up reports, call summaries)
- **Birthday automation** with notifications and SMS/email delivery
- **Realtime notifications** via Supabase Realtime
- **Row Level Security** enforced at the database level
- **Dark/light mode** UI

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Backend | Supabase (Auth, DB, Storage, Realtime, Edge Functions) |
| AI | Anthropic Claude API |
| SMS/Calls | Twilio |
| Email | Resend |
| Charts | Recharts |
| Calendar | FullCalendar |

## Getting Started

### 1. Clone and install

```bash
cd archeivers-fellowship
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations in order from `supabase/migrations/`:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_audit_triggers.sql`
   - `004_pg_cron_setup.sql` (after enabling pg_cron)
3. Create storage buckets: `member-photos` (public), `welfare-docs`, `exports`
4. Disable public signups in Auth settings (admin-only account creation)
5. Create the first Master Admin user in the Supabase dashboard, then set their role:

```sql
UPDATE profiles SET role = 'MASTER_ADMIN', full_name = 'Your Name' WHERE id = '<user-uuid>';
```

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in your Supabase URL and anon key.

### 4. Deploy Edge Functions

Set secrets in Supabase Dashboard → Edge Functions:

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
PAYSTACK_SECRET_KEY
APP_URL
ANTHROPIC_API_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
TWILIO_WHATSAPP_NUMBER
RESEND_API_KEY
CHURCH_EMAIL
```

### Paystack partnerships

See **[docs/PAYSTACK_SETUP.md](docs/PAYSTACK_SETUP.md)** for full Paystack deployment (one-time donations + daily subscriptions, webhook, cron).

Quick deploy:

```bash
bash scripts/deploy-paystack.sh
```

Deploy:

```bash
npx supabase functions deploy birthday-cron
npx supabase functions deploy ai-birthday-message
npx supabase functions deploy ai-followup-report
npx supabase functions deploy ai-call-report
npx supabase functions deploy ai-welfare-report
npx supabase functions deploy send-sms
npx supabase functions deploy send-bulk-message
npx supabase functions deploy ai-bulk-message
npx supabase functions deploy make-call
npx supabase functions deploy send-email
npx supabase functions deploy create-user
npx supabase functions deploy create-partnership-subscription
npx supabase functions deploy verify-partnership-subscription
npx supabase functions deploy charge-partnership-subscriptions
npx supabase functions deploy manage-partnership-subscription
npx supabase functions deploy initiate-welfare-partnership
npx supabase functions deploy verify-welfare-partnership
npx supabase functions deploy paystack-webhook
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Deploy frontend

Deploy to Vercel:

```bash
npm run build
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel environment variables.

## Project Structure

```
archeivers-fellowship/
├── src/
│   ├── components/     # UI, layout, shared components
│   ├── pages/          # Portal pages by role
│   ├── context/        # Auth & theme providers
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Supabase client
│   ├── types/          # TypeScript types
│   └── utils/          # Helpers (member names, dates)
├── supabase/
│   ├── migrations/     # SQL schema, RLS, triggers
│   └── functions/      # Edge Functions (AI, SMS, cron)
└── README.md
```

## Portals

| Role | Route | Access |
|---|---|---|
| Master Admin | `/admin/*` | Full system access |
| SCL | `/scl/*` | Own cell group only |
| Welfare | `/welfare/*` | All members (read-only), programs, birthdays |
| Follow-up | `/followup/*` | Follow-ups and visitations |
| Call Center | `/callcenter/*` | Calls and SMS |

## Member Naming Rule

All members are addressed as **Bro [FirstName] [LastName]** (male) or **Sis [FirstName] [LastName]** (female) throughout the entire system.

---

Built for Archeivers Fellowship — Empowering pastoral care through technology.
