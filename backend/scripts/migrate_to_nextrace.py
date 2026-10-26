import os
import shutil
import sqlite3

backend_dir = r"C:\Users\Administrator\Documents\project\nextrace\backend"
old_db = os.path.join(backend_dir, "nextrace.db")
new_db = os.path.join(backend_dir, "nextrace.db")

if os.path.exists(old_db):
    shutil.copyfile(old_db, new_db)
    print("Copied nextrace.db to nextrace.db")

conn = sqlite3.connect(new_db)
c = conn.cursor()
tables = [r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
print("Tables in nextrace.db:", tables)

migrated = 0
for table in tables:
    if table.startswith("sqlite_") or table == "alembic_version":
        continue
    cols = [r[1] for r in c.execute(f"PRAGMA table_info({table})").fetchall()]
    for col in cols:
        try:
            query_find = f"SELECT rowid, {col} FROM {table} WHERE {col} LIKE '%nextrace%' OR {col} LIKE '%NEXTRACE%'"
            rows = c.execute(query_find).fetchall()
            for rowid, val in rows:
                if isinstance(val, str):
                    new_val = (
                        val.replace("nextrace", "nextrace")
                        .replace("NEXTRACE", "NEXTRACE")
                        .replace("NextRace", "NextRace")
                        .replace("NEXTRACE", "NextRace")
                    )
                    c.execute(
                        f"UPDATE {table} SET {col} = ? WHERE rowid = ?",
                        (new_val, rowid),
                    )
                    migrated += 1
        except Exception:
            pass

conn.commit()
print(f"Total fields migrated in database: {migrated}")
conn.close()
