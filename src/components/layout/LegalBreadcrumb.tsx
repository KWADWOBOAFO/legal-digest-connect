import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface LegalBreadcrumbProps {
  currentPage: string;
}

const LegalBreadcrumb = ({ currentPage }: LegalBreadcrumbProps) => (
  <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
    <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
    <ChevronRight className="w-4 h-4" />
    <span className="text-foreground font-medium">{currentPage}</span>
  </nav>
);

export default LegalBreadcrumb;
