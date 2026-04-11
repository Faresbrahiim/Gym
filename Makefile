# =========================
# CONFIG
# =========================
COMPOSE=docker compose -f Infrastructure/docker-compose.yml

FRONTEND_DIR=Frontend/gym-web

USER_SERVICE=gym-user-service
MEMBERSHIP_SERVICE=membership-service
API_GATEWAY=kong

# =========================
# HELP
# =========================
.PHONY: help
help:
	@echo "==== GYM PROJECT COMMANDS ===="
	@echo "make up              -> start full system"
	@echo "make up-d            -> start system (detached)"
	@echo "make build           -> build all containers"
	@echo "make down            -> stop all"
	@echo "make down-v          -> stop + remove volumes"
	@echo "make restart         -> restart system"
	@echo "make ps              -> list containers"
	@echo "make clean           -> full cleanup"
	@echo ""
	@echo "make docker-logs     -> all docker logs"
	@echo "make logs-s s=name   -> service logs"
	@echo ""
	@echo "make ng              -> run Angular"
	@echo "make ng-install      -> install frontend deps"
	@echo ""
	@echo "make git-status      -> git status"
	@echo "make git-add         -> git add ."
	@echo "make git-commit m=x  -> git commit"
	@echo "make git-push b=x    -> git push"
	@echo "make git-pull b=x    -> git pull"
	@echo "make git-logs        -> git log"

# =========================
# DOCKER CORE
# =========================
build:
	$(COMPOSE) build

up:
	$(COMPOSE) up --build

up-d:
	$(COMPOSE) up --build -d

down:
	$(COMPOSE) down

down-v:
	$(COMPOSE) down -v

restart:
	$(COMPOSE) down && $(COMPOSE) up --build

ps:
	$(COMPOSE) ps

clean:
	docker system prune -af --volumes

# =========================
# LOGS (DOCKER)
# =========================
docker-logs:
	$(COMPOSE) logs -f

logs-s:
	$(COMPOSE) logs -f $(s)

logs-user:
	$(COMPOSE) logs -f $(USER_SERVICE)

logs-membership:
	$(COMPOSE) logs -f $(MEMBERSHIP_SERVICE)

logs-gateway:
	$(COMPOSE) logs -f $(API_GATEWAY)

# =========================
# SHELL ACCESS
# =========================
bash-user:
	$(COMPOSE) exec $(USER_SERVICE) bash

bash-membership:
	$(COMPOSE) exec $(MEMBERSHIP_SERVICE) bash

bash-gateway:
	$(COMPOSE) exec $(API_GATEWAY) bash

# =========================
# FRONTEND (ANGULAR)
# =========================
ng-install:
	cd $(FRONTEND_DIR) && npm install

ng:
	cd $(FRONTEND_DIR) && ng serve

ng-build:
	cd $(FRONTEND_DIR) && ng build --configuration production

# =========================
# GIT COMMANDS
# =========================
add:
	git add .

commit:
	git commit -m "$(m)"

push:
	git push origin $(b)

pull:
	git pull origin $(b)

status:
	git status

git-logs:
	git log --oneline --graph --decorate --all