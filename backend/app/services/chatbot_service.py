import os
from flask import current_app
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from ..models.doctor import Doctor
from ..models.chat_history import ChatHistory


def get_doctors_context():
    """Get formatted doctors information for the LLM context."""
    doctors = Doctor.find_all()
    if not doctors:
        return "No doctors available in the system."
    
    doctors_info = []
    for doc in doctors:
        doc_dict = Doctor.to_dict(doc)
        doctors_info.append(
            f"- Dr. {doc_dict['name']}: {doc_dict['specialty']} specialist, "
            f"located at {doc_dict['location']}, rating: {doc_dict['rating']}/5"
        )
    
    return "\n".join(doctors_info)


def get_system_prompt():
    """Get the system prompt for the chatbot."""
    doctors_context = get_doctors_context()
    
    return f"""You are a helpful medical assistant chatbot for a healthcare platform. Your role is to:

1. Listen to patients describe their symptoms
2. Based on their symptoms, recommend appropriate doctors from our available specialists
3. Provide helpful health information (but always remind them to consult a doctor)
4. Be empathetic and supportive

AVAILABLE DOCTORS:
{doctors_context}

GUIDELINES:
- When a patient describes symptoms, analyze them and recommend the most appropriate specialist(s)
- Always provide the doctor's name, specialty, and location when recommending
- If symptoms are unclear, ask clarifying questions
- For emergencies, always advise to call emergency services or go to the nearest hospital
- Never diagnose conditions - only suggest appropriate specialists
- Be concise but thorough in your responses
- If symptoms could match multiple specialties, list all relevant options

Remember: You are NOT a replacement for professional medical advice. Always encourage patients to book an appointment with the recommended doctor."""


def create_chat_model():
    """Create and configure the Gemini chat model."""
    api_key = current_app.config.get('GOOGLE_API_KEY') or os.environ.get('GOOGLE_API_KEY')
    
    if not api_key:
        raise ValueError("GOOGLE_API_KEY is not configured. Please set it in environment variables.")
    
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=api_key,
        temperature=0.7,
        convert_system_message_to_human=True
    )


def build_messages_from_history(history_messages):
    """Convert stored messages to LangChain message format."""
    messages = []
    
    for msg in history_messages:
        if msg['role'] == 'user':
            messages.append(HumanMessage(content=msg['content']))
        elif msg['role'] == 'assistant':
            messages.append(AIMessage(content=msg['content']))
    
    return messages


def process_message(user_id, user_message):
    """Process a user message and return AI response."""
    # Get the chat model
    llm = create_chat_model()
    
    # Get existing chat history
    history_messages = ChatHistory.get_messages(user_id)
    
    # Build the message list
    messages = [SystemMessage(content=get_system_prompt())]
    messages.extend(build_messages_from_history(history_messages))
    messages.append(HumanMessage(content=user_message))
    
    # Get AI response
    response = llm.invoke(messages)
    ai_response = response.content
    
    # Store messages in history
    ChatHistory.add_message(user_id, 'user', user_message)
    ChatHistory.add_message(user_id, 'assistant', ai_response)
    
    return ai_response


def get_chat_history(user_id):
    """Get formatted chat history for a user."""
    return ChatHistory.get_messages(user_id)


def clear_chat_history(user_id):
    """Clear chat history for a user."""
    return ChatHistory.clear_history(user_id)
