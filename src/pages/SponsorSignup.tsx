import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trophy, ArrowLeft, CheckCircle, Star } from "lucide-react";

const SponsorSignup = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
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

  const sponsorshipTiers = [
    {
      name: "Bronze",
      price: "$100",
      multiplier: "2x",
      features: [
        "Logo on tournament banners",
        "Sponsor mention in match intros",
        "Basic analytics report"
      ],
      color: "border-orange-400 bg-orange-900/20"
    },
    {
      name: "Silver", 
      price: "$250",
      multiplier: "2.5x",
      features: [
        "All Bronze features",
        "Logo on lobby screens",
        "Social media shoutouts",
        "Mid-tournament highlights"
      ],
      color: "border-gray-400 bg-gray-900/20"
    },
    {
      name: "Gold",
      price: "$500", 
      multiplier: "3x",
      features: [
        "All Silver features",
        "Featured on winner pages",
        "Custom hashtag campaigns",
        "Priority tournament access"
      ],
      color: "border-yellow-400 bg-yellow-900/20"
    }
  ];

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

      setIsSubmitted(true);
      toast({
        title: "Application Submitted!",
        description: "Thank you for your interest. We'll be in touch within 24 hours.",
      });

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

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container max-w-4xl mx-auto px-6 py-12">
          <div className="text-center">
            <CheckCircle className="w-20 h-20 text-neon-green mx-auto mb-6" />
            <h1 className="text-4xl font-gaming font-bold mb-4">
              Application Submitted Successfully!
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Thank you for your interest in sponsoring PUOSU tournaments.
              <br />
              Our team will review your application and get back to you within 24 hours.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="font-gaming"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <Button
                onClick={() => navigate('/sponsor')}
                className="bg-neon-green text-black hover:bg-neon-green/80 font-gaming"
              >
                View Sponsor Info
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Button
            onClick={() => navigate('/sponsor')}
            variant="ghost"
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sponsor Info
          </Button>
          <h1 className="text-4xl md:text-5xl font-gaming font-bold mb-4">
            <Trophy className="inline w-8 h-8 mr-3 text-accent" />
            Tournament Sponsor Application
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join the brands powering competitive gaming excellence
          </p>
        </div>

        {/* Tier Selection Preview */}
        <div className="mb-12">
          <h2 className="text-2xl font-gaming font-bold text-center mb-6">
            Choose Your Sponsorship Level
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {sponsorshipTiers.map((tier) => (
              <Card key={tier.name} className={`${tier.color} border-2 text-center`}>
                <CardHeader>
                  <CardTitle className="text-xl font-gaming">{tier.name}</CardTitle>
                  <div className="text-2xl font-bold text-accent">{tier.price}</div>
                  <div className="text-sm text-muted-foreground">
                    {tier.multiplier} Prize Pool Multiplier
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Star className="w-3 h-3 text-accent mr-2 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Application Form */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-gaming">
              Sponsor Application Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Information */}
              <div>
                <h3 className="text-lg font-gaming font-semibold mb-4">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company_name">Company Name *</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                      placeholder="Your Company Name"
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
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-gaming font-semibold mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Business Email *</Label>
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
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Sponsorship Details */}
              <div>
                <h3 className="text-lg font-gaming font-semibold mb-4">Sponsorship Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="selected_tier">Preferred Sponsorship Tier *</Label>
                    <Select value={formData.selected_tier} onValueChange={(value) => setFormData(prev => ({ ...prev, selected_tier: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your preferred tier" />
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
                        <SelectValue placeholder="Select your budget range" />
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
              </div>

              {/* Preferences & Goals */}
              <div>
                <h3 className="text-lg font-gaming font-semibold mb-4">Your Goals & Preferences</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tournament_preferences">Tournament Preferences</Label>
                    <Textarea
                      id="tournament_preferences"
                      value={formData.tournament_preferences}
                      onChange={(e) => setFormData(prev => ({ ...prev, tournament_preferences: e.target.value }))}
                      placeholder="Which games, tournament sizes, or events interest you most? (e.g., Call of Duty, Fortnite, small tournaments, major events)"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Brand Goals & Additional Information</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Tell us about your brand goals, target audience, and what you hope to achieve through tournament sponsorship..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/sponsor')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-neon-green text-black hover:bg-neon-green/80 font-gaming font-bold text-lg py-6"
                >
                  {isLoading ? "Submitting Application..." : "Submit Sponsor Application"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SponsorSignup;