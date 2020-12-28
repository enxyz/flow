"""Add samples table.

Revision ID: f500e59bf5e5
Revises: 5d1a156b1e81
Create Date: 2020-12-21 21:17:03.100139

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'f500e59bf5e5'
down_revision = '5d1a156b1e81'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('sample',
    sa.Column('is_deleted', sa.Boolean(), nullable=True),
    sa.Column('created_on', sa.DateTime(), nullable=True),
    sa.Column('sample_id', sa.String(length=64), nullable=False),
    sa.Column('plate_id', sa.String(length=64), nullable=False),
    sa.Column('run_version_id', sa.Integer(), nullable=False),
    sa.Column('protocol_version_id', sa.Integer(), nullable=False),
    sa.Column('version_id', sa.Integer(), nullable=True),
    sa.Column('created_by', sa.String(length=64), nullable=True),
    sa.ForeignKeyConstraint(['created_by'], ['user.id'], ),
    sa.ForeignKeyConstraint(['protocol_version_id'], ['protocol_version.id'], use_alter=True),
    sa.ForeignKeyConstraint(['run_version_id'], ['run_version.id'], use_alter=True),
    sa.ForeignKeyConstraint(['version_id'], ['sample_version.id'], use_alter=True),
    sa.PrimaryKeyConstraint('sample_id', 'plate_id', 'run_version_id', 'protocol_version_id')
    )
    op.create_table('sample_version',
    sa.Column('server_version', sa.String(length=40), nullable=True),
    sa.Column('webapp_version', sa.String(length=40), nullable=True),
    sa.Column('updated_on', sa.DateTime(), nullable=True),
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('sample_id', sa.String(length=64), nullable=True),
    sa.Column('plate_id', sa.String(length=64), nullable=True),
    sa.Column('run_version_id', sa.Integer(), nullable=True),
    sa.Column('protocol_version_id', sa.Integer(), nullable=True),
    sa.Column('data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('updated_by', sa.String(length=64), nullable=True),
    sa.ForeignKeyConstraint(['protocol_version_id'], ['sample.protocol_version_id'], ),
    sa.ForeignKeyConstraint(['run_version_id'], ['sample.run_version_id'], ),
    sa.ForeignKeyConstraint(['sample_id', 'plate_id', 'run_version_id', 'protocol_version_id'], ['sample.sample_id', 'sample.plate_id', 'sample.run_version_id', 'sample.protocol_version_id'], ),
    sa.ForeignKeyConstraint(['updated_by'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.add_column('protocol_version', sa.Column('server_version', sa.String(length=40), nullable=True))
    op.add_column('protocol_version', sa.Column('webapp_version', sa.String(length=40), nullable=True))
    op.add_column('run_version', sa.Column('server_version', sa.String(length=40), nullable=True))
    op.add_column('run_version', sa.Column('webapp_version', sa.String(length=40), nullable=True))
    op.add_column('user_version', sa.Column('server_version', sa.String(length=40), nullable=True))
    op.add_column('user_version', sa.Column('webapp_version', sa.String(length=40), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('user_version', 'webapp_version')
    op.drop_column('user_version', 'server_version')
    op.drop_column('run_version', 'webapp_version')
    op.drop_column('run_version', 'server_version')
    op.drop_column('protocol_version', 'webapp_version')
    op.drop_column('protocol_version', 'server_version')
    op.drop_table('sample_version')
    op.drop_table('sample')
    # ### end Alembic commands ###
