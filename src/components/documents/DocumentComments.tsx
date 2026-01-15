import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  MessageSquare, 
  Send, 
  Reply, 
  CheckCircle2, 
  Trash2,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  created_by: string;
  created_at: string;
  is_resolved: boolean;
  parent_comment_id: string | null;
  replies?: Comment[];
  user?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface DocumentCommentsProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentName: string;
}

export function DocumentComments({
  isOpen,
  onClose,
  documentId,
  documentName
}: DocumentCommentsProps) {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, documentId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_comments')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Organize into threads
      const topLevel: Comment[] = [];
      const repliesMap: Record<string, Comment[]> = {};

      (data || []).forEach(comment => {
        if (comment.parent_comment_id) {
          if (!repliesMap[comment.parent_comment_id]) {
            repliesMap[comment.parent_comment_id] = [];
          }
          repliesMap[comment.parent_comment_id].push(comment);
        } else {
          topLevel.push(comment);
        }
      });

      // Attach replies to parent comments
      const threaded = topLevel.map(comment => ({
        ...comment,
        replies: repliesMap[comment.id] || []
      }));

      setComments(threaded);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('document_comments')
        .insert({
          document_id: documentId,
          content: newComment.trim(),
          created_by: user.id
        });

      if (error) throw error;

      setNewComment('');
      fetchComments();
      
      toast({
        title: 'Comment added',
        description: 'Your comment has been posted.'
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: 'Error',
        description: 'Could not post comment.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('document_comments')
        .insert({
          document_id: documentId,
          content: replyContent.trim(),
          created_by: user.id,
          parent_comment_id: parentId
        });

      if (error) throw error;

      setReplyContent('');
      setReplyingTo(null);
      fetchComments();
      
      toast({
        title: 'Reply added',
        description: 'Your reply has been posted.'
      });
    } catch (error) {
      console.error('Error posting reply:', error);
      toast({
        title: 'Error',
        description: 'Could not post reply.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async (commentId: string, isResolved: boolean) => {
    try {
      const { error } = await supabase
        .from('document_comments')
        .update({ is_resolved: !isResolved })
        .eq('id', commentId);

      if (error) throw error;
      fetchComments();
    } catch (error) {
      console.error('Error resolving comment:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('document_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      fetchComments();
      
      toast({
        title: 'Comment deleted',
        description: 'The comment has been removed.'
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Error',
        description: 'Could not delete comment.',
        variant: 'destructive'
      });
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`${isReply ? 'ml-8 mt-2' : 'mb-4'}`}>
      <div className={`p-3 rounded-lg ${isReply ? 'bg-muted/30' : 'bg-muted/50'} ${comment.is_resolved ? 'opacity-60' : ''}`}>
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.user?.avatar_url || undefined} />
            <AvatarFallback className="text-xs">
              {getInitials(comment.user?.full_name || profile?.full_name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">
                {comment.user?.full_name || profile?.full_name || 'User'}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(comment.created_at), 'MMM d, h:mm a')}
              </span>
              {comment.is_resolved && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Resolved
                </Badge>
              )}
            </div>
            
            <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
            
            {!isReply && (
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setReplyingTo(comment.id)}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleResolve(comment.id, comment.is_resolved)}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {comment.is_resolved ? 'Unresolve' : 'Mark Resolved'}
              </DropdownMenuItem>
              {comment.created_by === user?.id && (
                <DropdownMenuItem 
                  onClick={() => handleDelete(comment.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Reply Input */}
      {replyingTo === comment.id && (
        <div className="ml-8 mt-2 flex gap-2">
          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            className="min-h-[60px] text-sm"
          />
          <div className="flex flex-col gap-1">
            <Button 
              size="sm" 
              onClick={() => handleReply(comment.id)}
              disabled={!replyContent.trim() || isSubmitting}
            >
              <Send className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => {
                setReplyingTo(null);
                setReplyContent('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Replies */}
      {comment.replies?.map(reply => (
        <CommentItem key={reply.id} comment={reply} isReply />
      ))}
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments
          </SheetTitle>
          <SheetDescription>
            Discussion for "{documentName}"
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 mt-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No comments yet</p>
              <p className="text-xs mt-1">Be the first to leave feedback</p>
            </div>
          ) : (
            <div className="pr-4">
              {comments.map(comment => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* New Comment Input */}
        <div className="border-t pt-4 mt-4">
          <div className="flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="min-h-[80px]"
            />
          </div>
          <div className="flex justify-end mt-2">
            <Button 
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
