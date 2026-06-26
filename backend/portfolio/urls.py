from django.urls import path

from portfolio.views import AssetView, DashboardView, HealthCheckView

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health-check"),
    path("assets/", AssetView.as_view(), name="assets"),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
]
