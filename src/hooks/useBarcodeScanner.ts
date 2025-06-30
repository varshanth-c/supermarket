
// import { useRef, useCallback } from 'react';
// import jsQR from 'jsqr';

// export const useBarcodeScanner = () => {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const streamRef = useRef<MediaStream | null>(null);

//   const startScanning = useCallback(async (onScan: (code: string) => void) => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ 
//         video: { facingMode: 'environment' } 
//       });
      
//       if (videoRef.current) {
//         videoRef.current.srcObject = stream;
//         streamRef.current = stream;
        
//         const scanFrame = () => {
//           if (videoRef.current && canvasRef.current) {
//             const video = videoRef.current;
//             const canvas = canvasRef.current;
//             const ctx = canvas.getContext('2d');
            
//             if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
//               canvas.width = video.videoWidth;
//               canvas.height = video.videoHeight;
//               ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              
//               const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//               const code = jsQR(imageData.data, imageData.width, imageData.height);
              
//               if (code) {
//                 onScan(code.data);
//                 stopScanning();
//                 return;
//               }
//             }
//           }
//           requestAnimationFrame(scanFrame);
//         };
        
//         videoRef.current.addEventListener('loadedmetadata', () => {
//           scanFrame();
//         });
//       }
//     } catch (error) {
//       console.error('Error accessing camera:', error);
//       throw new Error('Unable to access camera');
//     }
//   }, []);

//   const stopScanning = useCallback(() => {
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach(track => track.stop());
//       streamRef.current = null;
//     }
//   }, []);

//   return {
//     videoRef,
//     canvasRef,
//     startScanning,
//     stopScanning
//   };
// };

// useBarcodeScanner.ts
import { useEffect, useRef } from 'react';

export const useBarcodeScanner = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startScanning = async (onDetect: (barcode: string) => void) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const detectBarcode = () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const context = canvasRef.current.getContext('2d');
        if (!context) return;
        
        // Draw video frame to canvas
        context.drawImage(
          videoRef.current,
          0, 0,
          canvasRef.current.width,
          canvasRef.current.height
        );
        
        // Get image data from canvas
        const imageData = context.getImageData(
          0, 0,
          canvasRef.current.width,
          canvasRef.current.height
        );
        
        // Here you would integrate a barcode detection library
        // For demo purposes, we'll simulate detection
        setTimeout(() => {
          onDetect('DEMO-BARCODE-12345');
        }, 1000);
      };
      
      setInterval(detectBarcode, 2000);
    } catch (error) {
      throw new Error('Camera access denied');
    }
  };

  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return { videoRef, canvasRef, startScanning, stopScanning };
};