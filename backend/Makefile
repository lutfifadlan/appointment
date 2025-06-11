.PHONY: build up down restart logs clean ps migrate

# Build and start containers
up:
	docker-compose up -d

# Build containers
build:
	docker-compose build

# Stop containers
down:
	docker-compose down

# Restart containers
restart:
	docker-compose restart

# View logs
logs:
	docker-compose logs -f

# View running containers
ps:
	docker-compose ps

# Clean up containers and volumes
clean:
	docker-compose down -v

# Run TypeORM migrations
migrate:
	docker-compose exec app npm run migration:run

# Generate TypeORM migration
migration-generate:
	docker-compose exec app npm run migration:generate -- migrations/$(name)

# Enter app container shell
shell:
	docker-compose exec app sh

# Enter database container shell
db-shell:
	docker-compose exec postgres psql -U postgres -d appointment_db

# Default target
all: build up
