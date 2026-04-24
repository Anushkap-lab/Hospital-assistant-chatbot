# Hospital Assistant Chatbot

This project uses one FastAPI backend for both chatbot and appointment booking.

## Backend

The single backend entrypoint is [backend/main.py](/d:/Desktop/my%20folder/miniproject/backend/main.py).

Run it from the project root:

```bash
uvicorn backend.main:app --reload
```

Or run it from inside the `backend` folder:

```bash
uvicorn main:app --reload
```

Available API routes:

- `GET /`
- `POST /chatbot`
- `POST /book-appointment`
- `GET /appointments`

## Frontend

Start the Vite frontend from the `front` folder:

```bash
npm run dev
```

The frontend proxies chatbot and appointment requests to `http://localhost:8000`.
