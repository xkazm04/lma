-- Migration: Create negotiation_events table for event sourcing
-- This table stores all negotiation events as the source of truth.
-- Events are immutable and append-only.

-- Create the negotiation_events table
CREATE TABLE IF NOT EXISTS negotiation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    actor_id UUID NOT NULL,
    actor_name TEXT NOT NULL,
    actor_party_type TEXT NOT NULL CHECK (actor_party_type IN ('borrower_side', 'lender_side', 'third_party')),
    actor_organization_id UUID,
    payload JSONB NOT NULL DEFAULT '{}',
    correlation_id UUID,
    causation_id UUID,
    metadata JSONB,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint on deal_id + sequence for optimistic locking
CREATE UNIQUE INDEX IF NOT EXISTS idx_negotiation_events_deal_sequence
ON negotiation_events(deal_id, sequence);

-- Index for efficient event type filtering
CREATE INDEX IF NOT EXISTS idx_negotiation_events_event_type
ON negotiation_events(deal_id, event_type);

-- Index for efficient time-based queries (time travel)
CREATE INDEX IF NOT EXISTS idx_negotiation_events_created_at
ON negotiation_events(deal_id, created_at);

-- Index for actor-based filtering
CREATE INDEX IF NOT EXISTS idx_negotiation_events_actor
ON negotiation_events(deal_id, actor_id);

-- Index for term-specific queries using JSONB
CREATE INDEX IF NOT EXISTS idx_negotiation_events_term_id
ON negotiation_events((payload->>'term_id'))
WHERE payload->>'term_id' IS NOT NULL;

-- Index for correlation tracking
CREATE INDEX IF NOT EXISTS idx_negotiation_events_correlation
ON negotiation_events(correlation_id)
WHERE correlation_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE negotiation_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read events for deals they participate in
CREATE POLICY "Users can read events for their deals"
ON negotiation_events
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM deal_participants dp
        WHERE dp.deal_id = negotiation_events.deal_id
        AND dp.user_id = auth.uid()
        AND dp.status = 'active'
    )
);

-- RLS Policy: Participants can insert events
CREATE POLICY "Participants can insert events"
ON negotiation_events
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM deal_participants dp
        WHERE dp.deal_id = negotiation_events.deal_id
        AND dp.user_id = auth.uid()
        AND dp.status = 'active'
    )
);

-- Create event_snapshots table for optimized state reconstruction
CREATE TABLE IF NOT EXISTS negotiation_event_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL,
    state JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for snapshot lookups
CREATE INDEX IF NOT EXISTS idx_negotiation_snapshots_deal_sequence
ON negotiation_event_snapshots(deal_id, sequence DESC);

-- Enable RLS on snapshots
ALTER TABLE negotiation_event_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read snapshots for deals they participate in
CREATE POLICY "Users can read snapshots for their deals"
ON negotiation_event_snapshots
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM deal_participants dp
        WHERE dp.deal_id = negotiation_event_snapshots.deal_id
        AND dp.user_id = auth.uid()
        AND dp.status = 'active'
    )
);

-- Function to get the next sequence number for a deal
CREATE OR REPLACE FUNCTION get_next_event_sequence(p_deal_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_sequence INTEGER;
BEGIN
    SELECT COALESCE(MAX(sequence), 0) + 1
    INTO v_sequence
    FROM negotiation_events
    WHERE deal_id = p_deal_id;

    RETURN v_sequence;
END;
$$ LANGUAGE plpgsql;

-- Function to create a snapshot if threshold reached
CREATE OR REPLACE FUNCTION maybe_create_snapshot()
RETURNS TRIGGER AS $$
DECLARE
    v_event_count INTEGER;
    v_snapshot_threshold INTEGER := 50;
    v_last_snapshot_sequence INTEGER;
BEGIN
    -- Get the last snapshot sequence for this deal
    SELECT COALESCE(MAX(sequence), 0)
    INTO v_last_snapshot_sequence
    FROM negotiation_event_snapshots
    WHERE deal_id = NEW.deal_id;

    -- Check if we've crossed the threshold since last snapshot
    IF NEW.sequence - v_last_snapshot_sequence >= v_snapshot_threshold THEN
        -- In a production system, this would trigger a background job
        -- to create a snapshot. For now, we just log it.
        RAISE NOTICE 'Snapshot threshold reached for deal %, sequence %', NEW.deal_id, NEW.sequence;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check snapshot threshold after each event
CREATE TRIGGER check_snapshot_threshold
AFTER INSERT ON negotiation_events
FOR EACH ROW
EXECUTE FUNCTION maybe_create_snapshot();

-- Add comment describing the event sourcing model
COMMENT ON TABLE negotiation_events IS
'Event source for negotiation timeline. All state is derived from replaying these events.
Events are immutable and append-only. Use the sequence number for ordering and optimistic locking.';

COMMENT ON TABLE negotiation_event_snapshots IS
'Snapshots of projected state for optimized event replay. Snapshots are created periodically
to avoid replaying the entire event stream from the beginning.';
