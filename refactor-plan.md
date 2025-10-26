# Plan Refaktoryzacji - Analiza TOP 5 Plików

Data analizy: 2025-10-23

## 1. TOP 5 plików o największej liczbie LOC

1. **src/components/quizzes/EditableQuizContent.tsx** - 652 linie
2. **src/components/hooks/useEditableQuiz.ts** - 336 linii
3. **src/components/quizzes/AIQuizGenerator.tsx** - 306 linii
4. **src/components/ui/dropdown-menu.tsx** - 220 linii
5. **src/components/auth/ChangePasswordForm.tsx** - 212 linii

---

## 2. Szczegółowa analiza i sugestie refaktoryzacji

### #1 - EditableQuizContent.tsx (652 linie)
**Lokalizacja:** `src/components/quizzes/EditableQuizContent.tsx`

#### Zidentyfikowane problemy:
- **Monolityczny komponent** - jeden komponent odpowiada za całą logikę edycji quizu
- **Powtórzenia kodu JSX** - podobne wzorce dla pól formularza, validacji i przycisków
- **Mieszanie logiki z prezentacją** - komponenty UI ściśle splecione z logiką biznesową
- **Nadmierna liczba stanów lokalnych** - 3 stany (editableQuiz, isValid, isFooterSticky)
- **Bezpośrednia manipulacja DOM** - IntersectionObserver w komponencie UI

#### Sugerowane kierunki refaktoryzacji:

##### 1. Compound Components Pattern
Rozbij monolityczny komponent na mniejsze, kompozytowalne części:
```typescript
<EditableQuiz quiz={quiz} onSave={onSave}>
  <EditableQuiz.Metadata />
  <EditableQuiz.Questions>
    <EditableQuiz.Question />
  </EditableQuiz.Questions>
  <EditableQuiz.Footer />
</EditableQuiz>
```

**Argumentacja**: Zwiększa reużywalność, separuje odpowiedzialności, ułatwia testowanie poszczególnych części.

##### 2. Atomic Design + Presentational/Container Pattern
- **src/components/quiz-editor/QuizEditorContainer.tsx** - logika (container)
- **src/components/quiz-editor/QuizMetadataFields.tsx** - prezentacja metadanych
- **src/components/quiz-editor/QuestionEditor.tsx** - prezentacja pojedynczego pytania
- **src/components/quiz-editor/OptionEditor.tsx** - prezentacja opcji odpowiedzi
- **src/components/quiz-editor/QuizEditorFooter.tsx** - akcje (sticky footer)

**Argumentacja**: Zgodne z zasadami Atomic Design, ułatwia utrzymanie i testowanie, zwiększa czytelność.

##### 3. Custom Hook Extraction
Wydziel logikę do dedykowanych hooków:
```typescript
// src/components/hooks/useStickyFooter.ts
export function useStickyFooter() {
  const [isSticky, setIsSticky] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);
  // IntersectionObserver logic
  return { isSticky, sentinelRef };
}
```

**Argumentacja**: Separacja logiki UI od logiki biznesowej, reużywalność, łatwiejsze testowanie.

##### 4. Form Field Component Pattern
Stwórz reużywalny komponent pola formularza:
```typescript
<FormField
  label="Quiz Title"
  value={title}
  onChange={handleChange}
  error={errors.title}
  maxLength={200}
  required
/>
```

**Argumentacja**: Eliminuje duplikację kodu JSX (linie 330-346, 350-373), zapewnia spójność validacji i stylowania.

##### 5. Strategia walidacji - Zod + React Hook Form
Wykorzystaj React Hook Form zamiast ręcznej walidacji:
```typescript
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(quizSchema),
});
```

**Argumentacja**: Eliminuje ~100 linii kodu walidacji (linie 88-168), automatyczna walidacja, lepsza wydajność, mniejszy re-render.

**Potencjalna oszczędność LOC:** 300-400 linii (przy pełnym refactoringu)

---

### #2 - useEditableQuiz.ts (336 linii)
**Lokalizacja:** `src/components/hooks/useEditableQuiz.ts`

#### Zidentyfikowane problemy:
- **God Hook** - hook robi za dużo (stan, walidacja, CRUD operacje, przygotowanie danych)
- **Duplikacja logiki walidacji** - podobna walidacja co w EditableQuizContent.tsx
- **Nieoptymalne dependency arrays** - useCallback z całym `editableQuiz` w zależnościach (linia 124)
- **Brak separacji concerns** - mieszanie zarządzania stanem z logiką biznesową

#### Sugerowane kierunki refaktoryzacji:

##### 1. Hook Composition Pattern
Rozdziel na mniejsze, wyspecjalizowane hooki:
```typescript
// src/components/hooks/quiz-editor/useQuizState.ts
export function useQuizState(initialQuiz: QuizDetailDTO) {
  const [quiz, setQuiz] = useState(initialQuiz);
  return { quiz, setQuiz };
}

// src/components/hooks/quiz-editor/useQuizValidation.ts
export function useQuizValidation(quiz: QuizDetailDTO) {
  // validation logic
}

// src/components/hooks/quiz-editor/useQuestionActions.ts
export function useQuestionActions(quizId: string) {
  const addQuestion = useCallback(/* ... */);
  const removeQuestion = useCallback(/* ... */);
  return { addQuestion, removeQuestion };
}

// Główny hook kompozytowy
export function useEditableQuiz(initialQuiz: QuizDetailDTO) {
  const state = useQuizState(initialQuiz);
  const validation = useQuizValidation(state.quiz);
  const actions = useQuestionActions(state.quiz.id);
  return { ...state, ...validation, ...actions };
}
```

**Argumentacja**: Single Responsibility Principle, łatwiejsze testowanie, lepsza reużywalność.

##### 2. State Machine Pattern (XState/Zustand)
Wykorzystaj maszynę stanów do zarządzania złożonym stanem edycji:
```typescript
const quizEditorMachine = createMachine({
  states: {
    idle: {},
    editing: {
      on: {
        VALIDATE: 'validating',
        SAVE: 'saving',
      }
    },
    validating: {
      on: {
        VALID: 'editing',
        INVALID: 'editing',
      }
    },
    saving: {
      on: {
        SUCCESS: 'idle',
        ERROR: 'editing',
      }
    }
  }
});
```

**Argumentacja**: Przewidywalny flow stanu, eliminuje edge cases, wizualizacja stanów, łatwiejsze debugowanie.

##### 3. Reducer Pattern z useReducer
Zamień useState + wiele setterów na useReducer:
```typescript
type QuizAction =
  | { type: 'UPDATE_FIELD'; field: string; value: unknown }
  | { type: 'ADD_QUESTION'; question: QuestionDTO }
  | { type: 'REMOVE_QUESTION'; questionId: string }
  | { type: 'UPDATE_OPTION'; questionId: string; optionId: string; field: string; value: unknown };

const [state, dispatch] = useReducer(quizReducer, initialState);
```

**Argumentacja**: Centralizacja logiki aktualizacji stanu, łatwiejsze śledzenie zmian, lepsza testowanie logiki.

##### 4. Immutability Helper Library (Immer)
Użyj Immer do uproszczenia nested updates:
```typescript
const updateOption = useCallback((questionId: string, optionId: string, field: string, value: unknown) => {
  setEditableQuiz(produce(draft => {
    const question = draft.questions?.find(q => q.id === questionId);
    const option = question?.options?.find(o => o.id === optionId);
    if (option) option[field] = value;
    draft.isDirty = true;
  }));
}, []);
```

**Argumentacja**: Eliminuje skomplikowane mapowanie (linie 151-168), czytelniejszy kod, mniej błędów.

**Potencjalna oszczędność LOC:** 100-150 linii

---

### #3 - AIQuizGenerator.tsx (306 linii)
**Lokalizacja:** `src/components/quizzes/AIQuizGenerator.tsx`

#### Zidentyfikowane problemy:
- **Warunkowe renderowanie w jednym komponencie** - 5 różnych stanów UI (idle, generating, error, preview, editing)
- **Dummy quiz anti-pattern** - tworzenie sztucznego obiektu dla React Rules of Hooks (linie 45-59)
- **setTimeout dla database commit** - hacky workaround (linie 96-99)
- **Silne powiązanie z routing** - `window.location.href` (linia 98)
- **Zduplikowany IntersectionObserver** - ta sama logika co w EditableQuizContent

#### Sugerowane kierunki refaktoryzacji:

##### 1. State-Based Component Mapping Pattern
Stwórz osobne komponenty dla każdego stanu:
```typescript
const STATE_COMPONENTS = {
  idle: GenerationFormView,
  generating: GeneratingView,
  error: ErrorView,
  completed: (isEditing) => isEditing ? EditingView : PreviewView,
} as const;

export function AIQuizGenerator() {
  const { state } = useAIQuizGeneration();
  const Component = STATE_COMPONENTS[state.status];
  return <Component {...state} />;
}
```

**Argumentacja**: Eliminuje złożone warunki (linie 114-303), każdy stan ma własny komponent, łatwiejsze testowanie.

##### 2. Render Props / Children as Function Pattern
```typescript
<AIQuizGenerationFlow>
  {({ state, actions }) => (
    <>
      {state.status === 'idle' && <GenerationForm onSubmit={actions.generate} />}
      {state.status === 'generating' && <LoadingView onCancel={actions.cancel} />}
      {/* ... */}
    </>
  )}
</AIQuizGenerationFlow>
```

**Argumentacja**: Separacja logiki flow od prezentacji, elastyczność, łatwiejsza kompozycja.

##### 3. Custom Hook dla Navigation
```typescript
// src/hooks/useNavigateToQuiz.ts
export function useNavigateToQuiz() {
  const navigate = useNavigate(); // Astro/React Router

  return useCallback(async (quizId: string, options?: { delay?: number }) => {
    await new Promise(resolve => setTimeout(resolve, options?.delay ?? 0));
    navigate(`/quiz/${quizId}`);
  }, [navigate]);
}
```

**Argumentacja**: Eliminuje bezpośrednie użycie window.location, łatwiejsze testowanie, obsługa różnych routerów.

##### 4. Optimistic Updates Pattern
Zamiast setTimeout, użyj optimistic updates z rollback:
```typescript
const { mutate } = useMutation({
  mutationFn: publishQuiz,
  onSuccess: (data) => {
    queryClient.setQueryData(['quiz', data.id], data);
    navigate(`/quiz/${data.id}`);
  },
  onError: () => {
    // Rollback optimistic update
  }
});
```

**Argumentacja**: Eliminuje setTimeout hack, lepsza UX, zgodność z React Query/TanStack Query patterns.

##### 5. Wydziel Shared UI Logic
Stwórz hook useStickyFooter i użyj go w wielu miejscach:
```typescript
// src/components/hooks/ui/useStickyFooter.ts
export function useStickyFooter(enabled: boolean = true) {
  const [isSticky, setIsSticky] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    // IntersectionObserver logic
  }, [enabled]);

  return { isSticky, sentinelRef, StickyFooterSentinel };
}
```

**Argumentacja**: Eliminuje duplikację (linie 18-43), reużywalność, łatwiejsze testowanie.

**Potencjalna oszczędność LOC:** 100-150 linii

---

### #4 - dropdown-menu.tsx (220 linii)
**Lokalizacja:** `src/components/ui/dropdown-menu.tsx`

#### Zidentyfikowane problemy:
- **Wrapper Hell** - 14 komponentów to thin wrappers wokół Radix UI
- **Powtórzenia className patterns** - podobne wzorce stylowania w wielu miejscach
- **Brak abstrakcji dla wspólnej logiki** - każdy wrapper powtarza `data-slot` pattern

#### Sugerowane kierunki refaktoryzacji:

##### 1. Higher-Order Component (HOC) Pattern
```typescript
function withDataSlot<P extends object>(
  Component: React.ComponentType<P>,
  slotName: string
) {
  return ({ ...props }: P) => (
    <Component data-slot={slotName} {...props} />
  );
}

const DropdownMenu = withDataSlot(DropdownMenuPrimitive.Root, 'dropdown-menu');
const DropdownMenuTrigger = withDataSlot(DropdownMenuPrimitive.Trigger, 'dropdown-menu-trigger');
// ...
```

**Argumentacja**: Eliminuje powtórzenia (linie 9-19), DRY principle, centralizacja logiki data-slot.

##### 2. Style Variants with CVA (Class Variance Authority)
```typescript
import { cva } from "class-variance-authority";

const dropdownItemVariants = cva(
  "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5",
  {
    variants: {
      variant: {
        default: "focus:bg-accent focus:text-accent-foreground",
        destructive: "text-destructive focus:bg-destructive/10",
      },
      inset: {
        true: "pl-8",
      }
    }
  }
);
```

**Argumentacja**: Zgodność z Shadcn/ui patterns, type-safe variants, łatwiejsze zarządzanie stylami, eliminuje długie className strings (linie 60-61).

##### 3. Compound Component z Context API
```typescript
const DropdownContext = createContext<{ variant?: string }>(null);

export function DropdownMenu({ variant, ...props }: DropdownMenuProps) {
  return (
    <DropdownContext.Provider value={{ variant }}>
      <DropdownMenuPrimitive.Root {...props} />
    </DropdownContext.Provider>
  );
}

export function DropdownMenuItem({ className, ...props }: DropdownMenuItemProps) {
  const { variant } = useContext(DropdownContext);
  return (
    <DropdownMenuPrimitive.Item
      className={cn(dropdownItemVariants({ variant }), className)}
      {...props}
    />
  );
}
```

**Argumentacja**: Pozwala na propagowanie props przez całą hierarchię, eliminuje prop drilling, lepsze DX.

##### 4. Re-export Only Pattern
Jeśli komponenty są tylko thin wrappers, rozważ bezpośredni re-export:
```typescript
export {
  Root as DropdownMenu,
  Trigger as DropdownMenuTrigger,
  Content as DropdownMenuContent,
  // ...
} from "@radix-ui/react-dropdown-menu";
```

**Argumentacja**: Eliminuje ~150 linii kodu, zmniejsza bundle size, mniej warstw abstrakcji. **UWAGA**: Straci się customizację Shadcn/ui.

**Potencjalna oszczędność LOC:** 50-100 linii (z CVA pattern)

---

### #5 - ChangePasswordForm.tsx (212 linii)
**Lokalizacja:** `src/components/auth/ChangePasswordForm.tsx`

#### Zidentyfikowane problemy:
- **Ręczne zarządzanie stanem formularza** - 6 stanów lokalnych (formData, errors, formError, successMessage, isLoading, showPasswordStrength)
- **Ręczna walidacja** - duplikacja logiki walidacji (linie 41-58)
- **Powtórzenia JSX** - 3 podobne bloki pól input (linie 126-186)
- **Hardcoded TODO** - nieaktywny kod API (linie 72-86)
- **Hardcoded success color** - OKLCH color zamiast semantic token (linia 121)

#### Sugerowane kierunki refaktoryzacji:

##### 1. React Hook Form + Zod Integration
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export function ChangePasswordForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(changePasswordSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: ChangePasswordInput) => {
    await changePasswordMutation.mutateAsync(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormField
        {...register("currentPassword")}
        label="Current Password"
        type="password"
        error={errors.currentPassword?.message}
      />
      {/* ... */}
    </form>
  );
}
```

**Argumentacja**: Eliminuje ~100 linii kodu (stany, handleInputChange, validateForm), automatyczna walidacja, lepsza wydajność (mniej re-renderów), zgodność z React best practices.

##### 2. Custom Form Field Component
```typescript
// src/components/forms/PasswordField.tsx
export function PasswordField({
  label,
  error,
  showStrength = false,
  ...inputProps
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          className={cn(error && "border-destructive")}
          {...inputProps}
        />
        <PasswordToggle onToggle={setShowPassword} />
      </div>
      {error && <FormFieldError error={error} />}
      {showStrength && <PasswordStrengthIndicator password={inputProps.value} />}
    </div>
  );
}
```

**Argumentacja**: Eliminuje duplikację 3 bloków input (linie 126-186), reużywalność, dodatkowa funkcjonalność (show/hide password).

##### 3. React Query Mutation Hook
```typescript
// src/lib/api/mutations/useChangePassword.ts
export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: ChangePasswordInput) => {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Password changed successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Password change failed");
    },
  });
}

// W komponencie:
const changePassword = useChangePassword();
const onSubmit = (data) => changePassword.mutate(data);
```

**Argumentacja**: Eliminuje TODO code (linie 72-86), separacja logiki API, automatyczny error handling, caching, retry logic.

##### 4. Toast Notifications zamiast Alert Components
```typescript
// Zamień:
{successMessage && <Alert>...</Alert>}

// Na:
const onSubmit = async (data) => {
  await changePassword.mutateAsync(data);
  toast.success("Password changed successfully!");
  reset(); // react-hook-form reset
};
```

**Argumentacja**: Eliminuje stany successMessage i formError, lepszy UX (toasts są non-blocking), zgodność z resztą aplikacji (używa sonner).

##### 5. Semantic Color Tokens
```typescript
// Linia 121-123: Zamień hardcoded OKLCH color
<Alert className="bg-[oklch(0.65_0.15_145)]/10 border-[oklch(0.65_0.15_145)]">

// Na semantic token:
<Alert variant="success" className="bg-success/10 border-success">
```

**Argumentacja**: Zgodność z `.claude/docs/tailwind-theming.md` guidelines, spójność z design system, łatwiejsza zmiana theme.

**Potencjalna oszczędność LOC:** 80-120 linii

---

## 3. Podsumowanie rekomendacji priorytetowych

### ⚡ Najwyższy priorytet (High Impact, Low Effort)

#### 1. React Hook Form + Zod w ChangePasswordForm.tsx
- **Effort:** Low (2-4 godziny)
- **Impact:** High (oszczędność ~100 LOC, lepsze UX)
- **Lokalizacja:** `src/components/auth/ChangePasswordForm.tsx`
- **Dependencies:** `react-hook-form`, `@hookform/resolvers`

#### 2. Semantic color tokens - fix hardcoded colors
- **Effort:** Very Low (30 minut)
- **Impact:** Medium (zgodność z guidelines)
- **Lokalizacja:** `src/components/auth/ChangePasswordForm.tsx:121-123`
- **Action:** Zamień `bg-[oklch(0.65_0.15_145)]` na semantic token

#### 3. Wydzielenie useStickyFooter hook
- **Effort:** Low (1-2 godziny)
- **Impact:** High (eliminacja duplikacji w 2 miejscach)
- **Lokalizacja:**
  - `src/components/quizzes/EditableQuizContent.tsx:56-80`
  - `src/components/quizzes/AIQuizGenerator.tsx:18-43`
- **Nowy plik:** `src/components/hooks/ui/useStickyFooter.ts`

---

### 🔧 Średni priorytet (High Impact, Medium Effort)

#### 1. Rozbicie EditableQuizContent na Atomic Components
- **Effort:** High (1-2 dni)
- **Impact:** Very High (oszczędność 300-400 LOC, lepsza architektura)
- **Lokalizacja:** `src/components/quizzes/EditableQuizContent.tsx`
- **Nowa struktura:**
  ```
  src/components/quiz-editor/
  ├── QuizEditorContainer.tsx
  ├── QuizMetadataFields.tsx
  ├── QuestionEditor.tsx
  ├── OptionEditor.tsx
  └── QuizEditorFooter.tsx
  ```

#### 2. Hook Composition w useEditableQuiz
- **Effort:** Medium (4-8 godzin)
- **Impact:** High (lepsza architektura, testowalność)
- **Lokalizacja:** `src/components/hooks/useEditableQuiz.ts`
- **Nowa struktura:**
  ```
  src/components/hooks/quiz-editor/
  ├── useQuizState.ts
  ├── useQuizValidation.ts
  ├── useQuestionActions.ts
  └── useOptionActions.ts
  ```

#### 3. State-Based Component Mapping w AIQuizGenerator
- **Effort:** Medium (4-6 godzin)
- **Impact:** High (czytelność, maintainability)
- **Lokalizacja:** `src/components/quizzes/AIQuizGenerator.tsx`
- **Nowa struktura:**
  ```
  src/components/ai-quiz-generator/
  ├── AIQuizGenerator.tsx (główny orchestrator)
  ├── GenerationFormView.tsx
  ├── GeneratingView.tsx
  ├── ErrorView.tsx
  ├── PreviewView.tsx
  └── EditingView.tsx
  ```

---

### 📋 Niski priorytet (Nice to Have)

#### 1. CVA dla dropdown-menu
- **Effort:** Low (2-3 godziny)
- **Impact:** Medium (lepsze type safety, ale komponent działa poprawnie)
- **Lokalizacja:** `src/components/ui/dropdown-menu.tsx`
- **Dependencies:** `class-variance-authority`

#### 2. State Machine (XState) dla quiz editor
- **Effort:** Very High (2-3 dni)
- **Impact:** Medium (advanced pattern, wymaga learning curve)
- **Lokalizacja:** `src/components/hooks/useEditableQuiz.ts`
- **Dependencies:** `xstate`, `@xstate/react`
- **Uwaga:** Warto rozważyć tylko jeśli zespół ma doświadczenie z XState

---

## 4. Roadmap implementacji

### Faza 1: Quick Wins (Tydzień 1)
1. ✅ Semantic color tokens fix
2. ✅ useStickyFooter hook extraction
3. ✅ React Hook Form w ChangePasswordForm

**Rezultat:** Oszczędność ~150 LOC, zgodność z guidelines

### Faza 2: Medium Refactoring (Tydzień 2-3)
1. ✅ Hook Composition w useEditableQuiz
2. ✅ State-Based Component Mapping w AIQuizGenerator
3. ✅ Custom PasswordField component

**Rezultat:** Oszczędność ~200 LOC, lepsza architektura

### Faza 3: Major Refactoring (Tydzień 4-5)
1. ✅ Rozbicie EditableQuizContent na Atomic Components
2. ✅ Form Field Component Pattern
3. ✅ React Query mutations dla API calls

**Rezultat:** Oszczędność ~400 LOC, znacząca poprawa maintainability

### Faza 4: Optimization (Opcjonalna)
1. ⚙️ CVA dla UI components
2. ⚙️ State Machine (jeśli potrzebne)

---

## 5. Metryki sukcesu

### Przed refaktoryzacją:
- **Total LOC w TOP 5:** 1,926 linii
- **Średnia złożoność cyklomatyczna:** Wysoka
- **Duplikacja kodu:** ~20-25%
- **Test coverage:** ?

### Po refaktoryzacji (cel):
- **Total LOC w TOP 5:** ~1,200-1,300 linii (-30-40%)
- **Średnia złożoność cyklomatyczna:** Średnia/Niska
- **Duplikacja kodu:** <10%
- **Test coverage:** >70%
- **Bundle size reduction:** ~5-10%

---

## 6. Zależności do instalacji

### Niezbędne:
```bash
npm install react-hook-form @hookform/resolvers zod
```

### Opcjonalne (dla advanced patterns):
```bash
npm install immer class-variance-authority
npm install @tanstack/react-query  # jeśli nie używane
npm install xstate @xstate/react    # tylko dla state machine
```

---

## 7. Uwagi końcowe

### Zalecenia:
1. **Rozpocznij od Fazy 1** - quick wins dają natychmiastowe rezultaty
2. **Testuj po każdej zmianie** - napisz testy jednostkowe dla wydzielonych hooków
3. **Dokumentuj zmiany** - aktualizuj README i docs
4. **Code review** - każda faza powinna przejść przez review
5. **Nie refaktoruj wszystkiego naraz** - incremental approach jest bezpieczniejszy

### Ostrzeżenia:
- ⚠️ **Dropdown-menu.tsx** jest generowany przez Shadcn/ui - zmiany mogą zostać nadpisane
- ⚠️ **State Machine** pattern to overkill jeśli zespół nie ma doświadczenia
- ⚠️ **Breaking changes** - niektóre refactoring mogą wymagać zmian w innych plikach

### Kolejne kroki:
1. Przejrzyj plan z zespołem
2. Ustal priorytety zgodnie z roadmapą projektu
3. Stwórz tickety/issues dla każdej fazy
4. Ustaw code freeze podczas major refactoringu
5. Zaplanuj sesje pair programming dla skomplikowanych zmian

---

**Autor analizy:** Claude Code
**Data:** 2025-10-23
**Wersja:** 1.0
