
import { useState } from "react";
import { Camera } from "lucide-react";
import PhotoUploadButton from "./PhotoUploadButton";
import ImageCropModal from "./ImageCropModal";

interface PhotoUploadProps {
  photo: string;
  onPhotoChange: (photo: string) => void;
}

const PhotoUpload = ({ photo, onPhotoChange }: PhotoUploadProps) => {
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  const handlePhotoSelect = (photoDataUrl: string) => {
    console.log('Photo selected for cropping:', photoDataUrl.substring(0, 50) + '...');
    setSelectedImage(photoDataUrl);
    setIsCropModalOpen(true);
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    console.log('Crop completed, updating photo:', croppedImageUrl.substring(0, 50) + '...');
    onPhotoChange(croppedImageUrl);
    setSelectedImage("");
    setIsCropModalOpen(false);
  };

  const handlePhotoClick = () => {
    if (photo) {
      console.log('Editing existing photo:', photo.substring(0, 50) + '...');
      // If there's an existing photo, allow editing it
      setSelectedImage(photo);
      setIsCropModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsCropModalOpen(false);
    setSelectedImage("");
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <div 
        className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
        onClick={handlePhotoClick}
      >
        {photo ? (
          <img 
            src={photo} 
            alt="Pet" 
            className="w-full h-full rounded-full object-cover"
            key={photo} // Force re-render when photo changes
          />
        ) : (
          <Camera className="h-8 w-8 text-gray-400" />
        )}
      </div>
      
      <PhotoUploadButton 
        onPhotoSelect={handlePhotoSelect}
        hasExistingPhoto={!!photo}
      />

      <ImageCropModal
        open={isCropModalOpen}
        onOpenChange={handleModalClose}
        imageSrc={selectedImage}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

export default PhotoUpload;
