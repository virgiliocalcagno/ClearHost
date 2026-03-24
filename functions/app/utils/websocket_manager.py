from typing import List
from fastapi import WebSocket
import json

class ConnectionManager:
    """Gestiona conexiones WebSocket activas para notificaciones real-time."""
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        """Envía un mensaje a todos los clientes conectados."""
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                # Conexión rota, se limpiará en el endpoint
                pass

manager = ConnectionManager()
