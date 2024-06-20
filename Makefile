COMPOSE_FILE=docker/docker-compose.local.yml
DOCKER_COMPOSE=docker compose -f $(COMPOSE_FILE)

BLACK        := $(shell tput -Txterm setaf 0)
RED          := $(shell tput -Txterm setaf 1)
GREEN        := $(shell tput -Txterm setaf 2)
YELLOW       := $(shell tput -Txterm setaf 3)
LIGHTPURPLE  := $(shell tput -Txterm setaf 4)
PURPLE       := $(shell tput -Txterm setaf 5)
BLUE         := $(shell tput -Txterm setaf 6)
WHITE        := $(shell tput -Txterm setaf 7)
RESET := $(shell tput -Txterm sgr0)

default: build

#==============================================
# Building and cleaning the Docker environment
#==============================================
build: ## Build all Docker images (materia-django/python, materia-django/nginx, and materia-django/webpack)
	@echo "Building Materia's Docker images"
	@$(DOCKER_COMPOSE) build

build-backend: ## Build backend image (materia-django/python)
	@echo "Building materia-django/python"
	$(DOCKER_COMPOSE) build python

clean-backend: stop-backend remove-backend-volumes build-backend ## Stops and removes existing backend containers before rebuilding the backend image

clean: clean-backend ## Stops and removes existing existing containers before rebuilding images

clean-volumes:  ## Stops and removes existing all existing containers and volumes, including the database
	@echo "${YELLOW}Stopping running containers and purging existing volumes${RESET}"
	$(DOCKER_COMPOSE) down -v

#================================================================================
# Managing the Docker environment (e.g. starting, stopping, deleting containers)
#================================================================================
start: start-attached ## Start Materia (default: attached mode)

start-attached: ## Start Materia in attached mode
	@echo "${GREEN}Starting Materia in attached mode${RESET}"
	$(DOCKER_COMPOSE) up

start-daemon: ## Start Materia in daemon mode
	@echo "${GREEN}Starting Materia in daemon mode${RESET}"
	@echo "Run \`make start-attached\` to run in attached mode, or view container logs with \`make logs\`"
	$(DOCKER_COMPOSE) up -d

start-backend: ## Start backend containers
	@echo "${GREEN}Starting backend container${RESET}"
	$(DOCKER_COMPOSE) start python

stop-backend: ## Stop backend containers
	@echo "${YELLOW}Stopping backend containers${RESET}"
	$(DOCKER_COMPOSE) stop python

remove-backend: ## Remove backend containers (run `remove-backend-volumes` to purge volumes)
	@echo "${YELLOW}Removing backend containers${RESET}"
	$(DOCKER_COMPOSE) rm python

remove-backend-volumes: ## Remove backend containers and purge their volumes
	@echo "${YELLOW}Removing backend containers and purging their volumes (rm -v)${RESET}"
	$(DOCKER_COMPOSE) rm -v python

logs: ## View container logs (optionally specifying a service name, like `python` or `mysql`)
	$(DOCKER_COMPOSE) logs --tail 10 -f $(filter-out $@,$(MAKECMDGOALS))

#==============================================
# Application management commands
#==============================================
create-superuser: ## Create a new superuser using the Django `createsuperuser` management command
	$(DOCKER_COMPOSE) run --rm python python manage.py createsuperuser

change-password: ## Change user password using 'changepassword' command. Example: make user=your_username change-password
	$(DOCKER_COMPOSE) run --rm python python manage.py changepassword $(user)

lint: lint-backend lint-frontend ## Run backend and frontend linters
lint-backend: ## Run backend code formatter and linter
	$(DOCKER_COMPOSE) run --rm python black .
lint-frontend: ## Run frontend linter
	@echo "${YELLOW}Frontend linting not yet implemented.${RESET}"
lint-check: lint-backend-check lint-frontend-check ## Run backend and frontend linters in check/no-fix mode
lint-backend-check: ## Run backend code formatter and linter in check mode
	$(DOCKER_COMPOSE) run --rm python black . --check
lint-frontend-check: ## Run frontend linter in no-fix mode
	@echo "${YELLOW}Frontend linting not yet implemented.${RESET}"

makemigrations: ## Create database migrations
	@$(DOCKER_COMPOSE) run --rm python python manage.py makemigrations
showmigrations: ## Show database migrations
	@$(DOCKER_COMPOSE) run --rm python python manage.py showmigrations
migrate: ## Run database migrations
	@$(DOCKER_COMPOSE) run --rm python python manage.py migrate
migrate-to: ## Run migrations to a specific point. Example: make migrate-to app=core migration=zero
	@$(DOCKER_COMPOSE) run --rm python python manage.py migrate $(app) $(migration)

shell: ## Run shell in Django context
	@$(DOCKER_COMPOSE) run --rm python python manage.py shell

manage: ## Run Django management command. Example: make manage command="showmigrations"
	@$(DOCKER_COMPOSE) run --rm python python manage.py $(command)

.PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
