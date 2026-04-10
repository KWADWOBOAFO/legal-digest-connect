
-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  excerpt TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  cover_image_url TEXT,
  post_type TEXT NOT NULL DEFAULT 'blog' CHECK (post_type IN ('blog', 'insight')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  author_id UUID NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can view published posts
CREATE POLICY "Anyone can view published blog posts"
ON public.blog_posts FOR SELECT
USING (status = 'published');

-- Admins can view all posts (including drafts)
CREATE POLICY "Admins can view all blog posts"
ON public.blog_posts FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can create posts
CREATE POLICY "Admins can create blog posts"
ON public.blog_posts FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update posts
CREATE POLICY "Admins can update blog posts"
ON public.blog_posts FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete posts
CREATE POLICY "Admins can delete blog posts"
ON public.blog_posts FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Index for slug lookups
CREATE INDEX idx_blog_posts_slug ON public.blog_posts (slug);
CREATE INDEX idx_blog_posts_status ON public.blog_posts (status);

-- Trigger for updated_at
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
