from __future__ import annotations

from datetime import date, datetime

import httpx

from app.core.config import settings
from app.schemas.recommendations import UserProfileContext


class UserProfileService:
    def __init__(self) -> None:
        self._base_url = settings.USER_SERVICE_URL.rstrip("/")

    async def get_profile(self, user_id: str) -> UserProfileContext:
        if not self._base_url:
            raise RuntimeError("USER_SERVICE_URL is not configured.")

        url = f"{self._base_url}/internal/users/{user_id}/ai-profile"
        headers: dict[str, str] = {}

        if settings.INTERNAL_TOKEN:
            headers["X-Internal-Token"] = settings.INTERNAL_TOKEN

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers)

        if response.status_code == 404:
            raise ValueError(f"User profile not found for '{user_id}'.")

        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise RuntimeError(
                f"User service returned {exc.response.status_code} while loading the AI profile."
            ) from exc

        return self._normalize_profile(response.json())

    def _normalize_profile(self, payload: dict) -> UserProfileContext:
        return UserProfileContext(
            firstName=self._get(payload, "firstName", "FirstName") or "cher membre",
            age=self._compute_age(self._get(payload, "dateOfBirth", "DateOfBirth")),
            weight_kg=self._get(payload, "weightKg", "WeightKg"),
            height_cm=self._get(payload, "heightCm", "HeightCm"),
            fitness_goal=self._get(payload, "fitnessGoal", "FitnessGoal"),
            experience_level=self._experience_label(
                self._get(payload, "experienceLevel", "ExperienceLevel")
            ),
            gender=self._get(payload, "gender", "Gender"),
        )

    @staticmethod
    def _compute_age(raw_date: str | None) -> int | None:
        if not raw_date:
            return None

        try:
            normalized = raw_date.replace("Z", "+00:00")
            birth_date = datetime.fromisoformat(normalized).date()
        except ValueError:
            return None

        today = date.today()
        return today.year - birth_date.year - (
            (today.month, today.day) < (birth_date.month, birth_date.day)
        )

    @staticmethod
    def _experience_label(level: int | None) -> str | None:
        labels = {
            0: "debutant",
            1: "intermediaire",
            2: "avance",
        }

        return labels.get(level)

    @staticmethod
    def _get(payload: dict, *keys: str):
        for key in keys:
            if key in payload:
                return payload[key]

        return None
