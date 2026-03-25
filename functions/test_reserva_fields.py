from datetime import date, time
from app.schemas.reserva import ReservaCreate

def test_reserva_schema():
    print("Probando esquema ReservaCreate con nuevos campos...")
    data = {
        "propiedad_id": "prop-123",
        "nombre_huesped": "Juan Perez",
        "check_in": date(2026, 12, 1),
        "check_out": date(2026, 12, 5),
        "num_huespedes": 2,
        "fuente": "MANUAL",
        "hora_checkin": time(15, 0),
        "hora_checkout": time(11, 0),
        "tipo_documento": "Pasaporte",
        "documento_identidad": "RD12345",
        "nacionalidad": "Dominicana"
    }
    
    try:
        reserva = ReservaCreate(**data)
        print("✅ Esquema validado correctamente.")
        print(f"Objeto creado: {reserva.model_dump()}")
    except Exception as e:
        print(f"❌ Error de validación: {e}")

if __name__ == "__main__":
    test_reserva_schema()
