"""Add profile fields to users and is_custom to goals.

Revision ID: 002
Revises: 001
Create Date: 2026-02-23
"""
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None

from alembic import op


def upgrade() -> None:
    op.execute("""
        ALTER TABLE users
        ADD COLUMN height_cm   FLOAT,
        ADD COLUMN weight_kg   FLOAT,
        ADD COLUMN age         INTEGER,
        ADD COLUMN gender      VARCHAR(10),
        ADD COLUMN goal_type   VARCHAR(20)
    """)
    op.execute("""
        ALTER TABLE goals
        ADD COLUMN is_custom BOOLEAN NOT NULL DEFAULT FALSE
    """)


def downgrade() -> None:
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS height_cm")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS weight_kg")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS age")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS gender")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS goal_type")
    op.execute("ALTER TABLE goals DROP COLUMN IF EXISTS is_custom")
