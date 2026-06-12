#!/usr/bin/env bash
set -euo pipefail

FUNCTIONS=(
  create-partnership-subscription
  verify-partnership-subscription
  charge-partnership-subscriptions
  manage-partnership-subscription
  initiate-welfare-partnership
  verify-welfare-partnership
  paystack-webhook
)

for fn in "${FUNCTIONS[@]}"; do
  echo "Deploying $fn..."
  npx supabase functions deploy "$fn"
done

echo "Done. Set secrets: PAYSTACK_SECRET_KEY, APP_URL"
echo "Webhook URL: https://<project-ref>.supabase.co/functions/v1/paystack-webhook"
echo "See docs/PAYSTACK_SETUP.md for full setup."
