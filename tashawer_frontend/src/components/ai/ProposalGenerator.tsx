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
  Clock,
  DollarSign,
} from 'lucide-react';

interface ProposalEstimates {
  estimated_duration_days: number | null;
  estimated_amount: number | null;
  estimation_reasoning: string | null;
}

interface ProposalGeneratorProps {
  projectId?: string;
  projectTitle?: string;
  projectScope?: string;
  proposedAmount?: number;
  duration?: string;
  onProposalGenerated?: (proposal: string, estimates?: ProposalEstimates) => void;
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
  const [estimates, setEstimates] = useState<ProposalEstimates | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const isArabic = language === 'ar';

  const handleGenerate = async () => {
    if (!formData.project_title.trim() || !formData.project_scope.trim()) {
      setError(isArabic ? 'عنوان المشروع ونطاق العمل مطلوبان' : 'Project title and scope are required');
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
      setEstimates({
        estimated_duration_days: result.estimated_duration_days,
        estimated_amount: result.estimated_amount,
        estimation_reasoning: result.estimation_reasoning,
      });
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
      onProposalGenerated(generatedProposal, estimates || undefined);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">
            {isArabic ? 'مولد العروض بالذكاء الاصطناعي' : 'AI Proposal Generator'}
          </h3>
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
              {isArabic ? 'عنوان المشروع *' : 'Project Title *'}
            </label>
            <Input
              value={formData.project_title}
              onChange={(e) => setFormData(f => ({ ...f, project_title: e.target.value }))}
              placeholder={isArabic ? 'أدخل عنوان المشروع' : 'Enter project title'}
              dir={isArabic ? 'rtl' : 'ltr'}
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {isArabic ? 'نطاق المشروع *' : 'Project Scope *'}
            </label>
            <Textarea
              value={formData.project_scope}
              onChange={(e) => setFormData(f => ({ ...f, project_scope: e.target.value }))}
              placeholder={isArabic ? 'أدخل نطاق المشروع...' : 'Enter the project scope...'}
              className="min-h-[100px]"
              dir={isArabic ? 'rtl' : 'ltr'}
              disabled
            />
            <p className="text-xs text-muted-foreground mt-1">
              {isArabic
                ? 'سيقوم الذكاء الاصطناعي بتحليل نطاق المشروع وتقدير التكلفة والمدة'
                : 'AI will analyze the project scope and estimate cost and duration'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {isArabic ? 'ملاحظات إضافية' : 'Additional Notes'}
            </label>
            <Textarea
              value={formData.additional_notes}
              onChange={(e) => setFormData(f => ({ ...f, additional_notes: e.target.value }))}
              placeholder={isArabic ? 'أي معلومات إضافية تود تضمينها...' : 'Any additional information to include...'}
              className="min-h-[60px]"
              dir={isArabic ? 'rtl' : 'ltr'}
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
                {isArabic ? 'جاري توليد العرض...' : 'Generating Proposal...'}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {isArabic ? 'توليد العرض' : 'Generate Proposal'}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Generated Proposal */}
      {generatedProposal && (
        <div className="space-y-4">
          {/* AI Estimates Card */}
          {estimates && (estimates.estimated_amount || estimates.estimated_duration_days) && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
                {isArabic ? 'تقديرات الذكاء الاصطناعي' : 'AI Estimates'}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {estimates.estimated_amount && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        {isArabic ? 'التكلفة المقدرة' : 'Estimated Cost'}
                      </p>
                      <p className="font-semibold text-blue-900 dark:text-blue-100">
                        {estimates.estimated_amount.toLocaleString()} {isArabic ? 'ريال' : 'SAR'}
                      </p>
                    </div>
                  </div>
                )}
                {estimates.estimated_duration_days && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        {isArabic ? 'المدة المقدرة' : 'Estimated Duration'}
                      </p>
                      <p className="font-semibold text-blue-900 dark:text-blue-100">
                        {estimates.estimated_duration_days} {isArabic ? 'يوم' : 'days'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {estimates.estimation_reasoning && (
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  {estimates.estimation_reasoning}
                </p>
              )}
            </div>
          )}

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
                    {isArabic ? 'إخفاء المعاينة' : 'Hide Preview'}
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    {isArabic ? 'عرض المعاينة' : 'Show Preview'}
                  </>
                )}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1 text-green-500" />
                    {isArabic ? 'تم النسخ!' : 'Copied!'}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    {isArabic ? 'نسخ' : 'Copy'}
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
                    {isArabic ? 'جاري التحميل...' : 'Downloading...'}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1" />
                    {isArabic ? 'تحميل PDF' : 'Download PDF'}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div
              className="p-4 bg-muted rounded-lg prose prose-sm max-w-none max-h-[400px] overflow-y-auto border"
              dir={isArabic ? 'rtl' : 'ltr'}
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
                setEstimates(null);
              }}
            >
              {isArabic ? 'إعادة التوليد' : 'Regenerate'}
            </Button>
            {onProposalGenerated && (
              <Button onClick={handleUseProposal} className="flex-1">
                {isArabic ? 'استخدام هذا العرض' : 'Use This Proposal'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
