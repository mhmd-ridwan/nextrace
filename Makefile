.PHONY: help install run test migrate seed lint docker-build docker-up docker-down clean

help:
	@echo "NEXTRACE — Integrated Identity Protection & Digital Evidence Platform"
	@echo ""
	@echo "Available targets:"
	@echo "  install      Install Python dependencies"
	@echo "  run          Start FastAPI backend server (uvicorn)"
	@echo "  frontend-run Start Next.js frontend server"
	@echo "  frontend-build Build Next.js production bundle"
	@echo "  test         Run pytest test suite with coverage"
	@echo "  migrate      Run database migrations (alembic upgrade head)"
	@echo "  seed         Seed synthetic demonstration dataset"
	@echo "  docker-up    Start backend container via docker-compose"
	@echo "  docker-down  Stop docker-compose containers"
	@echo "  clean        Remove temporary files and test caches"

install:
	cd backend && pip install -r requirements.txt

run:
	cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

frontend-install:
	cd frontend && npm install

frontend-run:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

test:
	cd backend && pytest -v --cov=app tests/

migrate:
	cd backend && alembic upgrade head

seed:
	cd backend && python -c "import asyncio; from app.db.session import init_db; from app.db.seed import seed_demo_data; asyncio.run(init_db()); asyncio.run(seed_demo_data())"

docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

clean:
	rm -rf backend/.pytest_cache backend/__pycache__ backend/app/**/__pycache__
