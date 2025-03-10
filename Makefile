PYTHON_VERSION="3.12.1"
COMPOSE_FILE=docker/docker-compose.yml
DOCKER_COMPOSE=docker compose -f $(COMPOSE_FILE)

# finds the path in which this makefile is running, for subsequent use in generating a docker container name
APP_PATH := $(notdir $(abspath $(dir $(lastword $(MAKEFILE_LIST)))))
# this is a bit presumptive, there may be a smarter way of confirming this via docker compose
DOCKER_CONTAINER=${APP_PATH}-python-1

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

# reusable recipe to run a command in the app container if it's available,
#  or in a throwaway temporary container if it's not
# optionally allow commands to run in -it mode for bash or shell sessions
run-docker-command:
	@if docker ps --filter name=${DOCKER_CONTAINER} | grep ${DOCKER_CONTAINER} > /dev/null; then \
		if [ -n "$(IT_MODE)" ]; then \
			docker exec -it ${DOCKER_CONTAINER} ${DOCKER_COMMAND}; \
		else \
			docker exec ${DOCKER_CONTAINER} ${DOCKER_COMMAND}; \
		fi \
	else \
		$(DOCKER_COMPOSE) run --rm python ${DOCKER_COMMAND}; \
	fi

#==============================================
# Setting up the local development environment
#==============================================
dev-check: ## Check to make sure pyenv and virtualenv are installed
	@echo "Checking for pyenv"
	@pyenv --version 2> /dev/null || echo "${YELLOW}pyenv not installed${RESET}"
	@echo "Checking for virtualenv"
	@pyenv virtualenv --version 2> /dev/null || echo "${YELLOW}virtualenv not installed${RESET}"
	@echo "Checking for Python version $(PYTHON_VERSION)"
	@pyenv versions | grep $(PYTHON_VERSION) 2> /dev/null || echo "${YELLOW}python version $(PYTHON_VERSION) not installed${RESET} - run ${RED}pyenv install $(PYTHON_VERSION)${RESET}"

dev-setup: ## Create virtual environment
	@make dev-check
	@echo "Creating virtual environment named 'materia-local'"
	@pyenv virtualenv $(PYTHON_VERSION) materia-local || echo "Virtual environment 'materia-local' already exists"
	@pyenv local materia-local
	@echo "Installing Python dependencies"
	@pip install -r ./requirements-dev.txt
	@echo "Installing pre-commit hooks"
	@pre-commit install

dev-remove: ## Remove virtual environment
	@pyenv uninstall materia-local

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
	@$(MAKE) run-docker-command DOCKER_COMMAND="python manage.py createsuperuser"

change-password: ## Change user password using 'changepassword' command. Example: make user=your_username change-password
	@$(MAKE) run-docker-command DOCKER_COMMAND="python manage.py changepassword $(user)"

lint: lint-backend lint-frontend ## Run backend and frontend linters
lint-check: lint-backend-check lint-frontend-check ## Run backend and frontend linters in check/no-fix mode

lint-backend: ## Run backend code formatter and linter
	@if pyenv virtualenvs | grep materia-local >> /dev/null; then \
		black ./app/**/*.py; \
	else \
		$(MAKE) run-docker-command black .; \
	fi
lint-backend-check: ## Run backend code formatter and linter in check mode
	@if pyenv virtualenvs | grep materia-local >> /dev/null; then \
		black ./app/**/*.py --check; \
	else \
		$(MAKE) run-docker-command black . --check; \
	fi

lint-frontend: ## Run frontend linter
	@echo "${YELLOW}Frontend linting not yet implemented.${RESET}"
lint-frontend-check: ## Run frontend linter in no-fix mode
	@echo "${YELLOW}Frontend linting not yet implemented.${RESET}"

make-migrations: ## Create database migrations
	@$(MAKE) run-docker-command DOCKER_COMMAND="python manage.py makemigrations"
show-migrations: ## Show database migrations
	@$(MAKE) run-docker-command DOCKER_COMMAND="python manage.py showmigrations"
migrate: ## Run database migrations
	@$(MAKE) run-docker-command DOCKER_COMMAND="python manage.py migrate"
migrate-app: ## Run migrations for a specific app to a specific point. Example: make migrate-to app=auth
	@$(MAKE) run-docker-command DOCKER_COMMAND="python manage.py migrate $(app)
migrate-app-to: ## Run migrations for a specific app to a specific point. Example: make migrate-to app=core migration=zero
	@$(MAKE) run-docker-command DOCKER_COMMAND="python manage.py migrate $(app) $(migration)"

# repeating container detection since these functions have to run in interactive TTY mode, unlike the rest
bash: ## Start a Bash session in the application's Python container if it's running
	@$(MAKE) run-docker-command IT_MODE=1 DOCKER_COMMAND="bash"
shell: ## Run shell in Django context
	@$(MAKE) run-docker-command IT_MODE=1 DOCKER_COMMAND="python manage.py shell"

manage: ## Run Django management command. Example: make manage command="showmigrations"
	@$(DOCKER_COMPOSE) run --rm python python manage.py $(command)

.PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
