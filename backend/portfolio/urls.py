from django.urls import path

from portfolio.views import (
    AssetView,
    DashboardView,
    HealthCheckView,
    SnapshotDetailView,
    SnapshotListView,
)

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health-check"),
    path("assets/", AssetView.as_view(), name="assets"),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("snapshots/", SnapshotListView.as_view(), name="snapshot-list"),
    path("snapshots/<int:version>/", SnapshotDetailView.as_view(), name="snapshot-detail"),
]
