# 🏠 ClearHost PMS

**Property Management System para Rentas Vacacionales**

Sistema integral de gestión de propiedades vacacionales con sincronización iCal, automatización de tareas de limpieza, y app móvil para staff.

---

## 🏗️ Arquitectura

```
ClearHost/
├── backend/          ← API REST (FastAPI + SQLAlchemy)
│   ├── app/
│   │   ├── models/   ← Propiedad, UsuarioStaff, Reserva, TareaLimpieza
│   │   ├── schemas/  ← Validación Pydantic
│   │   ├── routers/  ← Endpoints CRUD
│   │   └── services/ ← iCal sync, automatización, push notifications
│   └── uploads/      ← Fotos de evidencia
│
└── mobile/           ← App Staff (React Native + Expo)
    └── src/
        ├── screens/  ← Login, Calendario, TareaDetalle, Checklist, Auditoría, Cámara
        └── services/ ← API client, Push notifications
```

## 🚀 Inicio Rápido

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Abrir **http://localhost:8000/docs** para la documentación interactiva Swagger.

### App Móvil

```bash
cd mobile
npm install
npx expo start
```

Escanear el QR con Expo Go en tu dispositivo.

## 📋 Funcionalidades MVP

| Función | Estado |
|---|---|
| CRUD Propiedades, Staff, Reservas, Tareas | ✅ |
| Sincronización iCal (Airbnb, Booking, VRBO) | ✅ |
| Auto-creación de tareas al detectar check-out | ✅ |
| Asignación automática round-robin del staff | ✅ |
| Checklist digital con validaciones booleanas | ✅ |
| Auditoría de activos por propiedad | ✅ |
| Fotos de evidencia (antes/después) obligatorias | ✅ |
| Push notifications (Clean & Ready → Admin) | ✅ |
| Cron: Recordatorios al staff (incluye lavado) | ✅ |
| Cron: Alertas de tareas pendientes a admins | ✅ |
| Auth JWT con login | ✅ |

## 🔧 Configuración

Copiar `.env.example` a `.env` y configurar:

```env
DATABASE_URL=sqlite+aiosqlite:///./clearhost.db  # Dev
# DATABASE_URL=postgresql+asyncpg://user:pass@host/db  # Producción
SECRET_KEY=tu-clave-secreta
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
```

## 📱 Endpoints Principales

- `POST /api/staff/login` — Auth
- `GET /api/tareas/hoy/{staff_id}` — Tareas del día
- `PUT /api/tareas/{id}/checklist` — Actualizar checklist
- `PUT /api/tareas/{id}/auditoria` — Auditoría de activos
- `POST /api/tareas/{id}/fotos` — Subir fotos
- `PUT /api/tareas/{id}/completar` — Marcar Clean & Ready (→ push al admin)
- `POST /api/reservas/sync-ical/{propiedad_id}` — Sync iCal manual
