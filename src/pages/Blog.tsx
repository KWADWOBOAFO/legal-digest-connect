import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LegalBreadcrumb from "@/components/layout/LegalBreadcrumb";
import BackToTopButton from "@/components/layout/BackToTopButton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const posts = [
  {
    title: "Understanding Your Rights as a Tenant in the UK",
    excerpt:
      "A comprehensive guide to tenant rights, from deposit protection to eviction notices.",
    category: "Housing Law",
    date: "28 March 2026",
  },
  {
    title: "How AI Is Transforming Access to Legal Services",
    excerpt:
      "Explore how artificial intelligence is helping everyday people navigate complex legal matters.",
    category: "Technology",
    date: "21 March 2026",
  },
  {
    title: "5 Things to Know Before Hiring a Solicitor",
    excerpt:
      "Key questions to ask and red flags to watch for when choosing legal representation.",
    category: "Legal Tips",
    date: "14 March 2026",
  },
  {
    title: "Small Claims Court: A Step-by-Step Guide",
    excerpt:
      "Everything you need to know about filing a small claim, from paperwork to court day.",
    category: "Civil Law",
    date: "7 March 2026",
  },
];

const Blog = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
        <LegalBreadcrumb currentPage="Blog" />

        <h1 className="text-4xl font-serif font-bold text-foreground mb-4">
          Blog
        </h1>
        <p className="text-lg text-muted-foreground mb-12 max-w-2xl">
          Insights, guides, and updates on legal matters and access to justice.
        </p>

        <div className="space-y-6">
          {posts.map((post) => (
            <Card
              key={post.title}
              className="hover:shadow-md transition-shadow cursor-pointer"
            >
              <CardContent className="py-6">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="secondary">{post.category}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {post.date}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  {post.title}
                </h2>
                <p className="text-muted-foreground">{post.excerpt}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <BackToTopButton />
      <Footer />
    </div>
  );
};

export default Blog;
