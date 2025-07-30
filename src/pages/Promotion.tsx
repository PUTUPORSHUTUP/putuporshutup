import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Share2, Eye, Code, Image, Trophy, Calendar, DollarSign, Users, Zap, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const Promotion = () => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [bannerConfig, setBannerConfig] = useState({
    title: 'High Noon Showdown',
    subtitle: 'Elite Tournament',
    prizePool: '$800',
    date: '2025-07-31',
    participants: '32',
    style: 'modern',
    color: 'blue',
    showLogo: true,
    showPrize: true,
    showDate: true
  });

  // Fetch tournaments for selection
  const { data: tournaments = [] } = useQuery({
    queryKey: ['tournaments-for-promotion'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const generateBanner = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 400;

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    
    switch (bannerConfig.color) {
      case 'blue':
        gradient.addColorStop(0, '#1e40af');
        gradient.addColorStop(1, '#3b82f6');
        break;
      case 'red':
        gradient.addColorStop(0, '#dc2626');
        gradient.addColorStop(1, '#ef4444');
        break;
      case 'purple':
        gradient.addColorStop(0, '#7c3aed');
        gradient.addColorStop(1, '#a855f7');
        break;
      case 'green':
        gradient.addColorStop(0, '#059669');
        gradient.addColorStop(1, '#10b981');
        break;
      default:
        gradient.addColorStop(0, '#1e40af');
        gradient.addColorStop(1, '#3b82f6');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add overlay pattern
    if (bannerConfig.style === 'gaming') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      for (let i = 0; i < 20; i++) {
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
      }
    }

    // Main title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(bannerConfig.title, canvas.width / 2, 120);

    // Subtitle
    ctx.font = '24px Arial';
    ctx.fillText(bannerConfig.subtitle, canvas.width / 2, 160);

    // Prize pool
    if (bannerConfig.showPrize) {
      ctx.font = 'bold 36px Arial';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`Prize Pool: ${bannerConfig.prizePool}`, canvas.width / 2, 220);
    }

    // Date
    if (bannerConfig.showDate) {
      ctx.font = '20px Arial';
      ctx.fillStyle = '#ffffff';
      const formattedDate = new Date(bannerConfig.date).toLocaleDateString();
      ctx.fillText(`📅 ${formattedDate}`, canvas.width / 2, 270);
    }

    // Participants
    ctx.fillText(`👥 ${bannerConfig.participants} Players`, canvas.width / 2, 300);

    // Call to action
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('JOIN NOW!', canvas.width / 2, 350);

    toast({
      title: "Banner Generated",
      description: "Your tournament banner has been created successfully!",
    });
  };

  const downloadBanner = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${bannerConfig.title.replace(/\s+/g, '-')}-banner.png`;
    link.href = canvas.toDataURL();
    link.click();

    toast({
      title: "Download Started",
      description: "Your banner is being downloaded.",
    });
  };

  const copyEmbedCode = (type: 'widget' | 'banner' | 'countdown') => {
    let code = '';
    
    switch (type) {
      case 'widget':
        code = `<iframe src="https://your-domain.com/widget/tournament/${selectedTournament}" width="300" height="400" frameborder="0"></iframe>`;
        break;
      case 'banner':
        code = `<div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; border-radius: 12px;">
  <h2 style="margin: 0; font-size: 24px;">${bannerConfig.title}</h2>
  <p style="margin: 10px 0; font-size: 16px;">${bannerConfig.subtitle}</p>
  <div style="font-size: 20px; font-weight: bold; color: #fbbf24;">Prize Pool: ${bannerConfig.prizePool}</div>
  <a href="https://your-domain.com/tournaments" style="display: inline-block; margin-top: 15px; padding: 10px 20px; background: #fbbf24; color: #000; text-decoration: none; border-radius: 6px; font-weight: bold;">JOIN NOW</a>
</div>`;
        break;
      case 'countdown':
        code = `<div id="tournament-countdown" style="text-align: center; padding: 15px; background: #000; color: #fbbf24; border-radius: 8px;">
  <h3 style="margin: 0 0 10px 0;">${bannerConfig.title}</h3>
  <div style="font-size: 24px; font-weight: bold;">Starting Soon!</div>
  <script>
    // Add countdown timer logic here
    console.log('Tournament countdown widget loaded');
  </script>
</div>`;
        break;
    }

    navigator.clipboard.writeText(code);
    toast({
      title: "Code Copied",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} embed code copied to clipboard!`,
    });
  };

  const shareOnSocial = (platform: string) => {
    const text = `🏆 ${bannerConfig.title} - ${bannerConfig.subtitle}\n💰 Prize Pool: ${bannerConfig.prizePool}\n👥 ${bannerConfig.participants} Players\n📅 ${new Date(bannerConfig.date).toLocaleDateString()}\n\nJoin now!`;
    const url = 'https://your-domain.com/tournaments';

    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'reddit':
        shareUrl = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`;
        break;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
    
    toast({
      title: "Sharing",
      description: `Opening ${platform} to share your tournament!`,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-4">Tournament Promotion Tools</h1>
        <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto">
          Create stunning promotional materials for your tournaments. Generate banners, embed widgets, and share across social media.
        </p>
      </div>

      <Tabs defaultValue="banners" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="banners" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            Banners
          </TabsTrigger>
          <TabsTrigger value="widgets" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            Widgets
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Social Media
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="banners" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Banner Configuration</CardTitle>
                <CardDescription>Customize your tournament banner design</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Tournament Title</Label>
                    <Input
                      id="title"
                      value={bannerConfig.title}
                      onChange={(e) => setBannerConfig(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="subtitle">Subtitle</Label>
                    <Input
                      id="subtitle"
                      value={bannerConfig.subtitle}
                      onChange={(e) => setBannerConfig(prev => ({ ...prev, subtitle: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prizePool">Prize Pool</Label>
                    <Input
                      id="prizePool"
                      value={bannerConfig.prizePool}
                      onChange={(e) => setBannerConfig(prev => ({ ...prev, prizePool: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="participants">Participants</Label>
                    <Input
                      id="participants"
                      value={bannerConfig.participants}
                      onChange={(e) => setBannerConfig(prev => ({ ...prev, participants: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Tournament Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={bannerConfig.date}
                      onChange={(e) => setBannerConfig(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="color">Color Theme</Label>
                    <Select value={bannerConfig.color} onValueChange={(value) => setBannerConfig(prev => ({ ...prev, color: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="red">Red</SelectItem>
                        <SelectItem value="purple">Purple</SelectItem>
                        <SelectItem value="green">Green</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="style">Banner Style</Label>
                    <Select value={bannerConfig.style} onValueChange={(value) => setBannerConfig(prev => ({ ...prev, style: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="gaming">Gaming</SelectItem>
                        <SelectItem value="minimalist">Minimalist</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="showPrize"
                      checked={bannerConfig.showPrize}
                      onCheckedChange={(checked) => setBannerConfig(prev => ({ ...prev, showPrize: checked }))}
                    />
                    <Label htmlFor="showPrize">Show Prize</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="showDate"
                      checked={bannerConfig.showDate}
                      onCheckedChange={(checked) => setBannerConfig(prev => ({ ...prev, showDate: checked }))}
                    />
                    <Label htmlFor="showDate">Show Date</Label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={generateBanner} className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    Generate Preview
                  </Button>
                  <Button onClick={downloadBanner} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Banner Preview</CardTitle>
                <CardDescription>Live preview of your tournament banner</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <canvas 
                    ref={canvasRef}
                    className="w-full h-auto border"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="widgets" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Tournament Widget
                </CardTitle>
                <CardDescription>Embeddable tournament information widget</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <h3 className="font-semibold">High Noon Showdown</h3>
                    <p className="text-sm text-muted-foreground">Elite Tournament</p>
                    <div className="flex justify-between mt-2">
                      <span className="text-sm">Prize Pool</span>
                      <span className="font-bold">$800</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-sm">Players</span>
                      <span>32/32</span>
                    </div>
                    <Button size="sm" className="w-full mt-3">Join Tournament</Button>
                  </div>
                  <Button 
                    onClick={() => copyEmbedCode('widget')} 
                    className="w-full"
                    variant="outline"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Embed Code
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Countdown Widget
                </CardTitle>
                <CardDescription>Live countdown to tournament start</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/50 text-center">
                    <h3 className="font-semibold">Tournament Starts In</h3>
                    <div className="text-2xl font-bold mt-2">02:45:30</div>
                    <div className="text-sm text-muted-foreground">Hours : Minutes : Seconds</div>
                    <Button size="sm" className="mt-3">Register Now</Button>
                  </div>
                  <Button 
                    onClick={() => copyEmbedCode('countdown')} 
                    className="w-full"
                    variant="outline"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Embed Code
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Prize Pool Widget
                </CardTitle>
                <CardDescription>Dynamic prize pool display</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/50 text-center">
                    <div className="text-sm text-muted-foreground">Total Prize Pool</div>
                    <div className="text-3xl font-bold text-primary">$800</div>
                    <div className="text-sm text-muted-foreground">32 Participants</div>
                    <div className="flex justify-center gap-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <Button 
                    onClick={() => copyEmbedCode('banner')} 
                    className="w-full"
                    variant="outline"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Embed Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Social Media Templates</CardTitle>
                <CardDescription>Ready-to-share content for your social platforms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Twitter/X Post</h3>
                  <div className="text-sm bg-muted p-3 rounded">
                    🏆 {bannerConfig.title} - {bannerConfig.subtitle}<br/>
                    💰 Prize Pool: {bannerConfig.prizePool}<br/>
                    👥 {bannerConfig.participants} Players<br/>
                    📅 {new Date(bannerConfig.date).toLocaleDateString()}<br/><br/>
                    Join now! 🎮 #Gaming #Tournament #Esports
                  </div>
                  <Button 
                    onClick={() => shareOnSocial('twitter')} 
                    className="w-full mt-2"
                    variant="outline"
                  >
                    Share on Twitter/X
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Facebook Post</h3>
                  <div className="text-sm bg-muted p-3 rounded">
                    🎮 Get ready for the ultimate gaming showdown!<br/><br/>
                    🏆 {bannerConfig.title}<br/>
                    💰 Prize Pool: {bannerConfig.prizePool}<br/>
                    📅 Date: {new Date(bannerConfig.date).toLocaleDateString()}<br/>
                    👥 {bannerConfig.participants} skilled players competing<br/><br/>
                    Don't miss out on the action! Register now and show your skills! 🚀
                  </div>
                  <Button 
                    onClick={() => shareOnSocial('facebook')} 
                    className="w-full mt-2"
                    variant="outline"
                  >
                    Share on Facebook
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Share Options</CardTitle>
                <CardDescription>Share across multiple platforms instantly</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={() => shareOnSocial('twitter')}
                    className="flex items-center gap-2"
                    variant="outline"
                  >
                    <Share2 className="w-4 h-4" />
                    Twitter/X
                  </Button>
                  <Button 
                    onClick={() => shareOnSocial('facebook')}
                    className="flex items-center gap-2"
                    variant="outline"
                  >
                    <Share2 className="w-4 h-4" />
                    Facebook
                  </Button>
                  <Button 
                    onClick={() => shareOnSocial('linkedin')}
                    className="flex items-center gap-2"
                    variant="outline"
                  >
                    <Share2 className="w-4 h-4" />
                    LinkedIn
                  </Button>
                  <Button 
                    onClick={() => shareOnSocial('reddit')}
                    className="flex items-center gap-2"
                    variant="outline"
                  >
                    <Share2 className="w-4 h-4" />
                    Reddit
                  </Button>
                </div>

                <div className="mt-6 p-4 border rounded-lg">
                  <h3 className="font-semibold mb-3">Hashtag Suggestions</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">#Gaming</Badge>
                    <Badge variant="secondary">#Tournament</Badge>
                    <Badge variant="secondary">#Esports</Badge>
                    <Badge variant="secondary">#Competition</Badge>
                    <Badge variant="secondary">#PrizePool</Badge>
                    <Badge variant="secondary">#GamerLife</Badge>
                    <Badge variant="secondary">#SkillBased</Badge>
                    <Badge variant="secondary">#JoinNow</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Banner Views
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">12,543</div>
                <p className="text-sm text-muted-foreground">Total banner impressions</p>
                <div className="text-sm text-green-600 mt-1">+15% from last week</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Widget Clicks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">1,847</div>
                <p className="text-sm text-muted-foreground">Widget interactions</p>
                <div className="text-sm text-green-600 mt-1">+23% from last week</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Social Shares
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">456</div>
                <p className="text-sm text-muted-foreground">Social media shares</p>
                <div className="text-sm text-green-600 mt-1">+8% from last week</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Popular Promotion Materials</CardTitle>
              <CardDescription>See which promotional content performs best</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">Elite Tournament Banner</div>
                    <div className="text-sm text-muted-foreground">Created 2 days ago</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">2,341 views</div>
                    <div className="text-sm text-green-600">+12% CTR</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">Countdown Widget</div>
                    <div className="text-sm text-muted-foreground">Created 1 week ago</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">1,876 views</div>
                    <div className="text-sm text-green-600">+8% CTR</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">Social Media Template</div>
                    <div className="text-sm text-muted-foreground">Created 3 days ago</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">967 shares</div>
                    <div className="text-sm text-green-600">+15% CTR</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Promotion;