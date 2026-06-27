"""포트폴리오 스냅샷 생성·조회."""

from datetime import datetime

from portfolio.documents import (
    MARKET_DOMESTIC,
    MARKET_DOMESTIC_ETF,
    MARKET_FOREIGN,
    CashSnapshotItem,
    GoldSnapshotItem,
    PortfolioSnapshot,
    StockSnapshotItem,
)
from portfolio.services.gold_price import enrich_gold_holding, fetch_gold_price_per_gram_krw
from portfolio.services.price_fetcher import (
    _format_krw_code,
    enrich_holding,
    fetch_usd_krw_rate,
)
from portfolio.services.symbol_resolver import resolve_symbol_by_name


def _build_stock_items(items: list[dict], market_type: str) -> list[dict]:
    result = []
    for item in items:
        name = item.get("name", "").strip()
        symbol = item.get("symbol", "").strip()

        if market_type in (MARKET_DOMESTIC, MARKET_DOMESTIC_ETF):
            if not name:
                continue
            if symbol:
                resolved_symbol = _format_krw_code(symbol)
            else:
                resolved_symbol = resolve_symbol_by_name(name, market_type) or ""
        else:
            if not symbol:
                continue
            resolved_symbol = symbol.strip().upper()
            if not name:
                name = resolved_symbol

        result.append(
            {
                "symbol": resolved_symbol,
                "name": name,
                "quantity": item["quantity"],
                "market_type": market_type,
                "asset_category": item.get("asset_category", "").strip(),
                "broker": item.get("broker", "").strip(),
                "sector": item.get("sector", "").strip(),
                "industry": item.get("industry", "").strip(),
            }
        )
    return result


def _build_gold_items(items: list[dict]) -> list[dict]:
    result = []
    for item in items:
        name = item["name"].strip()
        if not name:
            continue
        result.append(
            {
                "name": name,
                "quantity": item["quantity"],
                "asset_category": item.get("asset_category", "").strip() or "금(Gold)",
                "broker": item.get("broker", "").strip(),
                "sector": item.get("sector", "").strip(),
                "industry": item.get("industry", "").strip(),
            }
        )
    return result


def _build_cash_items(items: list[dict]) -> list[dict]:
    result = []
    for item in items:
        name = item["name"].strip()
        if not name:
            continue
        result.append(
            {
                "name": name,
                "amount": item["amount"],
                "asset_category": item.get("asset_category", "").strip(),
                "broker": item.get("broker", "").strip(),
                "sector": item.get("sector", "").strip(),
                "industry": item.get("industry", "").strip(),
            }
        )
    return result


def _snapshot_queryset():
    """구버전 MyFinData 문서(updated_at만 있는) 제외."""
    return PortfolioSnapshot.objects(snapshot_version__exists=True)


def _next_snapshot_version() -> int:
    latest = _snapshot_queryset().order_by("-snapshot_version").first()
    return (latest.snapshot_version + 1) if latest else 1


def _stock_dict_to_snapshot_item(item: dict) -> StockSnapshotItem:
    return StockSnapshotItem(
        symbol=item["symbol"],
        name=item["name"],
        quantity=item["quantity"],
        market_type=item["market_type"],
        asset_category=item.get("asset_category", ""),
        broker=item.get("broker", ""),
        sector=item.get("sector", ""),
        industry=item.get("industry", ""),
        price=item.get("price"),
        currency=item.get("currency", "KRW"),
        value=item.get("value"),
        value_krw=item.get("value_krw"),
        price_error=item.get("price_error") or "",
    )


def _gold_dict_to_snapshot_item(item: dict) -> GoldSnapshotItem:
    return GoldSnapshotItem(
        name=item["name"],
        quantity=item["quantity"],
        asset_category=item.get("asset_category", ""),
        broker=item.get("broker", ""),
        sector=item.get("sector", ""),
        industry=item.get("industry", ""),
        price=item.get("price"),
        currency="KRW",
        value_krw=item.get("value_krw"),
        gold_usd_per_oz=item.get("gold_usd_per_oz"),
        price_per_gram_krw_raw=item.get("price_per_gram_krw_raw"),
        price_error=item.get("price_error") or "",
    )


def _cash_dict_to_snapshot_item(item: dict) -> CashSnapshotItem:
    amount = item["amount"]
    return CashSnapshotItem(
        name=item["name"],
        amount=amount,
        asset_category=item.get("asset_category", ""),
        broker=item.get("broker", ""),
        sector=item.get("sector", ""),
        industry=item.get("industry", ""),
        currency="KRW",
        value_krw=amount,
    )


def get_snapshot(snapshot_id: str | None = None, version: int | None = None):
    qs = _snapshot_queryset()
    if snapshot_id:
        return qs.filter(id=snapshot_id).first()
    if version is not None:
        return qs.filter(snapshot_version=version).first()
    return qs.order_by("-snapshot_version").first()


def list_snapshots(limit: int = 50) -> list[PortfolioSnapshot]:
    return list(_snapshot_queryset().order_by("-snapshot_version")[:limit])


def _holding_to_dict(item: StockSnapshotItem) -> dict:
    return {
        "symbol": item.symbol,
        "name": item.name or "",
        "quantity": item.quantity,
        "market_type": item.market_type,
        "asset_category": item.asset_category or "",
        "broker": item.broker or "",
        "sector": item.sector or "",
        "industry": item.industry or "",
        "price": item.price,
        "currency": item.currency or "KRW",
        "value": item.value,
        "value_krw": item.value_krw,
        "price_error": item.price_error or None,
    }


def _gold_to_dict(item: GoldSnapshotItem) -> dict:
    return {
        "name": item.name,
        "quantity": item.quantity,
        "asset_category": item.asset_category or "",
        "broker": item.broker or "",
        "sector": item.sector or "",
        "industry": item.industry or "",
        "price": item.price,
        "currency": item.currency or "KRW",
        "value_krw": item.value_krw,
        "gold_usd_per_oz": item.gold_usd_per_oz,
        "price_per_gram_krw_raw": item.price_per_gram_krw_raw,
        "price_error": item.price_error or None,
    }


def _cash_to_dict(item: CashSnapshotItem) -> dict:
    return {
        "name": item.name,
        "amount": item.amount,
        "asset_category": item.asset_category or "",
        "broker": item.broker or "",
        "sector": item.sector or "",
        "industry": item.industry or "",
        "currency": item.currency or "KRW",
        "value_krw": item.value_krw or item.amount,
    }


def _split_holdings(holdings: list[StockSnapshotItem]) -> dict:
    domestic, etf, foreign = [], [], []
    for item in holdings:
        data = _holding_to_dict(item)
        if data["market_type"] == MARKET_FOREIGN:
            foreign.append(data)
        elif data["market_type"] == MARKET_DOMESTIC_ETF:
            etf.append(data)
        else:
            domestic.append(data)
    return {"domestic": domestic, "etf": etf, "foreign": foreign}


def _compute_summary(split: dict, cash: list[dict], gold: list[dict]) -> dict:
    domestic_value = sum(item.get("value_krw") or 0 for item in split["domestic"])
    etf_value = sum(item.get("value_krw") or 0 for item in split["etf"])
    foreign_value = sum(item.get("value_krw") or 0 for item in split["foreign"])
    cash_value = sum(item.get("value_krw") or 0 for item in cash)
    gold_value = sum(item.get("value_krw") or 0 for item in gold)

    return {
        "total_value_krw": domestic_value + etf_value + foreign_value + cash_value + gold_value,
        "domestic_value_krw": domestic_value,
        "etf_value_krw": etf_value,
        "foreign_value_krw": foreign_value,
        "cash_value_krw": cash_value,
        "gold_value_krw": gold_value,
        "domestic_count": len(split["domestic"]),
        "etf_count": len(split["etf"]),
        "foreign_count": len(split["foreign"]),
        "cash_count": len(cash),
        "gold_count": len(gold),
    }


def snapshot_to_dashboard(snapshot: PortfolioSnapshot | None) -> dict:
    empty_summary = {
        "total_value_krw": 0,
        "domestic_value_krw": 0,
        "etf_value_krw": 0,
        "foreign_value_krw": 0,
        "cash_value_krw": 0,
        "gold_value_krw": 0,
        "domestic_count": 0,
        "etf_count": 0,
        "foreign_count": 0,
        "cash_count": 0,
        "gold_count": 0,
    }

    if not snapshot:
        return {
            "snapshot_id": None,
            "snapshot_version": None,
            "snapshot_at": None,
            "updated_at": None,
            "usd_krw_rate": None,
            "gold_usd_per_oz": None,
            "summary": empty_summary,
            "domestic": [],
            "etf": [],
            "foreign": [],
            "cash": [],
            "gold": [],
            "performance": build_performance_history(),
        }

    split = _split_holdings(snapshot.holdings)
    cash = [_cash_to_dict(item) for item in snapshot.cash_holdings or []]
    gold = [_gold_to_dict(item) for item in getattr(snapshot, "gold_holdings", []) or []]
    summary = _compute_summary(split, cash, gold)

    return {
        "snapshot_id": str(snapshot.id),
        "snapshot_version": snapshot.snapshot_version,
        "snapshot_at": snapshot.snapshot_at,
        "updated_at": snapshot.snapshot_at,
        "usd_krw_rate": snapshot.usd_krw_rate,
        "gold_usd_per_oz": getattr(snapshot, "gold_usd_per_oz", None),
        "summary": summary,
        "performance": build_performance_history(snapshot.snapshot_version),
        **split,
        "cash": cash,
        "gold": gold,
    }


def snapshot_to_assets(snapshot: PortfolioSnapshot | None) -> dict:
    if not snapshot:
        return {
            "snapshot_id": None,
            "snapshot_version": None,
            "domestic": [],
            "etf": [],
            "foreign": [],
            "cash": [],
            "gold": [],
            "updated_at": None,
        }

    split = _split_holdings(snapshot.holdings)

    def strip_prices(items):
        return [
            {
                "symbol": item["symbol"],
                "name": item["name"],
                "quantity": item["quantity"],
                "asset_category": item["asset_category"],
                "broker": item["broker"],
                "sector": item["sector"],
                "industry": item["industry"],
            }
            for item in items
        ]

    cash = [
        {
            "name": item["name"],
            "amount": item["amount"],
            "asset_category": item["asset_category"],
            "broker": item["broker"],
            "sector": item["sector"],
            "industry": item["industry"],
        }
        for item in [_cash_to_dict(c) for c in snapshot.cash_holdings or []]
    ]

    gold = [
        {
            "name": item["name"],
            "quantity": item["quantity"],
            "asset_category": item["asset_category"],
            "broker": item["broker"],
            "sector": item["sector"],
            "industry": item["industry"],
        }
        for item in [_gold_to_dict(g) for g in getattr(snapshot, "gold_holdings", []) or []]
    ]

    return {
        "snapshot_id": str(snapshot.id),
        "snapshot_version": snapshot.snapshot_version,
        "snapshot_at": snapshot.snapshot_at,
        "domestic": strip_prices(split["domestic"]),
        "etf": strip_prices(split["etf"]),
        "foreign": strip_prices(split["foreign"]),
        "cash": cash,
        "gold": gold,
        "updated_at": snapshot.snapshot_at,
    }


def _normalize_stock_symbol(symbol: str, market_type: str) -> str:
    symbol = (symbol or "").strip()
    if market_type in (MARKET_DOMESTIC, MARKET_DOMESTIC_ETF):
        return _format_krw_code(symbol) if symbol else ""
    return symbol.upper()


def _find_stored_stock(stored_holdings: list[dict], item: dict) -> dict | None:
    market_type = item["market_type"]
    symbol = _normalize_stock_symbol(item.get("symbol", ""), market_type)
    name = (item.get("name") or "").strip()

    for stored in stored_holdings:
        if stored["market_type"] != market_type:
            continue
        stored_symbol = _normalize_stock_symbol(stored.get("symbol", ""), market_type)
        stored_name = (stored.get("name") or "").strip()
        if symbol and stored_symbol and symbol == stored_symbol:
            return stored
        if name and stored_name and name == stored_name:
            return stored
    return None


def _apply_stored_stock_price(
    item: dict, stored: dict | None, usd_krw_rate: float | None
) -> dict:
    if not stored:
        default_currency = "USD" if item["market_type"] == MARKET_FOREIGN else "KRW"
        return {
            **item,
            "price": None,
            "currency": default_currency,
            "value": None,
            "value_krw": None,
            "price_error": "저장된 가격 정보가 없습니다.",
        }

    price = stored.get("price")
    currency = stored.get("currency") or "KRW"
    quantity = item["quantity"]
    value = price * quantity if price is not None else None
    value_krw = None
    if value is not None:
        if currency == "KRW":
            value_krw = value
        elif usd_krw_rate:
            value_krw = value * usd_krw_rate

    return {
        **item,
        "symbol": item.get("symbol") or stored.get("symbol", ""),
        "price": price,
        "currency": currency,
        "value": value,
        "value_krw": value_krw,
        "price_error": stored.get("price_error"),
    }


def _find_stored_gold(stored_gold: list[dict], item: dict) -> dict | None:
    name = (item.get("name") or "").strip()
    for stored in stored_gold:
        if (stored.get("name") or "").strip() == name:
            return stored
    return None


def _apply_stored_gold_price(
    item: dict, stored: dict | None, snapshot_gold_usd_per_oz: float | None
) -> dict:
    if not stored:
        return {
            **item,
            "price": None,
            "currency": "KRW",
            "value": None,
            "value_krw": None,
            "gold_usd_per_oz": snapshot_gold_usd_per_oz,
            "price_per_gram_krw_raw": None,
            "price_error": "저장된 가격 정보가 없습니다.",
        }

    price = stored.get("price")
    quantity = item["quantity"]
    value_krw = price * quantity if price is not None else None
    return {
        **item,
        "price": price,
        "currency": "KRW",
        "value": value_krw,
        "value_krw": value_krw,
        "gold_usd_per_oz": stored.get("gold_usd_per_oz") or snapshot_gold_usd_per_oz,
        "price_per_gram_krw_raw": stored.get("price_per_gram_krw_raw"),
        "price_error": stored.get("price_error"),
    }


def _build_enriched_snapshot_fields(validated_data: dict) -> dict:
    """자산 입력 → 현재가 조회 후 스냅샷 필드 dict 반환."""
    domestic = _build_stock_items(validated_data.get("domestic", []), MARKET_DOMESTIC)
    etf = _build_stock_items(validated_data.get("etf", []), MARKET_DOMESTIC_ETF)
    foreign = _build_stock_items(validated_data.get("foreign", []), MARKET_FOREIGN)
    cash = _build_cash_items(validated_data.get("cash", []))
    gold = _build_gold_items(validated_data.get("gold", []))

    if not domestic and not etf and not foreign and not cash and not gold:
        raise ValueError("최소 1개 이상의 자산을 입력해 주세요.")

    usd_krw_rate = fetch_usd_krw_rate()
    enriched_holdings = [
        enrich_holding(item, usd_krw_rate) for item in domestic + etf + foreign
    ]

    gold_price_info = fetch_gold_price_per_gram_krw(usd_krw_rate)
    enriched_gold = [enrich_gold_holding(item, gold_price_info) for item in gold]

    return {
        "usd_krw_rate": usd_krw_rate,
        "gold_usd_per_oz": gold_price_info.get("gold_usd_per_oz") if gold else None,
        "holdings": [_stock_dict_to_snapshot_item(item) for item in enriched_holdings],
        "cash_holdings": [_cash_dict_to_snapshot_item(item) for item in cash],
        "gold_holdings": [_gold_dict_to_snapshot_item(item) for item in enriched_gold],
    }


def _build_snapshot_fields_preserve_prices(
    snapshot: PortfolioSnapshot, validated_data: dict
) -> dict:
    """스냅샷 수정 시 기존 저장 가격을 유지하고 수량·메타데이터만 반영."""
    domestic = _build_stock_items(validated_data.get("domestic", []), MARKET_DOMESTIC)
    etf = _build_stock_items(validated_data.get("etf", []), MARKET_DOMESTIC_ETF)
    foreign = _build_stock_items(validated_data.get("foreign", []), MARKET_FOREIGN)
    cash = _build_cash_items(validated_data.get("cash", []))
    gold = _build_gold_items(validated_data.get("gold", []))

    if not domestic and not etf and not foreign and not cash and not gold:
        raise ValueError("최소 1개 이상의 자산을 입력해 주세요.")

    stored_stocks = [_holding_to_dict(h) for h in snapshot.holdings or []]
    stored_gold = [_gold_to_dict(g) for g in getattr(snapshot, "gold_holdings", []) or []]
    usd_krw_rate = snapshot.usd_krw_rate
    snapshot_gold_usd = getattr(snapshot, "gold_usd_per_oz", None)

    enriched_holdings = [
        _apply_stored_stock_price(item, _find_stored_stock(stored_stocks, item), usd_krw_rate)
        for item in domestic + etf + foreign
    ]
    enriched_gold = [
        _apply_stored_gold_price(item, _find_stored_gold(stored_gold, item), snapshot_gold_usd)
        for item in gold
    ]

    return {
        "holdings": [_stock_dict_to_snapshot_item(item) for item in enriched_holdings],
        "cash_holdings": [_cash_dict_to_snapshot_item(item) for item in cash],
        "gold_holdings": [_gold_dict_to_snapshot_item(item) for item in enriched_gold],
    }


def create_snapshot(validated_data: dict) -> PortfolioSnapshot:
    """현재가 API로 가격을 조회한 뒤 새 스냅샷 버전을 저장합니다."""
    fields = _build_enriched_snapshot_fields(validated_data)

    snapshot = PortfolioSnapshot(
        snapshot_version=_next_snapshot_version(),
        snapshot_at=datetime.utcnow(),
        **fields,
    )
    snapshot.save()
    return snapshot


def update_snapshot(snapshot: PortfolioSnapshot, validated_data: dict) -> PortfolioSnapshot:
    """기존 스냅샷의 자산 내역을 수정합니다. snapshot_at·가격·환율은 유지합니다."""
    fields = _build_snapshot_fields_preserve_prices(snapshot, validated_data)

    snapshot.holdings = fields["holdings"]
    snapshot.cash_holdings = fields["cash_holdings"]
    snapshot.gold_holdings = fields["gold_holdings"]
    snapshot.save()
    return snapshot


def _snapshot_summary_values(snapshot: PortfolioSnapshot) -> dict:
    split = _split_holdings(snapshot.holdings)
    cash = [_cash_to_dict(item) for item in snapshot.cash_holdings or []]
    gold = [_gold_to_dict(item) for item in getattr(snapshot, "gold_holdings", []) or []]
    return _compute_summary(split, cash, gold)


def _snapshot_to_timeline_point(snapshot: PortfolioSnapshot) -> dict:
    summary = _snapshot_summary_values(snapshot)
    return {
        "snapshot_id": str(snapshot.id),
        "snapshot_version": snapshot.snapshot_version,
        "snapshot_at": snapshot.snapshot_at,
        **summary,
    }


def _compute_value_change(from_value: float, to_value: float) -> dict:
    change_krw = to_value - from_value
    change_pct = (change_krw / from_value * 100) if from_value else None
    return {
        "from_value_krw": from_value,
        "to_value_krw": to_value,
        "change_krw": change_krw,
        "change_pct": change_pct,
    }


def _compute_period_comparison(previous: dict, current: dict) -> dict:
    days = None
    if previous.get("snapshot_at") and current.get("snapshot_at"):
        delta = current["snapshot_at"] - previous["snapshot_at"]
        days = max(delta.days, 0)

    return {
        "from_version": previous["snapshot_version"],
        "to_version": current["snapshot_version"],
        "from_at": previous["snapshot_at"],
        "to_at": current["snapshot_at"],
        "days": days,
        "total": _compute_value_change(
            previous["total_value_krw"], current["total_value_krw"]
        ),
        "domestic": _compute_value_change(
            previous["domestic_value_krw"], current["domestic_value_krw"]
        ),
        "etf": _compute_value_change(previous["etf_value_krw"], current["etf_value_krw"]),
        "foreign": _compute_value_change(
            previous["foreign_value_krw"], current["foreign_value_krw"]
        ),
        "cash": _compute_value_change(previous["cash_value_krw"], current["cash_value_krw"]),
        "gold": _compute_value_change(previous["gold_value_krw"], current["gold_value_krw"]),
    }


def build_performance_history(current_version: int | None = None) -> dict:
    """snapshot_at 기준 기간별 자산 실적 이력."""
    snapshots = list_snapshots()
    timeline = [_snapshot_to_timeline_point(s) for s in reversed(snapshots)]

    periods = [
        _compute_period_comparison(timeline[i - 1], timeline[i])
        for i in range(1, len(timeline))
    ]

    current_point = None
    if current_version is not None:
        current_point = next(
            (point for point in timeline if point["snapshot_version"] == current_version),
            timeline[-1] if timeline else None,
        )
    elif timeline:
        current_point = timeline[-1]

    vs_previous = None
    vs_first = None
    if current_point and timeline:
        current_index = next(
            (
                index
                for index, point in enumerate(timeline)
                if point["snapshot_version"] == current_point["snapshot_version"]
            ),
            len(timeline) - 1,
        )
        if current_index > 0:
            vs_previous = _compute_period_comparison(timeline[current_index - 1], current_point)
        if current_index > 0:
            vs_first = _compute_period_comparison(timeline[0], current_point)

    return {
        "timeline": timeline,
        "periods": list(reversed(periods)),
        "vs_previous": vs_previous,
        "vs_first": vs_first,
        "snapshot_count": len(timeline),
    }


def snapshot_to_list_item(snapshot: PortfolioSnapshot) -> dict:
    split = _split_holdings(snapshot.holdings)
    cash = [_cash_to_dict(item) for item in snapshot.cash_holdings or []]
    gold = [_gold_to_dict(item) for item in getattr(snapshot, "gold_holdings", []) or []]
    summary = _compute_summary(split, cash, gold)

    return {
        "snapshot_id": str(snapshot.id),
        "snapshot_version": snapshot.snapshot_version,
        "snapshot_at": snapshot.snapshot_at,
        "total_value_krw": summary["total_value_krw"],
        "domestic_value_krw": summary["domestic_value_krw"],
        "etf_value_krw": summary["etf_value_krw"],
        "foreign_value_krw": summary["foreign_value_krw"],
        "cash_value_krw": summary["cash_value_krw"],
        "gold_value_krw": summary["gold_value_krw"],
        "asset_count": (
            summary["domestic_count"]
            + summary["etf_count"]
            + summary["foreign_count"]
            + summary["cash_count"]
            + summary["gold_count"]
        ),
    }
