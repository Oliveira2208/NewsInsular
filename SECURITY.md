# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it privately to the maintainers.

## Security Best Practices

### Environment Variables
- Never commit `.env` files
- Use `.env.local` for local development
- Use Vercel environment variables for production
- Rotate keys regularly

### Authentication
- All admin routes protected by middleware
- RLS policies enforce data access
- Service role key only in server-side code

### Data Validation
- Zod schemas validate all user input
- Document ID format enforced (V/E/P-XXXXXX)
- SQL injection prevented by Supabase client

### Storage
- All file uploads go to Supabase Storage
- Bucket is public read, authenticated write
- File paths include UUID to prevent traversal