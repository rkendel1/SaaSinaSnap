# Role Detection Flow Diagram

## Multi-Source Role Detection Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Authentication                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│           EnhancedAuthService.detectUserRole()                   │
│                                                                   │
│  [RoleDetection:SUPER-DEBUG] Multi-Source Role Detection         │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌─────────────────┐            ┌─────────────────┐
│  SOURCE 1: DB   │            │ SOURCE 2: Meta  │
│  public.users   │            │  user_metadata  │
│      role       │            │      role       │
└────────┬────────┘            └────────┬────────┘
         │                              │
         │    ┌──────────┬──────────┐   │
         │    │          │          │   │
         ▼    ▼          ▼          ▼   ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │ SOURCE 3:  │  │ SOURCE 4:  │  │            │
    │ Platform   │  │  Creator   │  │            │
    │ Settings   │  │  Profile   │  │            │
    └──────┬─────┘  └──────┬─────┘  └────────────┘
           │                │
           └────────┬───────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  PRIORITY DECISION   │
         │                      │
         │  1. Has Platform     │
         │     Settings?        │
         │     → platform_owner │
         │                      │
         │  2. Has Creator      │
         │     Profile?         │
         │     → creator        │
         │                      │
         │  3. DB Role Set?     │
         │     → use DB role    │
         │                      │
         │  4. Metadata Set?    │
         │     → use metadata   │
         │                      │
         │  5. Default          │
         │     → unauthenticated│
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ CONSISTENCY CHECK    │
         │                      │
         │ • DB vs Metadata     │
         │ • DB vs Settings     │
         │ • DB vs Profile      │
         │                      │
         │ Warnings logged if   │
         │ inconsistencies      │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │   FINAL ROLE         │
         │   DETERMINED         │
         └──────────────────────┘
```

## Atomic Role Setting Flow

```
┌─────────────────────────────────────────────────────────────────┐
│      EnhancedAuthService.setUserRoleAtomic(userId, role)         │
│                                                                   │
│  [RoleDetection:SUPER-DEBUG] Atomic Role Setting                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌─────────────────┐            ┌─────────────────┐
│   STEP 1: DB    │            │  STEP 2: Meta   │
│                 │            │                 │
│  UPDATE         │            │  UPDATE         │
│  public.users   │            │  auth.users     │
│  SET role =     │            │  user_metadata  │
│  'creator'      │            │  role='creator' │
│  WHERE id=...   │            │                 │
└────────┬────────┘            └────────┬────────┘
         │                              │
         ├──── Success? ───────┬────────┤
         │                     │        │
         ▼                     ▼        ▼
    ┌─────────┐          ┌─────────────────┐
    │  Log    │          │  Check Both     │
    │ Success │          │  Succeeded      │
    └─────────┘          └────────┬────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  Return Overall  │
                         │  Success Status  │
                         └──────────────────┘
```

## Role Assignment at Creation

### Platform Owner Creation

```
User Completes Platform Setup
         │
         ▼
┌─────────────────────────────────────────────┐
│  getOrCreatePlatformSettings(ownerId)       │
└────────────────────┬────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌──────────────┐         ┌──────────────┐
│ Step 1:      │         │ Step 2:      │
│ Insert       │──────▶  │ Update       │
│ platform_    │         │ public.users │
│ settings     │         │ role         │
└──────────────┘         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │ Step 3:      │
                         │ Update       │
                         │ auth.users   │
                         │ metadata     │
                         └──────────────┘
```

### Creator Creation

```
User Completes Creator Setup
         │
         ▼
┌─────────────────────────────────────────────┐
│  createCreatorProfile(profile)              │
└────────────────────┬────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌──────────────┐         ┌──────────────┐
│ Step 1:      │         │ Step 2:      │
│ Insert       │──────▶  │ Update       │
│ creator_     │         │ public.users │
│ profiles     │         │ role         │
└──────────────┘         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │ Step 3:      │
                         │ Update       │
                         │ auth.users   │
                         │ metadata     │
                         └──────────────┘
```

## Route Guard Flow

### Platform Layout Guard

```
User Accesses /dashboard
         │
         ▼
┌─────────────────────────────────────────────┐
│  EnhancedAuthService.getCurrentUserRole()   │
└────────────────────┬────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
  ┌──────────────┐      ┌──────────────┐
  │ Authenticated│      │ Unauthenticated│
  │ as platform_ │      │     or        │
  │ owner?       │      │  other role   │
  └──────┬───────┘      └──────┬────────┘
         │                     │
         ▼                     ▼
  ┌──────────────┐      ┌──────────────┐
  │ Allow Access │      │  Redirect to │
  │ to Dashboard │      │  Appropriate │
  │              │      │  Dashboard   │
  └──────────────┘      └──────────────┘
```

### Creator Layout Guard

```
User Accesses /creator/dashboard
         │
         ▼
┌─────────────────────────────────────────────┐
│  EnhancedAuthService.getCurrentUserRole()   │
└────────────────────┬────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
  ┌──────────────┐      ┌──────────────┐
  │ Authenticated│      │ Unauthenticated│
  │ as creator?  │      │     or        │
  │              │      │  other role   │
  └──────┬───────┘      └──────┬────────┘
         │                     │
         ▼                     ▼
  ┌──────────────┐      ┌──────────────┐
  │ Onboarding   │      │  Redirect to │
  │ Complete?    │      │  Appropriate │
  │              │      │  Dashboard   │
  └──────┬───────┘      └──────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  Yes        No
    │         │
    ▼         ▼
  Access    Redirect to
  Granted   Onboarding
```

## Benefits Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                      ROBUSTNESS                                  │
│  • Multiple sources ensure detection even if one fails           │
│  • Fallback chain provides resilience                            │
│  • Definitive checks (settings/profiles) take priority           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      CONSISTENCY                                 │
│  • Atomic updates prevent DB/metadata mismatches                 │
│  • Both locations updated together                               │
│  • Automatic consistency checking and warnings                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      DEBUGGABILITY                               │
│  • Super-debug logging for all operations                        │
│  • Source values displayed clearly                               │
│  • Easy to identify role detection issues                        │
│  • Full audit trail available                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY                                    │
│  • Route guards use most definitive detection                    │
│  • Multiple verification sources                                 │
│  • Automatic redirect to appropriate areas                       │
│  • Prevents unauthorized access                                  │
└─────────────────────────────────────────────────────────────────┘
```
