"""HTTP client with retry logic, rate limiting, and rotating user agents."""

import random
import time
from typing import Optional

import httpx

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15",
]


class HttpClient:
    """Robust HTTP client with retries and rate limiting."""

    def __init__(self, max_retries: int = 3, base_delay: float = 1.0, timeout: float = 30.0):
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.timeout = timeout
        self._client: Optional[httpx.Client] = None

    @property
    def client(self) -> httpx.Client:
        if self._client is None or self._client.is_closed:
            self._client = httpx.Client(
                timeout=self.timeout,
                follow_redirects=True,
                headers={"User-Agent": random.choice(USER_AGENTS)},
            )
        return self._client

    def get(self, url: str, headers: Optional[dict] = None, params: Optional[dict] = None) -> httpx.Response:
        """GET request with exponential backoff retry."""
        last_error = None
        for attempt in range(self.max_retries):
            try:
                resp = self.client.get(url, headers=headers, params=params)
                resp.raise_for_status()
                return resp
            except (httpx.HTTPStatusError, httpx.RequestError) as e:
                last_error = e
                if attempt < self.max_retries - 1:
                    delay = self.base_delay * (2 ** attempt) + random.uniform(0, 0.5)
                    time.sleep(delay)
        raise last_error  # type: ignore[misc]

    def get_json(self, url: str, headers: Optional[dict] = None, params: Optional[dict] = None) -> dict:
        return self.get(url, headers=headers, params=params).json()

    def get_text(self, url: str, headers: Optional[dict] = None, params: Optional[dict] = None) -> str:
        return self.get(url, headers=headers, params=params).text

    def close(self):
        if self._client and not self._client.is_closed:
            self._client.close()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()
