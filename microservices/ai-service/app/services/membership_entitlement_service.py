from __future__ import annotations

import httpx

from app.core.config import settings


class MembershipEntitlementService:
    def __init__(self) -> None:
        self._base_url = settings.MEMBERSHIP_SERVICE_URL.rstrip("/")

    async def ensure_ai_coach_access(self, authorization: str | None) -> None:
        entitlements = await self._get_entitlements(authorization)

        if entitlements.get("aiCoachAllowed"):
            return

        raise PermissionError(
            entitlements.get("aiCoachReason")
            or "Your current membership plan does not include AI Coach."
        )

    async def _get_entitlements(self, authorization: str | None) -> dict:
        if not self._base_url:
            raise RuntimeError("MEMBERSHIP_SERVICE_URL is not configured.")

        if not authorization:
            raise PermissionError("Authentication is required to use AI Coach.")

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{self._base_url}/api/subscriptions/me/entitlements",
                headers={"Authorization": authorization},
            )

        if response.status_code in (401, 403):
            raise PermissionError("Authentication is required to use AI Coach.")

        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise RuntimeError(
                f"Membership service returned {exc.response.status_code} while checking AI Coach access."
            ) from exc

        payload = response.json()
        if not isinstance(payload, dict):
            raise RuntimeError("Membership service returned an invalid entitlement payload.")

        return payload
