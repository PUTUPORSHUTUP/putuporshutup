import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Archive, Upload, Edit, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Poster {
  id: string;
  title: string;
  image_url: string;
  description?: string;
  is_active: boolean;
  is_archived: boolean;
  display_order: number;
  event_type: string;
  created_at: string;
}

export default function PosterManagement() {
  const [posters, setPosters] = useState<Poster[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPoster, setNewPoster] = useState({
    title: "",
    image_url: "",
    description: "",
    event_type: "sunday_showdown",
    display_order: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPosters();
  }, []);

  const fetchPosters = async () => {
    try {
      const { data, error } = await supabase
        .from("posters")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setPosters(data || []);
    } catch (error) {
      console.error("Error fetching posters:", error);
      toast({
        title: "Error",
        description: "Failed to fetch posters",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPoster = async () => {
    if (!newPoster.title || !newPoster.image_url) {
      toast({
        title: "Error",
        description: "Title and image URL are required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("posters")
        .insert([newPoster]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Poster added successfully"
      });

      setNewPoster({
        title: "",
        image_url: "",
        description: "",
        event_type: "sunday_showdown",
        display_order: 0
      });

      fetchPosters();
    } catch (error) {
      console.error("Error adding poster:", error);
      toast({
        title: "Error",
        description: "Failed to add poster",
        variant: "destructive"
      });
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("posters")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Poster ${!currentStatus ? "activated" : "deactivated"}`
      });

      fetchPosters();
    } catch (error) {
      console.error("Error updating poster:", error);
      toast({
        title: "Error",
        description: "Failed to update poster",
        variant: "destructive"
      });
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const { error } = await supabase
        .from("posters")
        .update({ is_archived: true, is_active: false })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Poster archived successfully"
      });

      fetchPosters();
    } catch (error) {
      console.error("Error archiving poster:", error);
      toast({
        title: "Error",
        description: "Failed to archive poster",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this poster?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("posters")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Poster deleted successfully"
      });

      fetchPosters();
    } catch (error) {
      console.error("Error deleting poster:", error);
      toast({
        title: "Error",
        description: "Failed to delete poster",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading posters...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Add New Poster
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newPoster.title}
                onChange={(e) => setNewPoster({ ...newPoster, title: e.target.value })}
                placeholder="Enter poster title"
              />
            </div>
            <div>
              <Label htmlFor="event_type">Event Type</Label>
              <select
                id="event_type"
                value={newPoster.event_type}
                onChange={(e) => setNewPoster({ ...newPoster, event_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="sunday_showdown">Sunday Showdown</option>
                <option value="tournament">Tournament</option>
                <option value="promotion">Promotion</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              value={newPoster.image_url}
              onChange={(e) => setNewPoster({ ...newPoster, image_url: e.target.value })}
              placeholder="/lovable-uploads/your-image.jpg"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={newPoster.description}
              onChange={(e) => setNewPoster({ ...newPoster, description: e.target.value })}
              placeholder="Brief description of the poster"
            />
          </div>
          
          <div>
            <Label htmlFor="display_order">Display Order</Label>
            <Input
              id="display_order"
              type="number"
              value={newPoster.display_order}
              onChange={(e) => setNewPoster({ ...newPoster, display_order: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>
          
          <Button onClick={handleAddPoster} className="w-full">
            Add Poster
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Posters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posters.map((poster) => (
              <div key={poster.id} className="border rounded-lg p-4 space-y-3">
                <img
                  src={poster.image_url}
                  alt={poster.title}
                  className="w-full h-32 object-cover rounded"
                />
                
                <div>
                  <h3 className="font-semibold">{poster.title}</h3>
                  {poster.description && (
                    <p className="text-sm text-muted-foreground">{poster.description}</p>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant={poster.is_active ? "default" : "secondary"}>
                    {poster.is_active ? "Active" : "Inactive"}
                  </Badge>
                  {poster.is_archived && <Badge variant="destructive">Archived</Badge>}
                  <Badge variant="outline">{poster.event_type}</Badge>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={poster.is_active ? "destructive" : "default"}
                    onClick={() => handleToggleActive(poster.id, poster.is_active)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleArchive(poster.id)}
                    disabled={poster.is_archived}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(poster.id)}
                  >
                    <Trash2 className="h-4 w-4" />
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