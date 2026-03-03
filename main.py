import os
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
from pymongo import MongoClient
from datetime import datetime, timezone


from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

# Load ENV
load_dotenv()

groq_api = os.getenv("API_KEY")
mongo_uri = os.getenv("MONGO_URI")

# MongoDB
client = MongoClient(mongo_uri)
db = client["hospital_assistant"]
collection = db["chats"]

# FastAPI
app = FastAPI()

# Request Model
class ChatRequest(BaseModel):
    user_id: str
    question: str


# -----------------------------
# HOSPITAL KNOWLEDGE BASE
# -----------------------------

hospital_data = [

"Hospital Name: Mahatme Eye Hospital",

"Location: Nagpur",

"Services: Cataract Surgery, LASIK Surgery, Retina Treatment, Glaucoma Treatment",

"Facilities: Modern operation theatre, Eye testing lab, Pharmacy",

"Insurance: CGHS, Mediclaim accepted",

"Doctors: Dr. Mahatme, Retina specialist",

"Working Hours: 9AM to 6PM Monday to Saturday",

"Emergency: Available",

"Appointments: Patients can book appointments online or by phone",

"Cataract surgery takes around 20 minutes",

"LASIK surgery improves vision permanently",

]


# -----------------------------
# VECTOR DATABASE
# -----------------------------

embeddings = HuggingFaceEmbeddings(
model_name="sentence-transformers/all-MiniLM-L6-v2"
)

vectorstore = FAISS.from_texts(
hospital_data,
embeddings
)

retriever = vectorstore.as_retriever()


# -----------------------------
# PROMPT
# -----------------------------

prompt = ChatPromptTemplate.from_messages([

("system",
"You are Mahatme Eye Hospital assistant chatbot. "
"Answer ONLY from hospital information. "
"If answer not available say 'Please contact hospital.'"
),

("user",
"Hospital Info:\n{context}\n\nQuestion:{question}")

])


# -----------------------------
# LLM
# -----------------------------

llm = ChatGroq(
api_key=groq_api,
model="llama-3.1-8b-instant"
)   


chain = prompt | llm

def get_history(user_id):

    chats = collection.find(
        {"user_id": user_id}
    ).sort("timestamp", 1)

    history = []

    for chat in chats:

        history.append(
            ("user", chat["question"])
        )

        history.append(
            ("assistant", chat["answer"])
        )

    return history
@app.get("/")
def home():

    return {
        "message":
        "Welcome to Hospital Assistant Chatbot API"
    }


# -----------------------------
# CHATBOT ROUTE
# -----------------------------

@app.post("/chatbot")
def chatbot(request: ChatRequest):

    docs = retriever.invoke(
        request.question
    )

    context = ""

    for d in docs:
        context += d.page_content + "\n"


    response = chain.invoke({

        "context": context,

        "question": request.question

    })


    collection.insert_one({

        "user_id": request.user_id,

        "question": request.question,

        "answer": response.content,

        "timestamp": datetime.now(timezone.utc)

    })


    return {

        "response": response.content

    }