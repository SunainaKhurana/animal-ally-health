
export const preprocessImage = async (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Set canvas size
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw original image
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Enhance contrast and reduce noise
      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        
        // Increase contrast
        const contrast = 1.5;
        const enhanced = ((gray - 128) * contrast) + 128;
        
        // Apply threshold for better text recognition
        const final = enhanced > 128 ? 255 : 0;
        
        data[i] = final;     // R
        data[i + 1] = final; // G  
        data[i + 2] = final; // B
        // Alpha stays the same
      }
      
      // Put enhanced image data back
      ctx.putImageData(imageData, 0, 0);
      
      // Convert canvas to blob and create new file
      canvas.toBlob((blob) => {
        if (blob) {
          const enhancedFile = new File([blob], file.name, { type: 'image/png' });
          resolve(enhancedFile);
        } else {
          resolve(file);
        }
      }, 'image/png');
    };
    
    img.src = URL.createObjectURL(file);
  });
};
