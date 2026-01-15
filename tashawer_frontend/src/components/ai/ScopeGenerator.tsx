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
import { generateScope, refineScope, generateDeliverables, getUsageStats, type UsageStats } from '@/lib/ai';
import { handleApiError } from '@/lib/api';
import {
  Sparkles,
  RefreshCw,
  Wand2,
  ListChecks,
  Copy,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';

interface ScopeGeneratorProps {
  initialDescription?: string;
  onScopeGenerated?: (scope: string) => void;
  onClose?: () => void;
  language?: 'ar' | 'en';
  category?: string;
}

export function ScopeGenerator({
  initialDescription = '',
  onScopeGenerated,
  onClose,
  language = 'ar',
  category,
}: ScopeGeneratorProps) {
  const [description, setDescription] = useState(initialDescription);
  const [generatedScope, setGeneratedScope] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isGeneratingDeliverables, setIsGeneratingDeliverables] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDeliverables, setShowDeliverables] = useState(false);
  const [deliverables, setDeliverables] = useState('');
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [showStats, setShowStats] = useState(false);

  const handleGenerate = async () => {
    if (!description.trim() || description.length < 20) {
      setError('Please provide a description with at least 20 characters');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      const result = await generateScope({
        description,
        language,
        category,
      });
      setGeneratedScope(result.scope);

      // Refresh usage stats
      const stats = await getUsageStats();
      setUsageStats(stats);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefine = async () => {
    if (!generatedScope.trim()) return;

    try {
      setIsRefining(true);
      setError(null);
      const result = await refineScope({
        current_scope: generatedScope,
      });
      setGeneratedScope(result.refined_scope);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsRefining(false);
    }
  };

  const handleGenerateDeliverables = async () => {
    if (!generatedScope.trim()) return;

    try {
      setIsGeneratingDeliverables(true);
      setError(null);
      const result = await generateDeliverables({
        scope: generatedScope,
        num_milestones: 4,
      });
      setDeliverables(result.deliverables);
      setShowDeliverables(true);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsGeneratingDeliverables(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedScope);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = generatedScope;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUseScope = () => {
    if (onScopeGenerated && generatedScope) {
      onScopeGenerated(generatedScope);
    }
  };

  const loadUsageStats = async () => {
    try {
      const stats = await getUsageStats();
      setUsageStats(stats);
      setShowStats(true);
    } catch (err) {
      console.error('Failed to load usage stats:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Scope Generator</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadUsageStats}
          >
            <Info className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Usage Stats */}
      {showStats && usageStats && (
        <div className="p-3 bg-muted rounded-lg text-sm">
          <div className="flex justify-between mb-2">
            <span>Daily Usage</span>
            <span className="font-medium">
              {usageStats.limits.daily_used} / {usageStats.limits.daily_limit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full"
              style={{
                width: `${Math.min(100, (usageStats.limits.daily_used / usageStats.limits.daily_limit) * 100)}%`,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {usageStats.limits.daily_remaining} generations remaining today
          </p>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Input Section */}
      {!generatedScope && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Project Description
            </label>
            <Textarea
              placeholder="Describe your project briefly. For example: 'I need a structural design for a 5-story residential building in Jeddah with underground parking...'"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px]"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum 20 characters. The more details you provide, the better the scope.
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || description.length < 20}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Scope
              </>
            )}
          </Button>
        </div>
      )}

      {/* Generated Scope */}
      {generatedScope && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Generated Scope</label>
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
            </div>
            <div
              className="p-4 bg-muted rounded-lg prose prose-sm max-w-none max-h-[300px] overflow-y-auto"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <div className="whitespace-pre-wrap">{generatedScope}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefine}
              disabled={isRefining}
            >
              {isRefining ? (
                <>
                  <Spinner size="sm" className="mr-1" />
                  Refining...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refine
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateDeliverables}
              disabled={isGeneratingDeliverables}
            >
              {isGeneratingDeliverables ? (
                <>
                  <Spinner size="sm" className="mr-1" />
                  Generating...
                </>
              ) : (
                <>
                  <ListChecks className="h-4 w-4 mr-1" />
                  Generate Deliverables
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setGeneratedScope('');
                setDeliverables('');
                setShowDeliverables(false);
              }}
            >
              <Wand2 className="h-4 w-4 mr-1" />
              Start Over
            </Button>
          </div>

          {/* Deliverables */}
          {showDeliverables && deliverables && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeliverables(!showDeliverables)}
                className="mb-2"
              >
                {showDeliverables ? (
                  <ChevronUp className="h-4 w-4 mr-1" />
                ) : (
                  <ChevronDown className="h-4 w-4 mr-1" />
                )}
                Deliverables & Milestones
              </Button>
              {showDeliverables && (
                <div
                  className="p-4 bg-blue-50 rounded-lg prose prose-sm max-w-none max-h-[200px] overflow-y-auto"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                >
                  <div className="whitespace-pre-wrap">{deliverables}</div>
                </div>
              )}
            </div>
          )}

          {/* Use Scope Button */}
          {onScopeGenerated && (
            <Button onClick={handleUseScope} className="w-full">
              Use This Scope
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
