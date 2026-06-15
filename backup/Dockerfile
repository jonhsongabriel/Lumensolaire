FROM postgres:15-alpine

# Install cron and basic tools
RUN apk add --no-cache dcron tzdata

# Set timezone (Africa/Algiers for Algeria, change as needed)
ENV TZ=Africa/Algiers
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Create backup directories
RUN mkdir -p /backups /scripts

# Copy scripts
COPY backup.sh /scripts/backup.sh
RUN chmod +x /scripts/backup.sh

# Copy crontab
COPY crontab /etc/cron.d/lumen-backup
RUN chmod 0644 /etc/cron.d/lumen-backup
RUN crontab /etc/cron.d/lumen-backup

# Start cron in foreground
CMD ["crond", "-f", "-l", "2"]
