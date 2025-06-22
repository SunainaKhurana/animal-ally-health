
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
    setSelectedImage(photoDataUrl);
    setIsCropModalOpen(true);
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    onPhotoChange(croppedImageUrl);
    setSelectedImage("");
  };

  const handlePhotoClick = () => {
    if (photo) {
      // If there's an existing photo, allow editing it
      setSelectedImage(photo);
      setIsCropModalOpen(true);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <div 
        className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
        onClick={handlePhotoClick}
      >
        {photo ? (
          <img src={photo} alt="Pet" className="w-full h-full rounded-full object-cover" />
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
        onOpenChange={setIsCropModalOpen}
        imageSrc={selectedImage}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

export default PhotoUpload;
