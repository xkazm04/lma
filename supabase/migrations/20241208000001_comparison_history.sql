-- Comparison History Table
-- Stores historical comparison results for document pairs
-- Enables version history like Google Docs for loan document comparisons

CREATE TABLE IF NOT EXISTS document_comparison_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Document pair being compared
    document1_id UUID NOT NULL REFERENCES loan_documents(id) ON DELETE CASCADE,
    document2_id UUID NOT NULL REFERENCES loan_documents(id) ON DELETE CASCADE,

    -- Comparison metadata
    compared_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    compared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Comparison results (JSON for flexibility)
    differences JSONB NOT NULL DEFAULT '[]'::jsonb,
    impact_analysis TEXT,

    -- Summary stats for quick display
    total_changes INTEGER NOT NULL DEFAULT 0,
    added_count INTEGER NOT NULL DEFAULT 0,
    modified_count INTEGER NOT NULL DEFAULT 0,
    removed_count INTEGER NOT NULL DEFAULT 0,

    -- Optional notes/labels
    label TEXT,
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_comparison_history_org ON document_comparison_history(organization_id);
CREATE INDEX idx_comparison_history_doc1 ON document_comparison_history(document1_id);
CREATE INDEX idx_comparison_history_doc2 ON document_comparison_history(document2_id);
CREATE INDEX idx_comparison_history_docs ON document_comparison_history(document1_id, document2_id);
CREATE INDEX idx_comparison_history_compared_at ON document_comparison_history(compared_at DESC);
CREATE INDEX idx_comparison_history_compared_by ON document_comparison_history(compared_by);

-- Composite index for finding history of a specific document pair
CREATE INDEX idx_comparison_history_pair_ordered ON document_comparison_history(
    LEAST(document1_id, document2_id),
    GREATEST(document1_id, document2_id),
    compared_at DESC
);

-- Enable RLS
ALTER TABLE document_comparison_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view comparison history for their organization"
    ON document_comparison_history FOR SELECT
    USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create comparison history for their organization"
    ON document_comparison_history FOR INSERT
    WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own comparison history entries"
    ON document_comparison_history FOR UPDATE
    USING (compared_by = auth.uid());

CREATE POLICY "Users can delete their own comparison history entries"
    ON document_comparison_history FOR DELETE
    USING (compared_by = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_comparison_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comparison_history_updated_at
    BEFORE UPDATE ON document_comparison_history
    FOR EACH ROW
    EXECUTE FUNCTION update_comparison_history_updated_at();

-- Comments for documentation
COMMENT ON TABLE document_comparison_history IS 'Stores historical document comparison results, enabling version history like Google Docs';
COMMENT ON COLUMN document_comparison_history.differences IS 'JSON array of ComparisonChange objects with field, doc1Value, doc2Value, changeType, impact, and category';
COMMENT ON COLUMN document_comparison_history.label IS 'Optional user-provided label for this comparison snapshot';
COMMENT ON COLUMN document_comparison_history.notes IS 'Optional user notes about this comparison';
