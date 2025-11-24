# =====================================================================================================
# Build stage - compile Python packages
# =====================================================================================================
FROM python:3.12-alpine AS build_stage

# Install build dependencies in a virtual package for easy removal
RUN apk add --no-cache --virtual .build-deps \
    build-base \
    xmlsec-dev \
    pkgconf \
    gcc \
    python3-dev \
    musl-dev \
    mariadb-connector-c-dev

COPY ./app/requirements.txt /tmp/requirements.txt

# Build wheels for all dependencies including uwsgi
RUN pip wheel --no-cache-dir --wheel-dir /wheels -r /tmp/requirements.txt \
    && pip wheel --no-cache-dir --wheel-dir /wheels uwsgi

# =====================================================================================================
# Node/Yarn stage - build frontend assets
# =====================================================================================================
FROM node:20-alpine AS yarn_stage

# Only install git if actually needed for dependencies
RUN apk add --no-cache git

WORKDIR /build

# Copy package files first for better layer caching
COPY ./package.json ./yarn.lock ./babel.config.json ./webpack.prod.config.js ./

# Install dependencies (they'll be cached if package files don't change)
RUN yarn install --frozen-lockfile --non-interactive --production=false

# Copy source files and build
COPY ./src ./src
COPY ./theme ./theme
COPY ./public ./public

RUN npm run-script build-for-image

# =====================================================================================================
# Final stage - minimal runtime image
# =====================================================================================================
FROM python:3.12-alpine AS final_stage

# Install only runtime dependencies (no build tools)
RUN apk add --no-cache \
    xmlsec \
    mariadb-connector-c \
    bash \
    libgcc \
    libstdc++ \
    libmagic

# Create www-data user
RUN adduser -u 33 -S -D -G www-data www-data

# Copy and install pre-built wheels
COPY --from=build_stage /wheels /wheels
RUN pip install --no-cache-dir --no-index --find-links=/wheels /wheels/* \
    && rm -rf /wheels

# Create directory structure
RUN mkdir -p /var/www/html

# Copy wait script
COPY docker/dockerfiles/wait_for_it.sh /wait_for_it.sh
RUN chmod +x /wait_for_it.sh

# Copy default uwsgi configuration
COPY docker/config/uwsgi /etc/uwsgi

# Copy application code
COPY --chown=www-data:www-data ./app /var/www/html/

# Copy built frontend assets from yarn stage
COPY --from=yarn_stage --chown=www-data:www-data /build/public /var/www/html/public

# Set ownership
RUN chown -R www-data:www-data /var/www

WORKDIR /var/www/html/

USER www-data
