import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const uploadedImages = [
  "13412423-6f9e-439b-bdfe-130d9db066d8.png",
  "1930f879-1b39-46b0-979f-fd849f770134.png",
  "3f2b1827-906a-40f5-b33e-a7bd8db103de.png",
  "45d7073b-0f70-4555-95ab-c80162886810.png",
  "4e3b5b2c-0ba4-4d1b-988c-245b68239da1.png",
  "614ba95f-d5a8-45c0-8be7-21124354ccc8.png",
  "81b4ce6a-1bc5-43e5-ae0e-ed2e03fe7e02.png",
  "95838ad7-77ab-4870-8d4a-47199b17b7f6.png",
  "aea2fe21-2dfc-4892-a6b7-c51889f74b09.png",
  "b715dd0a-2c87-45cb-8734-ada1261dd7a4.png",
  "d749df3e-de70-4e7f-89c3-95222b6896c6.png",
  "f281d141-8e53-4ee2-8718-7c846e155f55.png"
];

export default function PosterSelector() {
  const [sundayPoster, setSundayPoster] = useState<string>("");
  const [midweekPoster, setMidweekPoster] = useState<string>("");

  const handleSelection = (filename: string, type: "sunday" | "midweek") => {
    if (type === "sunday") {
      setSundayPoster(filename);
    } else {
      setMidweekPoster(filename);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Select Tournament Posters</h1>
      
      {/* Selection Summary */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Sunday Showdown Poster</CardTitle>
          </CardHeader>
          <CardContent>
            {sundayPoster ? (
              <div>
                <img 
                  src={`/lovable-uploads/${sundayPoster}`} 
                  alt="Selected Sunday poster"
                  className="w-full max-w-xs rounded-lg mb-2"
                />
                <p className="text-sm text-gray-600">Selected: {sundayPoster}</p>
              </div>
            ) : (
              <p className="text-gray-500">No poster selected yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">Midweek Mayhem Poster</CardTitle>
          </CardHeader>
          <CardContent>
            {midweekPoster ? (
              <div>
                <img 
                  src={`/lovable-uploads/${midweekPoster}`} 
                  alt="Selected Midweek poster"
                  className="w-full max-w-xs rounded-lg mb-2"
                />
                <p className="text-sm text-gray-600">Selected: {midweekPoster}</p>
              </div>
            ) : (
              <p className="text-gray-500">No poster selected yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {uploadedImages.map((filename) => (
          <Card key={filename} className="overflow-hidden">
            <CardContent className="p-4">
              <img 
                src={`/lovable-uploads/${filename}`} 
                alt={`Uploaded image ${filename}`}
                className="w-full h-48 object-cover rounded-lg mb-3"
              />
              <p className="text-xs text-gray-500 mb-3 font-mono break-all">{filename}</p>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={sundayPoster === filename ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => handleSelection(filename, "sunday")}
                >
                  {sundayPoster === filename ? "✓ Sunday" : "Sunday"}
                </Button>
                <Button 
                  size="sm" 
                  variant={midweekPoster === filename ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => handleSelection(filename, "midweek")}
                >
                  {midweekPoster === filename ? "✓ Midweek" : "Midweek"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Instructions */}
      {sundayPoster && midweekPoster && (
        <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-800 mb-2">Ready to proceed!</h3>
          <p className="text-green-700 text-sm mb-3">
            Tell me to rename these files:
          </p>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• <code>{sundayPoster}</code> → <code>sunday_showdown_fresh.png</code></li>
            <li>• <code>{midweekPoster}</code> → <code>midweek_mayhem_fresh.png</code></li>
          </ul>
        </div>
      )}
    </div>
  );
}