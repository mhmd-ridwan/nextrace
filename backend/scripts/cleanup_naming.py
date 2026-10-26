import os
import re
import sqlite3

BASE_DIR = r"C:\Users\Administrator\Documents\project\nextrace"


def replace_in_text(text: str) -> str:
    # Perform case-preserving replacements
    # 1. NEXTRACE -> NEXTRACE
    text = re.sub(r"NEXTRACE", "NEXTRACE", text)
    text = re.sub(r"nextrace", "nextrace", text)
    text = re.sub(r"NextRace", "NextRace", text)
    # 2. NEXTRACE -> NEXTRACE
    text = re.sub(r"NEXTRACE", "NEXTRACE", text)
    text = re.sub(r"NextRace", "NextRace", text)
    text = re.sub(r"nextrace", "nextrace", text)
    return text


def clean_files():
    modified_files = []
    for root, dirs, files in os.walk(BASE_DIR):
        dirs[:] = [d for d in dirs if d not in ("node_modules", ".git", "__pycache__", ".venv", ".next")]
        for file in files:
            if file.endswith((".db", ".coverage", ".png", ".jpg", ".ico", ".woff", ".woff2", ".ttf", ".pyc")):
                continue
            path = os.path.join(root, file)
            try:
                with open(path, encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                new_content = replace_in_text(content)
                if new_content != content:
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    modified_files.append(os.path.relpath(path, BASE_DIR))
            except Exception as e:
                print(f"Error processing {path}: {e}")

    print(f"Modified {len(modified_files)} files:")
    for mf in modified_files:
        print(f"  - {mf}")


def clean_db():
    db_path = os.path.join(BASE_DIR, "backend", "nextrace.db")
    if not os.path.exists(db_path):
        print("Database not found:", db_path)
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [r[0] for r in cursor.fetchall() if not r[0].startswith("sqlite_")]

    total_updates = 0
    for table in tables:
        cursor.execute(f"PRAGMA table_info({table});")
        columns = [col[1] for col in cursor.fetchall()]
        for col in columns:
            try:
                # Find all records where column contains lacak
                cursor.execute(f"SELECT rowid, {col} FROM {table} WHERE {col} LIKE '%lacak%'")
                rows = cursor.fetchall()
                for rowid, val in rows:
                    if isinstance(val, str):
                        new_val = replace_in_text(val)
                        if new_val != val:
                            cursor.execute(f"UPDATE {table} SET {col} = ? WHERE rowid = ?", (new_val, rowid))
                            total_updates += 1
            except Exception:
                pass
    conn.commit()
    conn.close()
    print(f"Updated {total_updates} records in database {db_path}")


if __name__ == "__main__":
    clean_files()
    clean_db()
