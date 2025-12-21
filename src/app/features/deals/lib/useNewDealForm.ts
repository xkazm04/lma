'use client';

import { useState, useCallback, useMemo } from 'react';
import type { NewDealFormData } from './types';

export interface NewDealParticipant {
  email: string;
  party_name: string;
  party_type: string;
  party_role: string;
  deal_role: string;
}

const DEFAULT_INITIAL_FORM_DATA: NewDealFormData = {
  deal_name: '',
  deal_type: 'new_facility',
  description: '',
  target_close_date: '',
  import_source: 'none',
  selected_facility: '',
  import_covenants: true,
  import_obligations: true,
  import_esg: true,
  imported_facility_data: null,
  participants: [
    {
      email: '',
      party_name: '',
      party_type: 'borrower_side',
      party_role: 'Borrower',
      deal_role: 'deal_lead',
    },
  ],
  negotiation_mode: 'collaborative',
};

export interface UseNewDealFormOptions {
  initialData?: Partial<NewDealFormData>;
}

export interface UseNewDealFormReturn {
  formData: NewDealFormData;
  updateForm: (field: string, value: unknown) => void;
  addParticipant: () => void;
  removeParticipant: (index: number) => void;
  updateParticipant: (index: number, field: string, value: string) => void;
  canProceed: (step: number) => boolean;
  resetForm: () => void;
  isDirty: boolean;
  markClean: () => void;
}

/**
 * Custom hook for managing new deal form state in the wizard.
 * Encapsulates form data, participant management, and step validation.
 */
export function useNewDealForm(options?: UseNewDealFormOptions): UseNewDealFormReturn {
  const initialFormData = useMemo(
    () => ({
      ...DEFAULT_INITIAL_FORM_DATA,
      ...options?.initialData,
      participants: options?.initialData?.participants ?? DEFAULT_INITIAL_FORM_DATA.participants,
    }),
    [options?.initialData]
  );

  const [formData, setFormData] = useState<NewDealFormData>(initialFormData);
  const [isDirty, setIsDirty] = useState(false);

  const updateForm = useCallback((field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  const addParticipant = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      participants: [
        ...prev.participants,
        {
          email: '',
          party_name: '',
          party_type: 'lender_side',
          party_role: '',
          deal_role: 'negotiator',
        },
      ],
    }));
    setIsDirty(true);
  }, []);

  const updateParticipant = useCallback(
    (index: number, field: string, value: string) => {
      setFormData((prev) => ({
        ...prev,
        participants: prev.participants.map((p, i) =>
          i === index ? { ...p, [field]: value } : p
        ),
      }));
      setIsDirty(true);
    },
    []
  );

  const removeParticipant = useCallback((index: number) => {
    setFormData((prev) => {
      if (prev.participants.length <= 1) {
        return prev;
      }
      setIsDirty(true);
      return {
        ...prev,
        participants: prev.participants.filter((_, i) => i !== index),
      };
    });
  }, []);

  const markClean = useCallback(() => {
    setIsDirty(false);
  }, []);

  const canProceed = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 0:
          return formData.deal_name.trim() !== '' && formData.deal_type !== '';
        case 1:
          return true;
        case 2:
          return formData.participants.every((p) => p.party_name.trim() !== '');
        case 3:
          return true;
        default:
          return false;
      }
    },
    [formData.deal_name, formData.deal_type, formData.participants]
  );

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  return {
    formData,
    updateForm,
    addParticipant,
    removeParticipant,
    updateParticipant,
    canProceed,
    resetForm,
    isDirty,
    markClean,
  };
}
