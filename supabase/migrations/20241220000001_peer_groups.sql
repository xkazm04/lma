-- Create ESG Peer Groups table for custom peer group definitions
CREATE TABLE IF NOT EXISTS esg_peer_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  definition JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_esg_peer_groups_organization ON esg_peer_groups(organization_id);
CREATE INDEX idx_esg_peer_groups_active ON esg_peer_groups(organization_id, is_active);
CREATE INDEX idx_esg_peer_groups_definition ON esg_peer_groups USING GIN (definition);

-- Add RLS policies
ALTER TABLE esg_peer_groups ENABLE ROW LEVEL SECURITY;

-- Users can view peer groups in their organization
CREATE POLICY "Users can view own org peer groups" ON esg_peer_groups
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can create peer groups in their organization
CREATE POLICY "Users can create peer groups" ON esg_peer_groups
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can update peer groups in their organization
CREATE POLICY "Users can update own org peer groups" ON esg_peer_groups
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Users can delete peer groups in their organization
CREATE POLICY "Users can delete own org peer groups" ON esg_peer_groups
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_esg_peer_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER esg_peer_groups_updated_at
  BEFORE UPDATE ON esg_peer_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_esg_peer_groups_updated_at();

-- Add comment
COMMENT ON TABLE esg_peer_groups IS 'Custom peer group definitions for ESG benchmarking comparisons';
