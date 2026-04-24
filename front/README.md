# Frontend

This frontend connects to the single FastAPI backend used for both chatbot and appointment booking.

## Development

Start the backend first:

```bash
uvicorn backend.main:app --reload
```

Then start the frontend from the `front` folder:

```bash
npm run dev
```

During local development, Vite proxies these backend routes to `http://localhost:8000`:

- `POST /chatbot`
- `POST /book-appointment`
- `GET /appointments`
