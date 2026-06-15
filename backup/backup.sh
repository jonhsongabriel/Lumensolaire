#!/bin/sh
# LUMEN PostgreSQL Daily Backup Script
# Runs inside Docker backup container

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-lumendb}"
DB_USER="${DB_USER:-lumen}"
DB_PASSWORD="${DB_PASSWORD:-Lum3n.pasS!}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
BACKUP_DIR="/backups"

TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
FILENAME="lumen_backup_${TIMESTAMP}.sql"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

echo "========================================="
echo "LUMEN PostgreSQL Backup - ${TIMESTAMP}"
echo "========================================="
echo "Database: ${DB_NAME} @ ${DB_HOST}:${DB_PORT}"
echo "User: ${DB_USER}"
echo "Output: ${FILEPATH}"
echo ""

export PGPASSWORD="${DB_PASSWORD}"

# Run pg_dump
pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -f "${FILEPATH}"

if [ $? -ne 0 ]; then
  echo "ERROR: Backup failed!"
  exit 1
fi

# Compress backup
gzip "${FILEPATH}"
COMPRESSED="${FILEPATH}.gz"

# Show size
SIZE=$(du -h "${COMPRESSED}" | cut -f1)
echo ""
echo "Backup created: ${FILENAME}.gz"
echo "Size: ${SIZE}"
echo "Location: ${COMPRESSED}"

# Cleanup old backups (keep last N days)
DELETED=$(find "${BACKUP_DIR}" -name "lumen_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
if [ "${DELETED}" -gt 0 ]; then
  echo "Cleaned up ${DELETED} old backup(s) (older than ${RETENTION_DAYS} days)."
fi

echo "========================================="
echo "Backup completed successfully!"
echo "========================================="
