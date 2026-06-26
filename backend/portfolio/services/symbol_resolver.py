"""국내 종목명 → 종목코드 조회 (KRX 상장 목록)."""

import functools

import FinanceDataReader as fdr


@functools.lru_cache(maxsize=1)
def _krx_listing():
    return fdr.StockListing("KRX")


def resolve_domestic_symbol_by_name(name: str) -> str | None:
    """종목명으로 6자리 종목코드를 조회합니다."""
    name = name.strip()
    if not name:
        return None

    df = _krx_listing()

    exact = df[df["Name"] == name]
    if not exact.empty:
        return str(exact.iloc[0]["Code"]).zfill(6)

    partial = df[df["Name"].str.contains(name, na=False, regex=False)]
    if len(partial) == 1:
        return str(partial.iloc[0]["Code"]).zfill(6)

    return None
