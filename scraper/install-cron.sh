#!/bin/bash
# Installs unified cron job for all billers (every 4 hours)
crontab - 2>/dev/null <<EOF
0 */4 * * * cd /home/ubuntu/contaya/scraper && bash sync.sh >> /tmp/contaya/cron.log 2>&1
EOF
echo "Crontab instalado:"
crontab -l
