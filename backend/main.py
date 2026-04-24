import json
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
from langchain_core.messages import HumanMessage, AIMessage

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
    user_id: str
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

with open("data/faq.json") as f:
    faqs = json.load(f)

faq_texts = [
    f"Question: {faq['question']} Answer: {faq['answer']}"
    for faq in faqs
]

vectorstore = FAISS.from_texts(
    hospital_data + faq_texts,
    embeddings
)

retriever = vectorstore.as_retriever(
    search_kwargs={"k": 3}
)




prompt = ChatPromptTemplate.from_messages([

("system",
"""You are a helpful hospital assistant.
Use the hospital information provided.
Dont give long answers just give brief answers
If exact answer is not found, give a helpful general response and suggest contacting the hospital."""
),

("user",
"Hospital Info:\n{context}\n\nQuestion:{question}")

])




llm = ChatGroq(
api_key=groq_api,
model="llama-3.1-8b-instant"
)   


chain = prompt | llm



def get_history(user_id):

    chats = collection.find(
        {"user_id": user_id}
    ).sort("timestamp", -1).limit(6)  # last 6 messages

    history = []

    # Reverse to maintain correct order
    chats = list(chats)[::-1]

    for chat in chats:
        history.append(HumanMessage(content=chat["question"]))
        history.append(AIMessage(content=chat["answer"]))

    return history


@app.get("/")
def home():

    return {
        "message":
        "Welcome to Hospital Assistant Chatbot API"
    }




@app.post("/chatbot")
def chatbot(request: ChatRequest):

  
    docs = retriever.invoke(request.question)

    context = "\n".join([d.page_content for d in docs])


    chat_history = get_history(request.user_id)


    response = chain.invoke({
        "context": context,
        "question": request.question,
        "chat_history": chat_history
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
