
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { calculateAge } from "@/lib/dateUtils";

interface DateOfBirthSelectorProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
}

const DateOfBirthSelector = ({ value, onChange }: DateOfBirthSelectorProps) => {
  const currentAge = value ? calculateAge(value) : null;

  return (
    <div>
      <Label>Date of Birth *</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal mt-1",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            disabled={(date) => date > new Date() || date < new Date("1990-01-01")}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {currentAge && (
        <p className="text-sm text-gray-600 mt-1">Current age: {currentAge}</p>
      )}
    </div>
  );
};

export default DateOfBirthSelector;
