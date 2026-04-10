import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LegalBreadcrumb from "@/components/layout/LegalBreadcrumb";
import BackToTopButton from "@/components/layout/BackToTopButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, FileText, Lightbulb, Calendar } from "lucide-react";

interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category: string;
  cover_image_url: string | null;
  post_type: string;
  published_at: string | null;
  created_at: string;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (!error && data) setPost(data);
      setIsLoading(false);
    };
    fetchPost();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center py-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 pb-20 max-w-4xl text-center">
          <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-6">The post you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/blog")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-20 max-w-3xl">
        <LegalBreadcrumb currentPage={post.title} />

        <Button variant="ghost" className="mb-6 -ml-2" onClick={() => navigate("/blog")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blog
        </Button>

        {post.cover_image_url && (
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full h-64 md:h-80 object-cover rounded-xl mb-8"
          />
        )}

        <div className="flex items-center gap-3 mb-4">
          <Badge variant={post.post_type === "insight" ? "default" : "secondary"}>
            {post.post_type === "insight" ? (
              <Lightbulb className="h-3 w-3 mr-1" />
            ) : (
              <FileText className="h-3 w-3 mr-1" />
            )}
            {post.post_type}
          </Badge>
          <Badge variant="outline">{post.category}</Badge>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(post.published_at || post.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-lg text-muted-foreground italic mb-8 border-l-4 border-primary/30 pl-4">
            {post.excerpt}
          </p>
        )}

        <div className="prose prose-lg max-w-none dark:prose-invert whitespace-pre-wrap">
          {post.content}
        </div>
      </main>
      <BackToTopButton />
      <Footer />
    </div>
  );
};

export default BlogPost;
