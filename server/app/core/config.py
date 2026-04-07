from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

SERVER_ROOT = Path(__file__).resolve().parents[2]
PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_DATABASE_PATH = SERVER_ROOT / "data" / "aurora.db"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(str(SERVER_ROOT / ".env"), str(PROJECT_ROOT / ".env")),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    environment: str = Field(default="development", alias="AURORA_ENV")
    app_name: str = Field(default="Aurora Course Manager API", alias="AURORA_APP_NAME")
    app_version: str = Field(default="0.1.0", alias="AURORA_APP_VERSION")
    api_prefix: str = Field(default="/api/v1", alias="AURORA_API_PREFIX")
    database_url: str = Field(
        default=f"sqlite:///{DEFAULT_DATABASE_PATH.as_posix()}",
        alias="AURORA_DATABASE_URL",
    )
    cors_origins_raw: str = Field(
        default="http://127.0.0.1:4200,http://localhost:4200",
        alias="AURORA_CORS_ORIGINS",
    )
    jwt_secret: str = Field(default="CHANGE_ME_TO_A_LONG_RANDOM_SECRET", alias="AURORA_JWT_SECRET")
    jwt_expire_minutes: int = Field(default=120, alias="AURORA_JWT_EXPIRE_MINUTES")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]

    @property
    def normalized_database_url(self) -> str:
        if self.database_url.startswith("sqlite:///") and not self.database_url.startswith("sqlite:////"):
            relative_path = self.database_url.removeprefix("sqlite:///")
            return f"sqlite:///{(PROJECT_ROOT / relative_path).resolve().as_posix()}"
        return self.database_url


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
