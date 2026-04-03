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
from fastapi.middleware.cors import CORSMiddleware


load_dotenv()

groq_api = os.getenv("API_KEY")
mongo_uri = os.getenv("MONGO_URI")


client = MongoClient(mongo_uri)
db = client["hospital_assistant"]
collection = db["chats"]


app = FastAPI()



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    question: str





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

vectorstore = FAISS.from_texts(
hospital_data,
embeddings
)

retriever = vectorstore.as_retriever()




prompt = ChatPromptTemplate.from_messages([

("system",
"You are Mahatme Eye Hospital assistant chatbot. "
"Answer ONLY from hospital information. "
"If answer not available say 'Please contact hospital.'"
),

("user",
"Hospital Info:\n{context}\n\nQuestion:{question}")

])




llm = ChatGroq(
api_key=groq_api,
model="llama-3.1-8b-instant"
)   


chain = prompt | llm


history = []

    

@app.get("/")
def home():

    return {
        "message":
        "Welcome to Hospital Assistant Chatbot API"
    }




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

@app.get("/api/history")
async def get_history():
    chats = list(collection.find({}, {"_id": 0}))
    return {"history": chats}