#!/bin/bash
# Installs cron jobs for Facturatech sync (every 4 hours, staggered 30 min)
crontab - 2>/dev/null <<EOF
0 */4 * * * cd /home/ubuntu/contaya/scraper && ./scrape_vladimir.sh >> /tmp/contaya/cron_vladimir.log 2>&1
30 */4 * * * cd /home/ubuntu/contaya/scraper && ./scrape_mendieta.sh >> /tmp/contaya/cron_mendieta.log 2>&1
EOF
echo "Crontab installed:"
crontab -l
