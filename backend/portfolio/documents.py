from datetime import datetime

from mongoengine import (
    DateTimeField,
    Document,
    EmbeddedDocument,
    EmbeddedDocumentField,
    FloatField,
    ListField,
    StringField,
)

MARKET_DOMESTIC = "domestic"
MARKET_DOMESTIC_ETF = "domestic_etf"
MARKET_FOREIGN = "foreign"


class StockItem(EmbeddedDocument):
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


class CashItem(EmbeddedDocument):
    """현금성 자산 (원화)"""

    name = StringField(required=True, max_length=128)
    amount = FloatField(required=True, min_value=0)
    asset_category = StringField(max_length=64)
    broker = StringField(max_length=64)
    sector = StringField(max_length=64)
    industry = StringField(max_length=64)


class MyFinData(Document):
    """보유 자산 (My_Fin_Data 컬렉션)"""

    holdings = ListField(EmbeddedDocumentField(StockItem), default=list)
    cash_holdings = ListField(EmbeddedDocumentField(CashItem), default=list)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {"collection": "My_Fin_Data"}

    def save(self, *args, **kwargs):
        self.updated_at = datetime.utcnow()
        return super().save(*args, **kwargs)
