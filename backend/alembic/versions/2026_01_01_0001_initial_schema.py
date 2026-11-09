"""initial schema

Revision ID: 2026_01_01_0001
Revises: 
Create Date: 2026-01-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '2026_01_01_0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'doctors',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('credentials', sa.String(length=255), nullable=True),
        sa.Column('preferred_language', sa.String(length=10), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'patients',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('age', sa.Integer(), nullable=True),
        sa.Column('date_of_birth', sa.String(length=20), nullable=True),
        sa.Column('mobile_number', sa.String(length=20), nullable=False),
        sa.Column('preferred_language', sa.String(length=10), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_patients_name', 'patients', ['name'], unique=False)
    op.create_index('ix_patients_mobile_number', 'patients', ['mobile_number'], unique=False)

    op.create_table(
        'translation_cache',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('cache_key_hash', sa.String(length=64), nullable=False),
        sa.Column('normalized_source_hash', sa.String(length=64), nullable=False),
        sa.Column('source_language', sa.String(length=10), nullable=False),
        sa.Column('target_language', sa.String(length=10), nullable=False),
        sa.Column('translated_text_encrypted', sa.Text(), nullable=False),
        sa.Column('model_id', sa.String(length=64), nullable=False),
        sa.Column('prompt_version', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('hit_count', sa.Integer(), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_translation_cache_cache_key_hash', 'translation_cache', ['cache_key_hash'], unique=True)
    op.create_index('ix_translation_cache_normalized_source_hash', 'translation_cache', ['normalized_source_hash'], unique=False)

    op.create_table(
        'consultations',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('patient_id', sa.String(length=36), nullable=False),
        sa.Column('doctor_id', sa.String(length=36), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('doctor_language', sa.String(length=10), nullable=True),
        sa.Column('patient_language', sa.String(length=10), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_consultations_patient_id', 'consultations', ['patient_id'], unique=False)
    op.create_index('ix_consultations_doctor_id', 'consultations', ['doctor_id'], unique=False)

    op.create_table(
        'transcripts',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('consultation_id', sa.String(length=36), nullable=False),
        sa.Column('speaker', sa.String(length=10), nullable=False),
        sa.Column('canonical_english_text', sa.String(length=4000), nullable=False),
        sa.Column('source_language', sa.String(length=10), nullable=False),
        sa.Column('recipient_language', sa.String(length=10), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=True),
        sa.Column('confidence_metadata', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['consultation_id'], ['consultations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_transcripts_consultation_id', 'transcripts', ['consultation_id'], unique=False)

    op.create_table(
        'medical_history',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('patient_id', sa.String(length=36), nullable=False),
        sa.Column('condition', sa.String(length=255), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('source', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_medical_history_patient_id', 'medical_history', ['patient_id'], unique=False)

    op.create_table(
        'consultation_drafts',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('consultation_id', sa.String(length=36), nullable=False),
        sa.Column('structured_payload', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['consultation_id'], ['consultations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('consultation_id')
    )

    op.create_table(
        'clinical_records',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('consultation_id', sa.String(length=36), nullable=False),
        sa.Column('approved_payload', sa.JSON(), nullable=False),
        sa.Column('approved_by', sa.String(length=36), nullable=False),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['approved_by'], ['doctors.id'], ),
        sa.ForeignKeyConstraint(['consultation_id'], ['consultations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('consultation_id')
    )

    op.create_table(
        'followups',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('consultation_id', sa.String(length=36), nullable=False),
        sa.Column('appointment_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('phone_number', sa.String(length=20), nullable=False),
        sa.Column('sms_status', sa.String(length=50), nullable=True),
        sa.Column('provider_message_id', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['consultation_id'], ['consultations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_followups_consultation_id', 'followups', ['consultation_id'], unique=False)


def downgrade() -> None:
    op.drop_table('followups')
    op.drop_table('clinical_records')
    op.drop_table('consultation_drafts')
    op.drop_table('medical_history')
    op.drop_table('transcripts')
    op.drop_table('consultations')
    op.drop_table('translation_cache')
    op.drop_table('patients')
    op.drop_table('doctors')
