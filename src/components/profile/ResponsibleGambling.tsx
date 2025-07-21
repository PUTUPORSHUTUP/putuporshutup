import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Shield, Phone, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserLimit {
  id: string;
  limit_type: string;
  limit_amount: number;
  effective_date: string;
}

interface SelfExclusion {
  id: string;
  exclusion_type: string;
  start_date: string;
  end_date?: string;
  reason?: string;
  is_active: boolean;
}

interface AddictionResource {
  id: string;
  title: string;
  description?: string;
  url: string;
  phone_number?: string;
  resource_type: string;
}

export function ResponsibleGambling() {
  const { user } = useAuth();
  const [limits, setLimits] = useState<UserLimit[]>([]);
  const [exclusions, setExclusions] = useState<SelfExclusion[]>([]);
  const [resources, setResources] = useState<AddictionResource[]>([]);
  const [newLimit, setNewLimit] = useState({ type: '', amount: '' });
  const [exclusionForm, setExclusionForm] = useState({ type: 'temporary', duration: '7', reason: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserData();
      loadResources();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const [limitsResponse, exclusionsResponse] = await Promise.all([
        supabase.from('user_limits').select('*').eq('user_id', user?.id),
        supabase.from('self_exclusions').select('*').eq('user_id', user?.id).order('created_at', { ascending: false })
      ]);

      if (limitsResponse.data) setLimits(limitsResponse.data);
      if (exclusionsResponse.data) setExclusions(exclusionsResponse.data);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadResources = async () => {
    try {
      const { data } = await supabase.from('addiction_resources').select('*').eq('is_active', true);
      if (data) setResources(data);
    } catch (error) {
      console.error('Error loading resources:', error);
    }
  };

  const handleSetLimit = async () => {
    if (!newLimit.type || !newLimit.amount || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('user_limits').upsert({
        user_id: user.id,
        limit_type: newLimit.type,
        limit_amount: parseFloat(newLimit.amount),
        effective_date: new Date().toISOString()
      });

      if (error) throw error;

      toast.success('Limit set successfully');
      setNewLimit({ type: '', amount: '' });
      loadUserData();
    } catch (error) {
      toast.error('Error setting limit');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelfExclusion = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const endDate = exclusionForm.type === 'temporary' 
        ? new Date(Date.now() + parseInt(exclusionForm.duration) * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase.from('self_exclusions').insert({
        user_id: user.id,
        exclusion_type: exclusionForm.type,
        end_date: endDate,
        reason: exclusionForm.reason || null
      });

      if (error) throw error;

      toast.success('Self-exclusion activated');
      setExclusionForm({ type: 'temporary', duration: '7', reason: '' });
      loadUserData();
    } catch (error) {
      toast.error('Error setting self-exclusion');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const activeExclusion = exclusions.find(ex => ex.is_active && 
    (ex.exclusion_type === 'permanent' || (ex.end_date && new Date(ex.end_date) > new Date()))
  );

  return (
    <div className="space-y-6">
      {activeExclusion && (
        <Alert className="border-destructive bg-destructive/5">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have an active {activeExclusion.exclusion_type} self-exclusion until{' '}
            {activeExclusion.exclusion_type === 'permanent' ? 'further notice' : 
              new Date(activeExclusion.end_date!).toLocaleDateString()}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Set Spending Limits
          </CardTitle>
          <CardDescription>
            Set daily, weekly, or monthly limits for deposits and wagers to help manage your spending
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="limit-type">Limit Type</Label>
              <Select value={newLimit.type} onValueChange={(value) => setNewLimit(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select limit type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily_deposit">Daily Deposit</SelectItem>
                  <SelectItem value="weekly_deposit">Weekly Deposit</SelectItem>
                  <SelectItem value="monthly_deposit">Monthly Deposit</SelectItem>
                  <SelectItem value="daily_wager">Daily Wager</SelectItem>
                  <SelectItem value="weekly_wager">Weekly Wager</SelectItem>
                  <SelectItem value="monthly_wager">Monthly Wager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="limit-amount">Amount ($)</Label>
              <Input
                id="limit-amount"
                type="number"
                value={newLimit.amount}
                onChange={(e) => setNewLimit(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSetLimit} disabled={loading || !newLimit.type || !newLimit.amount}>
                Set Limit
              </Button>
            </div>
          </div>

          {limits.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Current Limits</h4>
              {limits.map((limit) => (
                <div key={limit.id} className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="capitalize">{limit.limit_type.replace('_', ' ')}</span>
                  <span className="font-medium">${limit.limit_amount}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Self-Exclusion
          </CardTitle>
          <CardDescription>
            Temporarily or permanently exclude yourself from wagering activities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="exclusion-type">Exclusion Type</Label>
              <Select value={exclusionForm.type} onValueChange={(value) => setExclusionForm(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temporary">Temporary</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {exclusionForm.type === 'temporary' && (
              <div>
                <Label htmlFor="duration">Duration (days)</Label>
                <Select value={exclusionForm.duration} onValueChange={(value) => setExclusionForm(prev => ({ ...prev, duration: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Day</SelectItem>
                    <SelectItem value="7">1 Week</SelectItem>
                    <SelectItem value="30">1 Month</SelectItem>
                    <SelectItem value="90">3 Months</SelectItem>
                    <SelectItem value="180">6 Months</SelectItem>
                    <SelectItem value="365">1 Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              value={exclusionForm.reason}
              onChange={(e) => setExclusionForm(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Why are you setting this exclusion?"
            />
          </div>
          <Button 
            onClick={handleSelfExclusion} 
            disabled={loading || !!activeExclusion}
            variant="destructive"
          >
            {exclusionForm.type === 'permanent' ? 'Permanently Exclude' : 'Temporarily Exclude'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Gambling Addiction Resources
          </CardTitle>
          <CardDescription>
            Professional help and support for gambling-related problems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {resources.map((resource) => (
              <div key={resource.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{resource.title}</h4>
                    {resource.description && (
                      <p className="text-sm text-muted-foreground">{resource.description}</p>
                    )}
                  </div>
                  <span className="text-xs bg-secondary px-2 py-1 rounded capitalize">
                    {resource.resource_type.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {resource.phone_number && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`tel:${resource.phone_number}`}>
                        <Phone className="h-3 w-3 mr-1" />
                        {resource.phone_number}
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Visit Website
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}