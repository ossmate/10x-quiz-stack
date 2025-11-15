# Authentication Flow Diagram - QuizStack

## Kompletny diagram przepływu autentykacji

```mermaid
graph TB
    subgraph "User Interface Layer"
        A[User/Browser] --> B{Auth State?}
        B -->|Not Authenticated| C[Login/Register Buttons]
        B -->|Authenticated| D[User Menu Dropdown]

        C --> E[/auth/login]
        C --> F[/auth/register]
        D --> G[/auth/change-password]
        D --> H[/auth/logout]

        E --> I[LoginForm Component]
        F --> J[RegistrationForm Component]
        G --> K[ChangePasswordForm Component]

        L[/auth/forgot-password] --> M[ForgotPasswordForm]
        N[/auth/reset-password] --> O[ResetPasswordForm]
    end

    subgraph "React Components"
        I --> |validate| P[Zod Schema Validation]
        J --> |validate| P
        K --> |validate| P
        M --> |validate| P
        O --> |validate| P

        P --> |valid| Q[API Call]
        P --> |invalid| R[Display Field Errors]
    end

    subgraph "API Endpoints Layer"
        Q --> |POST| S[/api/auth/login]
        Q --> |POST| T[/api/auth/register]
        Q --> |POST| U[/api/auth/logout]
        Q --> |POST| V[/api/auth/change-password]
        Q --> |POST| W[/api/auth/forgot-password]
        Q --> |POST| X[/api/auth/reset-password]
        Q --> |GET| Y[/api/auth/session]
        Q --> |POST| Z[/api/auth/check-username]

        S --> AA[AuthService.login]
        T --> AB[AuthService.register]
        U --> AC[AuthService.logout]
        V --> AD[AuthService.changePassword]
        W --> AE[AuthService.forgotPassword]
        X --> AF[AuthService.resetPassword]
        Y --> AG[AuthService.getCurrentUser]
        Z --> AH[AuthService.checkUsernameAvailability]
    end

    subgraph "Service Layer"
        AA --> AI{Validate Credentials}
        AB --> AJ{Check Username/Email}

        AI --> |valid| AK[Supabase Auth]
        AJ --> |available| AK

        AC --> AK
        AD --> AK
        AE --> AK
        AF --> AK
        AG --> AK
        AH --> AL[Database Query]
    end

    subgraph "Supabase Backend"
        AK --> |signInWithPassword| AM[auth.users]
        AK --> |signUp| AM
        AK --> |signOut| AM
        AK --> |updateUser| AM
        AK --> |resetPasswordForEmail| AM
        AK --> |getSession| AM

        AM --> AN{Auth Success?}

        AN --> |yes - register| AO[Create Profile Record]
        AN --> |yes - login| AP[Set Session Cookie]
        AN --> |yes - logout| AQ[Clear Session]
        AN --> |yes - password reset| AR[Send Email]
        AN --> |no| AS[Return Error]

        AO --> AT[(profiles table)]
        AL --> AT
    end

    subgraph "Middleware Layer"
        AU[Astro Middleware] --> AV{Route Type?}

        AV --> |API Route| AW[Use Service Role Client]
        AV --> |Page Route| AX[Use Regular Client]

        AX --> AY{Check Auth State}

        AY --> |Protected Route + No Session| AZ[Redirect to /auth/login]
        AY --> |Auth Route + Has Session| BA[Redirect to /]
        AY --> |Valid Access| BB[Continue to Page]

        AW --> BB
    end

    subgraph "Page Routing"
        BB --> BC{Page Type}

        BC --> |Public| BD[Layout.astro with AuthButtons]
        BC --> |Protected| BE[ManagementLayout.astro with AuthButtons]

        BD --> BF[Public Quiz Pages]
        BD --> BG[Auth Pages]

        BE --> BH[Dashboard]
        BE --> BI[Quiz Management]
        BE --> BJ[Quiz Creation]
    end

    subgraph "Database Schema"
        AT --> BK[id: UUID - PK]
        AT --> BL[username: TEXT - UNIQUE]
        AT --> BM[created_at: TIMESTAMPTZ]
        AT --> BN[updated_at: TIMESTAMPTZ]

        BK -.->|FK| BO[auth.users.id]
    end

    subgraph "Row Level Security"
        AT --> BP{RLS Policies}

        BP --> BQ[Users can read own profile]
        BP --> BR[Users can update own profile]
        BP --> BS[Service role can insert profiles]
    end

    AP --> |redirect| BD
    AQ --> |redirect| BD
    AZ --> |with ?redirect param| E

    AR --> BT[User Email]
    BT --> |click link| N

    AS --> |401/400/409| BU[Error Response]
    BU --> |display| R

    style A fill:#e1f5ff
    style AK fill:#ffe1e1
    style AT fill:#e1ffe1
    style AU fill:#fff4e1
    style P fill:#f0e1ff

    classDef uiComponent fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef apiEndpoint fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef service fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef database fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef middleware fill:#fff9c4,stroke:#f9a825,stroke-width:2px

    class E,F,G,H,I,J,K,M,O uiComponent
    class S,T,U,V,W,X,Y,Z apiEndpoint
    class AA,AB,AC,AD,AE,AF,AG,AH service
    class AT,AM,BO database
    class AU,AV,AW,AX,AY middleware
```

## User Flow Scenarios

### 1. Registration Flow (US-001)

```mermaid
sequenceDiagram
    actor User
    participant UI as Registration Form
    participant Validation as Zod Schema
    participant API as POST /api/auth/register
    participant Service as AuthService
    participant Supabase as Supabase Auth
    participant DB as profiles table
    participant Email as Email Service

    User->>UI: Enters email, password, username
    UI->>Validation: Validate input

    alt Invalid Input
        Validation-->>UI: Return errors
        UI-->>User: Display field errors
    else Valid Input
        Validation->>API: Submit form data
        API->>Service: register(input)

        Service->>DB: Check username availability

        alt Username Taken
            DB-->>Service: Username exists
            Service-->>API: Error 409
            API-->>UI: Username taken
            UI-->>User: Show error message
        else Username Available
            DB-->>Service: Username available
            Service->>Supabase: signUp(email, password)

            alt Email Already Exists
                Supabase-->>Service: Error
                Service-->>API: Error 409
                API-->>UI: Email exists
                UI-->>User: Show error message
            else Registration Success
                Supabase-->>Service: User created
                Service->>DB: Insert profile record
                DB-->>Service: Profile created
                Supabase->>Email: Send verification email
                Service-->>API: Success 201
                API-->>UI: Registration successful
                UI-->>User: Redirect to /auth/verify-email
            end
        end
    end
```

### 2. Login Flow (US-001)

```mermaid
sequenceDiagram
    actor User
    participant UI as Login Form
    participant Validation as Zod Schema
    participant API as POST /api/auth/login
    participant Service as AuthService
    participant Supabase as Supabase Auth
    participant DB as profiles table
    participant Browser as Browser Cookie

    User->>UI: Enters email & password
    UI->>Validation: Validate input

    alt Invalid Format
        Validation-->>UI: Return errors
        UI-->>User: Display field errors
    else Valid Format
        Validation->>API: Submit credentials
        API->>Service: login(input)
        Service->>Supabase: signInWithPassword()

        alt Invalid Credentials
            Supabase-->>Service: Auth Error
            Service-->>API: Error 401
            API-->>UI: Invalid credentials
            UI-->>User: Show error message
        else Email Not Verified
            Supabase-->>Service: Email not confirmed
            Service-->>API: Error 403
            API-->>UI: Email not verified
            UI-->>User: Show verification prompt
        else Login Success
            Supabase-->>Service: Session created
            Supabase->>Browser: Set session cookie
            Service->>DB: Get user profile
            DB-->>Service: Username & profile data
            Service-->>API: Success 200 + user data
            API-->>UI: Login successful
            UI-->>User: Redirect to dashboard or ?redirect
        end
    end
```

### 3. Password Recovery Flow (US-001)

```mermaid
sequenceDiagram
    actor User
    participant ForgotUI as Forgot Password Form
    participant API1 as POST /api/auth/forgot-password
    participant Service as AuthService
    participant Supabase as Supabase Auth
    participant Email as Email Service
    participant ResetUI as Reset Password Form
    participant API2 as POST /api/auth/reset-password

    User->>ForgotUI: Enters email
    ForgotUI->>API1: Request password reset
    API1->>Service: forgotPassword(email)
    Service->>Supabase: resetPasswordForEmail()

    alt Email Exists
        Supabase->>Email: Send reset link with token
        Email->>User: Email with reset link
    end

    Note over Service,ForgotUI: Always show success message<br/>(security - don't reveal if email exists)
    Service-->>API1: Success 200
    API1-->>ForgotUI: Reset email sent
    ForgotUI-->>User: Check your email message

    User->>Email: Click reset link
    Email->>ResetUI: Open /auth/reset-password?token=xxx

    User->>ResetUI: Enters new password
    ResetUI->>API2: Submit new password + token
    API2->>Service: resetPassword(token, password)
    Service->>Supabase: updateUser(password)

    alt Invalid/Expired Token
        Supabase-->>Service: Error
        Service-->>API2: Error 400
        API2-->>ResetUI: Invalid token
        ResetUI-->>User: Show error + request new link
    else Reset Success
        Supabase-->>Service: Password updated
        Service-->>API2: Success 200
        API2-->>ResetUI: Password reset successful
        ResetUI-->>User: Redirect to /auth/login
    end
```

### 4. Protected Route Access (US-002, US-003, US-008)

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Middleware as Astro Middleware
    participant Supabase as Supabase Client
    participant Page as Protected Page
    participant Login as Login Page

    User->>Browser: Navigate to /quizzes/new
    Browser->>Middleware: Request protected route

    Middleware->>Supabase: getSession()

    alt No Session
        Supabase-->>Middleware: No active session
        Middleware-->>Browser: Redirect 302
        Browser->>Login: /auth/login?redirect=/quizzes/new
        Login-->>User: Show login form

        Note over User,Login: User logs in successfully

        Login->>Browser: Redirect to original page
        Browser->>Middleware: Request /quizzes/new
        Middleware->>Supabase: getSession()
        Supabase-->>Middleware: Valid session
        Middleware->>Page: Allow access
        Page-->>User: Render protected page
    else Valid Session
        Supabase-->>Middleware: Session data
        Middleware->>Page: Allow access
        Page-->>User: Render protected page
    end
```

### 5. Logout Flow (US-001)

```mermaid
sequenceDiagram
    actor User
    participant UI as User Menu
    participant Page as /auth/logout.astro
    participant API as POST /api/auth/logout
    participant Service as AuthService
    participant Supabase as Supabase Auth
    participant Browser as Browser Cookie
    participant Home as Home Page

    User->>UI: Click "Logout"
    UI->>Page: Navigate to /auth/logout
    Page->>API: Call logout endpoint
    API->>Service: logout()
    Service->>Supabase: signOut()
    Supabase->>Browser: Clear session cookie
    Supabase-->>Service: Logout success
    Service-->>API: Success 200
    API-->>Page: Logged out
    Page->>Home: Redirect to /
    Home-->>User: Show public home page
```

### 6. Change Password Flow (Authenticated User)

```mermaid
sequenceDiagram
    actor User
    participant UI as Change Password Form
    participant Middleware as Auth Check
    participant API as POST /api/auth/change-password
    participant Service as AuthService
    participant Supabase as Supabase Auth
    participant Browser as Browser Session

    User->>UI: Navigate to /auth/change-password
    Middleware->>Supabase: Check session

    alt Not Authenticated
        Supabase-->>Middleware: No session
        Middleware-->>User: Redirect to login
    else Authenticated
        Supabase-->>Middleware: Valid session
        Middleware->>UI: Allow access

        User->>UI: Enter current & new password
        UI->>API: Submit password change
        API->>Service: changePassword(input)
        Service->>Supabase: Verify current password

        alt Invalid Current Password
            Supabase-->>Service: Auth error
            Service-->>API: Error 401
            API-->>UI: Current password incorrect
            UI-->>User: Show error
        else Valid Current Password
            Service->>Supabase: updateUser(new password)
            Supabase-->>Service: Password updated
            Supabase->>Browser: Optionally clear session
            Service-->>API: Success 200
            API-->>UI: Password changed
            UI-->>User: Show success + optionally redirect to login
        end
    end
```

## Component Architecture

### Frontend Components Structure

```mermaid
graph TD
    subgraph "Layouts"
        A[Layout.astro] --> B[AuthButtons]
        C[ManagementLayout.astro] --> B
    end

    subgraph "Auth Pages"
        D[/auth/login.astro] --> E[LoginForm]
        F[/auth/register.astro] --> G[RegistrationForm]
        H[/auth/forgot-password.astro] --> I[ForgotPasswordForm]
        J[/auth/reset-password.astro] --> K[ResetPasswordForm]
        L[/auth/change-password.astro] --> M[ChangePasswordForm]
    end

    subgraph "Shared Components"
        E --> N[AuthContainer]
        G --> N
        I --> N
        K --> N
        M --> N

        N --> O[Shadcn/ui Components]

        G --> P[PasswordStrengthIndicator]
        K --> P
        M --> P

        E --> Q[FormFieldError]
        G --> Q
        I --> Q
        K --> Q
        M --> Q
    end

    subgraph "UI Library"
        O --> R[Form]
        O --> S[Input]
        O --> T[Label]
        O --> U[Alert]
        O --> V[Button]
        O --> W[Dropdown Menu]
        O --> X[Avatar]
    end

    subgraph "Validation"
        E --> Y[Zod Schemas]
        G --> Y
        I --> Y
        K --> Y
        M --> Y

        Y --> Z[auth.schema.ts]
    end

    B --> W
    B --> X

    style A fill:#e3f2fd
    style C fill:#e3f2fd
    style B fill:#fff3e0
    style N fill:#f3e5f5
    style Y fill:#e8f5e9
```

### Backend Architecture

```mermaid
graph TD
    subgraph "API Layer"
        A[/api/auth/login] --> B[AuthService]
        C[/api/auth/register] --> B
        D[/api/auth/logout] --> B
        E[/api/auth/change-password] --> B
        F[/api/auth/forgot-password] --> B
        G[/api/auth/reset-password] --> B
        H[/api/auth/session] --> B
        I[/api/auth/check-username] --> B
    end

    subgraph "Service Layer"
        B --> J[login]
        B --> K[register]
        B --> L[logout]
        B --> M[changePassword]
        B --> N[forgotPassword]
        B --> O[resetPassword]
        B --> P[getCurrentUser]
        B --> Q[checkUsernameAvailability]
    end

    subgraph "Validation Layer"
        A --> R[loginSchema]
        C --> S[registerSchema]
        E --> T[changePasswordSchema]
        F --> U[forgotPasswordSchema]
        G --> V[resetPasswordSchema]

        R --> W[Zod Validation]
        S --> W
        T --> W
        U --> W
        V --> W
    end

    subgraph "Data Access"
        J --> X[Supabase Auth]
        K --> X
        L --> X
        M --> X
        N --> X
        O --> X
        P --> X

        K --> Y[profiles table]
        Q --> Y
        P --> Y

        X --> Z[(auth.users)]
        Y --> AA[(profiles)]

        AA -.->|FK| Z
    end

    subgraph "Middleware"
        AB[Astro Middleware] --> AC{Route Check}
        AC --> AD[Protected Routes]
        AC --> AE[Auth Routes]
        AC --> AF[Public Routes]

        AD --> AG{Session Valid?}
        AE --> AG

        AG -->|No| AH[Redirect to Login]
        AG -->|Yes on Auth Page| AI[Redirect to Home]
        AG -->|Yes on Protected| AJ[Allow Access]

        AF --> AJ
    end

    style B fill:#ffebee
    style W fill:#e8f5e9
    style X fill:#fff3e0
    style AB fill:#e3f2fd
```

## Database Schema with Relationships

```mermaid
erDiagram
    AUTH_USERS ||--o{ PROFILES : "one to one"
    PROFILES ||--o{ QUIZZES : creates
    PROFILES ||--o{ QUIZ_ATTEMPTS : takes

    AUTH_USERS {
        uuid id PK
        string email UK
        string encrypted_password
        timestamptz email_confirmed_at
        timestamptz created_at
        timestamptz updated_at
    }

    PROFILES {
        uuid id PK,FK
        string username UK
        timestamptz created_at
        timestamptz updated_at
    }

    QUIZZES {
        uuid id PK
        uuid user_id FK
        string title
        jsonb metadata
        enum status
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    QUIZ_ATTEMPTS {
        uuid id PK
        uuid quiz_id FK
        uuid user_id FK
        integer score
        timestamptz started_at
        timestamptz completed_at
    }
```

## Row Level Security Policies

```mermaid
graph TD
    subgraph "profiles Table RLS"
        A[profiles] --> B{Policy Check}

        B --> C[SELECT Policy]
        C --> D{auth.uid = user_id?}
        D -->|Yes| E[Allow Read]
        D -->|No| F[Deny]

        B --> G[UPDATE Policy]
        G --> D

        B --> H[INSERT Policy]
        H --> I{Service Role?}
        I -->|Yes| J[Allow Insert]
        I -->|No| F
    end

    subgraph "quizzes Table RLS"
        K[quizzes] --> L{Policy Check}

        L --> M[SELECT - Own Quizzes]
        M --> N{auth.uid = user_id?}
        N -->|Yes| O[Allow Read]
        N -->|No| F

        L --> P[SELECT - Public Quizzes]
        P --> Q{status = 'public' AND deleted_at IS NULL?}
        Q -->|Yes| O
        Q -->|No| F

        L --> R[UPDATE Policy]
        R --> N

        L --> S[DELETE Policy]
        S --> N

        L --> T[INSERT Policy]
        T --> N
    end

    style A fill:#e8f5e9
    style K fill:#e8f5e9
    style E fill:#c8e6c9
    style O fill:#c8e6c9
    style J fill:#c8e6c9
    style F fill:#ffcdd2
```

## Security Layers

```mermaid
graph TB
    subgraph "Security Measures"
        A[Client Request] --> B[Rate Limiting]

        B --> C{Rate Limit OK?}
        C -->|No| D[429 Too Many Requests]
        C -->|Yes| E[Middleware Auth Check]

        E --> F{Protected Route?}
        F -->|No| G[Continue]
        F -->|Yes| H{Valid Session?}

        H -->|No| I[302 Redirect to Login]
        H -->|Yes| G

        G --> J[API Endpoint]

        J --> K[Input Validation - Zod]
        K --> L{Valid Input?}
        L -->|No| M[400 Bad Request]
        L -->|Yes| N[Service Layer]

        N --> O[Supabase Auth]
        O --> P[Password Hashing - bcrypt]
        O --> Q[JWT Token Generation]
        O --> R[Session Management]

        R --> S[HTTP-Only Cookie]
        S --> T[XSS Protection]

        N --> U[Database RLS]
        U --> V{Policy Check}
        V -->|Deny| W[403 Forbidden]
        V -->|Allow| X[Database Operation]

        X --> Y[SQL Injection Protection]
        Y --> Z[Parameterized Queries]

        Z --> AA[Success Response]
    end

    subgraph "Security Features"
        AB[Password Requirements]
        AC[Email Verification]
        AD[CSRF Protection]
        AE[Session Expiry]
        AF[Token Refresh]
    end

    style B fill:#ffebee
    style K fill:#fff3e0
    style P fill:#e8f5e9
    style U fill:#e3f2fd
    style T fill:#f3e5f5
```

## Error Handling Flow

```mermaid
graph TD
    A[User Action] --> B[Form Submission]

    B --> C{Client-side Validation}

    C -->|Fail| D[Display Field Errors]
    D --> E[User Corrects Input]
    E --> B

    C -->|Pass| F[API Request]

    F --> G{Network Success?}
    G -->|No| H[Network Error]
    H --> I[Show Connection Error]
    I --> J[Retry Option]
    J --> F

    G -->|Yes| K{Response Status}

    K -->|400 Validation Error| L[Show Field-Level Errors]
    K -->|401 Unauthorized| M[Show Auth Error Message]
    K -->|403 Forbidden| N[Show Permission Error]
    K -->|409 Conflict| O[Show Duplicate Error]
    K -->|429 Rate Limited| P[Show Rate Limit Message]
    K -->|500 Server Error| Q[Show Generic Error]
    K -->|200/201 Success| R[Show Success Message]

    L --> S[User Corrects Input]
    M --> T[Redirect to Login]
    N --> T
    O --> S
    P --> U[Wait and Retry]
    Q --> V[Log Error + Support Contact]
    R --> W[Continue to Next Step]

    S --> B
    U --> F

    style H fill:#ffcdd2
    style L fill:#ffcdd2
    style M fill:#ffcdd2
    style N fill:#ffcdd2
    style O fill:#ffcdd2
    style P fill:#ffcdd2
    style Q fill:#ffcdd2
    style R fill:#c8e6c9
```

## Implementation Phases

```mermaid
gantt
    title Authentication Implementation Timeline
    dateFormat YYYY-MM-DD
    section Phase 1 Core Auth
    Install Shadcn/ui components        :2025-10-17, 1d
    Create validation schemas           :2025-10-17, 1d
    Create AuthService                  :2025-10-18, 1d
    Create AuthButtons component        :2025-10-18, 1d
    Implement registration              :2025-10-19, 2d
    Implement login                     :2025-10-19, 2d
    Implement logout                    :2025-10-21, 1d
    Update middleware                   :2025-10-21, 1d
    Update layouts with auth UI         :2025-10-22, 1d
    Testing Phase 1                     :2025-10-22, 1d

    section Phase 2 Password Recovery
    Configure Supabase emails           :2025-10-23, 1d
    Implement forgot password           :2025-10-23, 1d
    Implement reset password            :2025-10-24, 1d
    Create verify-email page            :2025-10-24, 1d
    Testing Phase 2                     :2025-10-25, 1d

    section Phase 3 Password Management
    Implement change password           :2025-10-26, 1d
    Add password strength indicator     :2025-10-26, 1d
    Testing Phase 3                     :2025-10-27, 1d

    section Phase 4 UI Polish
    Create shared components            :2025-10-28, 2d
    Improve accessibility               :2025-10-28, 2d
    Add animations                      :2025-10-30, 1d
    Mobile testing                      :2025-10-30, 1d
    Browser compatibility               :2025-10-31, 1d
```

---

## Notatki implementacyjne

### Kluczowe elementy architektury:

1. **Podział odpowiedzialności**:
   - **Astro Pages** (.astro): Server-side rendering, routing, SEO
   - **React Components** (.tsx): Formularze, interaktywność, walidacja klienta
   - **API Routes** (api/auth/\*.ts): Endpointy REST, walidacja serwera
   - **Service Layer**: Logika biznesowa, komunikacja z Supabase
   - **Middleware**: Ochrona tras, zarządzanie sesjami

2. **Bezpieczeństwo**:
   - Hasła haszowane przez Supabase (bcrypt)
   - Sesje zarządzane przez JWT w HTTP-only cookies
   - Row Level Security (RLS) na poziomie bazy danych
   - Rate limiting na krytycznych endpointach
   - Walidacja po stronie klienta i serwera (Zod)

3. **User Experience**:
   - Walidacja w czasie rzeczywistym (on blur)
   - Wyraźne komunikaty błędów
   - Wskaźnik siły hasła
   - Loading states podczas operacji
   - Responsywny design (mobile-first)

4. **Zgodność z PRD**:
   - US-001: ✅ Pełna rejestracja, login, wylogowanie, odzyskiwanie hasła
   - US-002-008: ✅ Ochrona tras wymagających autentykacji
   - Przyciski login/logout w prawym górnym rogu na wszystkich stronach

5. **Supabase Integration**:
   - Automatyczna weryfikacja email
   - Session management z auto-refresh
   - Profile creation linked to auth.users
   - RLS policies dla bezpieczeństwa danych
