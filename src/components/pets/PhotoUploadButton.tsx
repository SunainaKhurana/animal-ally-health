
import { useState } from "react";
import { Camera, ImageIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface PhotoUploadButtonProps {
  onPhotoSelect: (photoDataUrl: string) => void;
  hasExistingPhoto: boolean;
}

const PhotoUploadButton = ({ onPhotoSelect, hasExistingPhoto }: PhotoUploadButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleFileSelection = (capture?: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (capture) {
      input.setAttribute('capture', capture);
    }
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          onPhotoSelect(result);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {hasExistingPhoto ? "Edit Photo" : "Upload Photo"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2">
        <div className="space-y-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => handleFileSelection('environment')}
          >
            <Camera className="h-4 w-4 mr-2" />
            Take Photo
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => handleFileSelection()}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Choose from Gallery
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PhotoUploadButton;
