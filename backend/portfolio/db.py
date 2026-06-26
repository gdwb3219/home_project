from django.conf import settings
from mongoengine import connect, disconnect


def connect_mongodb():
    disconnect(alias="default")
    connect(
        db=settings.MONGODB_DB,
        host=settings.MONGODB_URI,
        alias="default",
    )
