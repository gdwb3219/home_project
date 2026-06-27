from datetime import datetime

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from portfolio.serializers import AssetSaveSerializer
from portfolio.services.snapshot_service import (
    create_snapshot,
    get_snapshot,
    list_snapshots,
    snapshot_to_assets,
    snapshot_to_dashboard,
    snapshot_to_list_item,
    update_snapshot,
)


class HealthCheckView(APIView):
    def get(self, request):
        return Response(
            {
                "status": "ok",
                "service": "home_project-api",
                "timestamp": datetime.utcnow().isoformat(),
            }
        )


class AssetView(APIView):
    """최신 스냅샷의 보유 자산 조회 / 저장 시 새 스냅샷 생성"""

    def get(self, request):
        version = request.query_params.get("version")
        version_int = int(version) if version and version.isdigit() else None
        snapshot = get_snapshot(version=version_int)
        if version_int is not None and not snapshot:
            return Response(
                {"detail": f"스냅샷 v{version_int}을 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(snapshot_to_assets(snapshot))

    def post(self, request):
        serializer = AssetSaveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            snapshot = create_snapshot(serializer.validated_data)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        data = snapshot_to_assets(snapshot)
        data["message"] = f"스냅샷 v{snapshot.snapshot_version}이 저장되었습니다."
        return Response(data, status=status.HTTP_201_CREATED)


class DashboardView(APIView):
    """MongoDB 스냅샷 기반 대시보드 (실시간 API 미사용)"""

    def get(self, request):
        version = request.query_params.get("version")
        snapshot_id = request.query_params.get("snapshot_id")

        version_int = int(version) if version and version.isdigit() else None
        snapshot = get_snapshot(snapshot_id=snapshot_id, version=version_int)
        return Response(snapshot_to_dashboard(snapshot))


class SnapshotListView(APIView):
    """저장된 스냅샷 이력 목록"""

    def get(self, request):
        snapshots = list_snapshots()
        return Response(
            {
                "count": len(snapshots),
                "snapshots": [snapshot_to_list_item(s) for s in snapshots],
            }
        )


class SnapshotDetailView(APIView):
    """특정 스냅샷 자산 조회 / 수정"""

    def get(self, request, version):
        snapshot = get_snapshot(version=version)
        if not snapshot:
            return Response(
                {"detail": f"스냅샷 v{version}을 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(snapshot_to_assets(snapshot))

    def put(self, request, version):
        snapshot = get_snapshot(version=version)
        if not snapshot:
            return Response(
                {"detail": f"스냅샷 v{version}을 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AssetSaveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            updated = update_snapshot(snapshot, serializer.validated_data)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        data = snapshot_to_assets(updated)
        data["message"] = (
            f"스냅샷 v{updated.snapshot_version}이 수정되었습니다. "
            f"(저장 시점·가격 유지)"
        )
        return Response(data)
