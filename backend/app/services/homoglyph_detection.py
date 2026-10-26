"""
NEXTRACE Homoglyph / Confusable Character Detection Service.
Identifies Unicode characters that visually resemble Latin characters.
"""

import unicodedata


class HomoglyphDetectionService:
    """Detects confusable/homoglyph characters in text."""

    # Map of confusable characters: Unicode char -> (Latin equivalent, script name)
    CONFUSABLE_MAP: dict[str, tuple[str, str]] = {
        # Cyrillic -> Latin
        "\u0430": ("a", "Cyrillic"),  # а
        "\u0435": ("e", "Cyrillic"),  # е
        "\u043e": ("o", "Cyrillic"),  # о
        "\u0440": ("p", "Cyrillic"),  # р
        "\u0441": ("c", "Cyrillic"),  # с
        "\u0443": ("y", "Cyrillic"),  # у
        "\u0445": ("x", "Cyrillic"),  # х
        "\u0456": ("i", "Cyrillic"),  # і
        "\u0458": ("j", "Cyrillic"),  # ј
        "\u04bb": ("h", "Cyrillic"),  # һ
        "\u0410": ("A", "Cyrillic"),  # А
        "\u0412": ("B", "Cyrillic"),  # В
        "\u0415": ("E", "Cyrillic"),  # Е
        "\u041a": ("K", "Cyrillic"),  # К
        "\u041c": ("M", "Cyrillic"),  # М
        "\u041d": ("H", "Cyrillic"),  # Н
        "\u041e": ("O", "Cyrillic"),  # О
        "\u0420": ("P", "Cyrillic"),  # Р
        "\u0421": ("C", "Cyrillic"),  # С
        "\u0422": ("T", "Cyrillic"),  # Т
        "\u0425": ("X", "Cyrillic"),  # Х
        # Greek -> Latin
        "\u03b1": ("a", "Greek"),  # α
        "\u03bf": ("o", "Greek"),  # ο
        "\u03c1": ("p", "Greek"),  # ρ
        "\u03b5": ("e", "Greek"),  # ε
        # Latin-like
        "\u0131": ("i", "Latin Extended"),  # ı (dotless i)
        "\u0261": ("g", "IPA Extensions"),  # ɡ
        "\u1d00": ("a", "Phonetic"),  # ᴀ
        # Fullwidth -> ASCII
        "\uff41": ("a", "Fullwidth"),
        "\uff42": ("b", "Fullwidth"),
        "\uff43": ("c", "Fullwidth"),
    }

    def detect(self, text: str) -> dict:
        """
        Scan text for confusable/homoglyph characters.

        Args:
            text: The text to analyze.

        Returns:
            dict with:
                - confusable_chars: list of found confusables with details
                - has_confusables: bool indicating if any were found
                - details: additional analysis information
        """
        confusable_chars: list[dict] = []

        for i, char in enumerate(text):
            if char in self.CONFUSABLE_MAP:
                latin_equiv, script = self.CONFUSABLE_MAP[char]
                char_name = unicodedata.name(char, "UNKNOWN")
                confusable_chars.append(
                    {
                        "position": i,
                        "original": char,
                        "replacement": latin_equiv,
                        "unicode_name": char_name,
                        "unicode_codepoint": f"U+{ord(char):04X}",
                        "script": script,
                    }
                )

        scripts_found = set()
        for char in text:
            try:
                cat = unicodedata.category(char)
                if cat.startswith("L"):
                    name = unicodedata.name(char, "")
                    if "CYRILLIC" in name:
                        scripts_found.add("Cyrillic")
                    elif "GREEK" in name:
                        scripts_found.add("Greek")
                    elif "LATIN" in name or name == "":
                        scripts_found.add("Latin")
            except ValueError:
                pass

        mixed_script = len(scripts_found) > 1

        return {
            "confusable_chars": confusable_chars,
            "has_confusables": len(confusable_chars) > 0,
            "mixed_script": mixed_script,
            "scripts_detected": list(scripts_found),
            "details": (
                f"Found {len(confusable_chars)} confusable character(s) across {len(scripts_found)} script(s)."
            ),
        }
