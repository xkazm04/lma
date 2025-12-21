'use client';

import React, { memo, useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  FileText,
  Sparkles,
  Send,
  Download,
  Eye,
  Plus,
  Trash2,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
} from 'lucide-react';
import type {
  DocumentTemplateType,
  DocumentDataSource,
  SignerConfig,
  SignerRole,
  DocumentContent,
  CalendarEvent,
} from '../../lib';
import {
  getTemplateTypeLabel,
  getSignerRoleLabel,
  mockDocumentTemplates,
  mockFinancialData,
  mockCovenantCalculations,
  mockBorrowingBaseData,
  EVENT_TYPE_TEMPLATES,
} from '../../lib';
import { DocumentPreview } from './DocumentPreview';

interface DocumentGenerationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent;
  facilityId: string;
  facilityName: string;
  borrowerName: string;
  onGenerate: (
    templateType: DocumentTemplateType,
    dataSource: DocumentDataSource,
    signers: SignerConfig[]
  ) => Promise<void>;
}

const AVAILABLE_SIGNERS: Array<{ role: SignerRole; title: string }> = [
  { role: 'borrower_cfo', title: 'Chief Financial Officer' },
  { role: 'borrower_controller', title: 'Controller' },
  { role: 'borrower_authorized_officer', title: 'Authorized Officer' },
  { role: 'agent_bank', title: 'Agent Bank Representative' },
];

export const DocumentGenerationModal = memo(function DocumentGenerationModal({
  open,
  onOpenChange,
  event,
  facilityId,
  facilityName,
  borrowerName,
  onGenerate,
}: DocumentGenerationModalProps) {
  const [step, setStep] = useState<'select' | 'configure' | 'preview'>('select');
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplateType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<DocumentContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Signer configuration
  const [signers, setSigners] = useState<SignerConfig[]>([]);

  // Period configuration
  const [periodStart, setPeriodStart] = useState(() => {
    const now = new Date();
    const firstOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    return firstOfQuarter.toISOString().split('T')[0];
  });
  const [periodEnd, setPeriodEnd] = useState(() => {
    const now = new Date();
    const lastOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
    return lastOfQuarter.toISOString().split('T')[0];
  });

  // Available templates based on event type
  const availableTemplates = useMemo(() => {
    if (event) {
      const templateTypes = EVENT_TYPE_TEMPLATES[event.type] || [];
      return mockDocumentTemplates.filter(t => templateTypes.includes(t.type));
    }
    return mockDocumentTemplates;
  }, [event]);

  const resetState = useCallback(() => {
    setStep('select');
    setSelectedTemplate(null);
    setGeneratedContent(null);
    setError(null);
    setSigners([]);
    setIsGenerating(false);
  }, []);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  }, [onOpenChange, resetState]);

  const handleSelectTemplate = useCallback((type: DocumentTemplateType) => {
    setSelectedTemplate(type);
    setError(null);

    // Pre-populate signers based on template
    const template = mockDocumentTemplates.find(t => t.type === type);
    if (template) {
      const defaultSigners: SignerConfig[] = template.required_signers.map(role => ({
        role,
        name: '',
        email: '',
        title: AVAILABLE_SIGNERS.find(s => s.role === role)?.title || '',
        organization: borrowerName,
        is_required: true,
      }));
      setSigners(defaultSigners);
    }

    setStep('configure');
  }, [borrowerName]);

  const handleAddSigner = useCallback(() => {
    setSigners(prev => [
      ...prev,
      {
        role: 'borrower_authorized_officer',
        name: '',
        email: '',
        title: '',
        organization: borrowerName,
        is_required: false,
      },
    ]);
  }, [borrowerName]);

  const handleRemoveSigner = useCallback((index: number) => {
    setSigners(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateSigner = useCallback((index: number, field: keyof SignerConfig, value: string | boolean) => {
    setSigners(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const handleGeneratePreview = useCallback(async () => {
    if (!selectedTemplate) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Build data source
      const dataSource: DocumentDataSource = {
        facility_id: facilityId,
        facility_name: facilityName,
        borrower_name: borrowerName,
        period_start_date: periodStart,
        period_end_date: periodEnd,
        submission_date: new Date().toISOString().split('T')[0],
        financials: mockFinancialData,
        covenants: mockCovenantCalculations,
        borrowing_base: mockBorrowingBaseData,
      };

      // Import document generation dynamically
      const { generateDocumentContent } = await import('@/lib/llm/document-generation');

      const content = await generateDocumentContent(selectedTemplate, dataSource);
      setGeneratedContent(content);
      setStep('preview');
    } catch (err) {
      console.error('Error generating document:', err);
      setError('Failed to generate document. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedTemplate, facilityId, facilityName, borrowerName, periodStart, periodEnd]);

  const handleSubmit = useCallback(async () => {
    if (!selectedTemplate || !generatedContent) return;

    setIsGenerating(true);
    setError(null);

    try {
      const dataSource: DocumentDataSource = {
        facility_id: facilityId,
        facility_name: facilityName,
        borrower_name: borrowerName,
        period_start_date: periodStart,
        period_end_date: periodEnd,
        submission_date: new Date().toISOString().split('T')[0],
        financials: mockFinancialData,
        covenants: mockCovenantCalculations,
        borrowing_base: mockBorrowingBaseData,
      };

      await onGenerate(selectedTemplate, dataSource, signers);
      handleOpenChange(false);
    } catch (err) {
      console.error('Error submitting document:', err);
      setError('Failed to create document. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedTemplate, generatedContent, facilityId, facilityName, borrowerName, periodStart, periodEnd, signers, onGenerate, handleOpenChange]);

  const isConfigValid = useMemo(() => {
    const requiredSignersValid = signers
      .filter(s => s.is_required)
      .every(s => s.name.trim() && s.email.trim() && s.email.includes('@'));
    return requiredSignersValid;
  }, [signers]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          'max-h-[90vh] overflow-hidden flex flex-col',
          step === 'preview' ? 'sm:max-w-[900px]' : 'sm:max-w-[600px]'
        )}
        data-testid="document-generation-modal"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {step === 'select' && 'Generate Compliance Document'}
            {step === 'configure' && `Configure ${selectedTemplate ? getTemplateTypeLabel(selectedTemplate) : 'Document'}`}
            {step === 'preview' && 'Review Document'}
          </DialogTitle>
          {event && (
            <DialogDescription className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {event.title} • {event.facility_name}
            </DialogDescription>
          )}
        </DialogHeader>

        {error && (
          <div className="px-1 py-2">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-1">
          {/* Step 1: Select Template */}
          {step === 'select' && (
            <div className="space-y-3 py-2">
              <p className="text-sm text-zinc-500">
                Select a document template to generate for this compliance event.
              </p>
              <div className="grid gap-2">
                {availableTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className={cn(
                      'cursor-pointer transition-all hover:border-blue-300 hover:shadow-sm',
                      selectedTemplate === template.type && 'border-blue-500 ring-1 ring-blue-500'
                    )}
                    onClick={() => handleSelectTemplate(template.type)}
                    data-testid={`template-option-${template.type}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-zinc-900">{template.name}</h4>
                          <p className="text-sm text-zinc-500 mt-0.5">{template.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              v{template.version}
                            </Badge>
                            <span className="text-xs text-zinc-400">
                              {template.required_signers.length} signer(s) required
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Configure */}
          {step === 'configure' && selectedTemplate && (
            <div className="space-y-6 py-2">
              {/* Period Selection */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-zinc-700">Reporting Period</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Start Date</label>
                    <Input
                      type="date"
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                      data-testid="period-start-input"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">End Date</label>
                    <Input
                      type="date"
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                      data-testid="period-end-input"
                    />
                  </div>
                </div>
              </div>

              {/* Signers */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-zinc-700">Signers</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddSigner}
                    data-testid="add-signer-btn"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Signer
                  </Button>
                </div>

                <div className="space-y-3">
                  {signers.map((signer, index) => (
                    <Card key={index} className="bg-zinc-50">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={signer.is_required ? 'default' : 'outline'}>
                              {getSignerRoleLabel(signer.role)}
                            </Badge>
                            {signer.is_required && (
                              <span className="text-xs text-zinc-500">Required</span>
                            )}
                          </div>
                          {!signer.is_required && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSigner(index)}
                              data-testid={`remove-signer-btn-${index}`}
                            >
                              <Trash2 className="w-4 h-4 text-zinc-400" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Name *</label>
                            <Input
                              value={signer.name}
                              onChange={(e) => handleUpdateSigner(index, 'name', e.target.value)}
                              placeholder="Full name"
                              data-testid={`signer-name-input-${index}`}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Email *</label>
                            <Input
                              type="email"
                              value={signer.email}
                              onChange={(e) => handleUpdateSigner(index, 'email', e.target.value)}
                              placeholder="email@company.com"
                              data-testid={`signer-email-input-${index}`}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Title</label>
                            <Input
                              value={signer.title}
                              onChange={(e) => handleUpdateSigner(index, 'title', e.target.value)}
                              placeholder="Job title"
                              data-testid={`signer-title-input-${index}`}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-zinc-500 mb-1 block">Role</label>
                            <select
                              value={signer.role}
                              onChange={(e) => handleUpdateSigner(index, 'role', e.target.value as SignerRole)}
                              className="w-full h-9 px-3 rounded-md border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              data-testid={`signer-role-select-${index}`}
                            >
                              {AVAILABLE_SIGNERS.map((s) => (
                                <option key={s.role} value={s.role}>
                                  {getSignerRoleLabel(s.role)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                <Button
                  variant="outline"
                  onClick={() => setStep('select')}
                  data-testid="back-to-select-btn"
                >
                  Back
                </Button>
                <Button
                  onClick={handleGeneratePreview}
                  disabled={!isConfigValid || isGenerating}
                  data-testid="generate-preview-btn"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Preview
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && generatedContent && (
            <div className="space-y-4 py-2">
              <Tabs defaultValue="preview">
                <TabsList>
                  <TabsTrigger value="preview" data-testid="preview-tab">
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="signers" data-testid="signers-tab">
                    Signers ({signers.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="mt-4">
                  <div className="max-h-[400px] overflow-y-auto">
                    <DocumentPreview content={generatedContent} />
                  </div>
                </TabsContent>

                <TabsContent value="signers" className="mt-4">
                  <div className="space-y-2">
                    {signers.map((signer, index) => (
                      <div
                        key={index}
                        className="p-3 bg-zinc-50 rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-sm">{signer.name || 'Not specified'}</div>
                          <div className="text-xs text-zinc-500">
                            {signer.email || 'No email'} • {getSignerRoleLabel(signer.role)}
                          </div>
                        </div>
                        <Badge variant={signer.is_required ? 'default' : 'outline'}>
                          {signer.is_required ? 'Required' : 'Optional'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                <Button
                  variant="outline"
                  onClick={() => setStep('configure')}
                  data-testid="back-to-configure-btn"
                >
                  Back
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Download preview functionality
                      const blob = new Blob([JSON.stringify(generatedContent, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'document-preview.json';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    data-testid="download-preview-btn"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isGenerating}
                    data-testid="create-and-send-btn"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Create & Send for Signature
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});
