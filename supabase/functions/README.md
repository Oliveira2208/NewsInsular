# Edge Functions Setup

## Required Secrets

Configure these secrets in your Supabase project:

```bash
supabase secrets set RESEND_API_KEY=re_your_api_key
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Deploy Functions

```bash
supabase functions deploy send-welcome-email
supabase functions deploy notify-new-news
supabase functions deploy send-weekly-digest
supabase functions deploy send-custom-email
```

## Function URLs

- `https://your-project.supabase.co/functions/v1/send-welcome-email`
- `https://your-project.supabase.co/functions/v1/notify-new-news`
- `https://your-project.supabase.co/functions/v1/send-weekly-digest`
- `https://your-project.supabase.co/functions/v1/send-custom-email`

## Cron Job (optional - for weekly digest)

Set up a cron job to send weekly digest:
```bash
supabase functions create send-weekly-digest-scheduler
# Configure cron in Supabase dashboard
```

## Testing Functions

```bash
# Test welcome email
curl -X POST https://your-project.supabase.co/functions/v1/send-welcome-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -d '{"email":"test@example.com","fullName":"Test User"}'

# Test notify new news
curl -X POST https://your-project.supabase.co/functions/v1/notify-new-news \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -d '{"newsId":"uuid","title":"Test News","summary":"Summary","imageUrl":null}'
```