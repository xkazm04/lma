'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ClauseTypeSelector,
  CovenantForm,
  ObligationForm,
  FacilityTermForm,
  DefinitionForm,
  GeneralClauseForm,
  DocumentContextForm,
  TranslatedClausePreview,
  PrecedentClauseInput,
} from './components';
import type {
  ClauseType,
  FormalityLevel,
  CovenantFormFields,
  ObligationFormFields,
  FacilityTermFormFields,
  DefinitionFormFields,
  TranslatedClause,
  ExportFormat,
} from './lib/types';

interface DocumentTranslationPageProps {
  documentId?: string;
}

const INITIAL_COVENANT_VALUES: CovenantFormFields = {
  covenantName: '',
  covenantType: '',
  thresholdType: 'maximum',
  thresholdValue: '',
  testingFrequency: 'quarterly',
  numeratorDefinition: '',
  denominatorDefinition: '',
};

const INITIAL_OBLIGATION_VALUES: ObligationFormFields = {
  obligationType: '',
  description: '',
  frequency: '',
  deadlineDays: '',
  recipientRole: '',
};

const INITIAL_FACILITY_TERM_VALUES: FacilityTermFormFields = {
  termName: '',
  termValue: '',
  termType: '',
};

const INITIAL_DEFINITION_VALUES: DefinitionFormFields = {
  termName: '',
  definition: '',
  relatedTerms: '',
};

const INITIAL_GENERAL_VALUES = {
  clauseTitle: '',
  structuredDataJson: '',
};

export function DocumentTranslationPage({ documentId }: DocumentTranslationPageProps) {
  // State
  const [selectedClauseType, setSelectedClauseType] = useState<ClauseType>('covenant');
  const [covenantValues, setCovenantValues] = useState<CovenantFormFields>(INITIAL_COVENANT_VALUES);
  const [obligationValues, setObligationValues] = useState<ObligationFormFields>(INITIAL_OBLIGATION_VALUES);
  const [facilityTermValues, setFacilityTermValues] = useState<FacilityTermFormFields>(INITIAL_FACILITY_TERM_VALUES);
  const [definitionValues, setDefinitionValues] = useState<DefinitionFormFields>(INITIAL_DEFINITION_VALUES);
  const [generalValues, setGeneralValues] = useState(INITIAL_GENERAL_VALUES);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [context, setContext] = useState({
    borrowerName: '',
    facilityName: '',
    governingLaw: 'New York',
  });

  const [formatOptions, setFormatOptions] = useState({
    includeNumbering: true,
    useDefinedTerms: true,
    includeCrossReferences: true,
    formalityLevel: 'formal' as FormalityLevel,
  });

  const [precedentClauses, setPrecedentClauses] = useState<string[]>([]);
  const [translatedClause, setTranslatedClause] = useState<TranslatedClause | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handlers
  const handleCovenantChange = useCallback((field: keyof CovenantFormFields, value: string) => {
    setCovenantValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleObligationChange = useCallback((field: keyof ObligationFormFields, value: string) => {
    setObligationValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleFacilityTermChange = useCallback((field: keyof FacilityTermFormFields, value: string) => {
    setFacilityTermValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleDefinitionChange = useCallback((field: keyof DefinitionFormFields, value: string) => {
    setDefinitionValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleGeneralChange = useCallback((field: 'clauseTitle' | 'structuredDataJson', value: string) => {
    setGeneralValues((prev) => ({ ...prev, [field]: value }));
    if (field === 'structuredDataJson') {
      try {
        if (value.trim()) {
          JSON.parse(value);
        }
        setJsonError(null);
      } catch {
        setJsonError('Invalid JSON format');
      }
    }
  }, []);

  const handleContextChange = useCallback((field: 'borrowerName' | 'facilityName' | 'governingLaw', value: string) => {
    setContext((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleFormatChange = useCallback(
    (field: keyof typeof formatOptions, value: boolean | FormalityLevel) => {
      setFormatOptions((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleAddPrecedent = useCallback((clause: string) => {
    setPrecedentClauses((prev) => [...prev, clause]);
  }, []);

  const handleRemovePrecedent = useCallback((index: number) => {
    setPrecedentClauses((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Build request data based on clause type
  const buildRequestData = useCallback(() => {
    const baseContext = {
      borrowerName: context.borrowerName || undefined,
      facilityName: context.facilityName || undefined,
      governingLaw: context.governingLaw,
    };

    switch (selectedClauseType) {
      case 'covenant':
        return {
          action: 'translate-covenant',
          data: {
            covenantName: covenantValues.covenantName,
            covenantType: covenantValues.covenantType,
            thresholdType: covenantValues.thresholdType,
            thresholdValue: covenantValues.thresholdValue ? parseFloat(covenantValues.thresholdValue) : undefined,
            testingFrequency: covenantValues.testingFrequency || undefined,
            numeratorDefinition: covenantValues.numeratorDefinition || undefined,
            denominatorDefinition: covenantValues.denominatorDefinition || undefined,
            documentContext: baseContext,
            precedentClauses: precedentClauses.length > 0 ? precedentClauses : undefined,
          },
        };

      case 'obligation':
        return {
          action: 'translate-obligation',
          data: {
            obligationType: obligationValues.obligationType,
            description: obligationValues.description || undefined,
            frequency: obligationValues.frequency || undefined,
            deadlineDays: obligationValues.deadlineDays ? parseInt(obligationValues.deadlineDays, 10) : undefined,
            recipientRole: obligationValues.recipientRole || undefined,
            documentContext: baseContext,
            precedentClauses: precedentClauses.length > 0 ? precedentClauses : undefined,
          },
        };

      case 'facility_term':
        return {
          action: 'translate-facility-term',
          data: {
            termName: facilityTermValues.termName,
            termValue: facilityTermValues.termValue,
            termType: facilityTermValues.termType,
            documentContext: baseContext,
            precedentClauses: precedentClauses.length > 0 ? precedentClauses : undefined,
          },
        };

      case 'definition':
        return {
          action: 'translate-clause',
          data: {
            clauseType: 'definition',
            structuredData: {
              termName: definitionValues.termName,
              definition: definitionValues.definition,
              relatedTerms: definitionValues.relatedTerms
                ? definitionValues.relatedTerms.split(',').map((t) => t.trim())
                : [],
            },
            documentContext: baseContext,
            formatOptions,
            precedentClauses: precedentClauses.length > 0 ? precedentClauses : undefined,
          },
        };

      case 'general':
        return {
          action: 'translate-clause',
          data: {
            clauseType: 'general',
            structuredData: JSON.parse(generalValues.structuredDataJson || '{}'),
            documentContext: baseContext,
            formatOptions,
            precedentClauses: precedentClauses.length > 0 ? precedentClauses : undefined,
          },
        };

      default:
        return null;
    }
  }, [
    selectedClauseType,
    covenantValues,
    obligationValues,
    facilityTermValues,
    definitionValues,
    generalValues,
    context,
    formatOptions,
    precedentClauses,
  ]);

  // Validate form
  const isFormValid = useCallback(() => {
    switch (selectedClauseType) {
      case 'covenant':
        return covenantValues.covenantName && covenantValues.covenantType;
      case 'obligation':
        return obligationValues.obligationType;
      case 'facility_term':
        return facilityTermValues.termName && facilityTermValues.termValue && facilityTermValues.termType;
      case 'definition':
        return definitionValues.termName && definitionValues.definition;
      case 'general':
        return generalValues.clauseTitle && generalValues.structuredDataJson && !jsonError;
      default:
        return false;
    }
  }, [
    selectedClauseType,
    covenantValues,
    obligationValues,
    facilityTermValues,
    definitionValues,
    generalValues,
    jsonError,
  ]);

  // Generate clause
  const handleGenerate = useCallback(async () => {
    if (!isFormValid()) return;

    const requestData = buildRequestData();
    if (!requestData) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/documents/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Translation failed');
      }

      setTranslatedClause(result.data);
    } catch (err) {
      console.error('Translation error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [isFormValid, buildRequestData]);

  // Export
  const handleExport = useCallback(async (format: ExportFormat) => {
    if (!translatedClause) return;

    try {
      const response = await fetch('/api/documents/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export',
          data: {
            clauses: [translatedClause],
            format,
            documentTitle: translatedClause.clauseTitle,
            effectiveDate: '[DATE]',
            includeMetrics: true,
          },
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Export failed');
      }

      // Download the file
      const blob = new Blob([result.data.content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.data.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
    }
  }, [translatedClause]);

  // Regenerate
  const handleRegenerate = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  // Render form based on clause type
  const renderForm = () => {
    switch (selectedClauseType) {
      case 'covenant':
        return <CovenantForm values={covenantValues} onChange={handleCovenantChange} />;
      case 'obligation':
        return <ObligationForm values={obligationValues} onChange={handleObligationChange} />;
      case 'facility_term':
        return <FacilityTermForm values={facilityTermValues} onChange={handleFacilityTermChange} />;
      case 'definition':
        return <DefinitionForm values={definitionValues} onChange={handleDefinitionChange} />;
      case 'general':
        return (
          <GeneralClauseForm
            values={generalValues}
            onChange={handleGeneralChange}
            jsonError={jsonError}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50" data-testid="document-translation-page">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={documentId ? `/documents/${documentId}` : '/documents'}>
                <Button variant="ghost" size="icon" data-testid="back-btn">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Document Translation Layer
                </h1>
                <p className="text-sm text-zinc-500">
                  Convert structured data into professional legal clause language
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Input Form */}
          <div className="space-y-6">
            {/* Clause Type Selector */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-zinc-500" />
                  Clause Type
                </CardTitle>
                <CardDescription>
                  Select the type of clause you want to generate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClauseTypeSelector
                  selected={selectedClauseType}
                  onSelect={setSelectedClauseType}
                />
              </CardContent>
            </Card>

            {/* Clause-Specific Form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Clause Details</CardTitle>
                <CardDescription>
                  Enter the structured data for your clause
                </CardDescription>
              </CardHeader>
              <CardContent>{renderForm()}</CardContent>
            </Card>

            {/* Document Context & Format Options */}
            <DocumentContextForm
              context={context}
              formatOptions={formatOptions}
              onContextChange={handleContextChange}
              onFormatChange={handleFormatChange}
            />

            {/* Precedent Clauses */}
            <PrecedentClauseInput
              precedentClauses={precedentClauses}
              onAdd={handleAddPrecedent}
              onRemove={handleRemovePrecedent}
            />

            {/* Generate Button */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleGenerate}
                disabled={!isFormValid() || isLoading}
                className="flex-1"
                size="lg"
                data-testid="generate-clause-btn"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isLoading ? 'Generating...' : 'Generate Legal Clause'}
              </Button>
            </div>

            {/* Error Display */}
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="py-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Generation Failed</p>
                      <p className="text-xs text-red-600 mt-1">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Preview */}
          <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
            <TranslatedClausePreview
              clause={translatedClause}
              isLoading={isLoading}
              onExport={handleExport}
              onRegenerate={handleRegenerate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentTranslationPage;
