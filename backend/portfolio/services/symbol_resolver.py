"""국내 종목명/ETF명 → 종목코드 조회."""

import functools
import re

import FinanceDataReader as fdr

from portfolio.documents import MARKET_DOMESTIC, MARKET_DOMESTIC_ETF


def _normalize_spaces(name: str) -> str:
    return re.sub(r"\s+", " ", name.strip())


def _format_symbol(code: str) -> str:
    code = str(code).strip().upper()
    if code.isdigit():
        return code.zfill(6)
    return code


def _lookup_by_name(df, name_col: str, code_col: str, name: str) -> str | None:
    exact = df[df[name_col] == name]
    if not exact.empty:
        return _format_symbol(exact.iloc[0][code_col])

    partial = df[df[name_col].str.contains(name, na=False, regex=False)]
    if len(partial) == 1:
        return _format_symbol(partial.iloc[0][code_col])

    return None


@functools.lru_cache(maxsize=1)
def _krx_listing():
    return fdr.StockListing("KRX")


@functools.lru_cache(maxsize=1)
def _etf_listing():
    return fdr.StockListing("ETF/KR")


def resolve_domestic_symbol_by_name(name: str) -> str | None:
    """국내 주식 종목명으로 종목코드를 조회합니다."""
    name = _normalize_spaces(name)
    if not name:
        return None

    df = _krx_listing()
    return _lookup_by_name(df, "Name", "Code", name)


def resolve_etf_symbol_by_name(name: str) -> str | None:
    """국내 ETF 종목명으로 종목코드를 조회합니다."""
    name = _normalize_spaces(name)
    if not name:
        return None

    df = _etf_listing()
    return _lookup_by_name(df, "Name", "Symbol", name)


def resolve_symbol_by_name(name: str, market_type: str) -> str | None:
    if market_type == MARKET_DOMESTIC_ETF:
        return resolve_etf_symbol_by_name(name)
    if market_type == MARKET_DOMESTIC:
        return resolve_domestic_symbol_by_name(name)
    return None
