import os
from typing import List, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str = "dev_secret_key_change_me_in_production_1234567890"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"
    DATABASE_URL: str = "sqlite:///./data/route53.db"
    ENV: str = "development"
    
    ALLOWED_ORIGINS: Union[str, List[str]] = "*"

    @property
    def cors_origins(self) -> List[str]:
        if isinstance(self.ALLOWED_ORIGINS, str):
            if self.ALLOWED_ORIGINS == "*":
                return ["*"]
            return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
        return self.ALLOWED_ORIGINS

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
