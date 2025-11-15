# Diagram Przepływu Autentykacji - QuizStack

Diagram przedstawia pełny cykl życia autentykacji w aplikacji QuizStack zbudowanej z wykorzystaniem Astro, React i Supabase Auth.

## Diagram sekwencji - Pełny przepływ autentykacji

```mermaid
sequenceDiagram
    autonumber

    participant P as Przeglądarka
    participant M as Middleware
    participant API as Astro API
    participant S as Supabase Auth
    participant DB as Baza Danych

    Note over P,DB: REJESTRACJA NOWEGO UŻYTKOWNIKA

    P->>P: Użytkownik wypełnia formularz rejestracji
    activate P
    P->>P: Walidacja kliencka (Zod schema)
    P->>API: POST /api/auth/register
    deactivate P

    activate API
    API->>API: Walidacja danych (email, password, username)
    API->>DB: Sprawdź unikalność username
    activate DB
    DB-->>API: Username dostępny
    deactivate DB

    API->>S: signUp(email, password, metadata)
    activate S
    S->>S: Hash hasła (bcrypt)
    S->>DB: INSERT do auth.users
    activate DB
    DB-->>S: Użytkownik utworzony
    deactivate DB
    S->>S: Generuj token weryfikacyjny
    S-->>P: Wyślij email weryfikacyjny
    S-->>API: Użytkownik utworzony (wymaga potwierdzenia)
    deactivate S

    API-->>P: Status 201: Rejestracja udana
    deactivate API
    P->>P: Przekierowanie na /auth/verify-email

    Note over P,S: Użytkownik klika link w emailu

    P->>S: GET link weryfikacyjny z tokenem
    activate S
    S->>DB: UPDATE auth.users (email_confirmed)
    activate DB
    DB-->>S: Email potwierdzony
    deactivate DB
    S-->>P: Przekierowanie na /auth/login
    deactivate S

    Note over P,DB: LOGOWANIE UŻYTKOWNIKA

    P->>P: Użytkownik wypełnia formularz logowania
    activate P
    P->>P: Walidacja kliencka (email, password)
    P->>API: POST /api/auth/login
    deactivate P

    activate API
    API->>API: Walidacja danych (Zod)
    API->>S: signInWithPassword(email, password)
    activate S

    S->>DB: SELECT z auth.users WHERE email
    activate DB
    DB-->>S: Dane użytkownika
    deactivate DB

    alt Email nie potwierdzony
        S-->>API: Error: Email not confirmed
        API-->>P: Status 403: Potwierdź email
    else Nieprawidłowe dane
        S-->>API: Error: Invalid credentials
        API-->>P: Status 401: Błędny email lub hasło
    else Autentykacja udana
        S->>S: Weryfikacja hasła (bcrypt)
        S->>S: Generuj access token (JWT, TTL 1h)
        S->>S: Generuj refresh token (TTL 30 dni)
        S-->>API: Sesja z tokenami
        deactivate S

        API->>API: createSupabaseServerInstance
        API->>API: Zapisz tokeny w cookie (httpOnly, secure)

        API->>DB: SELECT z profiles WHERE id
        activate DB
        DB-->>API: Profil użytkownika (username)
        deactivate DB

        API-->>P: Status 200: Logowanie udane + dane użytkownika
        deactivate API

        P->>P: Zapisz cookie sesyjne
        P->>P: Przekierowanie na stronę główną lub redirect URL
    end

    Note over P,DB: DOSTĘP DO CHRONIONEJ STRONY

    P->>M: GET /quizzes/new (z cookie sesyjnym)
    activate M

    M->>M: createSupabaseServerInstance(cookies, headers)
    M->>M: Odczytaj tokeny z cookie
    M->>S: auth.getUser() (z access token)
    activate S

    alt Access token ważny
        S->>S: Weryfikacja JWT (signature, exp)
        S-->>M: Użytkownik zweryfikowany
        M->>M: Ustaw locals.user
        M->>M: next() - kontynuuj żądanie
        deactivate M
        P->>P: Renderuj chronioną stronę

    else Access token wygasł
        S->>S: Token wygasł (po 1h)
        S-->>M: Error: Token expired
        deactivate S

        M->>S: Automatyczne odświeżanie z refresh token
        activate S
        S->>S: Weryfikacja refresh token

        alt Refresh token ważny
            S->>S: Generuj nowy access token
            S->>S: Generuj nowy refresh token
            S-->>M: Nowe tokeny
            deactivate S
            M->>M: Zapisz nowe tokeny w cookie (setAll)
            M->>M: Ustaw locals.user
            M->>M: next() - kontynuuj żądanie
            deactivate M
            P->>P: Renderuj chronioną stronę

        else Refresh token wygasł lub nieprawidłowy
            S-->>M: Error: Session expired
            deactivate S
            M->>M: Brak aktywnej sesji
            M-->>P: Redirect 302: /auth/login?redirect=/quizzes/new
            deactivate M
            P->>P: Przekierowanie na stronę logowania
        end
    end

    Note over P,DB: WYLOGOWANIE UŻYTKOWNIKA

    P->>API: POST /api/auth/logout (z cookie sesyjnym)
    activate API

    API->>API: createSupabaseServerInstance
    API->>S: auth.signOut()
    activate S
    S->>S: Invaliduj refresh token
    S->>DB: UPDATE auth.refresh_tokens (revoked)
    activate DB
    DB-->>S: Token unieważniony
    deactivate DB
    S-->>API: Wylogowanie udane
    deactivate S

    API->>API: Usuń cookie sesyjne
    API-->>P: Status 200: Wylogowano
    deactivate API

    P->>P: Usuń cookie z przeglądarki
    P->>P: Przekierowanie na stronę główną

    Note over P,DB: ODZYSKIWANIE HASŁA

    P->>P: Użytkownik klika Forgot Password
    P->>P: Wypełnia formularz z emailem
    P->>API: POST /api/auth/forgot-password
    activate API

    API->>API: Walidacja email (Zod)
    API->>S: auth.resetPasswordForEmail(email)
    activate S

    S->>DB: SELECT z auth.users WHERE email
    activate DB
    DB-->>S: Użytkownik istnieje (lub nie)
    deactivate DB

    alt Użytkownik istnieje
        S->>S: Generuj token resetowania (TTL 1h)
        S-->>P: Wyślij email z linkiem resetowania
    else Użytkownik nie istnieje
        Note over S: Brak akcji (bezpieczeństwo)
    end

    S-->>API: Zawsze zwróć sukces (security)
    deactivate S
    API-->>P: Status 200: Email wysłany (jeśli konto istnieje)
    deactivate API

    P->>P: Wyświetl komunikat o wysłaniu emaila

    Note over P,S: Użytkownik klika link w emailu

    P->>S: GET link resetowania z tokenem
    activate S
    S->>S: Weryfikacja tokenu resetowania

    alt Token ważny
        S-->>P: Przekierowanie na /auth/reset-password?token=xxx
        deactivate S

        P->>P: Renderuj formularz nowego hasła
        P->>P: Użytkownik wprowadza nowe hasło
        P->>API: POST /api/auth/reset-password (token, password)
        activate API

        API->>API: Walidacja hasła (Zod - min 8 znaków, etc)
        API->>S: auth.updateUser(password)
        activate S
        S->>S: Weryfikacja tokenu resetowania
        S->>S: Hash nowego hasła (bcrypt)
        S->>DB: UPDATE auth.users SET password
        activate DB
        DB-->>S: Hasło zaktualizowane
        deactivate DB
        S->>S: Invaliduj wszystkie sesje
        S-->>API: Hasło zmienione
        deactivate S

        API-->>P: Status 200: Hasło zresetowane
        deactivate API
        P->>P: Przekierowanie na /auth/login z komunikatem

    else Token wygasł lub nieprawidłowy
        S-->>P: Error: Token invalid or expired
        deactivate S
        P->>P: Wyświetl błąd i link do ponownego resetowania
    end

    Note over P,DB: ZMIANA HASŁA (ZALOGOWANY UŻYTKOWNIK)

    P->>M: GET /auth/change-password (z cookie sesyjnym)
    activate M
    M->>S: auth.getUser() (weryfikacja sesji)
    activate S
    S-->>M: Użytkownik zweryfikowany
    deactivate S
    M->>M: Ustaw locals.user
    M->>M: next()
    deactivate M

    P->>P: Renderuj formularz zmiany hasła
    P->>P: Użytkownik wprowadza obecne i nowe hasło
    P->>API: POST /api/auth/change-password
    activate API

    API->>API: Walidacja (obecne =/= nowe, wymagania hasła)
    API->>API: Pobierz user z locals (wymaga sesji)

    API->>S: Weryfikacja obecnego hasła
    activate S
    S->>DB: SELECT auth.users (verify current password)
    activate DB
    DB-->>S: Hasło zweryfikowane
    deactivate DB

    alt Obecne hasło prawidłowe
        S->>S: Hash nowego hasła
        S->>DB: UPDATE auth.users SET password
        activate DB
        DB-->>S: Hasło zaktualizowane
        deactivate DB
        S->>S: Invaliduj refresh tokeny (opcjonalnie)
        S-->>API: Hasło zmienione
        deactivate S

        API-->>P: Status 200: Hasło zmienione
        deactivate API
        P->>P: Wyświetl komunikat sukcesu

    else Obecne hasło nieprawidłowe
        S-->>API: Error: Current password incorrect
        deactivate S
        API-->>P: Status 401: Nieprawidłowe obecne hasło
        deactivate API
        P->>P: Wyświetl błąd walidacji
    end

    Note over P,DB: OCHRONA PRZED NIEAUTORYZOWANYM DOSTĘPEM

    rect rgb(255, 230, 230)
        Note over P,M: Próba dostępu bez sesji
        P->>M: GET /quizzes/new (brak cookie)
        activate M
        M->>S: auth.getUser()
        activate S
        S-->>M: Error: No session
        deactivate S
        M->>M: isProtectedRoute = true
        M->>M: user = null
        M-->>P: Redirect 302: /auth/login?redirect=/quizzes/new
        deactivate M
    end

    rect rgb(230, 255, 230)
        Note over P,M: Przekierowanie z auth page gdy zalogowany
        P->>M: GET /auth/login (z aktywną sesją)
        activate M
        M->>S: auth.getUser()
        activate S
        S-->>M: Użytkownik zweryfikowany
        deactivate S
        M->>M: isAuthPage = true i user != null
        M-->>P: Redirect 302: / (strona główna)
        deactivate M
    end
```

## Legenda

### Aktorzy:
- **Przeglądarka**: Klient (React components, formularze, cookie storage)
- **Middleware**: Astro middleware (src/middleware/index.ts) - interceptuje wszystkie żądania
- **Astro API**: API routes (src/pages/api/auth/*) - endpoint handlers
- **Supabase Auth**: Serwis autentykacji (zarządzanie użytkownikami, tokeny JWT)
- **Baza Danych**: PostgreSQL (auth.users, profiles, refresh_tokens)

### Typy strzałek:
- `->` lub `->>`: Żądanie synchroniczne
- `-->` lub `-->>`: Odpowiedź lub komunikat zwrotny

### Kluczowe mechanizmy bezpieczeństwa:

1. **Cookie sesyjne**:
   - httpOnly: true (niedostępne dla JavaScript)
   - secure: true (tylko HTTPS)
   - sameSite: 'lax' (ochrona CSRF)

2. **Tokeny JWT**:
   - Access token: krótki TTL (1h), używany do autoryzacji
   - Refresh token: długi TTL (30 dni), używany do odświeżania sesji
   - Signature verification na każde żądanie

3. **Automatyczne odświeżanie sesji**:
   - @supabase/ssr automatycznie odświeża wygasłe tokeny
   - Transparentne dla użytkownika
   - Bezpieczne przechowywanie w httpOnly cookies

4. **Walidacja wielopoziomowa**:
   - Klient: Zod schemas (formularze React)
   - API: Ponowna walidacja Zod (defense in depth)
   - Supabase: Walidacja JWT, weryfikacja hasła (bcrypt)

5. **Row Level Security (RLS)**:
   - Middleware używa service role key dla API non-auth
   - Użytkownicy mogą widzieć tylko swoje dane
   - Polityki bezpieczeństwa na poziomie bazy danych

## Przepływy kluczowe

### 1. Happy Path - Logowanie:
- Walidacja → signInWithPassword → Tokeny w cookie → Przekierowanie → Dostęp

### 2. Token Expiration - Automatyczne odświeżanie:
- Access token wygasł → getUser() wykrywa → Refresh z refresh token → Nowe tokeny → Kontynuacja

### 3. Session Expired - Wymuszenie logowania:
- Refresh token wygasł → getUser() error → Redirect do login → Nowe logowanie

### 4. Protected Route - Ochrona dostępu:
- Żądanie → Middleware → getUser() → Weryfikacja → Allow/Deny

## Uwagi implementacyjne

1. **createSupabaseServerInstance** używa @supabase/ssr dla poprawnej obsługi SSR
2. **Middleware** sprawdza sesję na każde żądanie (oprócz publicznych ścieżek)
3. **Service role key** używany tylko dla API non-auth (bypass RLS)
4. **Email verification** wymagane przed pierwszym logowaniem
5. **Password reset token** ma TTL 1h (bezpieczeństwo)
6. **Wszystkie hasła** hashowane bcrypt przez Supabase
7. **Error messages** nie ujawniają czy email istnieje (security best practice)
