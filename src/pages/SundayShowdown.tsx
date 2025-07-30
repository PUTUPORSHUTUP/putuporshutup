import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, DollarSign, Target, Star } from "lucide-react";
import sundayShowdownImage from "@/assets/sunday-showdown.jpg";

export default function SundayShowdown() {
  const [registered, setRegistered] = useState(false);

  const handleRegister = () => {
    setRegistered(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-red-50 dark:from-amber-950 dark:via-orange-950 dark:to-red-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden min-h-screen">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${sundayShowdownImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center space-y-6">
            <Badge className="bg-amber-600 hover:bg-amber-700 text-amber-100 text-lg px-4 py-2">
              🤠 HIGH NOON SHOWDOWN
            </Badge>
            
            <h1 className="text-6xl md:text-8xl font-bold text-amber-100 drop-shadow-2xl">
              SUNDAY
              <br />
              <span className="text-orange-300">SHOWDOWN</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-amber-200 max-w-3xl mx-auto font-medium">
              When the clock strikes noon, only the fastest guns survive. 
              <br />
              <span className="text-orange-300">COD meets the Wild West</span>
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <div className="flex items-center gap-2 bg-black/40 rounded-full px-4 py-2">
                <Clock className="h-5 w-5 text-amber-400" />
                <span className="text-amber-100 font-semibold">12:00 PM Sharp</span>
              </div>
              <div className="flex items-center gap-2 bg-black/40 rounded-full px-4 py-2">
                <DollarSign className="h-5 w-5 text-green-400" />
                <span className="text-amber-100 font-semibold">$50 Buy-In</span>
              </div>
              <div className="flex items-center gap-2 bg-black/40 rounded-full px-4 py-2">
                <Target className="h-5 w-5 text-red-400" />
                <span className="text-amber-100 font-semibold">Winner Takes All</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tournament Details */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/30">
            <CardHeader>
              <CardTitle className="text-amber-800 dark:text-amber-200 flex items-center gap-2">
                <Target className="h-6 w-6" />
                Rules of Engagement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-amber-700 dark:text-amber-300">
                • Single elimination bracket
                <br />
                • Best of 3 rounds per duel
                <br />
                • No camping in spawn
                <br />
                • Honor system - fastest draw wins
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/30">
            <CardHeader>
              <CardTitle className="text-orange-800 dark:text-orange-200 flex items-center gap-2">
                <Users className="h-6 w-6" />
                Bounty Hunters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">32</div>
                <div className="text-orange-700 dark:text-orange-300">Max Outlaws</div>
                <div className="text-sm text-orange-600 dark:text-orange-400 mt-2">24 registered</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/30">
            <CardHeader>
              <CardTitle className="text-red-800 dark:text-red-200 flex items-center gap-2">
                <Star className="h-6 w-6" />
                Sheriff's Prize
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">$1,600</div>
                <div className="text-red-700 dark:text-red-300">Total Bounty</div>
                <div className="text-sm text-red-600 dark:text-red-400 mt-2">Winner takes 80%</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Registration Section */}
        <Card className="max-w-2xl mx-auto border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-amber-800 dark:text-amber-200">
              Join the Showdown
            </CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">
              Registration closes at 11:45 AM - Don't miss your shot
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!registered ? (
              <>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-amber-100 dark:bg-amber-900 rounded-lg">
                    <span className="font-semibold text-amber-800 dark:text-amber-200">Entry Fee:</span>
                    <span className="text-xl font-bold text-amber-600 dark:text-amber-400">$50.00</span>
                  </div>
                  
                  <div className="text-sm text-amber-700 dark:text-amber-300 space-y-2">
                    <p>• Must have Xbox Live account linked</p>
                    <p>• Tournament starts exactly at 12:00 PM</p>
                    <p>• Late arrivals will be disqualified</p>
                  </div>
                </div>

                <Button 
                  onClick={handleRegister}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-amber-100 font-semibold text-lg py-6"
                >
                  🤠 Register for High Noon Showdown
                </Button>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="text-6xl">🎯</div>
                <h3 className="text-xl font-bold text-green-600 dark:text-green-400">
                  You're Registered, Partner!
                </h3>
                <p className="text-amber-700 dark:text-amber-300">
                  See you at high noon for the ultimate showdown
                </p>
                <Badge className="bg-green-600 text-green-100">
                  Confirmed Gunslinger
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}