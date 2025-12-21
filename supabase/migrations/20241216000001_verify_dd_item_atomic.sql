-- Atomic DD item verification with timeline event creation
-- This function ensures that when a DD item is verified, the timeline event is always created atomically

CREATE OR REPLACE FUNCTION verify_dd_item_atomic(
  p_item_id UUID,
  p_trade_id UUID,
  p_user_id UUID,
  p_verification_notes TEXT DEFAULT NULL,
  p_evidence_document_ids UUID[] DEFAULT NULL,
  p_evidence_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  item_id UUID,
  item_status TEXT,
  item_name TEXT,
  item_category TEXT,
  event_id UUID,
  verified_at TIMESTAMPTZ,
  actor_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item_record RECORD;
  v_checklist_id UUID;
  v_event_id UUID;
  v_actor_name TEXT;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Get item details and validate it belongs to the trade
  SELECT
    di.*,
    dc.id as checklist_id,
    dc.trade_id
  INTO v_item_record
  FROM due_diligence_items di
  INNER JOIN due_diligence_checklists dc ON dc.id = di.checklist_id
  WHERE di.id = p_item_id AND dc.trade_id = p_trade_id;

  IF v_item_record IS NULL THEN
    RAISE EXCEPTION 'Item not found or does not belong to specified trade';
  END IF;

  v_checklist_id := v_item_record.checklist_id;

  -- Get actor name
  SELECT COALESCE(full_name, email) INTO v_actor_name
  FROM loan_users
  WHERE id = p_user_id;

  IF v_actor_name IS NULL THEN
    v_actor_name := 'Unknown User';
  END IF;

  -- Update the DD item to verified status
  UPDATE due_diligence_items
  SET
    status = 'verified',
    verified_by = p_user_id,
    verified_at = v_now,
    verification_notes = COALESCE(p_verification_notes, verification_notes),
    evidence_document_ids = COALESCE(p_evidence_document_ids, evidence_document_ids),
    evidence_notes = COALESCE(p_evidence_notes, evidence_notes),
    -- Clear any previous flags
    flag_reason = NULL,
    flag_severity = NULL,
    flagged_by = NULL,
    flagged_at = NULL,
    updated_at = v_now
  WHERE id = p_item_id;

  -- Create the timeline event
  INSERT INTO trade_events (
    trade_id,
    event_type,
    event_data,
    actor_id,
    occurred_at
  ) VALUES (
    p_trade_id,
    'dd_item_verified',
    jsonb_build_object(
      'item_id', p_item_id,
      'item_name', v_item_record.item_name,
      'category', v_item_record.category,
      'verification_notes', p_verification_notes
    ),
    p_user_id,
    v_now
  )
  RETURNING id INTO v_event_id;

  -- Update checklist status based on all items
  PERFORM update_dd_checklist_status(v_checklist_id, p_trade_id);

  -- Return the result
  RETURN QUERY SELECT
    p_item_id as item_id,
    'verified'::TEXT as item_status,
    v_item_record.item_name as item_name,
    v_item_record.category as item_category,
    v_event_id as event_id,
    v_now as verified_at,
    v_actor_name as actor_name;
END;
$$;

-- Helper function to update checklist status
CREATE OR REPLACE FUNCTION update_dd_checklist_status(
  p_checklist_id UUID,
  p_trade_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_items INTEGER;
  v_verified_items INTEGER;
  v_flagged_items INTEGER;
  v_completed_items INTEGER;
  v_new_status TEXT;
BEGIN
  -- Count items by status
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'verified'),
    COUNT(*) FILTER (WHERE status = 'flagged'),
    COUNT(*) FILTER (WHERE status IN ('verified', 'waived', 'not_applicable'))
  INTO v_total_items, v_verified_items, v_flagged_items, v_completed_items
  FROM due_diligence_items
  WHERE checklist_id = p_checklist_id;

  -- Determine new status
  IF v_flagged_items > 0 THEN
    v_new_status := 'flagged';
  ELSIF v_completed_items = v_total_items THEN
    v_new_status := 'complete';
  ELSIF v_verified_items > 0 OR v_completed_items > 0 THEN
    v_new_status := 'in_progress';
  ELSE
    v_new_status := 'not_started';
  END IF;

  -- Update checklist
  UPDATE due_diligence_checklists
  SET
    status = v_new_status,
    completed_items = v_completed_items,
    flagged_items = v_flagged_items,
    updated_at = NOW(),
    completed_at = CASE WHEN v_new_status = 'complete' THEN NOW() ELSE NULL END
  WHERE id = p_checklist_id;

  -- Update trade status if starting DD
  IF v_new_status = 'in_progress' THEN
    UPDATE trades
    SET
      status = 'in_due_diligence',
      updated_at = NOW()
    WHERE id = p_trade_id AND status = 'agreed';
  END IF;
END;
$$;

-- Add flagged_by and flagged_at columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'due_diligence_items' AND column_name = 'flagged_by')
  THEN
    ALTER TABLE due_diligence_items ADD COLUMN flagged_by UUID REFERENCES loan_users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'due_diligence_items' AND column_name = 'flagged_at')
  THEN
    ALTER TABLE due_diligence_items ADD COLUMN flagged_at TIMESTAMPTZ;
  END IF;
END $$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION verify_dd_item_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION update_dd_checklist_status TO authenticated;
