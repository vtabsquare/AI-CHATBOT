import os
import sys

_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(_backend_dir)

from services.db_service import DBService
from werkzeug.security import generate_password_hash

def run():
    print("Connecting to DB...")
    db = DBService()
    
    old_emails = ["gokulnathm.vtab@gmail.com", "gokulnath96880@gmail.com"]
    print(f"Removing old admins: {old_emails}")
    
    # Try to find and delete them
    for email in old_emails:
        user = db.get_user_by_email(email)
        if user:
            print(f"Deleting user: {email}")
            db.db.table("users").delete().eq("email", email).execute()
        else:
            print(f"User not found: {email}")
            
    # Add new admin
    new_email = "balamuraleee@gmail.com"
    new_password = "Bala@1234"
    
    print(f"Adding new admin: {new_email}")
    if not db.get_user_by_email(new_email):
        db.create_user("u_admin_1", new_email,
                       generate_password_hash(new_password), "admin", None, new_email)
        print("New admin successfully created.")
    else:
        print("New admin already exists.")

if __name__ == "__main__":
    run()
