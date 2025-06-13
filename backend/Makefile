DOCKER_COMPOSE = docker compose -f docker-compose.local.yml
APP_CONTAINER = appointment-app-1
DB_CONTAINER = appointment-postgres-1
NODE_IMAGE = node:22-alpine

# Production environment file
PROD_ENV_FILE = .env.prod

.DEFAULT_GOAL := help

.PHONY: help
help: ## Show this help message
	@echo "Appointment - Available Commands"
	@echo "================================"
	@echo "install              Install npm dependencies"
	@echo "dev                  Start development server with hot reload"
	@echo "build                Build the TypeScript application"
	@echo "clean                Clean build artifacts"
	@echo "start                Start the production application locally"
	@echo "t                    Run tests"
	@echo "tw                   Run tests in watch mode"
	@echo "tc                   Run tests with coverage report"
	@echo "lint                 Run ESLint"
	@echo "lint-fix             Run ESLint with auto-fix"
	@echo "up                   Start all services with Docker Compose"
	@echo "down                 Stop all services and remove containers"
	@echo "rst                  Restart all services"
	@echo "logs                 Show logs for all services"
	@echo "logs-app             Show logs for app service only"
	@echo "logs-db              Show logs for database service only"
	@echo "shell-app            Open shell in app container"
	@echo "shell-db             Open PostgreSQL shell in database container"
	@echo "ps                   Show running containers"
	@echo "prune                Remove containers, networks, volumes, and images"
	@echo "m-up                 Run database migrations locally"
	@echo "m-down               Drop all database tables (WARNING: destroys all data)"
	@echo "prod-m-up            Run database migrations in production"
	@echo "prod-m-down          Drop all database tables (WARNING: destroys all data)"
	@echo "prod-m-status        Check status of migrations in production"
	@echo "setup                Complete project setup (start services, migrate)"
	@echo "dev-setup            Setup for local development (no Docker)"
	@echo "full-reset           Full project reset (clean Docker, restart)"
	@echo "test                 Run tests"
	@echo "check                Run all code quality checks"

.PHONY: install
install: ## Install npm dependencies
	@echo "Installing dependencies..."
	npm ci

.PHONY: dev
dev: ## Start development server with hot reload
	@echo "Starting development server..."
	npm run dev:watch

.PHONY: build
build: ## Build the TypeScript application
	@echo "Building application..."
	npm run build

.PHONY: clean
clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	npm run clean

.PHONY: start
start: ## Start the production application locally
	@echo "Starting production server..."
	npm start

.PHONY: t
t: ## Run tests
	@echo "Running tests..."
	npm test

.PHONY: tw
tw: ## Run tests in watch mode
	@echo "Running tests in watch mode..."
	npm run test:watch

.PHONY: tc
tc: ## Run tests with coverage report
	@echo "Running tests with coverage..."
	npm run test:coverage

.PHONY: lint
lint: ## Run ESLint
	@echo "Running linter..."
	npm run lint

.PHONY: lint-fix
lint-fix: ## Run ESLint with auto-fix
	@echo "Running linter with auto-fix..."
	npm run lint:fix

.PHONY: up
up: ## Start all services with Docker Compose
	@echo "Starting services with Docker Compose..."
	$(DOCKER_COMPOSE) up --build -d

.PHONY: down
down: ## Stop all services and remove containers
	@echo "Stopping services..."
	$(DOCKER_COMPOSE) down

.PHONY: rst
rst: down up ## Restart all services

.PHONY: logs
logs: ## Show logs for all services
	@echo "Showing logs..."
	$(DOCKER_COMPOSE) logs -f

.PHONY: logs-app
logs-app: ## Show logs for app service only
	@echo "Showing app logs..."
	$(DOCKER_COMPOSE) logs -f app

.PHONY: logs-db
logs-db: ## Show logs for database service only
	@echo "Showing database logs..."
	$(DOCKER_COMPOSE) logs -f postgres

.PHONY: shell-app
shell-app: ## Open shell in app container
	@echo "Opening shell in app container..."
	$(DOCKER_COMPOSE) exec app sh

.PHONY: shell-db
shell-db: ## Open PostgreSQL shell in database container
	@echo "Opening PostgreSQL shell..."
	$(DOCKER_COMPOSE) exec postgres psql -U postgres

.PHONY: ps
ps: ## Show running containers
	@echo "Running containers:"
	$(DOCKER_COMPOSE) ps

.PHONY: prune
prune: ## Remove containers, networks, volumes, and images
	@echo "Cleaning up Docker resources..."
	$(DOCKER_COMPOSE) down -v --rmi all --remove-orphans
	docker system prune -f

.PHONY: m-up
m-up: ## Run database migrations
	@echo "Running database migrations..."
	$(DOCKER_COMPOSE) exec app npm run migration:run

.PHONY: m-down
m-down: ## Drop all database tables (WARNING: destroys all data)
	@echo "Dropping all database tables - all data will be lost!"
	$(DOCKER_COMPOSE) exec app npm run db:drop
	@echo "All tables dropped successfully"

.PHONY: m-revert
m-revert: ## Revert the last migration
	@echo "Reverting the last migration..."
	$(DOCKER_COMPOSE) exec app npm run migration:revert

.PHONY: setup
setup: up m-up ## Complete project setup (start services, migrate, seed)
	@echo "Project setup complete!"
	@echo "Your API should be available at: http://localhost:8080"

.PHONY: dev-setup
dev-setup: install build ## Setup for local development (no Docker)
	@echo "Development setup complete!"
	@echo "Run 'make dev' to start development server"

.PHONY: full-reset
full-reset: drop prune up m-up db-seed ## Full project reset (clean Docker, restart)
	@echo "Full reset complete!"

.PHONY: test
test: ## Run tests
	@echo "Running tests..."
	npm test

.PHONY: check
check: lint test ## Run all code quality checks
	@echo "All checks passed!"

.PHONY: prod-m-up
prod-m-up: ## Run database migrations in production
	@echo "Running database migrations in production..."
	@if [ ! -f "$(PROD_ENV_FILE)" ]; then \
		echo "Error: Production environment file $(PROD_ENV_FILE) not found"; \
		exit 1; \
	fi
	@echo "Using production environment from $(PROD_ENV_FILE)"
	env $(shell cat $(PROD_ENV_FILE) | grep -v '^#' | xargs) npm run migration:run
	@echo "Production database migrations completed successfully"

.PHONY: prod-m-down
prod-m-down: ## Drop all database tables (WARNING: destroys all data)
	@echo "Dropping all database tables - all data will be lost!"
	@if [ ! -f "$(PROD_ENV_FILE)" ]; then \
		echo "Error: Production environment file $(PROD_ENV_FILE) not found"; \
		exit 1; \
	fi
	@echo "Using production environment from $(PROD_ENV_FILE)"
	env $(shell cat $(PROD_ENV_FILE) | grep -v '^#' | xargs) npm run db:drop
	@echo "All tables dropped successfully"

.PHONY: prod-m-revert
prod-m-revert: ## Revert the last migration in production
	@echo "Reverting the last migration in production..."
	@if [ ! -f "$(PROD_ENV_FILE)" ]; then \
		echo "Error: Production environment file $(PROD_ENV_FILE) not found"; \
		exit 1; \
	fi
	@echo "Using production environment from $(PROD_ENV_FILE)"
	env $(shell cat $(PROD_ENV_FILE) | grep -v '^#' | xargs) npm run migration:revert
	@echo "Last migration reverted successfully"

.PHONY: prod-m-status
prod-m-status: ## Check status of migrations in production
	@echo "Checking migration status in production..."
	@if [ ! -f "$(PROD_ENV_FILE)" ]; then \
		echo "Error: Production environment file $(PROD_ENV_FILE) not found"; \
		exit 1; \
	fi
	@echo "Using production environment from $(PROD_ENV_FILE)"
	env $(shell cat $(PROD_ENV_FILE) | grep -v '^#' | xargs) npm run migration:show
