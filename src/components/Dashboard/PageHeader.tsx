/**
 * Props for PageHeader component
 */
interface PageHeaderProps {
  title: string;
  description?: string;
}

/**
 * Simple page header component with title and optional description
 *
 * @param props - Component props
 * @returns PageHeader component
 */
export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
      {description && <p className="mt-2 text-muted-foreground">{description}</p>}
    </header>
  );
}
