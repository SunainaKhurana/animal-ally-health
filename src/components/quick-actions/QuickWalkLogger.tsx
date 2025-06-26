
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, Clock } from 'lucide-react';
import { usePetContext } from '@/contexts/PetContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const WALK_TAGS = [
  'Pooped', 'Peed', 'Low energy', 'High energy', 'Ate something', 
  'Met other dogs', 'Pulled on leash', 'Good behavior', 'Anxious'
];

const QuickWalkLogger = () => {
  const { selectedPet, pets } = usePetContext();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [selectedPets, setSelectedPets] = useState<string[]>([]);
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const togglePet = (petId: string) => {
    setSelectedPets(prev => 
      prev.includes(petId) 
        ? prev.filter(id => id !== petId)
        : [...prev, petId]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSave = async () => {
    const petsToLog = selectedPets.length > 0 ? selectedPets : (selectedPet ? [selectedPet.id] : []);
    
    if (petsToLog.length === 0) return;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const now = new Date();
      const walkNotes = `${selectedTags.join(', ')}${selectedTags.length > 0 && notes ? '; ' : ''}${notes}`.trim();

      // Create walk logs for each selected pet
      const walkLogs = petsToLog.map(petId => ({
        pet_id: petId,
        user_id: user.id,
        start_time: now.toISOString(),
        duration_minutes: duration ? parseInt(duration) : null,
        notes: walkNotes || null
      }));

      const { error } = await supabase
        .from('walks')
        .insert(walkLogs);

      if (error) throw error;

      const petNames = petsToLog.map(id => pets.find(p => p.id === id)?.name).filter(Boolean).join(', ');
      
      toast({
        title: "Walk logged! 🚶‍♂️",
        description: `Walk saved for ${petNames}`,
      });

      // Reset form
      setSelectedPets([]);
      setDuration('');
      setNotes('');
      setSelectedTags([]);
      setShowForm(false);
    } catch (error) {
      console.error('Error saving walk:', error);
      toast({
        title: "Error",
        description: "Failed to save walk",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!showForm) {
    return (
      <Button 
        onClick={() => setShowForm(true)}
        className="w-full bg-blue-500 hover:bg-blue-600"
      >
        <Plus className="h-4 w-4 mr-2" />
        Log Walk
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Log Walk</h4>
          <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          {pets.length > 1 && (
            <div>
              <Label className="text-sm font-medium">Which pets went on this walk?</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {pets.map(pet => (
                  <Badge
                    key={pet.id}
                    variant={selectedPets.includes(pet.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => togglePet(pet.id)}
                  >
                    {pet.name}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {selectedPets.length === 0 && selectedPet ? `Default: ${selectedPet.name}` : ''}
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="duration" className="text-sm font-medium">Duration (minutes, optional)</Label>
            <Input
              id="duration"
              type="number"
              placeholder="30"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Walk notes (optional):</Label>
            <div className="flex flex-wrap gap-2 mt-2 mb-3">
              {WALK_TAGS.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
            <Textarea
              placeholder="How was the walk? Any observations or behaviors?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isLoading} className="flex-1">
              <Clock className="h-4 w-4 mr-2" />
              Save Walk
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickWalkLogger;
