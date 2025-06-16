# Admin Setup Guide

This guide explains how to set up the admin user for the Talnurt Recruitment Portal in both development and production environments.

## Quick Setup (Development)

The admin user has been automatically configured. You can now login at:

**URL:** http://localhost:3000/admin/login

**Credentials:**
- **Email:** `admin@talnurt.com`
- **Password:** `Admin@123`

## Production Deployment

### Method 1: Using NPM Scripts

```bash
# Setup admin user with default credentials
npm run setup:production

# Or setup with custom credentials
ADMIN_EMAIL=your-admin@company.com ADMIN_PASSWORD=YourSecurePassword npm run setup:production
```

### Method 2: Using Environment Variables

Set these environment variables in your production environment:

```env
ADMIN_EMAIL=your-admin@company.com
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_NAME=System Administrator
```

Then run:
```bash
npm run setup:production
```

### Method 3: Manual Database Setup

If you prefer to set up the admin user manually, run this SQL in your production database:

```sql
INSERT INTO users (id, name, email, password, role, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Super Administrator',
  'admin@talnurt.com',
  '$2b$12$[BCRYPT_HASH_OF_PASSWORD]',
  'admin',
  NOW(),
  NOW()
);
```

## Security Recommendations

### For Production:

1. **Change Default Credentials:** Always change the default admin email and password
2. **Use Strong Passwords:** Use a password with at least 12 characters, including uppercase, lowercase, numbers, and symbols
3. **Environment Variables:** Store credentials in environment variables, not in code
4. **HTTPS Only:** Ensure your production app uses HTTPS
5. **Regular Updates:** Regularly update admin passwords

### Environment Variables for Production:

```env
# Required
DATABASE_URL=postgresql://user:password@host:port/database
NEXTAUTH_SECRET=your-super-secret-jwt-key

# Admin Setup (Optional - will use defaults if not provided)
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_NAME=System Administrator

# Other required variables
NEXTAUTH_URL=https://yourdomain.com
```

## Deployment Checklist

- [ ] Database is configured and accessible
- [ ] Environment variables are set
- [ ] Run `npm run setup:production`
- [ ] Verify admin login works
- [ ] Change default password if using defaults
- [ ] Test all admin functionality

## Troubleshooting

### Common Issues:

1. **"Invalid credentials" error:**
   - Verify the admin user exists in the database
   - Check if password was properly hashed
   - Run `npm run setup:admin` to reset

2. **Database connection errors:**
   - Verify DATABASE_URL is correct
   - Ensure database is running and accessible
   - Check network/firewall settings

3. **Token/session issues:**
   - Verify NEXTAUTH_SECRET is set
   - Clear browser cookies
   - Check middleware configuration

### Reset Admin User:

```bash
# Reset to default credentials
npm run setup:admin

# Or create new admin with custom details
ADMIN_EMAIL=new-admin@company.com ADMIN_PASSWORD=NewPassword123 npm run setup:production
```

## Admin Features

Once logged in, the admin has access to:

- **Dashboard:** Overview of system metrics
- **Recruiter Management:** Add/remove recruiters
- **Job Management:** Manage all job postings
- **Talent Pool:** Browse and manage candidates
- **Company Management:** Manage companies and industries
- **Skills Management:** Manage skills and categories
- **Resume Parser:** Process and parse resumes
- **Blog Management:** Create and manage blog posts
- **Analytics:** View reports and system analytics

## Support

For issues with admin setup or access, check:
1. Application logs
2. Database connectivity
3. Environment variable configuration
4. Middleware and authentication flow 