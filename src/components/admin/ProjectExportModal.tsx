import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, Download, FileText, Database, Settings, ExternalLink } from 'lucide-react';

interface ProjectExportModalProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const ProjectExportModal = ({ isOpen, onOpenChange }: ProjectExportModalProps) => {
  const [email, setEmail] = useState('tournament-architect@putuporshutup.solutions');
  const [loading, setLoading] = useState(false);
  const [githubRepo, setGithubRepo] = useState('');
  const [generateTempAdmin, setGenerateTempAdmin] = useState(true);
  const { toast } = useToast();

  const handleSendProjectInfo = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let adminCredentials = undefined;
      
      if (generateTempAdmin) {
        // Generate temporary admin credentials (24h expiry)
        const tempPassword = Math.random().toString(36).slice(-12);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        
        adminCredentials = {
          tempUser: 'temp-architect@puosu.dev',
          tempPassword: tempPassword,
          expiresAt: expiresAt
        };
      }

      const { data, error } = await supabase.functions.invoke('send-project-info', {
        body: { 
          recipientEmail: email,
          githubRepo: githubRepo || undefined,
          adminCredentials 
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Project Information Sent!",
        description: `Technical documentation sent to ${email}`,
      });

      onOpenChange?.(false);
      
    } catch (error) {
      console.error('Error sending project info:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send project information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportLinks = [
    {
      title: "Supabase Dashboard",
      url: "https://supabase.com/dashboard/project/mwuakdaogbywysjplrmx",
      icon: Database,
      description: "Database management and SQL editor"
    },
    {
      title: "Edge Functions",
      url: "https://supabase.com/dashboard/project/mwuakdaogbywysjplrmx/functions",
      icon: Settings,
      description: "Serverless functions and API endpoints"
    },
    {
      title: "Authentication Settings",
      url: "https://supabase.com/dashboard/project/mwuakdaogbywysjplrmx/auth/users",
      icon: Settings,
      description: "User management and auth configuration"
    }
  ];

  const modalContent = (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="text-sm font-medium">
            Recipient Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            className="mt-1"
          />
        </div>

        <div>
          <label htmlFor="github" className="text-sm font-medium">
            GitHub Repository (Optional)
          </label>
          <Input
            id="github"
            value={githubRepo}
            onChange={(e) => setGithubRepo(e.target.value)}
            placeholder="https://github.com/username/repo"
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Click GitHub button in top right to export code first
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="tempAdmin"
            checked={generateTempAdmin}
            onChange={(e) => setGenerateTempAdmin(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="tempAdmin" className="text-sm">
            Generate 24h temporary admin credentials
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium">📋 What will be sent:</h4>
        <div className="grid gap-2">
          <Badge variant="outline" className="justify-start">
            <FileText className="w-3 h-3 mr-2" />
            Complete technical documentation
          </Badge>
          <Badge variant="outline" className="justify-start">
            <Database className="w-3 h-3 mr-2" />
            Database schema and access info
          </Badge>
          <Badge variant="outline" className="justify-start">
            <Settings className="w-3 h-3 mr-2" />
            System architecture overview
          </Badge>
          {generateTempAdmin && (
            <Badge variant="secondary" className="justify-start">
              🔑 Temporary admin access (24h)
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium">🔗 Quick Access Links:</h4>
        <div className="space-y-2">
          {exportLinks.map((link) => (
            <div key={link.title} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center space-x-2">
                <link.icon className="w-4 h-4" />
                <div>
                  <div className="text-sm font-medium">{link.title}</div>
                  <div className="text-xs text-muted-foreground">{link.description}</div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(link.url, '_blank')}
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Button 
        onClick={handleSendProjectInfo} 
        disabled={loading}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Mail className="w-4 h-4 mr-2 animate-spin" />
            Sending Documentation...
          </>
        ) : (
          <>
            <Mail className="w-4 h-4 mr-2" />
            Send Project Information
          </>
        )}
      </Button>
    </div>
  );

  if (isOpen !== undefined) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Project Information
            </DialogTitle>
          </DialogHeader>
          {modalContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          <Download className="w-4 h-4 mr-2" />
          Export Project Info
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Project Information
          </DialogTitle>
        </DialogHeader>
        {modalContent}
      </DialogContent>
    </Dialog>
  );
};