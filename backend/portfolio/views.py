from datetime import datetime

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from portfolio.documents import (
    MARKET_DOMESTIC,
    MARKET_DOMESTIC_ETF,
    MARKET_FOREIGN,
    CashItem,
    MyFinData,
    StockItem,
)
from portfolio.serializers import AssetSaveSerializer
from portfolio.services.price_fetcher import (
    _format_krw_code,
    enrich_holding,
    fetch_usd_krw_rate,
)
from portfolio.services.symbol_resolver import resolve_symbol_by_name


class HealthCheckView(APIView):
    def get(self, request):
        return Response(
            {
                "status": "ok",
                "service": "home_project-api",
                "timestamp": datetime.utcnow().isoformat(),
            }
        )


def _item_to_dict(item: StockItem) -> dict:
    market_type = getattr(item, "market_type", None) or MARKET_DOMESTIC
    return {
        "symbol": item.symbol,
        "name": item.name or "",
        "quantity": item.quantity,
        "market_type": market_type,
        "asset_category": getattr(item, "asset_category", None) or "",
        "broker": getattr(item, "broker", None) or "",
        "sector": getattr(item, "sector", None) or "",
        "industry": getattr(item, "industry", None) or "",
    }


def _cash_to_dict(item: CashItem) -> dict:
    return {
        "name": item.name,
        "amount": item.amount,
        "asset_category": getattr(item, "asset_category", None) or "",
        "broker": getattr(item, "broker", None) or "",
        "sector": getattr(item, "sector", None) or "",
        "industry": getattr(item, "industry", None) or "",
    }


def _split_holdings(holdings: list[StockItem]) -> dict:
    domestic = []
    etf = []
    foreign = []
    for item in holdings:
        data = _item_to_dict(item)
        if data["market_type"] == MARKET_FOREIGN:
            foreign.append(data)
        elif data["market_type"] == MARKET_DOMESTIC_ETF:
            etf.append(data)
        else:
            domestic.append(data)
    return {"domestic": domestic, "etf": etf, "foreign": foreign}


def _serialize_fin_data(doc: MyFinData | None) -> dict:
    if not doc:
        return {
            "id": None,
            "domestic": [],
            "etf": [],
            "foreign": [],
            "cash": [],
            "updated_at": None,
        }
    split = _split_holdings(doc.holdings)
    cash = [_cash_to_dict(item) for item in getattr(doc, "cash_holdings", []) or []]
    return {
        "id": str(doc.id),
        **split,
        "cash": cash,
        "updated_at": doc.updated_at,
    }


def _build_stock_items(items: list[dict], market_type: str) -> list[StockItem]:
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
            StockItem(
                symbol=resolved_symbol,
                name=name,
                quantity=item["quantity"],
                market_type=market_type,
                asset_category=item.get("asset_category", "").strip(),
                broker=item.get("broker", "").strip(),
                sector=item.get("sector", "").strip(),
                industry=item.get("industry", "").strip(),
            )
        )
    return result


def _build_cash_items(items: list[dict]) -> list[CashItem]:
    result = []
    for item in items:
        name = item["name"].strip()
        if not name:
            continue
        result.append(
            CashItem(
                name=name,
                amount=item["amount"],
                asset_category=item.get("asset_category", "").strip(),
                broker=item.get("broker", "").strip(),
                sector=item.get("sector", "").strip(),
                industry=item.get("industry", "").strip(),
            )
        )
    return result


def _enrich_cash(item: dict) -> dict:
    amount = item["amount"]
    return {
        **item,
        "currency": "KRW",
        "value_krw": amount,
    }


class AssetView(APIView):
    """My_Fin_Data 컬렉션에 보유 자산을 저장/조회"""

    def get(self, request):
        doc = MyFinData.objects.first()
        return Response(_serialize_fin_data(doc))

    def post(self, request):
        serializer = AssetSaveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        domestic = _build_stock_items(
            serializer.validated_data.get("domestic", []),
            MARKET_DOMESTIC,
        )
        etf = _build_stock_items(
            serializer.validated_data.get("etf", []),
            MARKET_DOMESTIC_ETF,
        )
        foreign = _build_stock_items(
            serializer.validated_data.get("foreign", []),
            MARKET_FOREIGN,
        )
        cash = _build_cash_items(serializer.validated_data.get("cash", []))
        holdings = domestic + etf + foreign

        if not holdings and not cash:
            return Response(
                {"detail": "최소 1개 이상의 자산을 입력해 주세요."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        doc = MyFinData.objects.first()
        if doc:
            doc.holdings = holdings
            doc.cash_holdings = cash
            doc.save()
        else:
            doc = MyFinData(holdings=holdings, cash_holdings=cash).save()

        return Response(_serialize_fin_data(doc), status=status.HTTP_201_CREATED)


class DashboardView(APIView):
    """현재가·평가금액이 포함된 대시보드 데이터"""

    def get(self, request):
        doc = MyFinData.objects.first()
        empty_summary = {
            "total_value_krw": 0,
            "domestic_value_krw": 0,
            "etf_value_krw": 0,
            "foreign_value_krw": 0,
            "cash_value_krw": 0,
            "domestic_count": 0,
            "etf_count": 0,
            "foreign_count": 0,
            "cash_count": 0,
        }

        if not doc:
            return Response(
                {
                    "updated_at": None,
                    "usd_krw_rate": fetch_usd_krw_rate(),
                    "summary": empty_summary,
                    "domestic": [],
                    "etf": [],
                    "foreign": [],
                    "cash": [],
                }
            )

        split = _split_holdings(doc.holdings)
        usd_krw_rate = fetch_usd_krw_rate()

        domestic = [enrich_holding(item, usd_krw_rate) for item in split["domestic"]]
        etf = [enrich_holding(item, usd_krw_rate) for item in split["etf"]]
        foreign = [enrich_holding(item, usd_krw_rate) for item in split["foreign"]]
        cash = [
            _enrich_cash(_cash_to_dict(item))
            for item in getattr(doc, "cash_holdings", []) or []
        ]

        domestic_value = sum(item["value_krw"] or 0 for item in domestic)
        etf_value = sum(item["value_krw"] or 0 for item in etf)
        foreign_value = sum(item["value_krw"] or 0 for item in foreign)
        cash_value = sum(item["value_krw"] or 0 for item in cash)

        return Response(
            {
                "updated_at": doc.updated_at,
                "usd_krw_rate": usd_krw_rate,
                "summary": {
                    "total_value_krw": domestic_value + etf_value + foreign_value + cash_value,
                    "domestic_value_krw": domestic_value,
                    "etf_value_krw": etf_value,
                    "foreign_value_krw": foreign_value,
                    "cash_value_krw": cash_value,
                    "domestic_count": len(domestic),
                    "etf_count": len(etf),
                    "foreign_count": len(foreign),
                    "cash_count": len(cash),
                },
                "domestic": domestic,
                "etf": etf,
                "foreign": foreign,
                "cash": cash,
            }
        )
