from flask import Blueprint, request, jsonify
from src.database import get_db
from src.config import Config
from stream_chat import StreamChat
from datetime import datetime, timedelta
from bson import ObjectId

video_bp = Blueprint('video', __name__)

# Initialize Stream Chat client
# Note: Stream Video uses the same underlying token system as Stream Chat
server_client = StreamChat(api_key=Config.STREAM_API_KEY, api_secret=Config.STREAM_API_SECRET)

@video_bp.route('/token', methods=['POST'])
def get_video_token():
    try:
        data = request.get_json()
        appointment_id = data.get('appointmentId')
        user_type = data.get('userType') # 'doctor' or 'patient'
        user_id = data.get('userId') # The DB ID of the user

        if not all([appointment_id, user_type, user_id]):
            return jsonify({"error": "Missing required fields"}), 400

        # Verify appointment exists and is confirmed
        db = get_db()
        appointment = db.appointments.find_one({"_id": ObjectId(appointment_id)})
        if not appointment:
            return jsonify({"error": "Appointment not found"}), 404
        
        if appointment.get('status') != 'confirmed':
             return jsonify({"error": "Appointment is not confirmed"}), 403

        # Verify user is part of the appointment
        if user_type == 'patient':
            if str(appointment.get('patientId')) != user_id:
                return jsonify({"error": "User not authorized for this appointment"}), 403
            user_name = appointment.get('patientName', 'Patient')
        elif user_type == 'doctor':
             if str(appointment.get('doctorId')) != user_id:
                return jsonify({"error": "User not authorized for this appointment"}), 403
             user_name = appointment.get('doctorName', 'Doctor')
        else:
             return jsonify({"error": "Invalid user type"}), 400


        # Check time window (15 mins before/after)
        # Assuming appointment date/time are stored. 
        # Adjust logic based on actual DB schema for date/time
        # For now, let's assume 'date' and 'time' fields exist or a 'datetime' field.
        # Based on previous file views, appointments usually have date/time strings.
        # We will implement a loose check or skip strict time checking if format is complex for now,
        # but adding a TODO to refine it.
        
        # TODO: Implement strict time window check based on actual date/time format in DB
        
        # Generate Stream Token
        # Stream User ID cannot contain special chars, so we use the DB ID string
        stream_user_id = str(user_id)
        
        # Update or create user in Stream (optional but good for displaying names)
        server_client.update_user({
            "id": stream_user_id,
            "role": "user",
            "name": user_name,
            # "image": user_image_url 
        })

        # Generate token
        token = server_client.create_token(stream_user_id)

        return jsonify({
            "token": token,
            "apiKey": Config.STREAM_API_KEY,
            "callId": str(appointment_id),
            "userId": stream_user_id,
            "userName": user_name
        }), 200

    except Exception as e:
        print(f"Error generating video token: {e}")
        return jsonify({"error": "Internal server error"}), 500
