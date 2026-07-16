import db
import json

async def route_dm(connected, sender_id, recipient_username, payload):
    recipient = db.fetch_user_by_username(recipient_username)
    
    if not recipient:
        if sender_id in connected:
            await connected[sender_id].send(json.dumps({"error": "Recipient not found"}))
        return
        
    recipient_id = recipient["id"]
    if recipient_id in connected:
        await connected[recipient_id].send(json.dumps(payload))

async def route_room(connected, sender_id, room_id, payload):
    pass