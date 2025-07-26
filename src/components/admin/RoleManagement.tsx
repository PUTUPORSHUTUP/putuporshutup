import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Search,
  Shield,
  Crown,
  User,
  Loader2
} from 'lucide-react';

interface UserWithRole {
  user_id: string;
  username?: string;
  display_name?: string;
  role?: string;
  assigned_at?: string;
}

export const RoleManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Get all users with their roles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name');

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at');

      if (rolesError) throw rolesError;

      // Combine the data
      const usersWithRoles = profilesData?.map(profile => {
        const userRole = rolesData?.find(r => r.user_id === profile.user_id);
        return {
          ...profile,
          role: userRole?.role || 'player',
          assigned_at: userRole?.created_at
        };
      }) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users and roles.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast({
        title: "Error",
        description: "Please select a user and role.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: selectedUser,
          role: selectedRole,
          assigned_by: (await supabase.auth.getUser()).data.user?.id
        }, {
          onConflict: 'user_id,role'
        });

      if (error) throw error;

      toast({
        title: "Role Assigned",
        description: `Successfully assigned ${selectedRole} role.`,
      });

      setSelectedUser('');
      setSelectedRole('');
      loadUsers();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: "Error",
        description: "Failed to assign role.",
        variant: "destructive",
      });
    }
  };

  const removeRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;

      toast({
        title: "Role Removed",
        description: `Successfully removed ${role} role.`,
      });

      loadUsers();
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: "Error",
        description: "Failed to remove role.",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />;
      case 'mod': return <Shield className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'mod': return 'secondary';
      default: return 'outline';
    }
  };

  const filteredUsers = users.filter(user => 
    searchTerm === '' || 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableUsers = users.filter(user => user.role === 'player');

  return (
    <div className="space-y-6">
      {/* Assign Role Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assign Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Select user..." />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto">
                {availableUsers.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {user.display_name || user.username || 'Unknown User'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mod">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={assignRole} className="w-full">
              Assign Role
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Roles ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div 
                  key={user.user_id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">
                        {user.display_name || user.username || 'Unknown User'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.username && user.display_name ? `@${user.username}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={getRoleBadgeVariant(user.role || 'player')}
                      className="flex items-center gap-1"
                    >
                      {getRoleIcon(user.role || 'player')}
                      {(user.role || 'player').toUpperCase()}
                    </Badge>

                    {user.role && user.role !== 'player' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeRole(user.user_id, user.role!)}
                        className="flex items-center gap-1"
                      >
                        <UserMinus className="h-3 w-3" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};