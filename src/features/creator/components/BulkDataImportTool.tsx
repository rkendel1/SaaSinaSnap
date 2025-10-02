'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Download, FileUp, Loader2, Sparkles, Upload, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import type { CreatorProfile } from '@/features/creator-onboarding/types';

import type { DataImportRequest, DataImportResponse, DataValidationResult } from '../services/bulk-data-import-ai-wizard';

interface BulkDataImportToolProps {
  creatorProfile: CreatorProfile;
}

export function BulkDataImportTool({ creatorProfile }: BulkDataImportToolProps) {
  const [dataType, setDataType] = useState<'customers' | 'subscriptions' | 'usage' | 'transactions' | 'custom'>('customers');
  const [fileType, setFileType] = useState<'csv' | 'excel' | 'json'>('csv');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedData, setUploadedData] = useState<Record<string, any>[] | null>(null);
  const [aiMappings, setAiMappings] = useState<DataImportResponse | null>(null);
  const [validationResult, setValidationResult] = useState<DataValidationResult | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showAIWizard, setShowAIWizard] = useState(true);
  const [step, setStep] = useState<'upload' | 'mapping' | 'validation' | 'import'>('upload');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // In a real implementation, parse the file here
      toast({
        title: 'File Selected',
        description: `${file.name} (${(file.size / 1024).toFixed(2)} KB)`
      });
    }
  };

  const handleGetAIMappings = async () => {
    if (!selectedFile) {
      toast({
        variant: 'destructive',
        description: 'Please select a file first.'
      });
      return;
    }

    setIsLoadingAI(true);
    try {
      // In a real implementation, we would parse the file and send sample data
      const sampleData = [
        { email: 'user@example.com', name: 'John Doe', created: '2024-01-01' }
      ];

      const response = await fetch('/api/creator/data-import/ai-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileType,
          dataType,
          sampleData,
          expectedFields: Object.keys(sampleData[0])
        } as DataImportRequest)
      });

      if (!response.ok) throw new Error('Failed to get AI mappings');

      const data: DataImportResponse = await response.json();
      setAiMappings(data);
      setStep('mapping');

      toast({
        title: 'AI Mapping Complete',
        description: 'Field mappings have been generated. Review and adjust as needed.'
      });
    } catch (error) {
      console.error('Error getting AI mappings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get AI mappings. Using default mappings.'
      });
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleValidateData = async () => {
    if (!aiMappings) {
      toast({
        variant: 'destructive',
        description: 'Please generate field mappings first.'
      });
      return;
    }

    setIsValidating(true);
    try {
      // In a real implementation, validate the actual uploaded data
      const mockData = [
        { email: 'user@example.com', name: 'John Doe', created: '2024-01-01' }
      ];

      const response = await fetch('/api/creator/data-import/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: mockData,
          dataType,
          mappings: aiMappings.fieldMappings
        })
      });

      if (!response.ok) throw new Error('Failed to validate data');

      const result: DataValidationResult = await response.json();
      setValidationResult(result);
      setStep('validation');

      if (result.isValid) {
        toast({
          title: 'Validation Passed',
          description: `${result.summary.validRows} of ${result.summary.totalRows} rows are valid.`
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Validation Issues Found',
          description: `${result.summary.errorRows} errors found. Please review.`
        });
      }
    } catch (error) {
      console.error('Error validating data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to validate data.'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleImportData = async () => {
    if (!validationResult?.isValid) {
      toast({
        variant: 'destructive',
        description: 'Please fix validation errors before importing.'
      });
      return;
    }

    setIsImporting(true);
    try {
      // Simulate import
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: 'Import Complete',
        description: `Successfully imported ${validationResult.summary.validRows} records.`
      });
      setStep('import');
    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to import data.'
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    // In a real implementation, generate and download a template file
    toast({
      description: 'Template downloaded successfully.'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bulk Data Import</h1>
          <p className="text-muted-foreground mt-1">
            Import customer data, subscriptions, and historical usage with AI-guided validation
          </p>
        </div>
        <Button
          onClick={() => setShowAIWizard(!showAIWizard)}
          variant={showAIWizard ? 'default' : 'outline'}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {showAIWizard ? 'Hide' : 'Show'} AI Wizard
        </Button>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {['Upload', 'Mapping', 'Validation', 'Import'].map((label, index) => {
              const stepValue = ['upload', 'mapping', 'validation', 'import'][index];
              const isActive = step === stepValue;
              const isPast = ['upload', 'mapping', 'validation', 'import'].indexOf(step) > index;
              
              return (
                <React.Fragment key={label}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        isActive
                          ? 'bg-blue-500 text-white'
                          : isPast
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {isPast ? <CheckCircle className="h-5 w-5" /> : index + 1}
                    </div>
                    <span className="text-sm mt-2 font-medium">{label}</span>
                  </div>
                  {index < 3 && (
                    <div className={`flex-1 h-1 mx-2 ${isPast ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Data File
                </CardTitle>
                <CardDescription>Select and upload your data file for import</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dataType">Data Type</Label>
                    <Select value={dataType} onValueChange={(value: any) => setDataType(value)}>
                      <SelectTrigger id="dataType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customers">Customers</SelectItem>
                        <SelectItem value="subscriptions">Subscriptions</SelectItem>
                        <SelectItem value="usage">Usage Data</SelectItem>
                        <SelectItem value="transactions">Transactions</SelectItem>
                        <SelectItem value="custom">Custom Data</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fileType">File Type</Label>
                    <Select value={fileType} onValueChange={(value: any) => setFileType(value)}>
                      <SelectTrigger id="fileType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <FileUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <div className="space-y-2">
                    <Label
                      htmlFor="fileUpload"
                      className="cursor-pointer text-blue-500 hover:text-blue-600"
                    >
                      Choose a file or drag and drop
                    </Label>
                    <input
                      id="fileUpload"
                      type="file"
                      accept=".csv,.xlsx,.xls,.json"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <p className="text-sm text-muted-foreground">
                      {selectedFile ? selectedFile.name : 'CSV, Excel, or JSON files up to 10MB'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2">
                    <Download className="h-4 w-4" />
                    Download Template
                  </Button>
                  <Button
                    onClick={handleGetAIMappings}
                    disabled={!selectedFile || isLoadingAI}
                    className="gap-2"
                  >
                    {isLoadingAI ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate Mappings
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Mapping */}
          {step === 'mapping' && aiMappings && (
            <Card>
              <CardHeader>
                <CardTitle>Field Mappings</CardTitle>
                <CardDescription>
                  Review and adjust how your data fields map to our system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {aiMappings.fieldMappings.map((mapping, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{mapping.sourceField}</div>
                        <div className="text-sm text-muted-foreground">
                          {mapping.dataType} {mapping.required && '(required)'}
                        </div>
                      </div>
                      <div className="mx-4 text-muted-foreground">→</div>
                      <div className="flex-1 text-right">
                        <div className="font-medium">{mapping.targetField}</div>
                        {mapping.transformation && (
                          <div className="text-sm text-blue-500">{mapping.transformation}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep('upload')}>
                    Back
                  </Button>
                  <Button onClick={handleValidateData} disabled={isValidating} className="gap-2">
                    {isValidating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Validate Data
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Validation */}
          {step === 'validation' && validationResult && (
            <Card>
              <CardHeader>
                <CardTitle>Validation Results</CardTitle>
                <CardDescription>Review data quality and validation issues</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{validationResult.summary.totalRows}</div>
                      <div className="text-sm text-muted-foreground">Total Rows</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-600">
                        {validationResult.summary.validRows}
                      </div>
                      <div className="text-sm text-muted-foreground">Valid</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-red-600">
                        {validationResult.summary.errorRows}
                      </div>
                      <div className="text-sm text-muted-foreground">Errors</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-yellow-600">
                        {validationResult.summary.warningRows}
                      </div>
                      <div className="text-sm text-muted-foreground">Warnings</div>
                    </CardContent>
                  </Card>
                </div>

                {validationResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-red-600">Errors</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {validationResult.errors.map((error, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-red-50 rounded text-sm">
                          <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                          <div>
                            <div className="font-medium">Row {error.row}: {error.field}</div>
                            <div className="text-muted-foreground">{error.error}</div>
                            {error.suggestion && (
                              <div className="text-blue-600 text-xs mt-1">💡 {error.suggestion}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {validationResult.warnings.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-yellow-600">Warnings</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {validationResult.warnings.map((warning, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-yellow-50 rounded text-sm">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <div>
                            <div className="font-medium">Row {warning.row}: {warning.field}</div>
                            <div className="text-muted-foreground">{warning.warning}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep('mapping')}>
                    Back
                  </Button>
                  <Button
                    onClick={handleImportData}
                    disabled={!validationResult.isValid || isImporting}
                    className="gap-2"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Import Data
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Import Complete */}
          {step === 'import' && (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                <h3 className="text-2xl font-bold mb-2">Import Complete!</h3>
                <p className="text-muted-foreground mb-6">
                  Your data has been successfully imported.
                </p>
                <Button onClick={() => {
                  setStep('upload');
                  setSelectedFile(null);
                  setAiMappings(null);
                  setValidationResult(null);
                }}>
                  Import More Data
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* AI Wizard Sidebar */}
        {showAIWizard && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  AI Import Wizard
                </CardTitle>
                <CardDescription>
                  Get AI assistance with your data import
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-3">
                  <div>
                    <div className="font-medium mb-1">Step 1: Prepare Your Data</div>
                    <p className="text-muted-foreground">
                      Ensure your data is clean and properly formatted
                    </p>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Step 2: Map Fields</div>
                    <p className="text-muted-foreground">
                      AI will suggest field mappings based on your data
                    </p>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Step 3: Validate</div>
                    <p className="text-muted-foreground">
                      Check for errors and data quality issues
                    </p>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Step 4: Import</div>
                    <p className="text-muted-foreground">
                      Complete the import process safely
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {aiMappings && (
              <>
                {aiMappings.suggestions && aiMappings.suggestions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">AI Suggestions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        {aiMappings.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex gap-2">
                            <span className="text-blue-500">💡</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {aiMappings.warnings && aiMappings.warnings.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        Important Warnings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        {aiMappings.warnings.map((warning, index) => (
                          <li key={index} className="flex gap-2">
                            <span className="text-yellow-500">⚠️</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
