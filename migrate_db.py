import sqlite3

def migrate():
    conn = sqlite3.connect('backend/clearhost.db')
    cursor = conn.cursor()
    
    # Check current columns
    cursor.execute("PRAGMA table_info(reservas)")
    columns = [c[1] for c in cursor.fetchall()]
    
    columns_to_add = [
        ('codigo_reserva_canal', 'TEXT'),
        ('telefono_ultimos_4', 'TEXT'),
        ('foto_id_url', 'TEXT'),
        ('self_checkin_complete', 'BOOLEAN DEFAULT 0')
    ]
    
    for col_name, col_type in columns_to_add:
        if col_name not in columns:
            print(f"Adding column {col_name} to reservas...")
            cursor.execute(f"ALTER TABLE reservas ADD COLUMN {col_name} {col_type}")
    
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
