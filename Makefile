# Rekan — Makefile
# NOTE: In the Emergent environment, backend (:8001) and frontend (:3000) are
# managed by supervisor (see `make dev`). Ports 8000/5173 in SPEC map to these.

.PHONY: dev seed check test

dev:
	@echo "Services are managed by supervisor in this environment."
	@echo "  backend  -> 0.0.0.0:8001 (/api)"
	@echo "  frontend -> 0.0.0.0:3000"
	sudo supervisorctl status || true

seed:
	cd backend && python seed.py

check:
	cd backend && ruff check . || true
	cd frontend && yarn build

test:
	cd /app && python -m pytest tests -n 0 -q
