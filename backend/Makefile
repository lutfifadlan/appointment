.PHONY: build up down restart logs clean ps migrate prod-up prod-down prod-logs prod-migrate

# Environment variables
ENV ?= development

# Docker compose command with environment file
DC_DEV = docker-compose
DC_PROD = NODE_ENV=production docker-compose -f docker-compose.yml

# Development commands
# --------------------

# Build and start containers
up:
	$(DC_DEV) up -d

# Build containers
build:
	$(DC_DEV) build

# Stop containers
down:
	$(DC_DEV) down

# Restart containers
restart:
	$(DC_DEV) restart

# View logs
logs:
	$(DC_DEV) logs -f

# View running containers
ps:
	$(DC_DEV) ps

# Clean up containers and volumes
clean:
	$(DC_DEV) down -v

# Run TypeORM migrations
migrate:
	$(DC_DEV) exec app npm run migration:run

# Generate TypeORM migration
migration-generate:
	$(DC_DEV) exec app npm run migration:generate -- migrations/$(name)

# Enter app container shell
shell:
	$(DC_DEV) exec app sh

# Enter database container shell
db-shell:
	$(DC_DEV) exec postgres psql -U postgres -d appointment_db

# Production commands
# -------------------

# Build and start production containers
prod-up:
	$(DC_PROD) up -d

# Build production containers
prod-build:
	$(DC_PROD) build

# Stop production containers
prod-down:
	$(DC_PROD) down

# View production logs
prod-logs:
	$(DC_PROD) logs -f

# Run TypeORM migrations in production
prod-migrate:
	$(DC_PROD) exec app npm run migration:run:prod

# Enter production app container shell
prod-shell:
	$(DC_PROD) exec app sh

# Enter production database container shell
prod-db-shell:
	$(DC_PROD) exec postgres psql -U postgres -d $(DB_NAME)

# Default target
all: build up
