import OpenAI from 'openai';

import type { CreatorProfile } from '@/features/creator-onboarding/types';
import { openaiServerClient } from '@/libs/openai/openai-server-client';

export interface DataImportRequest {
  fileType: 'csv' | 'excel' | 'json';
  dataType: 'customers' | 'subscriptions' | 'usage' | 'transactions' | 'custom';
  sampleData?: Record<string, any>[];
  expectedFields?: string[];
}

export interface DataImportResponse {
  fieldMappings: Array<{
    sourceField: string;
    targetField: string;
    dataType: string;
    required: boolean;
    transformation?: string;
  }>;
  validationRules: Array<{
    field: string;
    rule: string;
    description: string;
  }>;
  suggestions: string[];
  warnings: string[];
  estimatedRecords: number;
}

export interface DataValidationResult {
  isValid: boolean;
  errors: Array<{
    row: number;
    field: string;
    error: string;
    suggestion?: string;
  }>;
  warnings: Array<{
    row: number;
    field: string;
    warning: string;
  }>;
  summary: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    warningRows: number;
  };
}

export class BulkDataImportAIWizard {
  /**
   * Generate AI-powered data import recommendations
   */
  static async generateImportRecommendations(
    creatorProfile: CreatorProfile,
    request: DataImportRequest
  ): Promise<DataImportResponse> {
    const systemPrompt = this.createDataImportSystemPrompt(creatorProfile);
    const userPrompt = this.createUserPrompt(request);

    try {
      const completion = await openaiServerClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
        max_tokens: 1500
      });

      const aiResponseContent = completion.choices[0].message?.content;
      if (!aiResponseContent) throw new Error("AI returned an empty response.");

      const parsedResponse = JSON.parse(aiResponseContent);
      
      return {
        fieldMappings: parsedResponse.fieldMappings || [],
        validationRules: parsedResponse.validationRules || [],
        suggestions: parsedResponse.suggestions || [],
        warnings: parsedResponse.warnings || [],
        estimatedRecords: parsedResponse.estimatedRecords || 0
      };
    } catch (error) {
      console.error('Error in bulk data import AI wizard:', error);
      return this.getFallbackMappings(request);
    }
  }

  /**
   * Validate imported data with AI assistance
   */
  static async validateImportedData(
    data: Record<string, any>[],
    dataType: string,
    mappings: DataImportResponse['fieldMappings']
  ): Promise<DataValidationResult> {
    // Sample first 10 rows for AI validation
    const sampleData = data.slice(0, 10);
    
    const prompt = `Validate the following data import for ${dataType}. 
Field mappings: ${JSON.stringify(mappings)}
Sample data: ${JSON.stringify(sampleData)}

Check for:
1. Data type mismatches
2. Missing required fields
3. Format issues (emails, dates, numbers)
4. Potential duplicates
5. Data quality issues

Return JSON with: isValid (boolean), errors (array with row, field, error, suggestion), warnings (array), summary (object)`;

    try {
      const completion = await openaiServerClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a data validation expert helping ensure data quality for imports." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1200
      });

      const aiResponseContent = completion.choices[0].message?.content;
      if (!aiResponseContent) throw new Error("AI returned an empty response.");

      const result = JSON.parse(aiResponseContent);
      
      // Ensure all required properties exist
      return {
        isValid: result.isValid || false,
        errors: result.errors || [],
        warnings: result.warnings || [],
        summary: result.summary || {
          totalRows: data.length,
          validRows: data.length,
          errorRows: 0,
          warningRows: 0
        }
      };
    } catch (error) {
      console.error('Error validating imported data:', error);
      // Return basic validation
      return {
        isValid: true,
        errors: [],
        warnings: [{
          row: 0,
          field: 'general',
          warning: 'AI validation unavailable. Please review data carefully before importing.'
        }],
        summary: {
          totalRows: data.length,
          validRows: data.length,
          errorRows: 0,
          warningRows: 1
        }
      };
    }
  }

  /**
   * Suggest data transformations for better import
   */
  static async suggestDataTransformations(
    sampleData: Record<string, any>[],
    targetSchema: Record<string, string>
  ): Promise<Array<{
    field: string;
    currentFormat: string;
    suggestedFormat: string;
    transformation: string;
    reason: string;
  }>> {
    const prompt = `Analyze this sample data and suggest transformations to match the target schema:
Sample data: ${JSON.stringify(sampleData.slice(0, 5))}
Target schema: ${JSON.stringify(targetSchema)}

Suggest transformations for data type conversions, formatting, and cleaning.`;

    try {
      const completion = await openaiServerClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a data transformation expert." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 800
      });

      const aiResponseContent = completion.choices[0].message?.content;
      if (!aiResponseContent) throw new Error("AI returned an empty response.");

      const result = JSON.parse(aiResponseContent);
      return result.transformations || [];
    } catch (error) {
      console.error('Error suggesting data transformations:', error);
      return [];
    }
  }

  private static createDataImportSystemPrompt(creatorProfile: CreatorProfile): string {
    return `You are an expert data import specialist helping SaaS creators import bulk data into their platform.
Your role is to ensure smooth, accurate data migration with minimal errors.

Creator Context:
- Business Name: ${creatorProfile.business_name || 'N/A'}
- Industry: ${creatorProfile.business_industry || 'SaaS'}

Key Responsibilities:
1. Map source data fields to target schema fields accurately
2. Identify required vs optional fields
3. Suggest data validation rules to ensure quality
4. Warn about potential data quality issues
5. Recommend data transformations when needed
6. Guide through the import process step-by-step

Guidelines:
- Prioritize data integrity and accuracy
- Be conservative with automatic mappings - ask for confirmation on ambiguous cases
- Always validate critical fields (emails, IDs, dates)
- Provide clear error messages and suggestions
- Consider edge cases and data anomalies

Return responses in JSON format with:
{
  "fieldMappings": [{"sourceField": "string", "targetField": "string", "dataType": "string", "required": boolean, "transformation": "string"}],
  "validationRules": [{"field": "string", "rule": "string", "description": "string"}],
  "suggestions": ["string"],
  "warnings": ["string"],
  "estimatedRecords": number
}`;
  }

  private static createUserPrompt(request: DataImportRequest): string {
    let prompt = `I need help importing ${request.dataType} data from a ${request.fileType} file. `;
    
    if (request.expectedFields && request.expectedFields.length > 0) {
      prompt += `The file contains these fields: ${request.expectedFields.join(', ')}. `;
    }
    
    if (request.sampleData && request.sampleData.length > 0) {
      prompt += `Here's a sample of the data: ${JSON.stringify(request.sampleData.slice(0, 3))}. `;
    }
    
    prompt += 'Please help me map these fields correctly and validate the data before import.';
    
    return prompt;
  }

  private static getFallbackMappings(request: DataImportRequest): DataImportResponse {
    const mappingsByType: Record<string, any> = {
      customers: [
        { sourceField: 'email', targetField: 'email', dataType: 'string', required: true },
        { sourceField: 'name', targetField: 'full_name', dataType: 'string', required: true },
        { sourceField: 'created_date', targetField: 'created_at', dataType: 'date', required: false, transformation: 'parseDate' },
        { sourceField: 'status', targetField: 'status', dataType: 'string', required: false }
      ],
      subscriptions: [
        { sourceField: 'customer_email', targetField: 'customer_email', dataType: 'string', required: true },
        { sourceField: 'plan_name', targetField: 'product_name', dataType: 'string', required: true },
        { sourceField: 'amount', targetField: 'price', dataType: 'number', required: true },
        { sourceField: 'start_date', targetField: 'subscription_start', dataType: 'date', required: true, transformation: 'parseDate' },
        { sourceField: 'status', targetField: 'status', dataType: 'string', required: true }
      ],
      usage: [
        { sourceField: 'user_id', targetField: 'customer_id', dataType: 'string', required: true },
        { sourceField: 'feature', targetField: 'feature_name', dataType: 'string', required: true },
        { sourceField: 'count', targetField: 'usage_count', dataType: 'number', required: true },
        { sourceField: 'date', targetField: 'usage_date', dataType: 'date', required: true, transformation: 'parseDate' }
      ],
      transactions: [
        { sourceField: 'transaction_id', targetField: 'id', dataType: 'string', required: true },
        { sourceField: 'customer_email', targetField: 'customer_email', dataType: 'string', required: true },
        { sourceField: 'amount', targetField: 'amount', dataType: 'number', required: true },
        { sourceField: 'date', targetField: 'transaction_date', dataType: 'date', required: true, transformation: 'parseDate' },
        { sourceField: 'status', targetField: 'status', dataType: 'string', required: true }
      ],
      custom: [
        { sourceField: 'id', targetField: 'id', dataType: 'string', required: true },
        { sourceField: 'name', targetField: 'name', dataType: 'string', required: true },
        { sourceField: 'value', targetField: 'value', dataType: 'string', required: false }
      ]
    };

    const validationRules = [
      { field: 'email', rule: 'valid_email', description: 'Must be a valid email address' },
      { field: 'date', rule: 'valid_date', description: 'Must be a valid date in ISO format' },
      { field: 'amount', rule: 'positive_number', description: 'Must be a positive number' },
      { field: 'status', rule: 'valid_enum', description: 'Must be one of: active, inactive, pending, cancelled' }
    ];

    return {
      fieldMappings: mappingsByType[request.dataType] || mappingsByType.custom,
      validationRules,
      suggestions: [
        'Review field mappings carefully before importing',
        'Test with a small sample first (10-20 rows)',
        'Ensure date formats are consistent',
        'Verify email addresses are valid',
        'Check for duplicate records'
      ],
      warnings: [
        'Large imports may take several minutes to process',
        'Invalid data will be skipped and logged for review',
        'Make sure to backup existing data before importing'
      ],
      estimatedRecords: request.sampleData?.length || 0
    };
  }
}
