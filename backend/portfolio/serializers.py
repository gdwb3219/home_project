from rest_framework import serializers

from portfolio.documents import MARKET_DOMESTIC, MARKET_DOMESTIC_ETF, MARKET_FOREIGN


class DomesticStockItemSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=128)
    symbol = serializers.CharField(max_length=32, required=False, allow_blank=True, default="")
    quantity = serializers.FloatField(min_value=0)
    price = serializers.FloatField(min_value=0, required=False, allow_null=True)
    asset_category = serializers.CharField(max_length=64, required=False, allow_blank=True, default="")
    broker = serializers.CharField(max_length=64, required=False, allow_blank=True, default="")
    sector = serializers.CharField(max_length=64, required=False, allow_blank=True, default="")
    industry = serializers.CharField(max_length=64, required=False, allow_blank=True, default="")


class DomesticEtfItemSerializer(DomesticStockItemSerializer):
    pass


class ForeignStockItemSerializer(serializers.Serializer):
    symbol = serializers.CharField(max_length=32)
    name = serializers.CharField(max_length=128, required=False, allow_blank=True, default="")
    quantity = serializers.FloatField(min_value=0)
    price = serializers.FloatField(min_value=0, required=False, allow_null=True)
    asset_category = serializers.CharField(max_length=64, required=False, allow_blank=True, default="")
    broker = serializers.CharField(max_length=64, required=False, allow_blank=True, default="")
    sector = serializers.CharField(max_length=64, required=False, allow_blank=True, default="")
    industry = serializers.CharField(max_length=64, required=False, allow_blank=True, default="")


class CashItemSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=128)
    amount = serializers.FloatField(min_value=0)
    asset_category = serializers.CharField(max_length=64, required=False, allow_blank=True, default="")
    broker = serializers.CharField(max_length=64, required=False, allow_blank=True, default="")
    sector = serializers.CharField(max_length=64, required=False, allow_blank=True, default="")
    industry = serializers.CharField(max_length=64, required=False, allow_blank=True, default="")


class GoldItemSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=128)
    quantity = serializers.FloatField(min_value=0)  # g
    price = serializers.FloatField(min_value=0, required=False, allow_null=True)  # KRW/g
    asset_category = serializers.CharField(max_length=64, required=False, allow_blank=True, default="")
    broker = serializers.CharField(max_length=64, required=False, allow_blank=True, default="")
    sector = serializers.CharField(max_length=64, required=False, allow_blank=True, default="")
    industry = serializers.CharField(max_length=64, required=False, allow_blank=True, default="")


class AssetSaveSerializer(serializers.Serializer):
    domestic = DomesticStockItemSerializer(many=True, required=False, default=list)
    etf = DomesticEtfItemSerializer(many=True, required=False, default=list)
    foreign = ForeignStockItemSerializer(many=True, required=False, default=list)
    cash = CashItemSerializer(many=True, required=False, default=list)
    gold = GoldItemSerializer(many=True, required=False, default=list)


class SnapshotUpdateSerializer(AssetSaveSerializer):
    """스냅샷 수정 — 당시 단가·환율을 직접 입력."""

    usd_krw_rate = serializers.FloatField(min_value=0, required=False, allow_null=True)


class StockItemWithMarketSerializer(DomesticStockItemSerializer):
    market_type = serializers.ChoiceField(
        choices=[MARKET_DOMESTIC, MARKET_DOMESTIC_ETF, MARKET_FOREIGN]
    )
