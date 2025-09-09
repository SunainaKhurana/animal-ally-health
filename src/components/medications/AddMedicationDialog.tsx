import React, { useState } from 'react';
import { Calendar, Camera, Pill, Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useOptimizedPrescriptions } from '@/hooks/useOptimizedPrescriptions';
import { useAuth } from '@/contexts/AuthContext';

const medicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  nextDueDate: z.date().optional(),
  refills: z.number().min(0).optional(),
  notes: z.string().optional(),
});

type MedicationFormData = z.infer<typeof medicationSchema>;

interface AddMedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petId: string;
  petName: string;
  onMedicationAdded?: () => void;
}

const frequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'twice_daily', label: 'Twice Daily' },
  { value: 'three_times_daily', label: 'Three Times Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'sos', label: 'SOS (As Needed)' },
];

export const AddMedicationDialog: React.FC<AddMedicationDialogProps> = ({
  open,
  onOpenChange,
  petId,
  petName,
  onMedicationAdded,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { uploadPrescription } = useOptimizedPrescriptions();
  const [uploadMode, setUploadMode] = useState<'manual' | 'photo'>('manual');
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MedicationFormData>({
    resolver: zodResolver(medicationSchema),
  });

  const nextDueDate = watch('nextDueDate');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // TODO: Implement OCR extraction for medication data
      // For now, we'll just show a placeholder
      toast({
        title: 'Feature Coming Soon',
        description: 'Photo extraction will be available soon. Please fill the form manually.',
      });
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'Failed to process the image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: MedicationFormData) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to add medications.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const medicationData = {
        title: data.name,
        prescribedDate: data.nextDueDate ? data.nextDueDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        medications: [{
          name: data.name,
          dosage: data.dosage,
          frequency: data.frequency,
          nextDueDate: data.nextDueDate,
          refills: data.refills || 0,
          notes: data.notes || ''
        }]
      };

      // Create a dummy file for the prescription record
      const dummyFile = new File(['medication-record'], 'medication.txt', { type: 'text/plain' });
      
      await uploadPrescription(dummyFile, petId, medicationData);
      
      toast({
        title: 'Medication Added',
        description: `${data.name} has been added to ${petName}'s medications.`,
      });
      
      reset();
      onMedicationAdded?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add medication. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Add Medication for {petName}
          </DialogTitle>
        </DialogHeader>

        {/* Input Method Toggle */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={uploadMode === 'manual' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setUploadMode('manual')}
              >
                Manual Entry
              </Button>
              <Button
                type="button"
                variant={uploadMode === 'photo' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setUploadMode('photo')}
              >
                <Camera className="h-4 w-4 mr-2" />
                Photo Upload
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Photo Upload Section */}
        {uploadMode === 'photo' && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="border-2 border-dashed border-muted rounded-lg p-6">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a photo of the prescription or medication label
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="medication-photo"
                  />
                  <Label htmlFor="medication-photo">
                    <Button type="button" variant="outline" disabled={isUploading}>
                      {isUploading ? 'Processing...' : 'Choose Photo'}
                    </Button>
                  </Label>
                </div>
              </div>
              <Separator className="my-4" />
              <p className="text-xs text-muted-foreground text-center">
                After uploading, you can review and edit the extracted information below
              </p>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Medication Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Medication Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Rimadyl, Heartgard"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Dosage */}
          <div className="space-y-2">
            <Label htmlFor="dosage">Dosage *</Label>
            <Input
              id="dosage"
              placeholder="e.g., 25mg, 1 tablet, 2ml"
              {...register('dosage')}
            />
            {errors.dosage && (
              <p className="text-sm text-destructive">{errors.dosage.message}</p>
            )}
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label>Frequency *</Label>
            <Select onValueChange={(value) => setValue('frequency', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {frequencyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.frequency && (
              <p className="text-sm text-destructive">{errors.frequency.message}</p>
            )}
          </div>

          {/* Next Due Date */}
          <div className="space-y-2">
            <Label>Next Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !nextDueDate && 'text-muted-foreground'
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {nextDueDate ? format(nextDueDate, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={nextDueDate}
                  onSelect={(date) => setValue('nextDueDate', date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Number of Refills */}
          <div className="space-y-2">
            <Label htmlFor="refills">Number of Refills</Label>
            <Input
              id="refills"
              type="number"
              min="0"
              placeholder="0"
              {...register('refills', { valueAsNumber: true })}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional instructions or notes..."
              rows={3}
              {...register('notes')}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Medication'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};