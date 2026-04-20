import os
import psycopg2
from dotenv import load_dotenv

# Load env
_backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(dotenv_path=os.path.join(_backend_dir, ".env"))

def create_table():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL not found in .env")
        return

    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        print("Checking/Creating 'meeting_bookings' table...")
        
        # Create table SQL
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS meeting_bookings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            ws_id TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            requested_date TEXT NOT NULL,
            requested_time TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """
        
        cur.execute(create_table_sql)
        conn.commit()
        
        print("Table 'meeting_bookings' ensured successfully!")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error creating table: {e}")

if __name__ == "__main__":
    create_table()
