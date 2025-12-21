import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exportTermSheetSchema, exportAuditTrailSchema } from '@/lib/validations';
import { countBy } from '@/lib/utils';
import type { ApiResponse, TermSheetExport, AuditTrailExport, NegotiationTerm, TermCategory, TermHistory } from '@/types';

// POST /api/deals/[id]/export - Export term sheet or audit trail
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      }, { status: 401 });
    }

    const body = await request.json();
    const exportType = body.export_type;

    // Check user is a participant
    interface ParticipantData {
      deal_role: string;
      party_name: string;
    }
    const { data: participant } = await (supabase
      .from('deal_participants') as ReturnType<typeof supabase.from>)
      .select('deal_role, party_name')
      .eq('deal_id', dealId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single() as { data: ParticipantData | null };

    if (!participant) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not a participant in this deal',
        },
      }, { status: 403 });
    }

    // Get deal info
    interface DealData {
      id: string;
      deal_name: string;
      deal_type: string;
      status: string;
    }
    const { data: deal, error: dealError } = await (supabase
      .from('deals') as ReturnType<typeof supabase.from>)
      .select('*')
      .eq('id', dealId)
      .single() as { data: DealData | null; error: unknown };

    if (dealError || !deal) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Deal not found',
        },
      }, { status: 404 });
    }

    if (exportType === 'term_sheet') {
      const parsed = exportTermSheetSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request',
            details: parsed.error.flatten(),
          },
        }, { status: 400 });
      }

      // Get categories and terms
      const { data: categories } = await (supabase
        .from('term_categories') as ReturnType<typeof supabase.from>)
        .select('*')
        .eq('deal_id', dealId)
        .order('display_order', { ascending: true }) as { data: TermCategory[] | null };

      const { data: terms } = await (supabase
        .from('negotiation_terms') as ReturnType<typeof supabase.from>)
        .select('*')
        .eq('deal_id', dealId)
        .order('display_order', { ascending: true }) as { data: NegotiationTerm[] | null };

      // Filter terms based on options
      let filteredTerms = terms || [];
      if (!parsed.data.include_pending) {
        // Only include agreed or locked terms
        filteredTerms = filteredTerms.filter(
          (t: NegotiationTerm) => t.negotiation_status === 'agreed' || t.is_locked
        );
      }

      // Build term sheet structure
      const termSheet: TermSheetExport = {
        deal_name: deal.deal_name,
        deal_type: deal.deal_type,
        export_date: new Date().toISOString(),
        exported_by: participant.party_name,
        format: parsed.data.format,
        sections: (categories || []).map((cat: TermCategory) => ({
          category_name: cat.name,
          terms: filteredTerms
            .filter((t: NegotiationTerm) => t.category_id === cat.id)
            .map((t: NegotiationTerm) => ({
              term_label: t.term_label,
              current_value: t.current_value_text || String(t.current_value),
              status: t.negotiation_status,
              is_locked: t.is_locked,
              source_clause: t.source_clause_reference,
            })),
        })).filter((s: { category_name: string; terms: unknown[] }) => s.terms.length > 0),
        metadata: {
          total_terms: filteredTerms.length,
          agreed_terms: filteredTerms.filter((t: NegotiationTerm) => t.negotiation_status === 'agreed').length,
          locked_terms: filteredTerms.filter((t: NegotiationTerm) => t.is_locked).length,
        },
      };

      // If format is markdown, generate markdown content
      if (parsed.data.format === 'markdown') {
        const markdown = generateTermSheetMarkdown(termSheet);
        return new NextResponse(markdown, {
          headers: {
            'Content-Type': 'text/markdown',
            'Content-Disposition': `attachment; filename="${deal.deal_name.replace(/[^a-z0-9]/gi, '_')}_term_sheet.md"`,
          },
        });
      }

      return NextResponse.json<ApiResponse<TermSheetExport>>({
        success: true,
        data: termSheet,
      });
    }

    if (exportType === 'audit_trail') {
      const parsed = exportAuditTrailSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request',
            details: parsed.error.flatten(),
          },
        }, { status: 400 });
      }

      // Build query for history
      let historyQuery = supabase
        .from('term_history')
        .select('*')
        .eq('deal_id', dealId)
        .order('changed_at', { ascending: false });

      if (parsed.data.term_ids && parsed.data.term_ids.length > 0) {
        historyQuery = historyQuery.in('term_id', parsed.data.term_ids);
      }

      if (parsed.data.start_date) {
        historyQuery = historyQuery.gte('changed_at', parsed.data.start_date);
      }

      if (parsed.data.end_date) {
        historyQuery = historyQuery.lte('changed_at', parsed.data.end_date);
      }

      const { data: history } = await (historyQuery as ReturnType<typeof supabase.from>) as { data: TermHistory[] | null };

      // Get term labels
      const termIds = [...new Set((history || []).map((h: TermHistory) => h.term_id))];
      interface TermLabelData {
        id: string;
        term_label: string;
      }
      const { data: terms } = await (supabase
        .from('negotiation_terms') as ReturnType<typeof supabase.from>)
        .select('id, term_label')
        .in('id', termIds) as { data: TermLabelData[] | null };

      const termLabelMap: Record<string, string> = {};
      (terms || []).forEach((t: { id: string; term_label: string }) => {
        termLabelMap[t.id] = t.term_label;
      });

      const auditTrail: AuditTrailExport = {
        deal_name: deal.deal_name,
        export_date: new Date().toISOString(),
        exported_by: participant.party_name,
        date_range: {
          start: parsed.data.start_date || null,
          end: parsed.data.end_date || null,
        },
        entries: (history || []).map((h: TermHistory) => ({
          timestamp: h.changed_at,
          term_label: termLabelMap[h.term_id] || 'Unknown',
          change_type: h.change_type,
          previous_value: h.previous_value,
          new_value: h.new_value,
          changed_by_party: h.changed_by_party,
          metadata: h.metadata,
        })),
        summary: {
          total_changes: (history || []).length,
          changes_by_party: countBy(history || [], (h: TermHistory) => h.changed_by_party),
          changes_by_type: countBy(history || [], (h: TermHistory) => h.change_type),
        },
      };

      return NextResponse.json<ApiResponse<AuditTrailExport>>({
        success: true,
        data: auditTrail,
      });
    }

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'export_type must be "term_sheet" or "audit_trail"',
      },
    }, { status: 400 });
  } catch (error) {
    console.error('Error exporting:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

function generateTermSheetMarkdown(termSheet: TermSheetExport): string {
  let md = `# Term Sheet: ${termSheet.deal_name}\n\n`;
  md += `**Deal Type:** ${termSheet.deal_type}\n`;
  md += `**Export Date:** ${new Date(termSheet.export_date).toLocaleDateString()}\n`;
  md += `**Exported By:** ${termSheet.exported_by}\n\n`;
  md += `---\n\n`;

  for (const section of termSheet.sections) {
    md += `## ${section.category_name}\n\n`;
    md += `| Term | Value | Status |\n`;
    md += `|------|-------|--------|\n`;

    for (const term of section.terms) {
      const status = term.is_locked ? '🔒 Locked' : term.status;
      md += `| ${term.term_label} | ${term.current_value} | ${status} |\n`;
    }

    md += `\n`;
  }

  md += `---\n\n`;
  md += `### Summary\n\n`;
  md += `- **Total Terms:** ${termSheet.metadata.total_terms}\n`;
  md += `- **Agreed Terms:** ${termSheet.metadata.agreed_terms}\n`;
  md += `- **Locked Terms:** ${termSheet.metadata.locked_terms}\n`;

  return md;
}
