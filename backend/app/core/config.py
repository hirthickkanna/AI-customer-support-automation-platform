import os
from pydantic_settings import BaseSettings, SettingsConfigDict

# Determine the base directory of the backend folder to find the .env file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENV_FILE_PATH = os.path.join(BASE_DIR, ".env")

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://vaizai_admin:vaizai_secure_pass123@localhost:5432/vaizai_support"
    JWT_SECRET: str = "super_secret_vaizai_gateway_key_99881122"
    GEMINI_API_KEY: str = "mock-key-if-no-env-present"
    RAZORPAY_KEY_ID: str = "rzp_test_placeholder"
    RAZORPAY_KEY_SECRET: str = "placeholder_secret"

    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATH,
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
