FROM php:8.4-fpm-alpine

RUN apk add --no-cache \
        nginx \
        supervisor \
        libpq-dev \
        icu-dev \
        libzip-dev \
    && docker-php-ext-install -j"$(nproc)" \
        pdo \
        pdo_pgsql \
        intl \
        zip \
        opcache \
    && rm -rf /var/cache/apk/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Separate COPY for composer files to leverage Docker layer caching
COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts

COPY . .

COPY docker/nginx/default.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf   /etc/supervisord.conf
COPY docker/php.ini            /usr/local/etc/php/conf.d/symfony.ini
COPY docker/start.sh           /usr/local/bin/start.sh

RUN chmod +x /usr/local/bin/start.sh bin/console \
    && mkdir -p var/cache var/log \
    && chown -R www-data:www-data var/

EXPOSE 80

CMD ["/usr/local/bin/start.sh"]
