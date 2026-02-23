"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-02-22

"""
from alembic import op

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Use raw SQL to avoid SQLAlchemy ORM type-event interference with enums
    op.execute("""
        CREATE TABLE users (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email       VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            name        VARCHAR(255) NOT NULL,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX ix_users_email ON users (email)")

    op.execute("""
        CREATE TABLE goals (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            daily_calories  INTEGER NOT NULL DEFAULT 2000,
            protein_g       FLOAT NOT NULL DEFAULT 150.0,
            carbs_g         FLOAT NOT NULL DEFAULT 250.0,
            fat_g           FLOAT NOT NULL DEFAULT 65.0,
            weight_goal_kg  FLOAT,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)

    op.execute("CREATE TYPE mealtype AS ENUM ('breakfast', 'lunch', 'dinner', 'snack')")
    op.execute("CREATE TYPE messagerole AS ENUM ('user', 'assistant')")

    op.execute("""
        CREATE TABLE food_entries (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            meal_type     mealtype NOT NULL,
            food_name     VARCHAR(500) NOT NULL,
            quantity      FLOAT NOT NULL DEFAULT 1.0,
            quantity_unit VARCHAR(50) NOT NULL DEFAULT 'serving',
            calories      FLOAT NOT NULL DEFAULT 0.0,
            protein_g     FLOAT NOT NULL DEFAULT 0.0,
            carbs_g       FLOAT NOT NULL DEFAULT 0.0,
            fat_g         FLOAT NOT NULL DEFAULT 0.0,
            fiber_g       FLOAT,
            sugar_g       FLOAT,
            sodium_mg     FLOAT,
            micronutrients JSONB,
            image_url     VARCHAR(1000),
            logged_at     DATE NOT NULL,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX ix_food_entries_user_id ON food_entries (user_id)")
    op.execute("CREATE INDEX ix_food_entries_logged_at ON food_entries (logged_at)")

    op.execute("""
        CREATE TABLE chat_messages (
            id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role       messagerole NOT NULL,
            content    TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX ix_chat_messages_user_id ON chat_messages (user_id)")
    op.execute("CREATE INDEX ix_chat_messages_created_at ON chat_messages (created_at)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS chat_messages")
    op.execute("DROP TABLE IF EXISTS food_entries")
    op.execute("DROP TABLE IF EXISTS goals")
    op.execute("DROP TABLE IF EXISTS users")
    op.execute("DROP TYPE IF EXISTS mealtype")
    op.execute("DROP TYPE IF EXISTS messagerole")
