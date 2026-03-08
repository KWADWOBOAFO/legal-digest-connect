import { supabase } from '@/integrations/supabase/client';

export const logAdminAction = async (
  actionType: string,
  targetType: string,
  targetId?: string,
  details?: Record<string, unknown>
) => {
  try {
    await supabase.functions.invoke('manage-user-roles', {
      body: {
        action: 'log_action',
        action_type: actionType,
        target_type: targetType,
        target_id: targetId || null,
        details: details || {},
      },
    });
  } catch (err) {
    console.error('Failed to log admin action:', err);
  }
};
