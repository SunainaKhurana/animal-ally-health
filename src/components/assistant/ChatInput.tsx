
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatInputProps {
  onSendMessage: (message: string, imageFile?: File) => void;
  isLoading: boolean;
}

const ChatInput = ({ onSendMessage, isLoading }: ChatInputProps) => {
  const [inputMessage, setInputMessage] = useState('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const { toast } = useToast();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      toast({
        title: "Image Selected",
        description: "Image ready to send with your message",
      });
    }
  };

  const handleSend = () => {
    onSendMessage(inputMessage, uploadedImage || undefined);
    setInputMessage('');
    setUploadedImage(null);
  };

  return (
    <div className="border-t p-4">
      {uploadedImage && (
        <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800 flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Image ready: {uploadedImage.name}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUploadedImage(null)}
            className="ml-auto h-auto p-1 text-blue-600 hover:text-blue-800"
          >
            ×
          </Button>
        </div>
      )}
      
      <div className="flex gap-2">
        <Input
          placeholder="Ask me anything about your pet…"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          disabled={isLoading}
        />
        
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          id="image-upload"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => document.getElementById('image-upload')?.click()}
          disabled={isLoading}
        >
          <Camera className="h-4 w-4" />
        </Button>
        
        <Button
          onClick={handleSend}
          disabled={(!inputMessage.trim() && !uploadedImage) || isLoading}
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
