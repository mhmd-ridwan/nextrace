"""
NEXTRACE Real-time Profile Scraper Service.
Extracts profile metadata (display name, bio, avatar) from public social media
and web profiles using HTTP OpenGraph extraction with Edge Headless fallback.
"""

import html
import os
import re
import subprocess
import urllib.request
from urllib.parse import urlparse

from PIL import Image

from app.core.config import get_settings
from app.core.security import generate_id


class ProfileScraperService:
    """Scrapes public profile information and downloads avatar images."""

    def __init__(self):
        self.settings = get_settings()
        self.uploads_dir = self.settings.uploads_dir
        self.uploads_dir.mkdir(parents=True, exist_ok=True)
        self.edge_path = self._find_edge_path()

    def _find_edge_path(self) -> str | None:
        candidates = [
            r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        ]
        for c in candidates:
            if os.path.exists(c):
                return c
        return None

    def normalize_profile_url(self, query: str, platform: str = "Instagram") -> str:
        """Convert a username or partial string into a standard profile URL."""
        q = query.strip()
        if q.startswith("http://") or q.startswith("https://"):
            return q

        clean_user = q.replace("@", "").strip()
        plat = platform.lower()

        if "instagram" in plat:
            return f"https://www.instagram.com/{clean_user}/"
        elif "tiktok" in plat:
            return f"https://www.tiktok.com/@{clean_user}"
        elif "facebook" in plat:
            return f"https://www.facebook.com/{clean_user}"
        elif "twitter" in plat or "x" in plat:
            return f"https://x.com/{clean_user}"
        elif "shopee" in plat:
            return f"https://shopee.co.id/{clean_user}"
        else:
            return f"https://{clean_user}"

    def scrape(self, url_or_handle: str, platform: str = "Instagram") -> dict:
        """
        Scrapes public profile metadata and downloads avatar.

        Returns dict with:
            - success: bool
            - platform: str
            - username: str
            - display_name: str | None
            - bio: str | None
            - avatar_url: str | None
            - avatar_path: str | None
            - contact_info: dict
            - error: str | None
        """
        url = self.normalize_profile_url(url_or_handle, platform)
        parsed = urlparse(url)

        # Derive username from path
        path_parts = [p for p in parsed.path.strip("/").split("/") if p]
        username = path_parts[0].replace("@", "") if path_parts else url_or_handle.replace("@", "")

        result = {
            "success": False,
            "platform": platform,
            "profile_url": url,
            "username": username,
            "display_name": None,
            "bio": None,
            "avatar_url": None,
            "avatar_path": None,
            "contact_info": {},
            "error": None,
        }

        # Step 1: Try fast HTTP OpenGraph extraction
        html_content = self._fetch_http(url)

        # Step 2: If HTTP returns error/login wall (e.g. Instagram), use Edge headless dump-dom
        og_img, og_title, og_desc = self._extract_og_tags(html_content)

        if not og_img and self.edge_path:
            dom_content = self._fetch_edge_dom(url)
            if dom_content:
                e_img, e_title, e_desc = self._extract_og_tags(dom_content)
                og_img = og_img or e_img
                og_title = og_title or e_title
                og_desc = og_desc or e_desc

        if og_desc:
            result["bio"] = html.unescape(og_desc).strip()
            # Extract possible phone numbers in bio
            phones = re.findall(r"(?:\+62|62|08)[0-9\s\-]{8,14}", result["bio"])
            if phones:
                result["contact_info"]["whatsapp"] = phones[0].replace(" ", "").replace("-", "")

            # Extract real display name from bio pattern like "from Muhamad Ridwan (@mhmmd.ridwan)"
            bio_name_match = re.search(r"from\s+([^(@|•|-]+)\s+\(@", result["bio"])
            if bio_name_match:
                result["display_name"] = bio_name_match.group(1).strip()

        if og_title and not result["display_name"]:
            # Parse display name from title like "Muhamad Ridwan (@mhmmd.ridwan) • Instagram photos"
            clean_title = html.unescape(og_title)
            title_match = re.match(r"^([^(@|•|-]+)", clean_title)
            if title_match and title_match.group(1).strip().lower() not in [
                "instagram",
                "tiktok",
                "facebook",
            ]:
                result["display_name"] = title_match.group(1).strip()
            else:
                fallback_name = clean_title.split("|")[0].split("•")[0].strip()
                if fallback_name.lower() not in ["instagram", "tiktok", "facebook"]:
                    result["display_name"] = fallback_name

        if og_img:
            clean_img_url = html.unescape(og_img)
            result["avatar_url"] = clean_img_url
            downloaded_path = self._download_avatar(clean_img_url, username)
            if downloaded_path:
                result["avatar_path"] = downloaded_path
                result["success"] = True

        if result["display_name"] or result["avatar_path"] or result["bio"]:
            result["success"] = True
            result["contact_info"]["is_active"] = True
            result["contact_info"]["activity_status"] = "active"
            result["contact_info"]["activity_details"] = "Profil aktif beroperasi di platform publik"
        else:
            result["error"] = "Profile is private or anti-scraping wall active"
            result["contact_info"]["is_active"] = False
            result["contact_info"]["activity_status"] = "inactive"
            result["contact_info"]["activity_details"] = "Profil tidak aktif atau tidak ditemukan publik"

        return result

    def _fetch_http(self, url: str) -> str:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "id,en-US,en;q=0.9",
        }
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=6) as resp:
                return resp.read().decode("utf-8", errors="ignore")
        except Exception:
            return ""

    def _fetch_edge_dom(self, url: str) -> str:
        if not self.edge_path:
            return ""
        try:
            cmd = [
                self.edge_path,
                "--headless=new",
                "--disable-gpu",
                "--dump-dom",
                url,
            ]
            proc = subprocess.run(
                cmd,
                capture_output=True,
                timeout=12,
                text=True,
                encoding="utf-8",
                errors="ignore",
            )
            return proc.stdout or ""
        except Exception as e:
            print("Edge dump-dom error:", e)
            return ""

    def _extract_og_tags(self, html_text: str) -> tuple[str | None, str | None, str | None]:
        if not html_text:
            return None, None, None

        og_img = re.search(r'property=["\']og:image["\']\s+content=["\']([^"\']+)["\']', html_text) or re.search(
            r'content=["\']([^"\']+)["\']\s+property=["\']og:image["\']', html_text
        )
        og_title = (
            re.search(r'property=["\']og:title["\']\s+content=["\']([^"\']+)["\']', html_text)
            or re.search(r'content=["\']([^"\']+)["\']\s+property=["\']og:title["\']', html_text)
            or re.search(r"<title>([^<]+)</title>", html_text)
        )
        og_desc = (
            re.search(
                r'property=["\']og:description["\']\s+content=["\']([^"\']+)["\']',
                html_text,
            )
            or re.search(
                r'content=["\']([^"\']+)["\']\s+property=["\']og:description["\']',
                html_text,
            )
            or re.search(r'name=["\']description["\']\s+content=["\']([^"\']+)["\']', html_text)
        )

        img_val = og_img.group(1) if og_img else None
        title_val = og_title.group(1) if og_title else None
        desc_val = og_desc.group(1) if og_desc else None

        return img_val, title_val, desc_val

    def _download_avatar(self, img_url: str, username: str) -> str | None:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        }
        try:
            req = urllib.request.Request(img_url, headers=headers)
            with urllib.request.urlopen(req, timeout=8) as resp:
                content = resp.read()
                if len(content) < 500:
                    return None

                # Generate clean filename
                safe_user = re.sub(r"[^a-zA-Z0-9_-]", "_", username)
                filename = f"avatar_scraped_{safe_user}_{generate_id()[:6]}.jpg"
                target_path = self.uploads_dir / filename
                target_path.write_bytes(content)

                # Verify PIL can open it
                try:
                    with Image.open(target_path) as im:
                        im.verify()
                    return str(target_path)
                except Exception:
                    return None
        except Exception as e:
            print("Avatar download error:", e)
            return None
