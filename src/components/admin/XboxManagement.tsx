import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gamepad2, Settings, Search } from "lucide-react";
import { XboxConfigure } from "./XboxConfigure";
import { VerifyXboxProfile } from "./VerifyXboxProfile";

export function XboxManagement() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="h-6 w-6 text-primary" />
            Xbox Live Integration Management
          </CardTitle>
          <CardDescription>
            Configure Xbox console integration and verify player profiles for automated gaming tournaments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="setup" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="setup" className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4" />
                Setup
              </TabsTrigger>
              <TabsTrigger value="configure" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuration
              </TabsTrigger>
              <TabsTrigger value="verify" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Profile Verification
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="setup" className="mt-6">
              <div className="space-y-6">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold mb-3 text-lg">🚀 Simple Setup Steps</h3>
                  <div className="space-y-4 text-sm">
                    <div className="space-y-2">
                      <p className="font-medium">Step 1: Open Your Computer's Terminal</p>
                      <p className="text-muted-foreground pl-4">• On Windows: Press Win+R, type "cmd", press Enter</p>
                      <p className="text-muted-foreground pl-4">• On Mac: Press Cmd+Space, type "terminal", press Enter</p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="font-medium">Step 2: Copy & Paste This Command</p>
                      <div className="bg-background border rounded p-3 font-mono text-xs">
                        <code>
                          supabase secrets set \<br />
                          &nbsp;&nbsp;ENCRYPTION_KEY="your-32-character-key-here" \<br />
                          &nbsp;&nbsp;AZURE_TENANT_ID="your-azure-tenant-id" \<br />
                          &nbsp;&nbsp;AZURE_AUTH_URL="https://login.microsoftonline.com" \<br />
                          &nbsp;&nbsp;AZURE_TOKEN_PATH="/oauth2/v2.0/token"
                        </code>
                      </div>
                      <p className="text-muted-foreground pl-4">• Replace "your-32-character-key-here" with any random 32-letter password</p>
                      <p className="text-muted-foreground pl-4">• Replace "your-azure-tenant-id" with your Microsoft Azure ID</p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="font-medium">Step 3: Press Enter</p>
                      <p className="text-muted-foreground pl-4">The command will save your settings securely</p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="font-medium">Step 4: Come Back Here</p>
                      <p className="text-muted-foreground pl-4">Once done, use the "Configuration" tab above to enter your Xbox details</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="configure" className="mt-6">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">Configure your Xbox console integration for automated tournament management:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li><strong>Console IP:</strong> Local network IP address of your Xbox console</li>
                    <li><strong>API Key:</strong> Xbox Live API key for profile verification and stats</li>
                    <li><strong>Validation:</strong> Real-time testing of console connectivity and API access</li>
                  </ul>
                </div>
                <XboxConfigure />
              </div>
            </TabsContent>
            
            <TabsContent value="verify" className="mt-6">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">Verify Xbox Live profiles using the configured API integration:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li><strong>Real-time Verification:</strong> Direct lookup against Xbox Live API</li>
                    <li><strong>XUID Resolution:</strong> Get unique Xbox User ID for each gamertag</li>
                    <li><strong>Profile Validation:</strong> Ensure gamertag exists and is accessible</li>
                  </ul>
                </div>
                <VerifyXboxProfile onVerified={(data) => {
                  console.log('Profile verified:', data);
                }} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integration Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-semibold text-primary">Automated Verification</h4>
              <p className="text-sm text-muted-foreground">
                Automatically verify player stats and match results without manual intervention.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-primary">Real-time Stats</h4>
              <p className="text-sm text-muted-foreground">
                Pull live player statistics directly from Xbox Live for accurate tournament seeding.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-primary">Fair Play</h4>
              <p className="text-sm text-muted-foreground">
                Prevent cheating and ensure fair competition through automated stat verification.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}