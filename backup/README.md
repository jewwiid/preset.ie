# Supabase Backup System

A comprehensive backup solution for your Supabase database, featuring multiple backup methods, cloud storage integration, and automated scheduling.

## 📁 Directory Structure

```
backup/
├── README.md                           # This file
├── BACKUP_SUPABASE.sh                  # Core pg_dump backup script
├── BACKUP_ALL_DATABASES.sh             # Complete cluster backup (pg_dumpall)
├── SUPABASE_API_BACKUP.sh              # Official Supabase API backups
├── BACKUP_MANAGER.sh                   # Interactive backup dashboard
├── SIMPLEBACKUPS_INTEGRATION.sh        # Cloud storage integration
├── SETUP_BACKUP.sh                     # Quick setup script
├── configs/                            # Configuration files
├── logs/                               # Backup logs
├── backups/                            # Local backup storage
└── sql-backups/                        # Legacy SQL backup directory
    ├── README.md
    ├── admin-creation-attempts/
    ├── archive/
    └── diagnostics/
```

## 🚀 Quick Start

### 1. Basic Setup
```bash
cd backup
./SETUP_BACKUP.sh
```

### 2. Configure Your Settings
```bash
./SIMPLEBACKUPS_INTEGRATION.sh config
```

### 3. Test Your Backup
```bash
./SIMPLEBACKUPS_INTEGRATION.sh test
```

### 4. Run Your First Backup
```bash
./SIMPLEBACKUPS_INTEGRATION.sh run
```

## 📋 Available Scripts

### Core Backup Scripts

| Script | Purpose | Features |
|--------|---------|----------|
| `BACKUP_SUPABASE.sh` | Local pg_dump backups | Schema + data, compression, validation |
| `BACKUP_ALL_DATABASES.sh` | Cluster-wide backups | All databases, roles, tablespaces |
| `SUPABASE_API_BACKUP.sh` | Official API backups | Native Supabase backup management |
| `BACKUP_MANAGER.sh` | Interactive dashboard | Menu-driven backup management |

### Integration Scripts

| Script | Purpose | Cloud Storage |
|--------|---------|---------------|
| `SIMPLEBACKUPS_INTEGRATION.sh` | Cloud storage integration | AWS S3, GCS, Azure |
| `SETUP_BACKUP.sh` | Quick setup | Configuration wizard |

## ☁️ Cloud Storage Integration

Based on [SimpleBackups Supabase Guide](https://simplebackups.com/blog/how-to-backup-supabase)

### Supported Providers
- **AWS S3** - Enterprise-grade object storage
- **Google Cloud Storage** - Google's cloud storage solution
- **Azure Blob Storage** - Microsoft's cloud storage
- **Local Storage** - Keep backups on your server

### Configuration Example
```bash
# Edit configuration
./SIMPLEBACKUPS_INTEGRATION.sh config

# Set your preferred storage
BACKUP_STORAGE="s3"
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
S3_BUCKET_NAME="your-backup-bucket"
```

## 🔧 Features

### Backup Types
- **Complete Database** - Full schema and data
- **Schema Only** - Database structure only
- **Data Only** - Database content only
- **Functions & Triggers** - Stored procedures and triggers
- **Point-in-Time Recovery** - Restore to any point in time

### Automation
- **Cron Scheduling** - Automated backups
- **Retention Policies** - Automatic cleanup
- **Compression** - Reduce storage costs
- **Encryption** - Secure your backups

### Monitoring
- **Email Notifications** - Backup status alerts
- **Slack Integration** - Team notifications
- **Discord Webhooks** - Community notifications
- **Detailed Logging** - Complete audit trail

## 📊 Backup Methods

### 1. Local pg_dump Backups
```bash
./BACKUP_SUPABASE.sh
```
- ✅ Full control over backup process
- ✅ Works offline
- ✅ Fast for small databases
- ❌ Manual cloud storage upload

### 2. Supabase API Backups
```bash
./SUPABASE_API_BACKUP.sh
```
- ✅ Official Supabase method
- ✅ Built-in Point-in-Time Recovery
- ✅ Managed by Supabase
- ❌ Limited customization

### 3. SimpleBackups Integration
```bash
./SIMPLEBACKUPS_INTEGRATION.sh run
```
- ✅ All cloud providers supported
- ✅ Automated scheduling
- ✅ Compression and encryption
- ✅ Retention policies
- ✅ Monitoring and alerts

## 🗂️ File Organization

All backup-related files have been organized into this `/backup` directory for better maintainability:

- **Scripts** - All backup automation scripts
- **Configs** - Configuration files and templates
- **Logs** - Detailed backup operation logs
- **Backups** - Local backup storage
- **SQL Backups** - Legacy SQL backup archive

## 📈 Monitoring and Status

### Check Backup Status
```bash
./SIMPLEBACKUPS_INTEGRATION.sh status
```

### View Recent Backups
```bash
ls -lah backups/
```

### Check Logs
```bash
tail -f logs/simplebackups.log
```

### Interactive Dashboard
```bash
./BACKUP_MANAGER.sh
```

## 🔒 Security Best Practices

### 1. Access Control
```bash
# Secure configuration files
chmod 600 configs/simplebackups.config
chmod 700 backup/
```

### 2. Encryption
- Enable backup encryption in configuration
- Store encryption keys securely
- Use secure transport (HTTPS)

### 3. Access Keys
- Rotate access keys regularly
- Use IAM roles with minimal permissions
- Never commit keys to version control

## 🚨 Troubleshooting

### Common Issues

#### 1. Permission Errors
```bash
# Fix script permissions
chmod +x *.sh
```

#### 2. Missing Dependencies
```bash
# Install required tools
npm install -g aws-cli  # For AWS S3
npm install -g gcloud   # For Google Cloud
npm install -g azure-cli # For Azure
```

#### 3. Connection Issues
```bash
# Test Supabase connection
./SIMPLEBACKUPS_INTEGRATION.sh test
```

#### 4. Storage Full
```bash
# Clean up old backups
./SIMPLEBACKUPS_INTEGRATION.sh run  # Includes cleanup
```

### Getting Help
- Check logs: `logs/simplebackups.log`
- Run test: `./SIMPLEBACKUPS_INTEGRATION.sh test`
- Check status: `./SIMPLEBACKUPS_INTEGRATION.sh status`

## 📞 Support

### Documentation
- [SimpleBackups Blog](https://simplebackups.com/blog/how-to-backup-supabase)
- [Supabase Backup Docs](https://supabase.com/docs/guides/platform/backups)
- [PostgreSQL pg_dump](https://www.postgresql.org/docs/current/app-pg-dump.html)

### Script Help
```bash
./BACKUP_MANAGER.sh help
./SIMPLEBACKUPS_INTEGRATION.sh help
./SUPABASE_API_BACKUP.sh help
```

## 🔄 Migration from Old System

If you were using the old backup system:

1. **Old files have been moved** to this `/backup` directory
2. **Update your cron jobs** to use new script paths
3. **Update your monitoring** to check new log locations
4. **Test the new system** before decommissioning old scripts

### Update Cron Jobs
```bash
# Old
0 2 * * * /path/to/BACKUP_SUPABASE.sh

# New
0 2 * * * /path/to/backup/SIMPLEBACKUPS_INTEGRATION.sh run
```

## 📝 Configuration Templates

### Basic Local Backup
```bash
BACKUP_STORAGE="local"
RETENTION_DAYS=30
COMPRESS_BACKUPS=true
```

### AWS S3 Integration
```bash
BACKUP_STORAGE="s3"
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
S3_BUCKET_NAME="my-backup-bucket"
```

### Production Setup
```bash
BACKUP_STORAGE="s3"
RETENTION_DAYS=90
ENCRYPT_BACKUPS=true
NOTIFICATION_EMAIL="admin@yourcompany.com"
SLACK_WEBHOOK_URL="https://hooks.slack.com/..."
```

## 🎯 Best Practices

1. **Test Your Backups** - Regularly restore to verify integrity
2. **Monitor Storage** - Keep an eye on cloud storage costs
3. **Document Everything** - Keep runbooks and procedures updated
4. **Security First** - Encrypt sensitive backups
5. **Multiple Locations** - Store backups in different geographic regions
6. **Regular Testing** - Test your disaster recovery plan

---

**Made with ❤️ based on [SimpleBackups](https://simplebackups.com/blog/how-to-backup-supabase) recommendations**