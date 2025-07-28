import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trophy } from "lucide-react";

interface SponsorSignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SponsorSignupModal = ({ open, onOpenChange }: SponsorSignupModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    company_name: "",
    contact_person: "",
    email: "",
    phone: "",
    selected_tier: "",
    tournament_preferences: "",
    budget_range: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_name || !formData.contact_person || !formData.email || !formData.selected_tier) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('sponsors')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Application Submitted!",
        description: "Thank you for your interest. We'll be in touch soon.",
      });

      // Reset form and close modal
      setFormData({
        company_name: "",
        contact_person: "",
        email: "",
        phone: "",
        selected_tier: "",
        tournament_preferences: "",
        budget_range: "",
        message: ""
      });
      onOpenChange(false);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-gaming flex items-center">
            <Trophy className="w-6 h-6 mr-2 text-accent" />
            Become a PUOSU Tournament Sponsor
          </DialogTitle>
        </DialogHeader>
        
        {/* Sponsor Benefits Section */}
        <div className="mb-6 p-4 bg-accent/10 border border-accent/20 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-accent">🎯 Sponsor Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-accent">✨</span>
              <span>Automatic carousel placement</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-accent">📊</span>
              <span>Real-time analytics dashboard</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-accent">🎮</span>
              <span>Tournament logo integration</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-accent">📈</span>
              <span>Increased brand visibility</span>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="Your Company"
                required
              />
            </div>
            <div>
              <Label htmlFor="contact_person">Contact Person *</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="contact@company.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="selected_tier">Sponsorship Tier *</Label>
              <Select value={formData.selected_tier} onValueChange={(value) => setFormData(prev => ({ ...prev, selected_tier: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bronze">Bronze ($100) - 2x Prize Pool</SelectItem>
                  <SelectItem value="Silver">Silver ($250) - 2.5x Prize Pool</SelectItem>
                  <SelectItem value="Gold">Gold ($500) - 3x Prize Pool</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="budget_range">Monthly Budget Range</Label>
              <Select value={formData.budget_range} onValueChange={(value) => setFormData(prev => ({ ...prev, budget_range: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="$100-500">$100 - $500</SelectItem>
                  <SelectItem value="$500-1000">$500 - $1,000</SelectItem>
                  <SelectItem value="$1000-2500">$1,000 - $2,500</SelectItem>
                  <SelectItem value="$2500+">$2,500+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="tournament_preferences">Tournament Preferences</Label>
            <Textarea
              id="tournament_preferences"
              value={formData.tournament_preferences}
              onChange={(e) => setFormData(prev => ({ ...prev, tournament_preferences: e.target.value }))}
              placeholder="Which games, tournament sizes, or events interest you most?"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="message">Additional Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Tell us about your brand goals and what you hope to achieve..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-neon-green text-black hover:bg-neon-green/80 font-gaming"
            >
              {isLoading ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};