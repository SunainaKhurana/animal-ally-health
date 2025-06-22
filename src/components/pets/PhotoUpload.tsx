
import { Camera, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoUploadProps {
  photo: string;
  onPhotoChange: (photo: string) => void;
}

const PhotoUpload = ({ photo, onPhotoChange }: PhotoUploadProps) => {
  const handlePhotoCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          onPhotoChange(result);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handlePhotoGallery = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          onPhotoChange(result);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
        {photo ? (
          <img src={photo} alt="Pet" className="w-full h-full rounded-full object-cover" />
        ) : (
          <Camera className="h-8 w-8 text-gray-400" />
        )}
      </div>
      <div className="flex space-x-2">
        <Button type="button" variant="outline" size="sm" onClick={handlePhotoCapture}>
          <Camera className="h-4 w-4 mr-1" />
          Camera
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handlePhotoGallery}>
          <ImageIcon className="h-4 w-4 mr-1" />
          Gallery
        </Button>
      </div>
    </div>
  );
};

export default PhotoUpload;
