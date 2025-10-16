/**
 * Types for Quiz Management View Components
 * These types support the navigation, filtering, and layout components
 * used across the quiz management interface.
 */

/**
 * Navigation link for header menu
 */
export interface NavigationLink {
  title: string;
  path: string;
  isActive?: boolean;
}

/**
 * Filter option for sidebar navigation
 */
export interface FilterOption {
  id: string;
  label: string;
  value?: string;
}

/**
 * Breadcrumb navigation item
 */
export interface BreadcrumbItem {
  label: string;
  path: string;
  isCurrent?: boolean;
}

/**
 * Tab item for section navigation
 */
export interface TabItem {
  id: string;
  label: string;
  isActive: boolean;
}

/**
 * Overall view state for quiz management
 */
export interface QuizManagementViewState {
  activeTab: string;
  selectedFilter: string | null;
  breadcrumbs: BreadcrumbItem[];
  isLoading: boolean;
  error: string | null;
}

/**
 * User profile data for header navigation
 */
export interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}
