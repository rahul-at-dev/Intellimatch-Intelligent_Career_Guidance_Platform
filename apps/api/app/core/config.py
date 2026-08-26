from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "IntelliMatch AI API"
    demo_mode: bool = True
    database_url: str = "postgresql://intellimatch:intellimatch@localhost:5432/intellimatch"
    redis_url: str = "redis://localhost:6379/0"
    qdrant_url: str = "http://localhost:6333"
    neo4j_url: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "intellimatch"
    openrouter_api_key: str | None = None
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_model: str = "poolside/laguna-xs-2.1:free"


    github_token: str | None = None
    s3_endpoint: str | None = None
    clerk_secret_key: str | None = None
    clerk_jwt_key: str | None = None
    clerk_publishable_key: str | None = None
    affinda_api_key: str | None = None
    affinda_workspace_id: str | None = None
    affinda_document_type: str | None = None
    adzuna_app_id: str | None = None
    adzuna_app_key: str | None = None
    cors_origins: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
