'use client';

import { useState } from 'react';
import {
  Button,
  Textarea,
  Input,
  Alert,
  AlertDescription,
  Spinner,
} from '@/components/ui';
import { generateProposal, generateProposalPDF, downloadProposalPDF } from '@/lib/ai';
import { handleApiError } from '@/lib/api';
import {
  FileText,
  Sparkles,
  Download,
  Copy,
  Check,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';

interface ProposalGeneratorProps {
  projectId?: string;
  projectTitle?: string;
  projectScope?: string;
  proposedAmount?: number;
  duration?: string;
  onProposalGenerated?: (proposal: string) => void;
  onClose?: () => void;
  language?: 'ar' | 'en';
}

export function ProposalGenerator({
  projectId,
  projectTitle = '',
  projectScope = '',
  proposedAmount,
  duration = '',
  onProposalGenerated,
  onClose,
  language = 'ar',
}: ProposalGeneratorProps) {
  const [formData, setFormData] = useState({
    project_title: projectTitle,
    project_scope: projectScope,
    proposed_amount: proposedAmount?.toString() || '',
    duration: duration,
    additional_notes: '',
  });
  const [generatedProposal, setGeneratedProposal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const handleGenerate = async () => {
    if (!formData.project_title.trim() || !formData.project_scope.trim()) {
      setError('Project title and scope are required');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      const result = await generateProposal({
        project_id: projectId,
        project_title: formData.project_title,
        project_scope: formData.project_scope,
        proposed_amount: formData.proposed_amount ? parseFloat(formData.proposed_amount) : undefined,
        duration: formData.duration,
        additional_notes: formData.additional_notes,
        language,
      });
      setGeneratedProposal(result.proposal);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!generatedProposal) return;

    try {
      setIsDownloading(true);
      setError(null);
      const blob = await generateProposalPDF({
        proposal_content: generatedProposal,
        project_title: formData.project_title,
        proposed_amount: formData.proposed_amount,
      });
      downloadProposalPDF(blob, `proposal_${formData.project_title.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedProposal);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = generatedProposal;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUseProposal = () => {
    if (onProposalGenerated && generatedProposal) {
      onProposalGenerated(generatedProposal);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Proposal Generator</h3>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Input Form */}
      {!generatedProposal && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Project Title *
            </label>
            <Input
              value={formData.project_title}
              onChange={(e) => setFormData(f => ({ ...f, project_title: e.target.value }))}
              placeholder="Enter project title"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Project Scope *
            </label>
            <Textarea
              value={formData.project_scope}
              onChange={(e) => setFormData(f => ({ ...f, project_scope: e.target.value }))}
              placeholder="Enter the project scope..."
              className="min-h-[100px]"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Proposed Amount (SAR)
              </label>
              <Input
                type="number"
                value={formData.proposed_amount}
                onChange={(e) => setFormData(f => ({ ...f, proposed_amount: e.target.value }))}
                placeholder="e.g., 50000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Duration
              </label>
              <Input
                value={formData.duration}
                onChange={(e) => setFormData(f => ({ ...f, duration: e.target.value }))}
                placeholder="e.g., 3 months"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Additional Notes
            </label>
            <Textarea
              value={formData.additional_notes}
              onChange={(e) => setFormData(f => ({ ...f, additional_notes: e.target.value }))}
              placeholder="Any additional information to include..."
              className="min-h-[60px]"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !formData.project_title.trim() || !formData.project_scope.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Generating Proposal...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Proposal
              </>
            )}
          </Button>
        </div>
      )}

      {/* Generated Proposal */}
      {generatedProposal && (
        <div className="space-y-4">
          {/* Actions Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Hide Preview
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Show Preview
                  </>
                )}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>
                    <Spinner size="sm" className="mr-1" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div
              className="p-4 bg-muted rounded-lg prose prose-sm max-w-none max-h-[400px] overflow-y-auto border"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <div className="whitespace-pre-wrap">{generatedProposal}</div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setGeneratedProposal('');
              }}
            >
              Regenerate
            </Button>
            {onProposalGenerated && (
              <Button onClick={handleUseProposal} className="flex-1">
                Use This Proposal
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
