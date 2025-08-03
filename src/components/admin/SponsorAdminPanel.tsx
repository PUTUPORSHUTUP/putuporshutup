import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Sponsor {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone?: string;
  selected_tier: string;
  tournament_preferences?: string;
  budget_range?: string;
  message?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function SponsorAdminPanel() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSponsors();
  }, []);

  async function fetchSponsors() {
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        setSponsors(data);
      }
    } catch (error) {
      console.error('Error fetching sponsors:', error);
      toast({
        title: "Error",
        description: "Failed to load sponsors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: 'active' | 'archived') {
    try {
      console.log(`Updating sponsor ${id} to status: ${status}`);
      
      const { error } = await supabase
        .from('sponsors')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log(`Successfully updated sponsor ${id} to ${status}`);
      await fetchSponsors();
      
      toast({
        title: "Success",
        description: `Sponsor ${status === 'active' ? 'approved' : 'rejected'} successfully`,
      });
    } catch (error) {
      console.error('Error updating sponsor status:', error);
      toast({
        title: "Error", 
        description: "Failed to update sponsor status",
        variant: "destructive",
      });
    }
  }

  const filtered = {
    pending: sponsors.filter(s => s.status === 'pending'),
    active: sponsors.filter(s => s.status === 'active'),
    archived: sponsors.filter(s => s.status === 'archived'),
  };

  if (loading) {
    return <div className="p-6">Loading sponsors...</div>;
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Sponsor Manager</h1>

      <Section title="🕓 Pending Sponsors" data={filtered.pending} onUpdateStatus={updateStatus} actions />
      <Section title="✅ Active Sponsors" data={filtered.active} onUpdateStatus={updateStatus} />
      <Section title="📦 Archived Sponsors" data={filtered.archived} onUpdateStatus={updateStatus} />
    </div>
  );
}

interface SectionProps {
  title: string;
  data: Sponsor[];
  onUpdateStatus: (id: string, status: 'active' | 'archived') => void;
  actions?: boolean;
}

function Section({ title, data, onUpdateStatus, actions = false }: SectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {data.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No sponsors in this category
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map(sponsor => (
            <Card key={sponsor.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-lg">{sponsor.company_name}</p>
                    <Badge variant="outline" className="capitalize">
                      {sponsor.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Contact:</span> {sponsor.contact_person}
                  </p>
                  
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Email:</span> {sponsor.email}
                  </p>
                  
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Tier:</span> {sponsor.selected_tier}
                  </p>
                  
                  {sponsor.budget_range && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Budget:</span> {sponsor.budget_range}
                    </p>
                  )}
                  
                  {sponsor.tournament_preferences && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Preferences:</span> {sponsor.tournament_preferences}
                    </p>
                  )}
                  
                  {sponsor.message && (
                    <div className="p-2 bg-muted rounded text-sm">
                      <span className="font-medium">Message:</span> "{sponsor.message}"
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    {new Date(sponsor.created_at).toLocaleString()}
                  </p>
                </div>

                {actions && (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={() => onUpdateStatus(sponsor.id, 'active')}
                      className="flex-1"
                    >
                      Approve
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => onUpdateStatus(sponsor.id, 'archived')}
                      className="flex-1"
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}