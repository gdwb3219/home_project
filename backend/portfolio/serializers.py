from rest_framework import serializers

from portfolio.documents import MARKET_DOMESTIC, MARKET_DOMESTIC_ETF, MARKET_FOREIGN


class DomesticStockItemSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=128)
    symbol = serializers.CharField(max_length=32, required=False, allow_blank=True, default="")
    quantity = serializers.FloatField(min_value=0)
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


class AssetSaveSerializer(serializers.Serializer):
    domestic = DomesticStockItemSerializer(many=True, required=False, default=list)
    etf = DomesticEtfItemSerializer(many=True, required=False, default=list)
    foreign = ForeignStockItemSerializer(many=True, required=False, default=list)
    cash = CashItemSerializer(many=True, required=False, default=list)


class StockItemWithMarketSerializer(DomesticStockItemSerializer):
    market_type = serializers.ChoiceField(
        choices=[MARKET_DOMESTIC, MARKET_DOMESTIC_ETF, MARKET_FOREIGN]
    )
