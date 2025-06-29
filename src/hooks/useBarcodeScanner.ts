
import { useRef, useCallback } from 'react';
import jsQR from 'jsqr';

export const useBarcodeScanner = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startScanning = useCallback(async (onScan: (code: string) => void) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        const scanFrame = () => {
          if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height);
              
              if (code) {
                onScan(code.data);
                stopScanning();
                return;
              }
            }
          }
          requestAnimationFrame(scanFrame);
        };
        
        video.addEventListener('loadedmetadata', () => {
          scanFrame();
        });
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      throw new Error('Unable to access camera');
    }
  }, []);

  const stopScanning = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  return {
    videoRef,
    canvasRef,
    startScanning,
    stopScanning
  };
};
</lov-add-dependency>

Now let me create a component for generating product barcodes:

<lov-write file_path="src/components/ProductBarcode.tsx">
import React from 'react';
import Barcode from 'react-barcode';

interface ProductBarcodeProps {
  value: string;
  displayValue?: boolean;
  width?: number;
  height?: number;
  format?: string;
}

export const ProductBarcode: React.FC<ProductBarcodeProps> = ({
  value,
  displayValue = true,
  width = 2,
  height = 100,
  format = 'CODE128'
}) => {
  if (!value || value.length === 0) {
    return <div className="text-gray-400">No barcode data</div>;
  }

  try {
    return (
      <div className="flex flex-col items-center space-y-2">
        <Barcode
          value={value}
          format={format}
          width={width}
          height={height}
          displayValue={displayValue}
          background="transparent"
          lineColor="#000000"
        />
      </div>
    );
  } catch (error) {
    return <div className="text-red-400">Invalid barcode data</div>;
  }
};
