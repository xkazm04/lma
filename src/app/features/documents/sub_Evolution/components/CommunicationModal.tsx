'use client';

import * as React from 'react';
import {
  Mail,
  Send,
  Users,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AmendmentSuggestion } from '../lib/types';

interface Recipient {
  name: string;
  email: string;
  role: string;
}

interface CommunicationModalProps {
  suggestion: AmendmentSuggestion | null;
  isOpen: boolean;
  onClose: () => void;
  onSend?: (data: {
    suggestionId: string;
    communicationType: 'informal_discussion' | 'formal_proposal' | 'amendment_request';
    recipients: Recipient[];
    customMessage?: string;
  }) => Promise<void>;
}

interface CommunicationDraft {
  subject: string;
  greeting: string;
  body: string;
  suggestedNextSteps: string[];
  callToAction: string;
  closing: string;
  attachmentSuggestions: string[];
}

const communicationTypes = [
  {
    id: 'informal_discussion' as const,
    label: 'Informal Discussion',
    description: 'Initial conversation to gauge interest',
  },
  {
    id: 'formal_proposal' as const,
    label: 'Formal Proposal',
    description: 'Structured proposal with terms',
  },
  {
    id: 'amendment_request' as const,
    label: 'Amendment Request',
    description: 'Formal request to initiate amendment',
  },
];

export function CommunicationModal({
  suggestion,
  isOpen,
  onClose,
  onSend,
}: CommunicationModalProps) {
  const [communicationType, setCommunicationType] = React.useState<
    'informal_discussion' | 'formal_proposal' | 'amendment_request'
  >('informal_discussion');
  const [recipients, setRecipients] = React.useState<Recipient[]>([
    { name: '', email: '', role: 'CFO' },
  ]);
  const [customMessage, setCustomMessage] = React.useState('');
  const [draft, setDraft] = React.useState<CommunicationDraft | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  // Generate draft when modal opens or type changes
  React.useEffect(() => {
    if (isOpen && suggestion) {
      generateDraft();
    }
  }, [isOpen, suggestion, communicationType]);

  const generateDraft = async () => {
    if (!suggestion) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/documents/evolution/communicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestionId: suggestion.id,
          communicationType,
          facilityName: 'Credit Facility',
          borrowerName: 'Borrower',
          senderName: 'Loan Officer',
          senderRole: 'Relationship Manager',
          recipientName: 'CFO',
          recipientRole: 'Chief Financial Officer',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setDraft(data.data.draft);
      } else {
        setError(data.error?.message || 'Failed to generate draft');
      }
    } catch (err) {
      setError('Failed to generate communication draft');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRecipient = () => {
    setRecipients([...recipients, { name: '', email: '', role: '' }]);
  };

  const handleRemoveRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const handleRecipientChange = (
    index: number,
    field: keyof Recipient,
    value: string
  ) => {
    const updated = [...recipients];
    updated[index] = { ...updated[index], [field]: value };
    setRecipients(updated);
  };

  const handleSend = async () => {
    if (!suggestion || !onSend) return;

    setIsSending(true);
    setError(null);

    try {
      await onSend({
        suggestionId: suggestion.id,
        communicationType,
        recipients: recipients.filter(r => r.email),
        customMessage,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError('Failed to send communication');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setDraft(null);
    setError(null);
    setSuccess(false);
    setRecipients([{ name: '', email: '', role: 'CFO' }]);
    setCustomMessage('');
    onClose();
  };

  if (!suggestion) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="communication-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Draft Communication
          </DialogTitle>
          <DialogDescription>
            Initiate discussion with counterparty regarding: {suggestion.title}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
            <h3 className="text-lg font-semibold text-zinc-900">Communication Sent</h3>
            <p className="text-sm text-zinc-600 mt-1">
              Your message has been sent to the recipients.
            </p>
          </div>
        ) : (
          <>
            {/* Communication Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-700">Communication Type</label>
              <div className="grid grid-cols-3 gap-2">
                {communicationTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setCommunicationType(type.id)}
                    className={cn(
                      'rounded-md border p-3 text-left transition-colors',
                      communicationType === type.id
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                        : 'border-zinc-200 hover:border-zinc-300'
                    )}
                    data-testid={`comm-type-${type.id}`}
                  >
                    <p className="text-sm font-medium text-zinc-900">{type.label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Recipients */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Recipients
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddRecipient}
                  data-testid="add-recipient-btn"
                >
                  Add Recipient
                </Button>
              </div>
              <div className="space-y-2">
                {recipients.map((recipient, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="Name"
                      value={recipient.name}
                      onChange={(e) => handleRecipientChange(index, 'name', e.target.value)}
                      className="flex-1"
                      data-testid={`recipient-name-${index}`}
                    />
                    <Input
                      placeholder="Email"
                      type="email"
                      value={recipient.email}
                      onChange={(e) => handleRecipientChange(index, 'email', e.target.value)}
                      className="flex-1"
                      data-testid={`recipient-email-${index}`}
                    />
                    <Input
                      placeholder="Role"
                      value={recipient.role}
                      onChange={(e) => handleRecipientChange(index, 'role', e.target.value)}
                      className="w-24"
                      data-testid={`recipient-role-${index}`}
                    />
                    {recipients.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRecipient(index)}
                        className="text-zinc-400 hover:text-red-500"
                        data-testid={`remove-recipient-${index}`}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Generated Draft Preview */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                AI-Generated Draft
              </label>

              {isLoading ? (
                <div className="flex items-center justify-center py-8 bg-zinc-50 rounded-md">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
                  <span className="text-sm text-zinc-600">Generating draft...</span>
                </div>
              ) : error ? (
                <div className="flex items-center gap-2 p-4 bg-red-50 rounded-md text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              ) : draft ? (
                <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 space-y-4">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Subject</p>
                    <p className="text-sm font-medium text-zinc-900">{draft.subject}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Preview</p>
                    <div className="text-sm text-zinc-700 whitespace-pre-wrap bg-white rounded-md p-3 border border-zinc-200">
                      <p>{draft.greeting}</p>
                      <p className="mt-2">{draft.body}</p>
                      <p className="mt-2 font-medium">{draft.callToAction}</p>
                      <p className="mt-2">{draft.closing}</p>
                    </div>
                  </div>
                  {draft.suggestedNextSteps.length > 0 && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Suggested Next Steps</p>
                      <ul className="text-xs text-zinc-600 list-disc list-inside">
                        {draft.suggestedNextSteps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {draft.attachmentSuggestions.length > 0 && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Suggested Attachments</p>
                      <div className="flex flex-wrap gap-1">
                        {draft.attachmentSuggestions.map((att, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {att}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Custom Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">
                Additional Notes (Optional)
              </label>
              <Textarea
                placeholder="Add any custom notes or modifications..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
                data-testid="custom-message-input"
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSending}
                data-testid="cancel-communication-btn"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={isSending || !draft || recipients.every(r => !r.email)}
                data-testid="send-communication-btn"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Communication
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
