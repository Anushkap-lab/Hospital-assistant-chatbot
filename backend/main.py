import json
import os
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain_community.vectorstores import FAISS
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from pydantic import BaseModel
from pymongo import MongoClient

BACKEND_DIR = Path(__file__).resolve().parent
ROOT_DIR = BACKEND_DIR.parent

load_dotenv(BACKEND_DIR / ".env")
load_dotenv(ROOT_DIR / ".env", override=False)

groq_api = os.getenv("API_KEY")
mongo_uri = (
    os.getenv("MONGO_URI")
    or os.getenv("BOOKING_MONGO_URI")
    or "mongodb://localhost:27017"
)

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

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

faq_path = BACKEND_DIR / "data" / "faq.json"
with faq_path.open(encoding="utf-8") as file:
    faqs = json.load(file)

faq_texts = [
    f"Question: {faq['question']} Answer: {faq['answer']}"
    for faq in faqs
]

vectorstore = FAISS.from_texts(
    hospital_data + faq_texts,
    embeddings,
)

retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

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
    docs = retriever.invoke(request.question)
    context = "\n".join([doc.page_content for doc in docs])

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
