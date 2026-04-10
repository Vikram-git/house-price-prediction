from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "House Price Analytics"
    secret_key: str = "change-me-in-production-use-openssl-rand-hex-32"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480
    demo_email: str = "analyst@example.com"
    demo_password: str = "SecurePass2024"
    # Comma-separated; add your Vercel URL(s), e.g. https://your-app.vercel.app
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"


settings = Settings()
