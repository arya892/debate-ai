import time
import logging
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

# In-memory search cache with TTL (15 minutes)
_search_cache: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 900

_network_available: bool = True
_last_network_failure: float = 0
OFFLINE_COOLDOWN = 60.0  # If network is unreachable, don't stall for 60s

class SearchService:
    def __init__(self):
        self.tavily_key = settings.TAVILY_API_KEY
        self.brave_key = settings.BRAVE_SEARCH_API_KEY

    @property
    def is_configured(self) -> bool:
        return bool(self.tavily_key or self.brave_key)

    @property
    def provider_name(self) -> str:
        if self.tavily_key:
            return "Tavily Search API"
        if self.brave_key:
            return "Brave Search API"
        return "DuckDuckGo / Web Fallback"

    async def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        global _network_available, _last_network_failure
        now = time.time()

        # If we recently detected network is unavailable, avoid blocking on OS DNS
        if not _network_available and (now - _last_network_failure < OFFLINE_COOLDOWN):
            return []

        cache_key = f"{query.strip().lower()}:{max_results}"
        
        # Check cache
        if cache_key in _search_cache:
            entry = _search_cache[cache_key]
            if now - entry["timestamp"] < CACHE_TTL_SECONDS:
                logger.info(f"Returning cached search results for '{query}'")
                return entry["data"]

        results: List[Dict[str, Any]] = []

        try:
            # 1. Tavily if available
            if self.tavily_key:
                try:
                    results = await self._search_tavily(query, max_results)
                except Exception as e:
                    logger.warning(f"Tavily search failed for '{query}': {e}. Falling back...")

            # 2. Brave if available
            if not results and self.brave_key:
                try:
                    results = await self._search_brave(query, max_results)
                except Exception as e:
                    logger.warning(f"Brave search failed for '{query}': {e}. Falling back...")

            # 3. DuckDuckGo public fallback
            if not results:
                try:
                    results = await self._search_duckduckgo(query, max_results)
                except Exception as e:
                    logger.warning(f"DuckDuckGo fallback failed for '{query}': {e}")
                    _network_available = False
                    _last_network_failure = time.time()

        except Exception as e:
            logger.warning(f"Network search unreachable: {e}")
            _network_available = False
            _last_network_failure = time.time()

        # Store in cache
        if results:
            _network_available = True
            _search_cache[cache_key] = {"data": results, "timestamp": now}

        return results

    async def _search_tavily(self, query: str, max_results: int) -> List[Dict[str, Any]]:
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": self.tavily_key,
            "query": query,
            "search_depth": "advanced",
            "max_results": max_results,
            "include_domains": [],
            "exclude_domains": []
        }
        async with httpx.AsyncClient(timeout=2.5) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                items = []
                for item in data.get("results", []):
                    u = item.get("url", "")
                    domain = urlparse(u).netloc.replace("www.", "")
                    items.append({
                        "title": item.get("title", ""),
                        "url": u,
                        "snippet": item.get("content", ""),
                        "publisher": domain or "Source",
                        "published_date": item.get("published_date") or None
                    })
                return items
        return []

    async def _search_brave(self, query: str, max_results: int) -> List[Dict[str, Any]]:
        url = "https://api.search.brave.com/res/v1/web/search"
        headers = {
            "Accept": "application/json",
            "Accept-Encoding": "gzip",
            "X-Subscription-Token": self.brave_key
        }
        params = {"q": query, "count": max_results}
        async with httpx.AsyncClient(timeout=2.5) as client:
            resp = await client.get(url, headers=headers, params=params)
            if resp.status_code == 200:
                data = resp.json()
                web_results = data.get("web", {}).get("results", [])
                items = []
                for item in web_results:
                    u = item.get("url", "")
                    domain = urlparse(u).netloc.replace("www.", "")
                    items.append({
                        "title": item.get("title", ""),
                        "url": u,
                        "snippet": item.get("description", ""),
                        "publisher": domain or "Source",
                        "published_date": item.get("page_age") or None
                    })
                return items
        return []

    async def _search_duckduckgo(self, query: str, max_results: int) -> List[Dict[str, Any]]:
        # DuckDuckGo HTML / Instant Answers endpoint
        url = "https://html.duckduckgo.com/html/"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        async with httpx.AsyncClient(timeout=2.5, follow_redirects=True) as client:
            resp = await client.post(url, data={"q": query}, headers=headers)
            if resp.status_code == 200:
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(resp.text, "html.parser")
                results = []
                for result in soup.select(".result"):
                    title_elem = result.select_one(".result__title a")
                    snippet_elem = result.select_one(".result__snippet")
                    if title_elem and title_elem.get("href"):
                        href = title_elem["href"]
                        # Duckduckgo redirects look like /l/?kh=-1&uddg=https%3A%2F%2F...
                        if "uddg=" in href:
                            from urllib.parse import parse_qs, unquote
                            parsed = parse_qs(urlparse(href).query)
                            actual_url = parsed.get("uddg", [href])[0]
                        else:
                            actual_url = href
                        
                        domain = urlparse(actual_url).netloc.replace("www.", "")
                        results.append({
                            "title": title_elem.get_text(strip=True),
                            "url": actual_url,
                            "snippet": snippet_elem.get_text(strip=True) if snippet_elem else "",
                            "publisher": domain or "Web Source",
                            "published_date": None
                        })
                        if len(results) >= max_results:
                            break
                return results
        return []

search_service = SearchService()

