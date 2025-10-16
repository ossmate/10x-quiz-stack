# Authentication Architecture Specification

## Table of Contents
1. [Overview](#overview)
2. [User Interface Architecture](#user-interface-architecture)
3. [Backend Logic](#backend-logic)
4. [Database Schema](#database-schema)
5. [Security Considerations](#security-considerations)
6. [Implementation Phases](#implementation-phases)

---

## Overview

This document defines the complete architecture for user authentication, including registration, login, and password recovery functionality for QuizStack. The implementation leverages Supabase Auth for secure authentication flows while maintaining compatibility with the existing application structure.

**Key Technologies:**
- **Frontend**: Astro 5 (pages), React 19 (interactive forms), TypeScript 5
- **Backend**: Astro API Routes, Supabase Auth
- **Styling**: Tailwind 4 with semantic color tokens, Shadcn/ui components
- **Validation**: Zod schemas

**PRD Compliance Notes:**
- ✅ All User Stories (US-001 through US-008) are fully supported by this architecture
- ⚠️ **Extension**: Registration form includes a "username" field (3-20 chars, alphanumeric + underscore) in addition to PRD requirements (email, password, password confirmation). This enables better user identification and aligns with the existing `profiles` table schema.
- ✅ Login/logout buttons positioned in **upper right corner** on all pages as specified in US-001

---

## User Interface Architecture

### 1. Page Structure

#### 1.1 New Astro Pages

**`/src/pages/auth/login.astro`**
- **Purpose**: User login page
- **Access**: Public (unauthenticated users only)
- **Redirect Logic**:
  - If authenticated → redirect to `/` (home)
  - After successful login → redirect to `?redirect` param or `/`
- **Layout**: Uses `Layout.astro` (minimal layout without auth header)
- **Components**:
  - `<LoginForm client:load />` (React component)

**`/src/pages/auth/register.astro`**
- **Purpose**: User registration page
- **Access**: Public (unauthenticated users only)
- **Redirect Logic**:
  - If authenticated → redirect to `/`
  - After successful registration → redirect to `/auth/verify-email`
- **Layout**: Uses `Layout.astro`
- **Components**:
  - `<RegistrationForm client:load />` (React component)

**`/src/pages/auth/forgot-password.astro`**
- **Purpose**: Password recovery request page
- **Access**: Public
- **Redirect Logic**:
  - If authenticated → redirect to `/auth/change-password`
- **Layout**: Uses `Layout.astro`
- **Components**:
  - `<ForgotPasswordForm client:load />` (React component)

**`/src/pages/auth/reset-password.astro`**
- **Purpose**: Password reset page (accessed via email link with token)
- **Access**: Public (requires valid token in URL)
- **Query Params**: `?token=xxx&type=recovery`
- **Layout**: Uses `Layout.astro`
- **Components**:
  - `<ResetPasswordForm client:load token={token} />` (React component)

**`/src/pages/auth/verify-email.astro`**
- **Purpose**: Email verification confirmation page
- **Access**: Public
- **Layout**: Uses `Layout.astro`
- **Content**: Static message with instructions to check email

**`/src/pages/auth/change-password.astro`**
- **Purpose**: Change password for logged-in users
- **Access**: Protected (requires authentication)
- **Layout**: Uses `ManagementLayout.astro`
- **Components**:
  - `<ChangePasswordForm client:load />` (React component)

**`/src/pages/auth/logout.astro`**
- **Purpose**: Logout endpoint
- **Access**: Protected
- **Logic**: Server-side logout, then redirect to `/`

### 1.2 Layout Updates

**IMPORTANT (PRD Requirement)**: Login/logout buttons must be visible in the **upper right corner** on ALL pages, not just management pages. This includes:
- Public pages (home, public quizzes)
- Auth pages (login, register) - show only if needed
- Management pages (dashboard, quiz creation)

**`/src/layouts/Layout.astro`** (Main layout for public pages and auth pages)
- **Current State**: Minimal layout without auth UI
- **Updates Required (CRITICAL for US-001)**:
  - Add auth UI in **upper right corner** of page header
  - **If NOT authenticated**:
    - Show "Login" button (links to `/auth/login`)
    - Show "Register" button (links to `/auth/register`)
  - **If authenticated**:
    - Show user menu dropdown (avatar + email)
    - Dropdown menu contains:
      - "My Quizzes" link (to `/`)
      - "Change Password" link (to `/auth/change-password`)
      - "Logout" button
  - Create shared component: `<AuthButtons client:load />` for auth state handling

**`/src/layouts/ManagementLayout.astro`** (Layout for authenticated pages)
- **Current State**: Has placeholder for auth button
- **Updates Required**:
  - Add same `<HeaderNavigation />` component in **upper right corner**
  - User avatar/email display with dropdown menu:
    - "My Quizzes" link
    - "Change Password" link
    - "Logout" button
  - Conditionally render based on auth state
  - If not authenticated, middleware redirects to login (no UI needed)

**New Shared Component**: `/src/components/auth/AuthButtons.tsx`
```tsx
// Reusable auth buttons for both layouts
// Checks auth state and displays:
// - Login/Register buttons (unauthenticated)
// - User menu dropdown (authenticated)
// Position: Always in upper right corner

interface AuthButtonsProps {
  currentPath?: string; // For redirect after login
}
```

### 1.3 Home Page Updates

**`/src/pages/index.astro`**
- **Current State**: Public page showing public quizzes
- **Updates Required**:
  - Uses `Layout.astro` which now includes `<AuthButtons />` in upper right corner
  - Auth buttons handled by layout (no page-specific changes needed)
  - **Optional enhancement**: Add "Get Started" CTA in hero section linking to registration

### 2. React Component Architecture

#### 2.1 Form Components (Interactive - React)

All form components follow these principles:
- **Client-side validation**: Using Zod schemas before API calls
- **Error handling**: Display field-level and form-level errors
- **Loading states**: Disable form during submission
- **Accessibility**: Proper labels, ARIA attributes, keyboard navigation
- **Styling**: Semantic color tokens (never hardcoded colors)

**`/src/components/auth/LoginForm.tsx`**
```tsx
interface LoginFormProps {
  redirectTo?: string; // Optional redirect after login
}

// Form Fields:
- Email (type="email", required)
- Password (type="password", required)
- "Remember me" checkbox (optional for future implementation)
- Submit button
- Links: "Forgot password?" and "Don't have an account? Register"

// Client-side Validation:
- Email: Valid email format
- Password: Minimum 8 characters

// API Endpoint: POST /api/auth/login
// Success: Set session, redirect to redirectTo or "/"
// Error States:
  - Invalid credentials → "Invalid email or password"
  - Email not verified → "Please verify your email address"
  - Rate limited → "Too many attempts. Please try again later"
  - Network error → "Connection error. Please try again"
```

**`/src/components/auth/RegistrationForm.tsx`**
```tsx
// Form Fields:
- Email (type="email", required)
- Password (type="password", required)
- Confirm Password (type="password", required)
- Username (type="text", required, 3-20 chars, alphanumeric + underscore)
- Submit button
- Link: "Already have an account? Login"

// Client-side Validation:
- Email: Valid email format, not already registered (checked on blur)
- Password:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - Optional: 1 special character
- Confirm Password: Must match password
- Username:
  - 3-20 characters
  - Alphanumeric + underscore only
  - Not already taken (checked on blur)

// Visual Feedback:
- Password strength indicator (weak/medium/strong)
- Real-time validation on field blur
- Checkmarks for valid fields

// API Endpoint: POST /api/auth/register
// Success: Redirect to /auth/verify-email
// Error States:
  - Email already exists → "Email already registered"
  - Username already taken → "Username already taken"
  - Weak password → "Password does not meet requirements"
  - Network error → "Registration failed. Please try again"
```

**`/src/components/auth/ForgotPasswordForm.tsx`**
```tsx
// Form Fields:
- Email (type="email", required)
- Submit button
- Link: "Remember your password? Login"

// Client-side Validation:
- Email: Valid email format

// API Endpoint: POST /api/auth/forgot-password
// Success: Always show success message (for security)
// Message: "If an account exists with this email, you will receive a password reset link"

// Error States:
  - Invalid email format → "Please enter a valid email"
  - Rate limited → "Please wait before requesting another reset"
  - Network error → "Request failed. Please try again"
```

**`/src/components/auth/ResetPasswordForm.tsx`**
```tsx
interface ResetPasswordFormProps {
  token: string; // From URL query param
}

// Form Fields:
- New Password (type="password", required)
- Confirm New Password (type="password", required)
- Submit button

// Client-side Validation:
- Same password requirements as registration
- Passwords must match
- Token must be valid (checked on mount)

// API Endpoint: POST /api/auth/reset-password
// Success: Redirect to /auth/login with success message
// Error States:
  - Invalid/expired token → "Reset link is invalid or expired"
  - Weak password → "Password does not meet requirements"
  - Network error → "Reset failed. Please try again"
```

**`/src/components/auth/ChangePasswordForm.tsx`**
```tsx
// Form Fields:
- Current Password (type="password", required)
- New Password (type="password", required)
- Confirm New Password (type="password", required)
- Submit button

// Client-side Validation:
- Current password: Required
- New password: Same requirements as registration
- New password must be different from current
- Passwords must match

// API Endpoint: POST /api/auth/change-password
// Success: Show success message, optionally log out user
// Error States:
  - Incorrect current password → "Current password is incorrect"
  - New password same as old → "New password must be different"
  - Network error → "Change failed. Please try again"
```

#### 2.2 UI Components from Shadcn/ui (Required)

**Components to Install:**
```bash
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add alert
npx shadcn@latest add dropdown-menu
npx shadcn@latest add avatar
npx shadcn@latest add separator
```

**Component Usage:**
- **Form**: Wrapper with proper validation and error handling
- **Input**: Text fields with proper styling and states
- **Label**: Accessible labels for form fields
- **Alert**: Error and success message display
- **Dropdown Menu**: User menu in header
- **Avatar**: User profile display
- **Separator**: Visual separation in dropdowns

#### 2.3 Shared Components

**`/src/components/auth/AuthButtons.tsx`** (CRITICAL for US-001)
```tsx
// Reusable auth buttons for Layout.astro and ManagementLayout.astro
// Position: Upper right corner of all pages
// Functionality:
- Fetches current auth state from /api/auth/session
- Conditionally renders based on authentication status
- Unauthenticated: Shows "Login" and "Register" buttons
- Authenticated: Shows user menu dropdown (avatar, email, logout)

interface AuthButtonsProps {
  currentPath?: string; // For redirect after login
}

// User menu dropdown items:
- User email/avatar display
- "My Quizzes" link (/)
- "Change Password" link (/auth/change-password)
- Separator
- "Logout" button
```

**`/src/components/auth/AuthContainer.tsx`**
```tsx
// Wrapper component for all auth forms
// Provides:
- Consistent card layout
- Logo/branding
- Form container with proper spacing
- Error alert area
- Loading overlay

interface AuthContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  showLogo?: boolean;
}
```

**`/src/components/auth/PasswordStrengthIndicator.tsx`**
```tsx
// Visual indicator for password strength
// Shows: Weak (red), Medium (yellow), Strong (green)
// Criteria:
- Length (8+ chars)
- Uppercase letter
- Lowercase letter
- Number
- Special character (optional)

interface PasswordStrengthIndicatorProps {
  password: string;
}
```

**`/src/components/auth/FormFieldError.tsx`**
```tsx
// Reusable error message display for form fields
// Styling: text-destructive, small size

interface FormFieldErrorProps {
  error?: string;
}
```

### 3. Validation Schemas

**`/src/lib/validation/auth.schema.ts`** (New file)
```typescript
import { z } from "zod";

// Email validation
export const emailSchema = z
  .string()
  .email("Please enter a valid email address")
  .min(1, "Email is required");

// Password validation
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

// Username validation
export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores");

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer&lt;typeof loginSchema&gt;;

// Registration schema
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    username: usernameSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer&lt;typeof registerSchema&gt;;

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer&lt;typeof forgotPasswordSchema&gt;;

// Reset password schema
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer&lt;typeof resetPasswordSchema&gt;;

// Change password schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer&lt;typeof changePasswordSchema&gt;;
```

### 4. User Scenarios

#### 4.1 New User Registration Flow
1. User visits `/auth/register`
2. Fills out registration form
3. Client validates input (real-time on blur)
4. Submits form → POST `/api/auth/register`
5. Backend creates user in Supabase Auth
6. Backend creates profile in `profiles` table
7. Supabase sends verification email
8. User redirected to `/auth/verify-email` with instructions
9. User clicks link in email
10. User redirected to `/auth/login` with success message
11. User logs in normally

#### 4.2 Existing User Login Flow
1. User visits `/auth/login` (or redirected from protected page with `?redirect` param)
2. Fills out login form
3. Client validates input
4. Submits form → POST `/api/auth/login`
5. Backend validates credentials with Supabase Auth
6. Backend sets session cookie
7. User redirected to original page or home
8. Middleware validates session on subsequent requests

#### 4.3 Password Recovery Flow
1. User visits `/auth/forgot-password`
2. Enters email address
3. Submits form → POST `/api/auth/forgot-password`
4. Backend sends recovery email via Supabase
5. User sees confirmation message (always shown for security)
6. User clicks reset link in email → `/auth/reset-password?token=xxx&type=recovery`
7. Token validated on page load
8. User enters new password
9. Submits form → POST `/api/auth/reset-password`
10. Password updated in Supabase
11. User redirected to `/auth/login` with success message

#### 4.4 Change Password (Authenticated User)
1. Logged-in user visits `/auth/change-password`
2. Enters current password and new password
3. Submits form → POST `/api/auth/change-password`
4. Backend validates current password
5. Backend updates password in Supabase
6. Session optionally terminated (user must log in again)
7. Success message displayed

#### 4.5 Logout Flow
1. User clicks "Logout" in user menu
2. Redirected to `/auth/logout` (Astro page)
3. Server calls Supabase sign out
4. Session cookie cleared
5. User redirected to `/`

#### 4.6 Protected Route Access (Unauthenticated)
1. Unauthenticated user tries to access `/quizzes/new`
2. Middleware detects no valid session
3. User redirected to `/auth/login?redirect=/quizzes/new`
4. After successful login, user redirected to original page

### 5. Error Handling

#### 5.1 Field-Level Errors
- Displayed below each form field
- Styling: `text-destructive text-sm`
- Shown on blur or submit attempt
- Cleared when field is corrected

#### 5.2 Form-Level Errors
- Displayed at top of form in Alert component
- Types:
  - **Validation errors**: "Please correct the errors below"
  - **Authentication errors**: "Invalid credentials"
  - **Network errors**: "Connection failed. Please try again"
  - **Rate limiting**: "Too many attempts. Please wait"
- Styling: `bg-destructive/10 border-destructive text-destructive`

#### 5.3 Success Messages
- Displayed at top of form or as toast notification
- Types:
  - Registration: "Account created! Please check your email"
  - Password reset: "Password reset email sent"
  - Password changed: "Password updated successfully"
- Styling: Success variant (green tones using semantic tokens)

---

## Backend Logic

### 1. API Endpoints Structure

**Location**: `/src/pages/api/auth/`

#### 1.1 `POST /api/auth/register`

**File**: `/src/pages/api/auth/register.ts`

**Request Body**:
```typescript
{
  email: string;
  password: string;
  username: string;
}
```

**Validation**:
- Use `registerSchema` from `/src/lib/validation/auth.schema.ts`
- Check if email already exists
- Check if username already taken

**Process**:
1. Validate input with Zod
2. Check username uniqueness against `profiles` table
3. Call Supabase `auth.signUp()` with email and password
4. Create profile record in `profiles` table with `id` (from auth.users.id) and `username`
5. Supabase automatically sends verification email

**Response**:
```typescript
// Success (201 Created)
{
  message: "Registration successful. Please check your email to verify your account",
  userId: string;
}

// Error (400 Bad Request)
{
  error: "Validation Error",
  message: "Invalid input",
  details: { field: "error message" }
}

// Error (409 Conflict)
{
  error: "Conflict",
  message: "Email or username already exists"
}
```

**Implementation Notes**:
- Use service role key to create profile (bypasses RLS)
- Handle race conditions (concurrent registrations)
- Log errors for monitoring

---

#### 1.2 `POST /api/auth/login`

**File**: `/src/pages/api/auth/login.ts`

**Request Body**:
```typescript
{
  email: string;
  password: string;
}
```

**Validation**:
- Use `loginSchema` from validation

**Process**:
1. Validate input
2. Call Supabase `auth.signInWithPassword()`
3. Set session cookie (handled by Supabase client)
4. Return user data

**Response**:
```typescript
// Success (200 OK)
{
  user: {
    id: string;
    email: string;
    username: string;
  },
  session: {
    access_token: string;
    refresh_token: string;
  }
}

// Error (401 Unauthorized)
{
  error: "Authentication Failed",
  message: "Invalid email or password"
}

// Error (403 Forbidden)
{
  error: "Email Not Verified",
  message: "Please verify your email address before logging in"
}
```

**Implementation Notes**:
- Do not reveal whether email exists (security)
- Rate limit to prevent brute force attacks
- Log failed attempts

---

#### 1.3 `POST /api/auth/logout`

**File**: `/src/pages/api/auth/logout.ts`

**Request**: No body required

**Process**:
1. Get current session from `locals.supabase`
2. Call Supabase `auth.signOut()`
3. Clear session cookie

**Response**:
```typescript
// Success (200 OK)
{
  message: "Logged out successfully"
}
```

**Implementation Notes**:
- Also implement as Astro page `/src/pages/auth/logout.astro` for direct navigation
- Handle cases where user is already logged out

---

#### 1.4 `POST /api/auth/forgot-password`

**File**: `/src/pages/api/auth/forgot-password.ts`

**Request Body**:
```typescript
{
  email: string;
}
```

**Validation**:
- Use `forgotPasswordSchema`

**Process**:
1. Validate email format
2. Call Supabase `auth.resetPasswordForEmail()`
3. Supabase sends password reset email with token
4. Always return success (don't reveal if email exists)

**Response**:
```typescript
// Always Success (200 OK) - for security
{
  message: "If an account exists with this email, you will receive a password reset link"
}
```

**Implementation Notes**:
- Configure redirect URL in Supabase dashboard: `{site_url}/auth/reset-password`
- Rate limit to prevent abuse
- Don't reveal whether email exists in system

---

#### 1.5 `POST /api/auth/reset-password`

**File**: `/src/pages/api/auth/reset-password.ts`

**Request Body**:
```typescript
{
  token: string;
  password: string;
}
```

**Validation**:
- Use `resetPasswordSchema`
- Validate token is present and valid format

**Process**:
1. Validate input
2. Call Supabase `auth.updateUser()` with new password
3. Token validation handled by Supabase
4. Optionally invalidate all sessions

**Response**:
```typescript
// Success (200 OK)
{
  message: "Password reset successfully"
}

// Error (400 Bad Request)
{
  error: "Invalid Token",
  message: "Reset link is invalid or expired"
}
```

**Implementation Notes**:
- Token comes from URL query params, passed by React component
- Tokens expire after 1 hour (Supabase default)
- Consider forcing re-login after password reset

---

#### 1.6 `POST /api/auth/change-password`

**File**: `/src/pages/api/auth/change-password.ts`

**Request Body**:
```typescript
{
  currentPassword: string;
  newPassword: string;
}
```

**Validation**:
- Use `changePasswordSchema`
- Requires valid session

**Process**:
1. Validate session (user must be logged in)
2. Verify current password by attempting sign-in
3. Update password with Supabase `auth.updateUser()`
4. Optionally force logout and re-login

**Response**:
```typescript
// Success (200 OK)
{
  message: "Password changed successfully"
}

// Error (401 Unauthorized)
{
  error: "Authentication Failed",
  message: "Current password is incorrect"
}

// Error (400 Bad Request)
{
  error: "Validation Error",
  message: "New password must be different from current password"
}
```

**Implementation Notes**:
- Requires authentication (protected route)
- Consider requiring re-authentication for sensitive changes
- Invalidate refresh tokens after change

---

#### 1.7 `GET /api/auth/session`

**File**: `/src/pages/api/auth/session.ts` (Already exists)

**Updates Required**:
- Remove test/mock logic
- Implement real Supabase session check
- Return user profile data (including username)

**Response**:
```typescript
// Success (200 OK)
{
  user: {
    id: string;
    email: string;
    username: string;
    created_at: string;
  }
}

// Error (401 Unauthorized)
{
  error: "Unauthorized",
  message: "No active session"
}
```

---

#### 1.8 `POST /api/auth/check-username`

**File**: `/src/pages/api/auth/check-username.ts`

**Purpose**: Check if username is available (for registration form)

**Request Body**:
```typescript
{
  username: string;
}
```

**Process**:
1. Validate username format
2. Query `profiles` table for existing username
3. Return availability status

**Response**:
```typescript
// Success (200 OK)
{
  available: boolean;
}
```

**Implementation Notes**:
- Rate limit to prevent enumeration attacks
- Case-insensitive check
- Consider username reservation/blacklist

---

#### 1.9 `POST /api/auth/check-email`

**File**: `/src/pages/api/auth/check-email.ts`

**Purpose**: Check if email is already registered (for registration form)

**Request Body**:
```typescript
{
  email: string;
}
```

**Process**:
1. Validate email format
2. Check with Supabase if email exists
3. Return availability status (consider privacy implications)

**Response**:
```typescript
// Success (200 OK)
{
  available: boolean;
}
```

**Implementation Notes**:
- Rate limit heavily (security concern)
- Consider not implementing (privacy trade-off)
- Alternative: Only check on submit, not on blur

---

### 2. Middleware Updates

**File**: `/src/middleware/index.ts`

**Current State**:
- Commented authentication check
- Service role client for API routes

**Required Updates**:

```typescript
import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";
import { supabaseClient } from "../db/supabase.client.ts";
import type { Database } from "../db/database.types.ts";

/**
 * Routes that require authentication
 */
const PROTECTED_ROUTES = [
  "/quizzes/new",
  "/quizzes/ai/generate",
  "/quizzes/*/edit", // Pattern for edit pages
  "/auth/change-password",
];

/**
 * Routes that should redirect to home if already authenticated
 */
const AUTH_ROUTES = [
  "/auth/login",
  "/auth/register",
];

export const onRequest = defineMiddleware(async (context, next) => {
  // For API routes, use service role key to bypass RLS
  if (context.url.pathname.startsWith("/api/")) {
    const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (serviceRoleKey) {
      context.locals.supabase = createClient&lt;Database&gt;(
        import.meta.env.SUPABASE_URL,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );
    } else {
      context.locals.supabase = supabaseClient;
    }

    return next();
  }

  // For page routes, use regular client
  context.locals.supabase = supabaseClient;

  // Get current session
  const {
    data: { session },
  } = await context.locals.supabase.auth.getSession();

  // Check if route requires authentication
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => {
    if (route.includes("*")) {
      const pattern = new RegExp(`^${route.replace("*", ".*")}$`);
      return pattern.test(context.url.pathname);
    }
    return context.url.pathname.startsWith(route);
  });

  // Check if route is auth page
  const isAuthRoute = AUTH_ROUTES.some((route) =>
    context.url.pathname.startsWith(route)
  );

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !session) {
    const redirectUrl = `/auth/login?redirect=${encodeURIComponent(context.url.pathname)}`;
    return Response.redirect(new URL(redirectUrl, context.url.origin));
  }

  // Redirect authenticated users from auth pages
  if (isAuthRoute && session) {
    return Response.redirect(new URL("/", context.url.origin));
  }

  // Store user in context for easy access
  if (session) {
    context.locals.user = {
      id: session.user.id,
      email: session.user.email!,
    };
  }

  return next();
});
```

**Type Definitions Update** (`/src/env.d.ts`):
```typescript
/// <reference types="astro/client" />

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient&lt;Database&gt;;
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

---

### 3. Service Layer

**File**: `/src/lib/services/auth.service.ts` (New file)

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types.ts";
import type {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput
} from "../validation/auth.schema.ts";

type SupabaseClientType = SupabaseClient&lt;Database&gt;;

export class AuthService {
  /**
   * Register a new user
   */
  async register(
    supabase: SupabaseClientType,
    input: RegisterInput
  ): Promise&lt;{ userId: string }&gt; {
    // Check username availability
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", input.username)
      .single();

    if (existingProfile) {
      throw new Error("Username already taken");
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error("Registration failed");
    }

    // Create profile (using service role key to bypass RLS)
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      username: input.username,
    });

    if (profileError) {
      // TODO: Consider cleanup - delete auth user if profile creation fails
      throw profileError;
    }

    return { userId: authData.user.id };
  }

  /**
   * Login user
   */
  async login(
    supabase: SupabaseClientType,
    input: LoginInput
  ): Promise&lt;{
    userId: string;
    email: string;
    username: string;
  }&gt; {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error("Login failed");
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Profile not found");
    }

    return {
      userId: data.user.id,
      email: data.user.email!,
      username: profile.username,
    };
  }

  /**
   * Logout user
   */
  async logout(supabase: SupabaseClientType): Promise&lt;void&gt; {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async forgotPassword(
    supabase: SupabaseClientType,
    input: ForgotPasswordInput
  ): Promise&lt;void&gt; {
    // Always return success for security (don't reveal if email exists)
    const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
      redirectTo: `${import.meta.env.PUBLIC_SITE_URL}/auth/reset-password`,
    });

    // Don't throw error - always appear successful
    if (error) {
      console.error("Password reset error:", error);
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(
    supabase: SupabaseClientType,
    input: ResetPasswordInput
  ): Promise&lt;void&gt; {
    // Verify the token is valid by updating password
    const { error } = await supabase.auth.updateUser({
      password: input.password,
    });

    if (error) {
      throw error;
    }
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(
    supabase: SupabaseClientType,
    userId: string,
    input: ChangePasswordInput
  ): Promise&lt;void&gt; {
    // First verify current password by getting user
    const { data: user } = await supabase.auth.getUser();

    if (!user || user.user.id !== userId) {
      throw new Error("Unauthorized");
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: input.newPassword,
    });

    if (error) {
      throw error;
    }
  }

  /**
   * Check if username is available
   */
  async checkUsernameAvailability(
    supabase: SupabaseClientType,
    username: string
  ): Promise&lt;boolean&gt; {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", username)
      .single();

    return !data;
  }

  /**
   * Get current user session
   */
  async getCurrentUser(
    supabase: SupabaseClientType
  ): Promise&lt;{
    id: string;
    email: string;
    username: string;
  } | null&gt; {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return null;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", session.user.id)
      .single();

    if (!profile) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email!,
      username: profile.username,
    };
  }
}

export const authService = new AuthService();
```

---

### 4. Environment Variables

**File**: `.env` (Update required)

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Site Configuration
PUBLIC_SITE_URL=http://localhost:4321

# Email Configuration (Supabase Dashboard)
# Configure in Supabase Dashboard → Authentication → Email Templates
# - Confirmation email
# - Password reset email
# - Magic link email (optional)
```

---

## Database Schema

### 1. Existing Tables

**`profiles` table** (Already exists)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Notes**:
- `id` references `auth.users(id)` (Supabase Auth table)
- Username stored here, not in auth.users
- Consider adding fields in future:
  - `display_name TEXT`
  - `avatar_url TEXT`
  - `bio TEXT`

### 2. Row Level Security (RLS) Policies

**Profiles Table Policies**:

```sql
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id);

-- Service role can insert profiles (for registration)
CREATE POLICY "Service role can insert profiles"
ON profiles
FOR INSERT
WITH CHECK (true); -- Only service role can bypass this
```

**Quizzes Table Policies** (Update required):
```sql
-- Existing policies...

-- Users can only edit/delete their own quizzes
CREATE POLICY "Users can update own quizzes"
ON quizzes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quizzes"
ON quizzes
FOR DELETE
USING (auth.uid() = user_id);
```

### 3. Database Functions

**Function: Update `updated_at` timestamp**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles table
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

## Security Considerations

### 1. Password Security

**Requirements**:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- Optional: 1 special character

**Hashing**:
- Handled by Supabase Auth (bcrypt)
- Never store plain text passwords
- Never log passwords

### 2. Session Management

**Implementation**:
- JWT tokens managed by Supabase
- Access token (short-lived, 1 hour)
- Refresh token (long-lived, 30 days)
- Stored in HTTP-only cookies

**Best Practices**:
- Validate session on each request (middleware)
- Refresh tokens automatically (Supabase handles)
- Clear tokens on logout
- Invalidate on password change

### 3. Rate Limiting

**Endpoints to Rate Limit**:
- `/api/auth/login` - 5 attempts per 15 minutes per IP
- `/api/auth/register` - 3 attempts per hour per IP
- `/api/auth/forgot-password` - 3 attempts per hour per email
- `/api/auth/check-username` - 10 attempts per minute per IP
- `/api/auth/check-email` - 10 attempts per minute per IP

**Implementation Options**:
- Cloudflare rate limiting (if using Cloudflare)
- Supabase Edge Functions with rate limiting
- Custom middleware with Redis (future enhancement)

### 4. Email Verification

**Flow**:
1. User registers
2. Supabase sends verification email automatically
3. User clicks link with token
4. Supabase marks email as verified
5. User can now log in

**Configuration** (Supabase Dashboard):
- Enable "Confirm email" in Auth settings
- Customize email template
- Set redirect URL after verification

### 5. XSS Protection

**Measures**:
- Never render user input as HTML
- Sanitize all user input
- Use React's built-in escaping
- Set proper Content-Security-Policy headers

### 6. CSRF Protection

**Measures**:
- Supabase handles CSRF for auth endpoints
- Use SameSite cookies
- Validate origin header
- Use CSRF tokens for sensitive operations (future enhancement)

### 7. SQL Injection Protection

**Measures**:
- Supabase uses parameterized queries
- Never concatenate SQL strings
- Use query builder methods
- Enable RLS policies

---

## Implementation Phases

### Phase 1: Core Authentication (Priority: High)

**Goals**: Basic login and registration working

**Tasks**:
1. Install required Shadcn/ui components (form, input, label, alert, dropdown-menu, avatar, separator)
2. Create validation schemas (`/src/lib/validation/auth.schema.ts`)
3. Create auth service (`/src/lib/services/auth.service.ts`)
4. **Create `<AuthButtons />` component** (CRITICAL for US-001):
   - Create `/src/components/auth/AuthButtons.tsx`
   - Fetches auth state from `/api/auth/session`
   - Shows Login/Register buttons (unauthenticated)
   - Shows user menu dropdown (authenticated)
   - Used in BOTH layouts
5. Implement registration:
   - Create `/src/pages/auth/register.astro`
   - Create `<RegistrationForm />` component
   - Create `/api/auth/register` endpoint
   - Create `/api/auth/check-username` endpoint
6. Implement login:
   - Create `/src/pages/auth/login.astro`
   - Create `<LoginForm />` component
   - Create `/api/auth/login` endpoint
7. Implement logout:
   - Create `/src/pages/auth/logout.astro`
   - Create `/api/auth/logout` endpoint
8. Update middleware:
   - Enable authentication checks
   - Add protected routes
   - Add redirect logic
9. Update `GET /api/auth/session` to use real Supabase session
10. **Update BOTH layouts with auth UI** (US-001 requirement):
    - Add `<AuthButtons client:load />` to **Layout.astro** header (upper right)
    - Add `<AuthButtons client:load />` to **ManagementLayout.astro** header (upper right)
    - Ensure consistent positioning across all pages

**Testing**:
- Register new user
- Verify email requirement
- Login with valid credentials
- Access protected routes
- Logout functionality

**Estimated Time**: 2-3 days

---

### Phase 2: Password Recovery (Priority: Medium)

**Goals**: Users can reset forgotten passwords

**Tasks**:
1. Configure Supabase email templates
2. Implement forgot password:
   - Create `/src/pages/auth/forgot-password.astro`
   - Create `<ForgotPasswordForm />` component
   - Create `/api/auth/forgot-password` endpoint
3. Implement reset password:
   - Create `/src/pages/auth/reset-password.astro`
   - Create `<ResetPasswordForm />` component
   - Create `/api/auth/reset-password` endpoint
4. Add "Forgot password?" link to login page
5. Create `/src/pages/auth/verify-email.astro` confirmation page

**Testing**:
- Request password reset
- Receive email with reset link
- Reset password successfully
- Login with new password

**Estimated Time**: 1-2 days

---

### Phase 3: Password Management (Priority: Medium)

**Goals**: Authenticated users can change their password

**Tasks**:
1. Implement change password:
   - Create `/src/pages/auth/change-password.astro`
   - Create `<ChangePasswordForm />` component
   - Create `/api/auth/change-password` endpoint
2. Add "Change Password" link to user menu
3. Add password strength indicator component

**Testing**:
- Change password while logged in
- Verify current password validation
- Ensure new password requirements

**Estimated Time**: 1 day

---

### Phase 4: UI Polish (Priority: Low)

**Goals**: Enhanced user experience

**Tasks**:
1. Create `<AuthContainer />` wrapper component
2. Create `<PasswordStrengthIndicator />` component
3. Create `<FormFieldError />` component
4. Add loading states to all forms
5. Add success/error toast notifications
6. Improve form accessibility
7. Add "Remember me" checkbox (optional)
8. Add avatar dropdown to user menu
9. Add dark mode support for auth pages
10. Add animations/transitions

**Testing**:
- Test accessibility (keyboard navigation, screen readers)
- Test on mobile devices
- Test in different browsers

**Estimated Time**: 2-3 days

---

### Phase 5: Advanced Features (Priority: Low - Future)

**Goals**: Enhanced security and user experience

**Tasks**:
1. Implement rate limiting with Redis
2. Add OAuth providers (Google, GitHub)
3. Add two-factor authentication (2FA)
4. Add magic link login
5. Add user profile page
6. Add email change functionality
7. Add account deletion
8. Add session management (view active sessions)
9. Add login history/audit log
10. Add "Remember this device" feature

**Estimated Time**: 5-7 days (as needed)

---

## Summary

This authentication architecture provides:

✅ **Complete authentication flow**: Registration, login, logout
✅ **Password recovery**: Forgot password and reset functionality
✅ **Password management**: Change password for authenticated users
✅ **Email verification**: Supabase-handled email confirmation
✅ **Protected routes**: Middleware-based authentication checks
✅ **Form validation**: Client-side and server-side validation with Zod
✅ **Error handling**: Comprehensive error messages and states
✅ **Security**: Best practices for passwords, sessions, and API security
✅ **Accessibility**: Proper labels, ARIA attributes, keyboard navigation
✅ **Styling**: Semantic color tokens, dark mode support, responsive design
✅ **Type safety**: Full TypeScript coverage with proper types
✅ **Service layer**: Reusable authentication service
✅ **Compatibility**: Preserves existing quiz functionality

The implementation follows the project's coding standards and integrates seamlessly with the existing Astro + React + Supabase stack.
