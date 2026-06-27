"""국제 금 선물 가격 → 원화 g당 가격 환산."""

import math

import yfinance as yf

from portfolio.services.price_fetcher import fetch_usd_krw_rate

TROY_OZ_TO_GRAMS = 31.1034768
GOLD_FUTURES_SYMBOLS = ("GC=F", "XAUUSD=X")


def truncate_to_100_krw(value: float) -> float:
    """100원 단위 절사 (내림)."""
    return math.floor(value / 100) * 100


def _fetch_close_price(yahoo_symbol: str) -> float | None:
    ticker = yf.Ticker(yahoo_symbol)
    hist = ticker.history(period="5d")
    if hist.empty:
        return None
    return float(hist["Close"].iloc[-1])


def fetch_gold_usd_per_troy_oz() -> tuple[float | None, str | None]:
    for symbol in GOLD_FUTURES_SYMBOLS:
        price = _fetch_close_price(symbol)
        if price is not None:
            return price, symbol
    return None, None


def fetch_gold_price_per_gram_krw(usd_krw_rate: float | None = None) -> dict:
    """
    COMEX 금 선물(USD/troy oz) → 원화/g 변환.
    100원 단위 절사된 g당 가격을 반환합니다.
    """
    rate = usd_krw_rate if usd_krw_rate is not None else fetch_usd_krw_rate()
    gold_usd_per_oz, yahoo_symbol = fetch_gold_usd_per_troy_oz()

    if gold_usd_per_oz is None:
        return {
            "price_per_gram_krw": None,
            "price_per_gram_krw_raw": None,
            "gold_usd_per_oz": None,
            "usd_krw_rate": rate,
            "yahoo_symbol": None,
            "error": "국제 금 선물 가격을 불러올 수 없습니다.",
        }

    if not rate:
        return {
            "price_per_gram_krw": None,
            "price_per_gram_krw_raw": None,
            "gold_usd_per_oz": gold_usd_per_oz,
            "usd_krw_rate": None,
            "yahoo_symbol": yahoo_symbol,
            "error": "USD/KRW 환율을 불러올 수 없습니다.",
        }

    raw_per_gram = (gold_usd_per_oz * rate) / TROY_OZ_TO_GRAMS
    truncated = truncate_to_100_krw(raw_per_gram)

    return {
        "price_per_gram_krw": truncated,
        "price_per_gram_krw_raw": raw_per_gram,
        "gold_usd_per_oz": gold_usd_per_oz,
        "usd_krw_rate": rate,
        "yahoo_symbol": yahoo_symbol,
        "error": None,
    }


def enrich_gold_holding(item: dict, gold_price_info: dict) -> dict:
    """금 보유량(g)에 g당 원화 가격을 적용합니다."""
    price = gold_price_info.get("price_per_gram_krw")
    quantity = item["quantity"]

    value_krw = None
    if price is not None:
        value_krw = price * quantity

    return {
        **item,
        "price": price,
        "currency": "KRW",
        "value": value_krw,
        "value_krw": value_krw,
        "gold_usd_per_oz": gold_price_info.get("gold_usd_per_oz"),
        "price_per_gram_krw_raw": gold_price_info.get("price_per_gram_krw_raw"),
        "price_error": gold_price_info.get("error"),
    }
