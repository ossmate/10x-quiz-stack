import { useEffect, useRef, useState } from "react";

/**
 * Custom hook to manage sticky footer behavior using IntersectionObserver.
 * Observes a sentinel element to determine when the footer should be sticky.
 *
 * @param options - Configuration options
 * @param options.rootMargin - Margin around the root. Default: "100px"
 * @param options.dependencies - Dependencies array for the useEffect hook
 * @returns Object containing isSticky state and sentinelRef
 *
 * @example
 * ```tsx
 * const { isSticky, sentinelRef } = useStickyFooter();
 *
 * return (
 *   <div>
 *     <div>Content...</div>
 *     <div ref={sentinelRef} />
 *     <footer className={isSticky ? 'sticky bottom-0' : ''}>
 *       Footer content
 *     </footer>
 *   </div>
 * );
 * ```
 */
export function useStickyFooter(options?: { rootMargin?: string; dependencies?: React.DependencyList }) {
  const { rootMargin = "100px", dependencies = [] } = options ?? {};

  const [isSticky, setIsSticky] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Create a stable dependency key for the effect
  const depsKey = JSON.stringify(dependencies);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When sentinel is visible, footer should not be sticky
        setIsSticky(!entry.isIntersecting);
      },
      {
        // Trigger when sentinel is within the specified margin from viewport
        rootMargin,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
    // Using depsKey to ensure the effect runs when dependencies change
  }, [rootMargin, depsKey]);

  return { isSticky, sentinelRef };
}
