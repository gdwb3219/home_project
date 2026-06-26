# Home Project — 주식 포트폴리오 대시보드

React + Django + MongoDB 스택으로 보유 종목과 현재가를 관리하는 홈 프로젝트입니다.

## 프로젝트 구조

```
04_Home_Project/
├── frontend/          # React (Vite)
├── backend/           # Django REST API
├── docker-compose.yml # MongoDB
└── README.md
```

## 사전 요구사항

- Node.js 20+
- Python 3.11+
- Docker Desktop (MongoDB용)

## 빠른 시작

### 1. MongoDB 실행

```bash
docker compose up -d
```

### 2. 백엔드 실행

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py runserver
```

API: http://localhost:8000/api/health/

### 3. 프론트엔드 실행

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

대시보드: http://localhost:5173

## API 엔드포인트

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/health/` | 서버 상태 확인 |
| GET/POST | `/api/portfolios/` | 포트폴리오 조회/등록 |
| GET | `/api/prices/` | 현재가 스냅샷 조회 |

### 포트폴리오 등록 예시

```bash
curl -X POST http://localhost:8000/api/portfolios/ \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"default\",\"holdings\":[{\"symbol\":\"005930\",\"name\":\"삼성전자\",\"category\":\"국내주식\",\"quantity\":10}]}"
```

## 다음 단계

- [ ] 보유 종목 CSV/엑셀 import
- [ ] 외부 API 현재가 수집 (`portfolio/services/price_fetcher.py`)
- [ ] Celery/APScheduler로 주기적 저장
- [ ] 대시보드 차트 및 수익률 계산

## 기술 스택

- **Frontend**: React 18, Vite
- **Backend**: Django 5, Django REST Framework
- **Database**: MongoDB (MongoEngine), SQLite (Django admin용)
