"""
NEXTRACE Link / URL Analysis Service.
Analyzes URLs for suspicious patterns without making outbound network requests.
"""

from urllib.parse import parse_qs, urlparse

from rapidfuzz import fuzz

from app.schemas.impersonator import LinkAnalysisResult

SHORTENER_DOMAINS = {
    "bit.ly",
    "tinyurl.com",
    "t.co",
    "goo.gl",
    "ow.ly",
    "is.gd",
    "buff.ly",
    "tiny.cc",
    "lnkd.in",
    "rb.gy",
    "cutt.ly",
    "t.ly",
    "s.id",
    "v.gd",
    "shorturl.at",
    "shorturl.asia",
    "rebrand.ly",
}

REDIRECT_PARAMS = {
    "url",
    "redirect",
    "redirect_uri",
    "redirect_url",
    "next",
    "return",
    "returnto",
    "return_url",
    "goto",
    "destination",
    "dest",
    "redir",
    "out",
    "link",
    "target",
    "to",
    "continue",
    "forward",
}


class LinkAnalyzerService:
    """
    Analyzes URLs for suspicious patterns without network access.
    """

    def analyze_links(
        self,
        urls: list[str],
        official_domain: str | None = None,
    ) -> list[LinkAnalysisResult]:
        """Analyze multiple URLs."""
        return [self.analyze_single(url, official_domain) for url in urls if url]

    def analyze_single(
        self,
        url: str,
        official_domain: str | None = None,
    ) -> LinkAnalysisResult:
        """
        Analyze a single URL for suspicious indicators.
        Never makes outbound HTTP requests.
        """
        risk_indicators = []
        risk_level = "low"
        is_shortened = False
        is_punycode = False
        has_suspicious_redirect = False
        domain_similarity = None

        if not url:
            return LinkAnalysisResult(
                url="",
                risk_indicators=["Empty URL"],
                risk_level="low",
            )

        try:
            parsed = urlparse(url)
            domain = parsed.hostname or ""
            domain_lower = domain.lower()
        except Exception:
            return LinkAnalysisResult(
                url=url,
                risk_indicators=["Malformed URL - failed to parse"],
                risk_level="medium",
            )

        # 1. URL shorteners
        if domain_lower in SHORTENER_DOMAINS:
            is_shortened = True
            risk_indicators.append(f"URL shortener detected ({domain_lower}). Obscures destination.")

        # 2. Punycode / IDN domains
        if domain_lower.startswith("xn--") or ".xn--" in domain_lower:
            is_punycode = True
            risk_indicators.append(f"Punycode/IDN domain detected ({domain_lower}). Potential lookalike spoof.")

        # 3. Suspicious redirects
        if parsed.query:
            try:
                params = parse_qs(parsed.query)
                for p in params:
                    if p.lower() in REDIRECT_PARAMS:
                        has_suspicious_redirect = True
                        risk_indicators.append(f"Suspicious redirect parameter '{p}' detected.")
            except Exception:
                pass

        # 4. Domain similarity to official
        if official_domain and domain_lower:
            domain_similarity = self._domain_similarity(domain_lower, official_domain.lower())
            if 60.0 < domain_similarity < 100.0:
                risk_indicators.append(
                    f"Domain '{domain_lower}' is {domain_similarity:.0f}% similar to official '{official_domain}'."
                )

        # Risk level determination
        if (
            is_punycode
            or (is_shortened and has_suspicious_redirect)
            or (domain_similarity and 80.0 < domain_similarity < 100.0)
        ):
            risk_level = "high"
        elif is_shortened or has_suspicious_redirect or (domain_similarity and 60.0 < domain_similarity < 100.0):
            risk_level = "medium"

        return LinkAnalysisResult(
            url=url,
            is_shortened=is_shortened,
            is_punycode=is_punycode,
            has_suspicious_redirect=has_suspicious_redirect,
            domain_similarity_to_official=domain_similarity,
            risk_indicators=risk_indicators,
            risk_level=risk_level,
        )

    def _domain_similarity(self, domain: str, official: str) -> float:
        """Calculate similarity between domain second-level names."""
        d_parts = domain.split(".")
        o_parts = official.split(".")
        d_base = d_parts[-2] if len(d_parts) >= 2 else domain
        o_base = o_parts[-2] if len(o_parts) >= 2 else official
        return float(fuzz.ratio(d_base, o_base))
