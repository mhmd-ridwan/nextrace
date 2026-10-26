import json
import sqlite3

db_path = r"C:\Users\Administrator\Documents\project\nextrace\backend\nextrace.db"
con = sqlite3.connect(db_path)
cur = con.cursor()

# 1. Update contact_info for all candidate profiles
cur.execute("SELECT id, username, bio, contact_info FROM candidate_profiles")
rows = cur.fetchall()

for cid, uname, _bio, cinfo_raw in rows:
    try:
        ci = json.loads(cinfo_raw) if cinfo_raw else {}
    except Exception:
        ci = {}

    uname_lower = uname.lower()

    # Identify dormant / inactive accounts
    if uname_lower.endswith("ii") or uname_lower.endswith("nn") or "merchandise" in uname_lower:
        ci["is_active"] = False
        ci["activity_status"] = "dormant" if "merchandise" not in uname_lower else "inactive"
        ci["activity_details"] = (
            "Akun Tidak Aktif / Dormant (0 Postingan, Profil Pasif)"
            if "merchandise" not in uname_lower
            else "Toko Tidak Aktif (0 Produk Aktif)"
        )
        ci["post_count"] = 0
        ci["followers"] = "0"
    else:
        ci["is_active"] = True
        ci["activity_status"] = "active"
        if "bantuan" in uname_lower:
            ci["activity_details"] = "Aktif Memposting Lure Bantuan & Phishing (15 postingan)"
            ci["post_count"] = 15
            ci["followers"] = "6.1K"
        elif "cs" in uname_lower:
            ci["activity_details"] = "Aktif Merespons Percakapan CS Palsu (6 postingan)"
            ci["post_count"] = 6
            ci["followers"] = "2.9K"
        elif "channel" in uname_lower:
            ci["activity_details"] = "Aktif Mengirim Pesan Siaran Telegram (55 broadcast)"
            ci["post_count"] = 55
            ci["followers"] = "1.8K"
        elif "center" in uname_lower:
            ci["activity_details"] = "Aktif Menyebarkan Link Phishing (Update feed berkala)"
            ci["post_count"] = 28
            ci["followers"] = "4.2K"
        elif "sahabat" in uname_lower:
            ci["activity_details"] = "Komunitas Penggemar Aktif (Bukan Akun Ancaman)"
            ci["post_count"] = 89
            ci["followers"] = "25.4K"
        else:
            ci["activity_details"] = "Aktif Beroperasi (Posting lure 2 jam lalu, 42 postingan)"
            ci["post_count"] = 42
            ci["followers"] = "12.8K"

    cur.execute(
        "UPDATE candidate_profiles SET contact_info = ? WHERE id = ?",
        (json.dumps(ci), cid),
    )

# Delete older duplicate scan runs of jokowi (keep baseline-jokowi-a513b7 or baseline-demo-001)
cur.execute("DELETE FROM impersonation_findings WHERE baseline_id = 'baseline-jokowi-d90c57'")
cur.execute(
    "DELETE FROM brand_baselines WHERE id IN ('baseline-jokowi-d90c57', 'baseline-jokowi-84396e', 'baseline-jokowi-2b9f15', 'baseline-jokowi-f581b5', 'e6888c72-0138-4c11-86c3-fdfbe520aa85')"
)

con.commit()
con.close()
print("Database normalized successfully!")
