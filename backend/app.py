import os
from pathlib import Path
from fastapi import FastAPI
from fastapi import HTTPException
from pydantic import BaseModel
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId

BACKEND_DIR = Path(__file__).resolve().parent
ROOT_DIR = BACKEND_DIR.parent

load_dotenv(BACKEND_DIR / ".env")
load_dotenv(ROOT_DIR / ".env", override=False)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

mongo_uri = (
    os.getenv("BOOKING_MONGO_URI")
    or os.getenv("MONGO_URI")
    or "mongodb://localhost:27017"
)

client = MongoClient(mongo_uri)
db = client["book_appointment"]
appointments = db["appointments"]

class Appointment(BaseModel):
    name: str
    phone: str
    date: str
    time: str
    doctor: str | None = None
    purpose: str | None = None


def serialize_appointment(document):
    return {
        "id": str(document["_id"]),
        "name": document["name"],
        "phone": document["phone"],
        "date": document["date"],
        "time": document["time"],
        "doctor": document.get("doctor"),
        "purpose": document.get("purpose"),
        "created_at": document["created_at"],
    }

@app.post("/book-appointment")
def book_appointment(data: Appointment):
    appointment = data.dict()
    appointment["created_at"] = datetime.utcnow()

    try:
        result = appointments.insert_one(appointment)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save appointment: {exc}",
        ) from exc

    saved_appointment = appointments.find_one({"_id": result.inserted_id})
    if not saved_appointment:
        raise HTTPException(
            status_code=500,
            detail="Appointment was submitted but could not be read back from the database.",
        )

    return {
        "message": "Appointment booked successfully",
        "appointment": serialize_appointment(saved_appointment),
    }


@app.get("/appointments")
def list_appointments():
    documents = appointments.find().sort("created_at", -1)
    return {
        "appointments": [serialize_appointment(document) for document in documents]
    }
