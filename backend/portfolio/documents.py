from datetime import datetime

from mongoengine import (
    DateTimeField,
    Document,
    EmbeddedDocument,
    EmbeddedDocumentField,
    FloatField,
    IntField,
    ListField,
    StringField,
)

MARKET_DOMESTIC = "domestic"
MARKET_DOMESTIC_ETF = "domestic_etf"
MARKET_FOREIGN = "foreign"


class StockSnapshotItem(EmbeddedDocument):
    symbol = StringField(max_length=32, default="")
    name = StringField(max_length=128)
    quantity = FloatField(required=True, min_value=0)
    market_type = StringField(
        required=True,
        max_length=16,
        choices=[MARKET_DOMESTIC, MARKET_DOMESTIC_ETF, MARKET_FOREIGN],
        default=MARKET_DOMESTIC,
    )
    asset_category = StringField(max_length=64)
    broker = StringField(max_length=64)
    sector = StringField(max_length=64)
    industry = StringField(max_length=64)
    price = FloatField()
    currency = StringField(max_length=8, default="KRW")
    value = FloatField()
    value_krw = FloatField()
    price_error = StringField(max_length=256)


class CashSnapshotItem(EmbeddedDocument):
    name = StringField(required=True, max_length=128)
    amount = FloatField(required=True, min_value=0)
    asset_category = StringField(max_length=64)
    broker = StringField(max_length=64)
    sector = StringField(max_length=64)
    industry = StringField(max_length=64)
    currency = StringField(max_length=8, default="KRW")
    value_krw = FloatField()


class GoldSnapshotItem(EmbeddedDocument):
    """금(Gold) — 보유량(g), g당 원화 가격"""

    name = StringField(required=True, max_length=128)
    quantity = FloatField(required=True, min_value=0)  # g
    asset_category = StringField(max_length=64)
    broker = StringField(max_length=64)
    sector = StringField(max_length=64)
    industry = StringField(max_length=64)
    price = FloatField()  # KRW per gram (100원 절사)
    currency = StringField(max_length=8, default="KRW")
    value_krw = FloatField()
    gold_usd_per_oz = FloatField()
    price_per_gram_krw_raw = FloatField()
    price_error = StringField(max_length=256)


class PortfolioSnapshot(Document):
    """저장 시점 현재가가 포함된 포트폴리오 스냅샷 (My_Fin_Data 컬렉션)"""

    snapshot_version = IntField(required=True)
    snapshot_at = DateTimeField(default=datetime.utcnow)
    usd_krw_rate = FloatField()
    gold_usd_per_oz = FloatField()
    holdings = ListField(EmbeddedDocumentField(StockSnapshotItem), default=list)
    cash_holdings = ListField(EmbeddedDocumentField(CashSnapshotItem), default=list)
    gold_holdings = ListField(EmbeddedDocumentField(GoldSnapshotItem), default=list)

    meta = {
        "collection": "My_Fin_Data",
        "indexes": ["-snapshot_version", "-snapshot_at"],
        "ordering": ["-snapshot_version"],
    }
