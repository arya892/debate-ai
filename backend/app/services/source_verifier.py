import logging
import asyncio
from typing import List, Dict, Any, Optional
import httpx
from app.schemas import EvidenceItem, SourceItem

logger = logging.getLogger(__name__)

# Cache URL check status {url: bool}
_url_check_cache: Dict[str, bool] = {}
_verifier_network_available: bool = True
_verifier_last_failure: float = 0
OFFLINE_COOLDOWN = 60.0

class SourceVerifier:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) DebateAI/1.0"
        }

    async def check_url_resolves(self, url: str) -> bool:
        global _verifier_network_available, _verifier_last_failure
        import time
        now = time.time()

        if not url or not (url.startswith("http://") or url.startswith("https://")):
            return False
            
        if url in _url_check_cache:
            return _url_check_cache[url]

        if not _verifier_network_available and (now - _verifier_last_failure < OFFLINE_COOLDOWN):
            _url_check_cache[url] = False
            return False

        try:
            async with httpx.AsyncClient(timeout=1.5, follow_redirects=True, headers=self.headers) as client:
                try:
                    resp = await client.head(url)
                    if 200 <= resp.status_code < 400:
                        _url_check_cache[url] = True
                        _verifier_network_available = True
                        return True
                except Exception:
                    pass

                resp = await client.get(url, headers={"Range": "bytes=0-1024"})
                is_valid = 200 <= resp.status_code < 400
                _url_check_cache[url] = is_valid
                _verifier_network_available = True
                return is_valid
        except Exception as e:
            logger.debug(f"URL check failed for {url}: {e}")
            _verifier_network_available = False
            _verifier_last_failure = time.time()
            _url_check_cache[url] = False
            return False

    async def verify_evidence_list(
        self,
        evidence_list: List[EvidenceItem],
        retrieved_sources: List[Dict[str, Any]]
    ) -> List[EvidenceItem]:
        valid_urls = {s.get("url"): s for s in retrieved_sources if s.get("url")}
        verified_items: List[EvidenceItem] = []

        for item in evidence_list:
            # Preserve opinion or unavailable claims
            if item.status in ("opinion", "unavailable"):
                verified_items.append(item)
                continue

            # If marked verified:
            if item.status == "verified":
                if not item.url:
                    item.status = "unverified"
                    item.explanation = (item.explanation or "") + " [Downgraded: No source URL provided]"
                    verified_items.append(item)
                    continue

                # Rule 4: LLM may only cite URLs that were actually returned by search
                if item.url not in valid_urls:
                    item.status = "unverified"
                    item.explanation = (item.explanation or "") + " [Downgraded: URL was not in verified search results]"
                    verified_items.append(item)
                    continue

                # Rule 5: Verify links resolve (HTTP 2xx)
                resolves = await self.check_url_resolves(item.url)
                if not resolves:
                    item.status = "unverified"
                    item.explanation = (item.explanation or "") + " [Downgraded: Source link failed HTTP resolution check]"
                    verified_items.append(item)
                    continue

                # Corroborate metadata from retrieved source
                matched_source = valid_urls[item.url]
                if not item.source_title:
                    item.source_title = matched_source.get("title")
                if not item.publisher:
                    item.publisher = matched_source.get("publisher")
                if not item.publication_date:
                    item.publication_date = matched_source.get("published_date")

                verified_items.append(item)
            else:
                # Keep unverified
                verified_items.append(item)

        return verified_items

    async def audit_sources(
        self,
        retrieved_sources: List[Dict[str, Any]]
    ) -> List[SourceItem]:
        tasks = []
        for s in retrieved_sources:
            tasks.append(self.check_url_resolves(s.get("url", "")))
        
        resolutions = await asyncio.gather(*tasks, return_exceptions=True)
        audit_results: List[SourceItem] = []

        for s, res in zip(retrieved_sources, resolutions):
            is_verified = res is True
            audit_results.append(SourceItem(
                title=s.get("title"),
                publisher=s.get("publisher"),
                url=s.get("url"),
                published_date=s.get("published_date"),
                verified=is_verified,
                status_label="verified" if is_verified else "unverified",
                snippet=s.get("snippet")
            ))
        return audit_results

source_verifier = SourceVerifier()

