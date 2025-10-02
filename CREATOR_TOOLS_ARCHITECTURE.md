# Creator Tools Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        SaaSinaSnap Platform                      │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Creator Dashboard                         │ │
│  │                                                              │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │              Navigation Sidebar                       │  │ │
│  │  │                                                        │  │ │
│  │  │  📊 Dashboard                                         │  │ │
│  │  │  📦 Products & Tiers                                  │  │ │
│  │  │  💻 Embeds & Scripts                                  │  │ │
│  │  │  🎨 White-Label Sites                                 │  │ │
│  │  │  📈 Revenue & Analytics                               │  │ │
│  │  │                                                        │  │ │
│  │  │  ┌──────────────────────────────────────────────┐    │  │ │
│  │  │  │  🆕 Data & Reports                          │    │  │ │
│  │  │  │    📄 Report Builder        ← NEW!         │    │  │ │
│  │  │  │    📤 Data Import           ← NEW!         │    │  │ │
│  │  │  │    📈 Data Visualization    ← NEW!         │    │  │ │
│  │  │  └──────────────────────────────────────────────┘    │  │ │
│  │  │                                                        │  │ │
│  │  │  ⚙️  Settings                                         │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (React/Next.js)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Report Builder  │  │   Data Import    │  │  Data Viz Tool   │  │
│  │      Tool        │  │      Tool        │  │                  │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │
│           │                     │                     │              │
│           │                     │                     │              │
│           ▼                     ▼                     ▼              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    UI Components                             │   │
│  │  • Card, Button, Input, Select, Textarea                    │   │
│  │  • Badge, Label, Progress                                   │   │
│  │  • Toast notifications                                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP Requests
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API Layer (Next.js Routes)                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  /api/creator/report-builder/ai-recommendations                     │
│  /api/creator/data-import/ai-mappings                               │
│  /api/creator/data-import/validate                                  │
│  /api/creator/data-visualization/ai-recommendations                 │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  Common Functions                            │   │
│  │  • getAuthenticatedUser()                                   │   │
│  │  • getCreatorProfile()                                      │   │
│  │  • Error handling & response formatting                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Service Calls
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Service Layer                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │         ReportBuilderAIWizard                                 │  │
│  │  • generateReportRecommendations()                           │  │
│  │  • analyzeDataForReport()                                    │  │
│  │  • createSystemPrompt() / createUserPrompt()                 │  │
│  │  • getFallbackRecommendations()                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │         BulkDataImportAIWizard                                │  │
│  │  • generateImportRecommendations()                           │  │
│  │  • validateImportedData()                                    │  │
│  │  • suggestDataTransformations()                              │  │
│  │  • getFallbackMappings()                                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │    AdvancedDataVisualizationAIWizard                          │  │
│  │  • generateVisualizationRecommendations()                    │  │
│  │  • analyzeDataForVisualization()                             │  │
│  │  • suggestVisualizationForQuestion()                         │  │
│  │  • getFallbackRecommendations()                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ AI API Calls
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         External Services                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    OpenAI API                                 │  │
│  │                  (GPT-4o-mini model)                          │  │
│  │                                                                │  │
│  │  • Context-aware prompts                                      │  │
│  │  • JSON response format                                       │  │
│  │  • Fallback on error                                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

## Data Flow: Report Builder

```
User Action                    Frontend                API                Service              AI
─────────────────────────────────────────────────────────────────────────────────────────────────

1. Enter query     ──────────►
   "I need revenue
   insights"
                               
2.                             Click "Get AI        
                               Recommendations"     
                               ──────────►
                               
3.                                                   POST /api/creator/
                                                   report-builder/
                                                   ai-recommendations
                                                   ──────────►
                                                   
4.                                                                       ReportBuilderAIWizard
                                                                       .generateRecommendations()
                                                                       ──────────►
                                                                       
5.                                                                                            Create prompt
                                                                                            Call OpenAI
                                                                                            Parse response
                                                                                            ◄──────────
                                                                       
6.                                                                       Return typed response
                                                                       ◄──────────
                                                   
7.                                                   Return JSON
                                                   ◄──────────
                               
8.                             Update UI with:
                               • Suggested metrics
                               • Report structure
                               • Insights
                               • Recommendations
                               ◄──────────

9. Review & adjust ──────────►

10.                            Generate Report
                               (local rendering)
```

## Data Flow: Bulk Data Import

```
User Action                Frontend                API                Service              AI
───────────────────────────────────────────────────────────────────────────────────────────

Step 1: UPLOAD
──────────────
1. Select file     ──────►
   Upload CSV

2.                          Parse file
                           Extract headers
                           Sample data
                           
3.                          Click "Generate
                           Mappings"
                           ──────►

4.                                               POST /api/creator/
                                                data-import/
                                                ai-mappings
                                                ──────►

5.                                                                    BulkDataImportAIWizard
                                                                    .generateImportRecommendations()
                                                                    ──────►

6.                                                                                         Analyze headers
                                                                                         Suggest mappings
                                                                                         Validation rules
                                                                                         ◄──────

7.                                                                    Return mappings
                                                                    ◄──────

8.                                               Return JSON
                                                ◄──────

9.                          Display mappings:
                           • Source → Target
                           • Data types
                           • Required fields
                           ◄──────

Step 2: VALIDATION
──────────────────
10. Click           ──────►
    "Validate"

11.                                              POST /api/creator/
                                                data-import/validate
                                                ──────►

12.                                                                   BulkDataImportAIWizard
                                                                    .validateImportedData()
                                                                    ──────►

13.                                                                                        Check types
                                                                                         Validate formats
                                                                                         Find errors
                                                                                         ◄──────

14.                                                                   Return validation
                                                                    ◄──────

15.                                              Return results
                                                ◄──────

16.                         Show validation:
                           • Valid rows
                           • Errors with fixes
                           • Warnings
                           ◄──────

Step 3: IMPORT
──────────────
17. Click           ──────►
    "Import"

18.                         Process & import
                           (future: save to DB)
                           
19.                         Show success
                           ◄──────
```

## Data Flow: Data Visualization

```
User Action                Frontend                API                Service              AI
───────────────────────────────────────────────────────────────────────────────────────────

1. Select viz type ──────►
   (e.g., Trend)
   
2. Choose metrics  ──────►
   Select timeframe

3.                          Click "Get AI
                           Recommendations"
                           ──────►

4.                                               POST /api/creator/
                                                data-visualization/
                                                ai-recommendations
                                                ──────►

5.                                                                    AdvancedDataVizAIWizard
                                                                    .generateVisualizationRecommendations()
                                                                    ──────►

6.                                                                                         Analyze request
                                                                                         Recommend viz type
                                                                                         Suggest config
                                                                                         Find insights
                                                                                         ◄──────

7.                                                                    Return recommendations
                                                                    ◄──────

8.                                               Return JSON
                                                ◄──────

9.                          Display:
                           • Recommended type
                           • Configuration
                           • Insights
                           • Alternatives
                           ◄──────

10. Click           ──────►
    "Generate"

11.                         Render visualization
                           (mock/preview)
                           ◄──────

12. Export          ──────►

13.                         Generate export
                           ◄──────
```

## Type System

```typescript
// Report Builder Types
interface ReportBuilderRequest {
  reportType?: 'revenue' | 'customer' | 'usage' | 'custom';
  metrics?: string[];
  timeframe?: string;
  userQuery?: string;
}

interface ReportBuilderResponse {
  suggestedMetrics: MetricSuggestion[];
  reportStructure: ReportStructure;
  insights: string[];
  recommendations: string[];
}

// Data Import Types
interface DataImportRequest {
  fileType: 'csv' | 'excel' | 'json';
  dataType: 'customers' | 'subscriptions' | 'usage' | 'transactions' | 'custom';
  sampleData?: Record<string, any>[];
}

interface DataImportResponse {
  fieldMappings: FieldMapping[];
  validationRules: ValidationRule[];
  suggestions: string[];
  warnings: string[];
}

// Data Visualization Types
type VisualizationType = 'heatmap' | 'trend' | 'journey' | 'funnel' | 'cohort' | 'distribution' | 'comparison';

interface VisualizationRequest {
  dataType: string;
  visualizationType?: VisualizationType;
  metrics: string[];
  timeframe?: string;
  userGoal?: string;
}

interface VisualizationResponse {
  recommendedVisualization: VisualizationType;
  configuration: ChartConfiguration;
  insights: Insight[];
  recommendations: string[];
  alternativeVisualizations: Alternative[];
}
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Error Handling                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  API Route Error          Service Error       AI Error   │
│       │                        │                  │       │
│       ▼                        ▼                  ▼       │
│  ┌──────────┐           ┌──────────┐       ┌──────────┐ │
│  │ Catch &  │           │ Try/Catch│       │ Fallback │ │
│  │ Return   │           │ Block    │       │ Response │ │
│  │ 500      │           └──────────┘       └──────────┘ │
│  └──────────┘                 │                  │       │
│       │                        │                  │       │
│       ▼                        ▼                  ▼       │
│  ┌─────────────────────────────────────────────────┐    │
│  │          Frontend Toast Notification            │    │
│  │  "Error occurred. Using default configuration." │    │
│  └─────────────────────────────────────────────────┘    │
│                           │                              │
│                           ▼                              │
│              ┌───────────────────────────┐              │
│              │  Tool continues to work   │              │
│              │  with fallback responses  │              │
│              └───────────────────────────┘              │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Authentication & Authorization Flow

```
User Request
     │
     ▼
┌─────────────────┐
│   Page Route    │
│   (Server)      │
└────────┬────────┘
         │
         ▼
┌───────────────────────────┐
│ getAuthenticatedUser()    │
│ Check if user logged in   │
└───────┬───────────────────┘
        │
        ├─── Not logged in ──► redirect('/login')
        │
        ▼ Logged in
┌───────────────────────────┐
│ getCreatorProfile()       │
│ Check onboarding complete │
└───────┬───────────────────┘
        │
        ├─── Not complete ──► redirect('/creator/onboarding')
        │
        ▼ Complete
┌───────────────────────────┐
│   Render Tool Page        │
│   with CreatorProfile     │
└───────────────────────────┘
```

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── creator/
│   │       ├── report-builder/
│   │       │   └── ai-recommendations/
│   │       │       └── route.ts
│   │       ├── data-import/
│   │       │   ├── ai-mappings/
│   │       │   │   └── route.ts
│   │       │   └── validate/
│   │       │       └── route.ts
│   │       └── data-visualization/
│   │           └── ai-recommendations/
│   │               └── route.ts
│   └── creator/
│       └── (protected)/
│           ├── report-builder/
│           │   └── page.tsx
│           ├── data-import/
│           │   └── page.tsx
│           └── data-visualization/
│               └── page.tsx
├── components/
│   └── creator/
│       └── sidebar-navigation.tsx (modified)
└── features/
    └── creator/
        ├── components/
        │   ├── ReportBuilderTool.tsx
        │   ├── BulkDataImportTool.tsx
        │   └── DataVisualizationTool.tsx
        └── services/
            ├── report-builder-ai-wizard.ts
            ├── bulk-data-import-ai-wizard.ts
            └── advanced-data-visualization-ai-wizard.ts

Documentation/
├── CREATOR_TOOLS_GUIDE.md
└── CREATOR_TOOLS_QUICK_REFERENCE.md
```

---

*This architecture diagram illustrates the complete implementation of the three creator tools with AI wizards.*
