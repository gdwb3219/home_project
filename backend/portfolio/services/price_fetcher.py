"""Yahoo Finance를 이용한 현재가 조회."""

import yfinance as yf

from portfolio.documents import MARKET_DOMESTIC, MARKET_DOMESTIC_ETF, MARKET_FOREIGN
from portfolio.services.symbol_resolver import (
    resolve_domestic_symbol_by_name,
    resolve_etf_symbol_by_name,
)

KRW_MARKETS = {MARKET_DOMESTIC, MARKET_DOMESTIC_ETF}


def _format_krw_code(symbol: str) -> str:
    symbol = symbol.strip().upper().replace(".KS", "").replace(".KQ", "")
    if symbol.isdigit():
        return symbol.zfill(6)
    return symbol


def _resolve_krw_code(symbol: str, name: str, market_type: str) -> str | None:
    if symbol.strip():
        return _format_krw_code(symbol)
    if market_type == MARKET_DOMESTIC_ETF:
        return resolve_etf_symbol_by_name(name)
    return resolve_domestic_symbol_by_name(name)


def _fetch_krw_price(code: str) -> dict:
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
    if market_type in KRW_MARKETS:
        code = _resolve_krw_code(symbol, name, market_type)
        if not code:
            label = "ETF명" if market_type == MARKET_DOMESTIC_ETF else "종목명"
            return {
                "price": None,
                "currency": "KRW",
                "yahoo_symbol": None,
                "resolved_symbol": "",
                "error": f"{label}으로 종목코드를 찾을 수 없습니다.",
            }
        return _fetch_krw_price(code)

    yahoo_symbol = symbol.strip().upper()
    price = _fetch_close_price(yahoo_symbol)
    if price is None:
        return {
            "price": None,
            "currency": "USD",
            "yahoo_symbol": yahoo_symbol,
            "resolved_symbol": yahoo_symbol,
            "error": "현재가를 불러올 수 없습니다.",
        }
    return {
        "price": price,
        "currency": "USD",
        "yahoo_symbol": yahoo_symbol,
        "resolved_symbol": yahoo_symbol,
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
