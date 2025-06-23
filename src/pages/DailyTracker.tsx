
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Calendar } from 'lucide-react';
import { usePets } from '@/hooks/usePets';
import { useDailyCheckins } from '@/hooks/useDailyCheckins';
import PetSelector from '@/components/pets/PetSelector';

const DailyTracker = () => {
  const navigate = useNavigate();
  const { pets } = usePets();
  const { addDailyCheckin } = useDailyCheckins();
  
  const [selectedPet, setSelectedPet] = useState<any>(null);
  const [energyLevel, setEnergyLevel] = useState<'low' | 'normal' | 'hyper'>('normal');
  const [hungerLevel, setHungerLevel] = useState<'not eating' | 'normal' | 'overeating'>('normal');
  const [thirstLevel, setThirstLevel] = useState<'less' | 'normal' | 'more'>('normal');
  const [stoolConsistency, setStoolConsistency] = useState<'normal' | 'soft' | 'diarrhea'>('normal');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentDate = new Date().toLocaleDateString();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPet) {
      alert('Please select a pet');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDailyCheckin({
        pet_id: selectedPet.id,
        energy_level: energyLevel,
        hunger_level: hungerLevel,
        thirst_level: thirstLevel,
        stool_consistency: stoolConsistency,
        notes: notes || undefined,
        checkin_date: new Date().toISOString().split('T')[0]
      });
      navigate('/health');
    } catch (error) {
      console.error('Failed to submit daily check-in:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Daily Tracker</h1>
        </div>

        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>Today: {currentDate}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pet Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Pet</CardTitle>
            </CardHeader>
            <CardContent>
              <PetSelector
                pets={pets}
                selectedPet={selectedPet}
                onSelectPet={setSelectedPet}
                placeholder="Choose a pet for daily tracking"
              />
            </CardContent>
          </Card>

          {/* Energy Level */}
          <Card>
            <CardHeader>
              <CardTitle>Energy Level</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={energyLevel} onValueChange={(value: any) => setEnergyLevel(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="energy-low" />
                  <Label htmlFor="energy-low">Low - Lethargic, sleeping more than usual</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="energy-normal" />
                  <Label htmlFor="energy-normal">Normal - Typical activity level</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hyper" id="energy-hyper" />
                  <Label htmlFor="energy-hyper">Hyper - More active than usual</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Hunger Level */}
          <Card>
            <CardHeader>
              <CardTitle>Hunger Level</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={hungerLevel} onValueChange={(value: any) => setHungerLevel(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="not eating" id="hunger-not-eating" />
                  <Label htmlFor="hunger-not-eating">Not eating - Refusing food</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="hunger-normal" />
                  <Label htmlFor="hunger-normal">Normal - Eating regular amounts</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="overeating" id="hunger-overeating" />
                  <Label htmlFor="hunger-overeating">Overeating - Eating more than usual</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Thirst Level */}
          <Card>
            <CardHeader>
              <CardTitle>Thirst Level</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={thirstLevel} onValueChange={(value: any) => setThirstLevel(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="less" id="thirst-less" />
                  <Label htmlFor="thirst-less">Less - Drinking less water than usual</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="thirst-normal" />
                  <Label htmlFor="thirst-normal">Normal - Regular water intake</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="more" id="thirst-more" />
                  <Label htmlFor="thirst-more">More - Drinking more water than usual</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Stool Consistency */}
          <Card>
            <CardHeader>
              <CardTitle>Stool Consistency</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={stoolConsistency} onValueChange={(value: any) => setStoolConsistency(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="stool-normal" />
                  <Label htmlFor="stool-normal">Normal - Well-formed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="soft" id="stool-soft" />
                  <Label htmlFor="stool-soft">Soft - Slightly loose</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="diarrhea" id="stool-diarrhea" />
                  <Label htmlFor="stool-diarrhea">Diarrhea - Liquid/very loose</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Any additional observations about your pet's behavior, appetite, or health today..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !selectedPet}
          >
            {isSubmitting ? 'Saving...' : 'Save Daily Check-in'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default DailyTracker;
