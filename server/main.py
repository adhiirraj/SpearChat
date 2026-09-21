import asyncio
import websockets
import json
import auth
import router
import db
import init_db

init_db.init_db()

connected = {}

async def handler(websocket):
    user_id = None
    try:
        async for message in websocket:
            data = json.loads(message)
            msg_type = data.get("type")
            
            if msg_type == "register":
                res = auth.register(data.get("username"), data.get("password"))
                if "error" in res:
                    await websocket.send(json.dumps({"error": res["error"]}))
                else:
                    await websocket.send(json.dumps({"type": "register_success"}))
                    
            elif msg_type == "login":
                res = auth.login(data.get("username"), data.get("password"))
                if "error" in res:
                    await websocket.send(json.dumps({"error": res["error"]}))
                else:
                    await websocket.send(json.dumps({
                        "type": "login_success", 
                        "token": res["token"]
                    }))
                    
            elif msg_type == "auth":
                uid = auth.verify_token(data.get("token"))
                if not uid:
                    await websocket.send(json.dumps({"error": "Invalid token"}))
                    await websocket.close()
                    return
                user_id = uid
                connected[uid] = websocket
                await websocket.send(json.dumps({"type": "auth_success"}))
                
            elif user_id is not None:
                if msg_type == "register_pk":
                    db.update_public_key(user_id, data.get("public_key"))
                elif msg_type == "get_pk":
                    await router.handle_get_pk(connected, user_id, data.get("username"))
                elif msg_type == "fetch_sidebar":
                    users = db.fetch_all_users(user_id)
                    rooms = db.fetch_user_rooms(user_id)
                    await websocket.send(json.dumps({
                        "type": "sidebar_data",
                        "dms": [{"username": u["username"]} for u in users],
                        "rooms": rooms
                    }))
                elif msg_type == "typing":
                    await router.route_typing(connected, user_id, data)
                elif msg_type == "dm":
                    await router.route_dm(connected, user_id, data.get("to"), data)
                elif msg_type == "room":
                    await router.route_room(connected, user_id, data.get("room_id"), data)
                    
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        if user_id in connected:
            del connected[user_id]

async def main():
    async with websockets.serve(handler, "0.0.0.0", 8765):
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())