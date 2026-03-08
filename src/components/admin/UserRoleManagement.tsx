import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Shield, ShieldPlus, ShieldMinus, Search, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserWithRoles {
  user_id: string;
  email: string;
  full_name: string | null;
  user_type: string;
  roles: string[];
}

const AVAILABLE_ROLES = ['admin', 'moderator', 'user'] as const;

const roleBadgeVariant = (role: string) => {
  switch (role) {
    case 'admin': return 'destructive';
    case 'moderator': return 'default';
    default: return 'secondary';
  }
};

const UserRoleManagement = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-user-roles', {
        body: { action: 'list' },
      });

      if (error) throw error;
      setUsers(data.users || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching users',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddRole = async (userId: string, role: string) => {
    setActionLoading(`${userId}-add`);
    try {
      const { data, error } = await supabase.functions.invoke('manage-user-roles', {
        body: { action: 'add_role', user_id: userId, role },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({ title: 'Role added successfully' });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error adding role',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    setActionLoading(`${userId}-${role}`);
    try {
      const { data, error } = await supabase.functions.invoke('manage-user-roles', {
        body: { action: 'remove_role', user_id: userId, role },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({ title: 'Role removed successfully' });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error removing role',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Role Management
          </CardTitle>
          <CardDescription>
            Manage user roles across the platform. Admins have full access, moderators can review cases and firms.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="outline" className="whitespace-nowrap">
              <Users className="h-3 w-3 mr-1" />
              {filteredUsers.length} users
            </Badge>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Current Roles</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <UserRoleRow
                    key={user.user_id}
                    user={user}
                    actionLoading={actionLoading}
                    onAddRole={handleAddRole}
                    onRemoveRole={handleRemoveRole}
                  />
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface UserRoleRowProps {
  user: UserWithRoles;
  actionLoading: string | null;
  onAddRole: (userId: string, role: string) => void;
  onRemoveRole: (userId: string, role: string) => void;
}

const UserRoleRow = ({ user, actionLoading, onAddRole, onRemoveRole }: UserRoleRowProps) => {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const missingRoles = AVAILABLE_ROLES.filter((r) => !user.roles.includes(r));

  return (
    <TableRow>
      <TableCell>
        <div>
          <p className="font-medium">{user.full_name || 'Unnamed'}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="capitalize">
          {user.user_type}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {user.roles.map((role) => (
            <div key={role} className="flex items-center gap-1">
              <Badge variant={roleBadgeVariant(role)} className="capitalize">
                {role}
              </Badge>
              {role !== 'user' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  disabled={actionLoading === `${user.user_id}-${role}`}
                  onClick={() => onRemoveRole(user.user_id, role)}
                >
                  {actionLoading === `${user.user_id}-${role}` ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ShieldMinus className="h-3 w-3 text-destructive" />
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>
      </TableCell>
      <TableCell>
        {missingRoles.length > 0 && (
          <div className="flex items-center gap-2">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[130px] h-8">
                <SelectValue placeholder="Add role..." />
              </SelectTrigger>
              <SelectContent>
                {missingRoles.map((role) => (
                  <SelectItem key={role} value={role} className="capitalize">
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              disabled={!selectedRole || actionLoading === `${user.user_id}-add`}
              onClick={() => {
                if (selectedRole) {
                  onAddRole(user.user_id, selectedRole);
                  setSelectedRole('');
                }
              }}
            >
              {actionLoading === `${user.user_id}-add` ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ShieldPlus className="h-3 w-3" />
              )}
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
};

export default UserRoleManagement;
