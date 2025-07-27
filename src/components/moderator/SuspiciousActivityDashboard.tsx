import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

interface SuspiciousActivity {
  id: string;
  user_id: string;
  activity_type: string;
  description: string;
  severity: string;
  status: string;
  created_at: string;
  profiles?: {
    username: string;
    display_name: string;
  } | null;
}

export function SuspiciousActivityDashboard() {
  const [activities, setActivities] = useState<SuspiciousActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<SuspiciousActivity | null>(null);
  const [investigationNotes, setInvestigationNotes] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    loadSuspiciousActivities();
  }, []);

  const loadSuspiciousActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('suspicious_activities')
        .select(`
          *,
          profiles!inner (
            username,
            display_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivities((data as any) || []);
    } catch (error) {
      console.error('Error loading suspicious activities:', error);
      toast({
        title: "Error",
        description: "Failed to load suspicious activities",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateActivityStatus = async () => {
    if (!selectedActivity || !newStatus) return;

    try {
      const { error } = await supabase
        .from('suspicious_activities')
        .update({
          status: newStatus,
          investigation_notes: investigationNotes,
          investigated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', selectedActivity.id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: "Activity status has been updated successfully"
      });

      setSelectedActivity(null);
      setInvestigationNotes("");
      setNewStatus("");
      loadSuspiciousActivities();

    } catch (error) {
      console.error('Error updating activity:', error);
      toast({
        title: "Error",
        description: "Failed to update activity status",
        variant: "destructive"
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertTriangle className="w-4 h-4" />;
      case 'investigating': return <Eye className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'false_positive': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading suspicious activities...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Suspicious Activity Dashboard</h2>
        <Badge variant="outline" className="text-sm">
          {activities.filter(a => a.status === 'open').length} open cases
        </Badge>
      </div>

      <div className="grid gap-4">
        {activities.map((activity) => (
          <Card key={activity.id} className={`border-l-4 ${getSeverityColor(activity.severity)}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(activity.status)}
                  <CardTitle className="text-base">
                    {activity.activity_type.replace('_', ' ').toUpperCase()}
                  </CardTitle>
                  <Badge variant="outline" className={`${getSeverityColor(activity.severity)} text-white`}>
                    {activity.severity}
                  </Badge>
                  <Badge variant="secondary">
                    {activity.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(activity.created_at), 'MMM dd, HH:mm')}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">User:</span> {activity.profiles?.username || 'Unknown'}
                  {activity.profiles?.display_name && (
                    <span className="text-muted-foreground ml-2">({activity.profiles.display_name})</span>
                  )}
                </div>
                <div>
                  <span className="font-medium">Description:</span> {activity.description}
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedActivity(activity);
                      setNewStatus(activity.status);
                    }}
                  >
                    Investigate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedActivity && (
        <Card className="mt-6 border-2 border-primary">
          <CardHeader>
            <CardTitle>Investigating Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Activity Details</h4>
              <p className="text-sm text-muted-foreground">{selectedActivity.description}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Investigation Notes</label>
              <Textarea
                value={investigationNotes}
                onChange={(e) => setInvestigationNotes(e.target.value)}
                placeholder="Add your investigation findings..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Update Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="false_positive">False Positive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedActivity(null)}>
                Cancel
              </Button>
              <Button onClick={updateActivityStatus}>
                Update Status
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}