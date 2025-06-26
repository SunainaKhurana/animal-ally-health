
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { usePetContext } from '@/contexts/PetContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const QUICK_TAGS = [
  'Vomiting', 'Diarrhea', 'Low energy', 'Excessive drinking', 
  'Not eating', 'Limping', 'Scratching', 'Panting', 'Restless'
];

const QuickLogButton = () => {
  const { selectedPet } = usePetContext();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!selectedPet || (!notes.trim() && selectedTags.length === 0)) return;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Save to daily_checkins with notes and tags
      const logEntry = {
        pet_id: selectedPet.id,
        user_id: user.id,
        energy_level: 'normal' as const,
        hunger_level: 'normal' as const,
        thirst_level: 'normal' as const,
        stool_consistency: 'normal' as const,
        notes: `${selectedTags.join(', ')}${selectedTags.length > 0 && notes ? '; ' : ''}${notes}`.trim(),
        checkin_date: new Date().toISOString().split('T')[0]
      };

      const { error } = await supabase
        .from('daily_checkins')
        .insert(logEntry);

      if (error) throw error;

      toast({
        title: "Logged successfully! 📝",
        description: `Entry saved for ${selectedPet.name}`,
      });

      // Reset form
      setNotes('');
      setSelectedTags([]);
      setShowForm(false);
    } catch (error) {
      console.error('Error saving log:', error);
      toast({
        title: "Error",
        description: "Failed to save log entry",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedPet) return null;

  if (!showForm) {
    return (
      <Button 
        onClick={() => setShowForm(true)}
        className="w-full bg-orange-500 hover:bg-orange-600"
      >
        <Plus className="h-4 w-4 mr-2" />
        Log something about {selectedPet.name}
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Quick Log for {selectedPet.name}</h4>
          <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium mb-2">Quick tags (optional):</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map(tag => (
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
          </div>

          <div>
            <Textarea
              placeholder="What did you notice? Any behavior changes, symptoms, or observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isLoading} className="flex-1">
              Save Log
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

export default QuickLogButton;
