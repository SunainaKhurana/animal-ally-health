
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SymptomReport {
  id: number;
  pet_id: string;
  symptoms: string[];
  notes?: string;
  photo_url?: string;
  reported_on: string;
  created_at: string;
  diagnosis?: string;
  ai_response?: string;
  severity_level?: 'mild' | 'moderate' | 'severe';
  is_resolved?: boolean;
  resolved_at?: string;
  ai_severity_analysis?: string;
  recurring_note?: string;
}

export const useSymptomReports = (petId?: string) => {
  const [reports, setReports] = useState<SymptomReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
  }, [petId]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('symptom_reports')
        .select('*')
        .order('reported_on', { ascending: false });

      if (petId) {
        query = query.eq('pet_id', petId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setReports((data || []) as SymptomReport[]);
    } catch (error) {
      console.error('Error fetching symptom reports:', error);
      toast({
        title: "Error",
        description: "Failed to load symptom reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addSymptomReport = async (
    petId: string,
    symptoms: string[],
    notes?: string,
    photo?: File,
    chatContext?: any[]
  ) => {
    console.log('Starting symptom report submission...', { petId, symptoms: symptoms.length, hasNotes: !!notes, hasPhoto: !!photo });
    
    try {
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Authentication error:', authError);
        throw new Error('Authentication failed. Please sign in again.');
      }
      if (!user) {
        console.error('No authenticated user found');
        throw new Error('Please sign in to submit a report.');
      }
      
      console.log('User authenticated successfully:', user.id);

      let photoUrl: string | undefined;

      // Upload photo if provided
      if (photo) {
        console.log('Starting photo upload...', { fileName: photo.name, fileSize: photo.size });
        
        const fileExt = photo.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        // Create bucket if it doesn't exist (with better error handling)
        try {
          const { error: bucketError } = await supabase.storage
            .createBucket('symptom-photos', { public: true });
          
          if (bucketError && !bucketError.message.includes('already exists')) {
            console.error('Bucket creation error:', bucketError);
          } else {
            console.log('Storage bucket ready');
          }
        } catch (bucketErr) {
          console.log('Bucket creation info:', bucketErr);
        }
        
        // Upload file with retry logic
        let uploadAttempts = 0;
        const maxAttempts = 3;
        let uploadData;
        let uploadError;
        
        while (uploadAttempts < maxAttempts) {
          uploadAttempts++;
          console.log(`Photo upload attempt ${uploadAttempts}/${maxAttempts}`);
          
          const result = await supabase.storage
            .from('symptom-photos')
            .upload(fileName, photo);
          
          uploadData = result.data;
          uploadError = result.error;
          
          if (!uploadError) {
            console.log('Photo uploaded successfully');
            break;
          }
          
          console.error(`Upload attempt ${uploadAttempts} failed:`, uploadError);
          
          if (uploadAttempts < maxAttempts) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
          }
        }

        if (uploadError) {
          console.error('All upload attempts failed:', uploadError);
          throw new Error(`Photo upload failed: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('symptom-photos')
          .getPublicUrl(fileName);

        photoUrl = publicUrl;
        console.log('Photo URL generated:', photoUrl);
      }

      // Prepare data for insertion
      const insertData: any = {
        pet_id: petId,
        notes: notes || null,
        photo_url: photoUrl || null,
        diagnosis: null,
        ai_response: null
      };

      // Handle symptoms appropriately
      if (symptoms.length > 0) {
        insertData.symptoms = symptoms;
      } else {
        insertData.symptoms = null;
      }

      console.log('Inserting symptom report:', { ...insertData, photo_url: photoUrl ? '[URL_SET]' : null });

      // Insert with retry logic
      let insertAttempts = 0;
      const maxInsertAttempts = 3;
      let data;
      let error;
      
      while (insertAttempts < maxInsertAttempts) {
        insertAttempts++;
        console.log(`Database insert attempt ${insertAttempts}/${maxInsertAttempts}`);
        
        const result = await supabase
          .from('symptom_reports')
          .insert(insertData)
          .select()
          .single();
        
        data = result.data;
        error = result.error;
        
        if (!error) {
          console.log('Database insert successful:', data);
          break;
        }
        
        console.error(`Insert attempt ${insertAttempts} failed:`, error);
        
        if (insertAttempts < maxInsertAttempts) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 500 * insertAttempts));
        }
      }

      if (error) {
        console.error('All insert attempts failed:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('Symptom report submitted successfully:', data.id);

      // Send to Make.com webhook for AI analysis
      await sendToMakeWebhook(data.id, petId, symptoms, notes, photoUrl, chatContext);

      toast({
        title: "Success",
        description: "Your request has been submitted successfully",
      });

      fetchReports();
      return data;
    } catch (error: any) {
      console.error('Error in addSymptomReport:', error);
      
      // Provide specific error messages based on error type
      let userMessage = "Failed to submit your request. Please try again.";
      
      if (error.message?.includes('Authentication')) {
        userMessage = "Please sign in again to submit your request.";
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        userMessage = "Network error. Please check your connection and try again.";
      } else if (error.message?.includes('Photo upload')) {
        userMessage = "Photo upload failed. Please try with a smaller image.";
      } else if (error.message?.includes('Database')) {
        userMessage = "Database error. Please try again in a moment.";
      }
      
      toast({
        title: "Error",
        description: userMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const sendToMakeWebhook = async (
    reportId: number,
    petId: string,
    symptoms: string[],
    notes?: string,
    photoUrl?: string | null,
    chatContext?: any[]
  ) => {
    try {
      // Generate unique request ID for tracking
      const requestId = `symptom-report-${reportId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log(`Sending to Make.com webhook for report [${requestId}]:`, { reportId, symptoms: symptoms.length, hasNotes: !!notes, hasPhoto: !!photoUrl });
      
      // Get pet details for context
      const { data: pet } = await supabase
        .from('pets')
        .select('name, breed, species, age_years, age_months, weight_kg, gender, pre_existing_conditions')
        .eq('id', petId)
        .single();

      // Get recent health reports for additional context
      const { data: recentReports } = await supabase
        .from('health_reports')
        .select('report_type, ai_diagnosis, key_findings, report_date')
        .eq('pet_id', petId)
        .order('created_at', { ascending: false })
        .limit(5);

      // Get recent symptom reports for pattern analysis
      const { data: recentSymptoms } = await supabase
        .from('symptom_reports')
        .select('symptoms, diagnosis, reported_on')
        .eq('pet_id', petId)
        .neq('id', reportId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Standardized payload structure matching health log queries
      const payload = {
        requestId,
        requestType: 'symptom_report',
        reportId,
        petId,
        query: notes || '', // Use notes as query text for symptom reports
        symptoms,
        notes: notes || '',
        photoUrl,
        petProfile: pet,
        recentHealthReports: recentReports || [],
        recentSymptomReports: recentSymptoms || [],
        chatContext: chatContext || [],
        timestamp: new Date().toISOString()
      };

      console.log(`Make.com webhook payload [${requestId}]:`, { 
        ...payload, 
        symptoms: payload.symptoms.length,
        chatContext: `${payload.chatContext.length} messages`,
        photoUrl: payload.photoUrl ? '[URL_SET]' : null
      });

      const response = await fetch('https://hook.eu2.make.com/es5jhdfotkr146ihy2ll02vjyuq75wdv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const responseText = await response.text();
        console.error(`Make.com webhook failed [${requestId}]:`, { status: response.status, statusText: response.statusText, responseText });
        throw new Error(`Make.com webhook failed: ${response.status} ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log(`Successfully sent to Make.com webhook [${requestId}]:`, { responseStatus: response.status, responseLength: responseText.length });
    } catch (error) {
      console.error('Error sending to Make.com webhook:', error);
      // Update report with error status
      await supabase
        .from('symptom_reports')
        .update({
          ai_response: 'AI analysis is currently unavailable. Please try again later.',
          severity_level: 'Unknown',
        })
        .eq('id', reportId);
    }
  };

  const markAsResolved = async (reportId: number) => {
    try {
      const { error } = await supabase
        .from('symptom_reports')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Health log marked as resolved",
      });

      fetchReports();
    } catch (error) {
      console.error('Error marking as resolved:', error);
      toast({
        title: "Error",
        description: "Failed to update health log",
        variant: "destructive",
      });
    }
  };

  return {
    reports,
    loading,
    addSymptomReport,
    markAsResolved,
    refetch: fetchReports
  };
};
