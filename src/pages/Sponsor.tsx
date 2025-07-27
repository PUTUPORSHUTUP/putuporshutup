import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Sponsor = () => {
  const navigate = useNavigate();

  const handleSponsorSignup = () => {
    // For now, redirect to contact or create a sponsor signup modal
    window.open('mailto:sponsors@puosu.com?subject=Tournament Sponsorship Inquiry', '_blank');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-gaming font-bold mb-4">
            Become a <span className="text-accent">PUOSU</span> Tournament Sponsor
          </h1>
          <p className="text-xl text-muted-foreground">
            Support the game. Elevate your brand. Power the prize pool.
          </p>
        </div>

        {/* Benefits Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-gaming font-bold text-neon-green mb-6 pb-3 border-b-2 border-neon-green">
            ✨ Sponsor Value: What You Get
          </h2>
          <ul className="space-y-4 text-lg">
            <li className="flex items-start">
              <span className="text-accent mr-3">•</span>
              <div>
                <strong className="text-accent">Premium Visibility:</strong>{" "}
                Logo on banners, lobby screens, and winner pages
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-accent mr-3">•</span>
              <div>
                <strong className="text-accent">Audience Access:</strong>{" "}
                Gamers aged 16–35 who are highly engaged
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-accent mr-3">•</span>
              <div>
                <strong className="text-accent">Brand Loyalty:</strong>{" "}
                Fans remember who powered the big wins
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-accent mr-3">•</span>
              <div>
                <strong className="text-accent">Viral Reach:</strong>{" "}
                Highlight clips, co-branded content, and shoutouts
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-accent mr-3">•</span>
              <div>
                <strong className="text-accent">ROI & Reports:</strong>{" "}
                Get sponsor analytics after each event
              </div>
            </li>
          </ul>
        </div>

        {/* Smart Sponsorship Ideas */}
        <div className="mb-12">
          <h2 className="text-2xl font-gaming font-bold text-neon-pink mb-6 pb-3 border-b-2 border-neon-pink">
            🚀 Smart Sponsorship Ideas
          </h2>
          <ul className="space-y-4 text-lg">
            <li className="flex items-start">
              <span className="text-neon-pink mr-3">•</span>
              <div>
                <strong className="text-neon-pink">Sponsor a Winner:</strong>{" "}
                Highlight how your brand backed their victory
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-neon-pink mr-3">•</span>
              <div>
                <strong className="text-neon-pink">Exclusive Perks:</strong>{" "}
                First access to major tournaments or elite events
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-neon-pink mr-3">•</span>
              <div>
                <strong className="text-neon-pink">Brand Integration:</strong>{" "}
                Add products, merch, or powerups to gameplay
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-neon-pink mr-3">•</span>
              <div>
                <strong className="text-neon-pink">Affiliate Bonuses:</strong>{" "}
                Create trackable codes for commissions
              </div>
            </li>
          </ul>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <p className="text-xl mb-8 text-muted-foreground">
            Ready to support the next wave of champions?
          </p>
          <Button
            onClick={handleSponsorSignup}
            size="lg"
            className="bg-neon-green text-black hover:bg-neon-green/80 font-gaming font-bold text-lg px-8 py-4"
          >
            Sponsor a Tournament Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sponsor;