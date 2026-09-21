import db
import json

async def handle_get_pk(connected, sender_id, target_username):
    public_key = db.fetch_public_key(target_username)

    if sender_id not in connected:
        return

    if public_key is None:
        await connected[sender_id].send(json.dumps({
            "type": "pk_response",
            "username": target_username,
            "public_key": None,
            "error": "User not found or key not registered"
        }))
        return

    await connected[sender_id].send(json.dumps({
        "type": "pk_response",
        "username": target_username,
        "public_key": public_key
    }))

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

async def route_typing(connected, sender_id, payload):
    target = payload.get("to")
    if not target:
        return
        
    recipient = db.fetch_user_by_username(target)
    if not recipient:
        return
        
    recipient_id = recipient["id"]
    if recipient_id in connected:
        sender = next((u["username"] for u in db.fetch_all_users(0) if u["username"] == payload.get("sender")), payload.get("sender"))
        # we can just use payload["sender"] instead of db lookup for simplicity, but let's trust payload for now as it's blind routing.
        await connected[recipient_id].send(json.dumps({
            "type": "typing",
            "sender": payload.get("sender")
        }))