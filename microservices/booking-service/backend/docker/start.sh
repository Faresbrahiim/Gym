#!/bin/sh
set -e

echo "==> Running database migrations..."
php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration

echo "==> Warming up cache..."
php bin/console cache:warmup

echo "==> Starting nginx + php-fpm..."
exec /usr/bin/supervisord -n -c /etc/supervisord.conf
