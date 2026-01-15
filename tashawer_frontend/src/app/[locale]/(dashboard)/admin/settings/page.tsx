'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Alert,
  AlertDescription,
  Spinner,
} from '@/components/ui';
import { handleApiError } from '@/lib/api';
import {
  getPlatformSettings,
  updatePlatformSettings,
  testAIConnection,
  type PlatformSettings,
} from '@/lib/settings';
import {
  Settings,
  Key,
  Bot,
  CreditCard,
  Percent,
  AlertTriangle,
  Check,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  Zap,
  Shield,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [anthropicKey, setAnthropicKey] = useState('');
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [dailyLimit, setDailyLimit] = useState(10);
  const [monthlyLimit, setMonthlyLimit] = useState(100);
  const [tapSecretKey, setTapSecretKey] = useState('');
  const [showTapKey, setShowTapKey] = useState(false);
  const [tapPublicKey, setTapPublicKey] = useState('');
  const [platformFee, setPlatformFee] = useState(10);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  // Test result
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; response?: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getPlatformSettings();
      setSettings(data);

      // Populate form with current values
      setAiEnabled(data.ai_settings.ai_enabled);
      setDailyLimit(data.ai_settings.ai_daily_limit_per_user);
      setMonthlyLimit(data.ai_settings.ai_monthly_limit_per_user);
      setTapPublicKey(data.payment_settings.tap_public_key);
      setPlatformFee(data.platform_settings.platform_fee_percentage);
      setMaintenanceMode(data.platform_settings.maintenance_mode);
      setMaintenanceMessage(data.platform_settings.maintenance_message);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAISettings = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const updateData: Record<string, unknown> = {
        ai_enabled: aiEnabled,
        ai_daily_limit_per_user: dailyLimit,
        ai_monthly_limit_per_user: monthlyLimit,
      };

      // Only include API key if it was changed
      if (anthropicKey) {
        updateData.anthropic_api_key = anthropicKey;
      }

      const data = await updatePlatformSettings(updateData);
      setSettings(data);
      setAnthropicKey(''); // Clear the input after save
      setSuccess('AI settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePaymentSettings = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const updateData: Record<string, unknown> = {
        tap_public_key: tapPublicKey,
      };

      if (tapSecretKey) {
        updateData.tap_secret_key = tapSecretKey;
      }

      const data = await updatePlatformSettings(updateData);
      setSettings(data);
      setTapSecretKey('');
      setSuccess('Payment settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePlatformSettings = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const data = await updatePlatformSettings({
        platform_fee_percentage: platformFee,
        maintenance_mode: maintenanceMode,
        maintenance_message: maintenanceMessage,
      });
      setSettings(data);
      setSuccess('Platform settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestAI = async () => {
    try {
      setIsTesting(true);
      setTestResult(null);
      const result = await testAIConnection();
      setTestResult({
        success: result.connected,
        message: result.message,
        response: result.test_response,
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: handleApiError(err),
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Platform Settings
            </h1>
            <p className="text-muted-foreground">
              Configure AI, payment, and platform settings
            </p>
          </div>
          <Button variant="outline" onClick={loadSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert variant="success">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Settings (Claude)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* API Key Status */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  <span className="text-sm">Anthropic API Key</span>
                </div>
                {settings?.ai_settings.anthropic_api_key_set ? (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    Configured
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-yellow-600">
                    <AlertTriangle className="h-4 w-4" />
                    Not Set
                  </span>
                )}
              </div>

              {/* API Key Input */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {settings?.ai_settings.anthropic_api_key_set ? 'Update API Key' : 'Set API Key'}
                </label>
                <div className="relative">
                  <Input
                    type={showAnthropicKey ? 'text' : 'password'}
                    value={anthropicKey}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                    placeholder={settings?.ai_settings.anthropic_api_key_set ? '••••••••••••' : 'sk-ant-...'}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showAnthropicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Get your API key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">console.anthropic.com</a>
                </p>
              </div>

              {/* AI Enabled Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Enable AI Features</label>
                <button
                  type="button"
                  onClick={() => setAiEnabled(!aiEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    aiEnabled ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      aiEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Usage Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Daily Limit/User</label>
                  <Input
                    type="number"
                    min="1"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Monthly Limit/User</label>
                  <Input
                    type="number"
                    min="1"
                    value={monthlyLimit}
                    onChange={(e) => setMonthlyLimit(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              {/* Test Connection */}
              {testResult && (
                <div className={`p-3 rounded-lg text-sm ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  <p className="font-medium">{testResult.success ? 'Connection Successful!' : 'Connection Failed'}</p>
                  <p>{testResult.message}</p>
                  {testResult.response && (
                    <p className="mt-1 text-xs italic">Response: {testResult.response}</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleTestAI}
                  disabled={isTesting}
                >
                  {isTesting ? <Spinner size="sm" className="mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                  Test Connection
                </Button>
                <Button
                  onClick={handleSaveAISettings}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? <Spinner size="sm" className="mr-2" /> : null}
                  Save AI Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Settings (Tap)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Secret Key Status */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  <span className="text-sm">Tap Secret Key</span>
                </div>
                {settings?.payment_settings.tap_secret_key_set ? (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    Configured
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-yellow-600">
                    <AlertTriangle className="h-4 w-4" />
                    Not Set
                  </span>
                )}
              </div>

              {/* Secret Key Input */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {settings?.payment_settings.tap_secret_key_set ? 'Update Secret Key' : 'Set Secret Key'}
                </label>
                <div className="relative">
                  <Input
                    type={showTapKey ? 'text' : 'password'}
                    value={tapSecretKey}
                    onChange={(e) => setTapSecretKey(e.target.value)}
                    placeholder={settings?.payment_settings.tap_secret_key_set ? '••••••••••••' : 'sk_test_...'}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTapKey(!showTapKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showTapKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Public Key Input */}
              <div>
                <label className="block text-sm font-medium mb-1">Public Key</label>
                <Input
                  value={tapPublicKey}
                  onChange={(e) => setTapPublicKey(e.target.value)}
                  placeholder="pk_test_..."
                />
              </div>

              <Button
                onClick={handleSavePaymentSettings}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? <Spinner size="sm" className="mr-2" /> : null}
                Save Payment Settings
              </Button>
            </CardContent>
          </Card>

          {/* Platform Settings */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Platform Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Platform Fee */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <Percent className="h-4 w-4 inline mr-1" />
                    Platform Fee (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={platformFee}
                    onChange={(e) => setPlatformFee(parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Percentage taken from each transaction
                  </p>
                </div>

                {/* Maintenance Mode */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    Maintenance Mode
                  </label>
                  <button
                    type="button"
                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                    className={`w-full h-10 rounded-md border flex items-center justify-center gap-2 transition-colors ${
                      maintenanceMode
                        ? 'bg-red-100 border-red-300 text-red-700'
                        : 'bg-green-100 border-green-300 text-green-700'
                    }`}
                  >
                    {maintenanceMode ? (
                      <>
                        <AlertTriangle className="h-4 w-4" />
                        Enabled
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Disabled
                      </>
                    )}
                  </button>
                </div>

                {/* Maintenance Message */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium mb-1">Maintenance Message</label>
                  <Input
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    placeholder="Platform is under maintenance..."
                    disabled={!maintenanceMode}
                  />
                </div>
              </div>

              <Button
                onClick={handleSavePlatformSettings}
                disabled={isSaving}
              >
                {isSaving ? <Spinner size="sm" className="mr-2" /> : null}
                Save Platform Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Last Updated */}
        {settings && (
          <p className="text-sm text-muted-foreground text-center">
            Last updated: {new Date(settings.updated_at).toLocaleString()}
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
