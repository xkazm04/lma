'use client';

import React, { memo, useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  PenLine,
  Type,
  Upload,
  CheckCircle2,
  Shield,
  AlertCircle,
} from 'lucide-react';
import type { Signer, SignatureData } from '../../lib';
import { getSignerRoleLabel } from '../../lib';

interface SignatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signer: Signer | null;
  documentTitle: string;
  onSign: (signatureData: Omit<SignatureData, 'ip_address' | 'user_agent' | 'timestamp'>) => Promise<void>;
  onDecline: (reason: string) => Promise<void>;
}

export const SignatureModal = memo(function SignatureModal({
  open,
  onOpenChange,
  signer,
  documentTitle,
  onSign,
  onDecline,
}: SignatureModalProps) {
  const [signatureType, setSignatureType] = useState<'typed' | 'drawn'>('typed');
  const [typedSignature, setTypedSignature] = useState('');
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showDecline, setShowDecline] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const resetState = useCallback(() => {
    setTypedSignature('');
    setDrawnSignature(null);
    setDeclineReason('');
    setShowDecline(false);
    setIsSubmitting(false);
    setAgreedToTerms(false);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, []);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  }, [onOpenChange, resetState]);

  // Canvas drawing handlers
  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const coords = getCanvasCoords(e);
    lastPosRef.current = coords;
  }, [getCanvasCoords]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);

    ctx.beginPath();
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    lastPosRef.current = coords;
  }, [isDrawing, getCanvasCoords]);

  const stopDrawing = useCallback(() => {
    if (isDrawing && canvasRef.current) {
      setIsDrawing(false);
      setDrawnSignature(canvasRef.current.toDataURL());
    }
  }, [isDrawing]);

  const clearCanvas = useCallback(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      setDrawnSignature(null);
    }
  }, []);

  const handleSign = useCallback(async () => {
    if (!agreedToTerms) return;

    const signatureValue = signatureType === 'typed' ? typedSignature : drawnSignature;
    if (!signatureValue) return;

    setIsSubmitting(true);
    try {
      await onSign({
        signature_type: signatureType,
        signature_value: signatureValue,
      });
      handleOpenChange(false);
    } catch (error) {
      console.error('Error applying signature:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [signatureType, typedSignature, drawnSignature, agreedToTerms, onSign, handleOpenChange]);

  const handleDecline = useCallback(async () => {
    if (!declineReason.trim()) return;

    setIsSubmitting(true);
    try {
      await onDecline(declineReason);
      handleOpenChange(false);
    } catch (error) {
      console.error('Error declining signature:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [declineReason, onDecline, handleOpenChange]);

  const isSignatureValid = signatureType === 'typed'
    ? typedSignature.trim().length >= 2
    : !!drawnSignature;

  const canSubmit = isSignatureValid && agreedToTerms && !isSubmitting;

  if (!signer) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        data-testid="signature-modal"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="w-5 h-5" />
            Sign Document
          </DialogTitle>
          <DialogDescription>
            {documentTitle}
          </DialogDescription>
        </DialogHeader>

        {!showDecline ? (
          <div className="space-y-6">
            {/* Signer Info */}
            <div className="p-3 bg-zinc-50 rounded-lg">
              <div className="text-sm font-medium text-zinc-900">{signer.name}</div>
              <div className="text-xs text-zinc-500">
                {signer.title} • {getSignerRoleLabel(signer.role)}
              </div>
              <div className="text-xs text-zinc-400 mt-1">{signer.email}</div>
            </div>

            {/* Signature Input */}
            <Tabs value={signatureType} onValueChange={(v) => setSignatureType(v as 'typed' | 'drawn')}>
              <TabsList className="w-full">
                <TabsTrigger value="typed" className="flex-1" data-testid="typed-signature-tab">
                  <Type className="w-4 h-4 mr-2" />
                  Type
                </TabsTrigger>
                <TabsTrigger value="drawn" className="flex-1" data-testid="drawn-signature-tab">
                  <PenLine className="w-4 h-4 mr-2" />
                  Draw
                </TabsTrigger>
              </TabsList>

              <TabsContent value="typed" className="mt-4">
                <div className="space-y-2">
                  <label className="text-sm text-zinc-600">
                    Type your full name as your signature
                  </label>
                  <Input
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    placeholder="Your full name"
                    className="text-lg font-serif"
                    data-testid="typed-signature-input"
                  />
                  {typedSignature && (
                    <div className="p-4 bg-white border border-zinc-200 rounded-lg text-center">
                      <span
                        className="text-2xl font-serif italic text-zinc-800"
                        data-testid="signature-preview"
                      >
                        {typedSignature}
                      </span>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="drawn" className="mt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-zinc-600">
                      Draw your signature below
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearCanvas}
                      data-testid="clear-signature-btn"
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white">
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={150}
                      className="w-full cursor-crosshair touch-none"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      data-testid="signature-canvas"
                    />
                  </div>
                  <p className="text-xs text-zinc-400 text-center">
                    Sign using your mouse or finger
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Terms Agreement */}
            <div className="p-3 bg-zinc-50 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1"
                  data-testid="agree-terms-checkbox"
                />
                <span className="text-xs text-zinc-600">
                  By signing this document electronically, I acknowledge that I have read and understand
                  the document contents. I agree that my electronic signature has the same legal effect
                  as a handwritten signature.
                </span>
              </label>
            </div>

            {/* Security Notice */}
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Shield className="w-4 h-4" />
              <span>Your signature is securely captured with timestamp and audit trail</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
              <Button
                variant="ghost"
                onClick={() => setShowDecline(true)}
                data-testid="decline-signature-btn"
              >
                Decline to Sign
              </Button>
              <Button
                onClick={handleSign}
                disabled={!canSubmit}
                data-testid="apply-signature-btn"
              >
                {isSubmitting ? (
                  'Signing...'
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Apply Signature
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          // Decline View
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-900">Decline to Sign</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Please provide a reason for declining. This will be recorded
                    and the document sender will be notified.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-600">Reason for declining</label>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Please explain why you are declining to sign..."
                className="w-full min-h-[100px] p-3 border border-zinc-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="decline-reason-input"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowDecline(false)}
                data-testid="cancel-decline-btn"
              >
                Go Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleDecline}
                disabled={!declineReason.trim() || isSubmitting}
                data-testid="confirm-decline-btn"
              >
                {isSubmitting ? 'Declining...' : 'Confirm Decline'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});
