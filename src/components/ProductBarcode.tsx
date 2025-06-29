
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
