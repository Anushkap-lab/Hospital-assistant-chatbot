import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from pydantic import BaseModel
from pymongo import MongoClient

BACKEND_DIR = Path(__file__).resolve().parent
ROOT_DIR = BACKEND_DIR.parent

load_dotenv(BACKEND_DIR / ".env")
load_dotenv(ROOT_DIR / ".env", override=False)

groq_api = os.getenv("API_KEY")
mongo_uri = os.getenv("MONGO_URI") or "mongodb://localhost:27017"

client = MongoClient(mongo_uri)

db = client["hospital_assistant"]
chat_collection = db["chats"]
appointments = db["appointments"]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    user_id: str
    question: str


class Appointment(BaseModel):
    name: str
    phone: str
    date: str
    time: str
    doctor: str | None = None
    purpose: str | None = None


hospital_data = [
    "Hospital Name: Mahatme Eye Hospital",
    "Location: Nagpur",
    "Services: Cataract Surgery, LASIK Surgery, Retina Treatment, Glaucoma Treatment",
    "Facilities: Modern operation theatre, Eye testing lab, Pharmacy",
    "Insurance: CGHS, Mediclaim accepted",
    "Working Hours: 9AM to 6PM Monday to Saturday",
    "Emergency: Available",
    "Appointments: Patients can book appointments online or by phone",
    "Cataract surgery takes around 20 minutes",
    "LASIK surgery improves vision permanently",
]

faq_path = BACKEND_DIR / "data" / "faq.json"
with faq_path.open(encoding="utf-8") as file:
    faqs = json.load(file)

knowledge_base = hospital_data + [
    f"Question: {faq['question']} Answer: {faq['answer']}"
    for faq in faqs
]

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """You are a helpful hospital assistant.
Use the hospital information provided.
Dont give long answers just give brief answers.
If exact answer is not found, give a helpful general response and suggest contacting the hospital.""",
        ),
        (
            "user",
            "Hospital Info:\n{context}\n\nQuestion: {question}",
        ),
    ]
)

llm = ChatGroq(
    api_key=groq_api,
    model="llama-3.1-8b-instant",
)

chain = prompt | llm


def tokenize(text: str) -> set[str]:
    return set(re.findall(r"\b[a-z0-9]+\b", text.lower()))


def get_relevant_context(question: str, limit: int = 3) -> str:
    question_tokens = tokenize(question)
    scored_items = []

    for item in knowledge_base:
        item_tokens = tokenize(item)
        overlap = len(question_tokens & item_tokens)
        if overlap > 0:
            scored_items.append((overlap, item))

    scored_items.sort(key=lambda entry: entry[0], reverse=True)
    selected_items = [item for _, item in scored_items[:limit]]

    if not selected_items:
        selected_items = knowledge_base[:limit]

    return "\n".join(selected_items)


def get_history(user_id: str):
    chats = (
        chat_collection.find({"user_id": user_id})
        .sort("timestamp", -1)
        .limit(6)
    )

    history = []
    for chat in list(chats)[::-1]:
        history.append(HumanMessage(content=chat["question"]))
        history.append(AIMessage(content=chat["answer"]))

    return history


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


@app.get("/")
def home():
    return {
        "message": "Welcome to Hospital Assistant Chatbot API",
        "routes": ["/chatbot", "/book-appointment", "/appointments"],
    }


@app.post("/chatbot")
def chatbot(request: ChatRequest):
    context = get_relevant_context(request.question)

    chat_history = get_history(request.user_id)
    response = chain.invoke(
        {
            "context": context,
            "question": request.question,
            "chat_history": chat_history,
        }
    )

    chat_collection.insert_one(
        {
            "user_id": request.user_id,
            "question": request.question,
            "answer": response.content,
            "timestamp": datetime.now(timezone.utc),
        }
    )

    return {"response": response.content}


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
