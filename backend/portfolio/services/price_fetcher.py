"""Yahoo Finance를 이용한 현재가 조회."""

import yfinance as yf

from portfolio.services.symbol_resolver import resolve_domestic_symbol_by_name

MARKET_DOMESTIC = "domestic"
MARKET_FOREIGN = "foreign"


def _normalize_domestic_symbol(symbol: str) -> str:
    return symbol.strip().upper().replace(".KS", "").replace(".KQ", "").zfill(6)


def _resolve_domestic_code(symbol: str, name: str) -> str | None:
    if symbol.strip():
        return _normalize_domestic_symbol(symbol)
    return resolve_domestic_symbol_by_name(name)


def to_yahoo_symbol(symbol: str, market_type: str) -> str:
    if market_type == MARKET_DOMESTIC:
        return f"{_normalize_domestic_symbol(symbol)}.KS"
    return symbol.strip().upper()


def _fetch_close_price(yahoo_symbol: str) -> float | None:
    ticker = yf.Ticker(yahoo_symbol)
    hist = ticker.history(period="5d")
    if hist.empty:
        return None
    return float(hist["Close"].iloc[-1])


def fetch_usd_krw_rate() -> float | None:
    return _fetch_close_price("USDKRW=X")


def fetch_current_price(symbol: str, market_type: str, name: str = "") -> dict:
    """종목 현재가 조회. 실패 시 price=None, error 메시지 반환."""
    if market_type == MARKET_DOMESTIC:
        code = _resolve_domestic_code(symbol, name)
        if not code:
            return {
                "price": None,
                "currency": "KRW",
                "yahoo_symbol": None,
                "resolved_symbol": "",
                "error": "종목명으로 종목코드를 찾을 수 없습니다.",
            }

        for suffix in (".KS", ".KQ"):
            yahoo_symbol = f"{code}{suffix}"
            price = _fetch_close_price(yahoo_symbol)
            if price is not None:
                return {
                    "price": price,
                    "currency": "KRW",
                    "yahoo_symbol": yahoo_symbol,
                    "resolved_symbol": code,
                    "error": None,
                }
        return {
            "price": None,
            "currency": "KRW",
            "yahoo_symbol": f"{code}.KS",
            "resolved_symbol": code,
            "error": "현재가를 불러올 수 없습니다.",
        }

    yahoo_symbol = to_yahoo_symbol(symbol, market_type)
    price = _fetch_close_price(yahoo_symbol)
    if price is None:
        return {
            "price": None,
            "currency": "USD",
            "yahoo_symbol": yahoo_symbol,
            "resolved_symbol": symbol.strip().upper(),
            "error": "현재가를 불러올 수 없습니다.",
        }
    return {
        "price": price,
        "currency": "USD",
        "yahoo_symbol": yahoo_symbol,
        "resolved_symbol": symbol.strip().upper(),
        "error": None,
    }


def enrich_holding(item: dict, usd_krw_rate: float | None) -> dict:
    """보유 종목에 현재가·평가금액 정보를 추가."""
    price_info = fetch_current_price(
        item.get("symbol", ""),
        item["market_type"],
        item.get("name", ""),
    )
    price = price_info["price"]
    currency = price_info["currency"]
    quantity = item["quantity"]

    value = None
    value_krw = None
    if price is not None:
        value = price * quantity
        if currency == "KRW":
            value_krw = value
        elif usd_krw_rate:
            value_krw = value * usd_krw_rate

    resolved_symbol = price_info.get("resolved_symbol") or item.get("symbol", "")

    return {
        **item,
        "symbol": resolved_symbol or item.get("symbol", ""),
        "price": price,
        "currency": currency,
        "value": value,
        "value_krw": value_krw,
        "price_error": price_info["error"],
    }
