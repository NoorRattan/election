"""
Centralised settings for the Electra backend.
All environment variables are declared here.
Import get_settings() and call it — never read os.environ directly in other modules.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    google_cloud_project: str = ""
    firebase_service_account_key: str = ""
    dialogflow_agent_id: str = ""
    dialogflow_location: str = "global"
    environment: str = "development"
    allowed_origins: str = "http://localhost:5173"
    secret_key: str = ""
    api_version: str = "1.0.0"
    rate_limit_per_minute: int = 120

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
