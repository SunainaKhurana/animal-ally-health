import React from 'react';
import { Clock, Calendar, RefreshCw, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDate } from '@/lib/dateUtils';

interface Prescription {
  id: string;
  title: string;
  prescribed_date: string;
  status: string;
  medications?: any;
  created_at: string;
}

interface MedicationCardProps {
  prescription: Prescription;
}

export const MedicationCard: React.FC<MedicationCardProps> = ({ prescription }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{prescription.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getStatusColor(prescription.status)}>
                {prescription.status}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit Medication</DropdownMenuItem>
              <DropdownMenuItem>Mark as Taken</DropdownMenuItem>
              <DropdownMenuItem>Pause</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Medication Details */}
        {prescription.medications && (
          <div className="space-y-2 mb-3">
            {/* TODO: Parse and display medication details */}
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>Daily dosage</span>
              </div>
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Prescribed {formatDate(prescription.prescribed_date)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="outline" className="flex-1">
            <Clock className="h-3 w-3 mr-1" />
            Mark as Taken
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <RefreshCw className="h-3 w-3 mr-1" />
            Refill
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};