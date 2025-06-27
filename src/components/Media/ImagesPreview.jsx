import { MAX_IMAGE_SIZE } from "@/constants";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";

const ImagesPreview = ({images}) => {

    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const gridConfig = useMemo(() => {
        const count = images.length;
        if (count <= 2) return { cols: count, spans: [] };
        
        const remainder = count % 3;
        const spans = [];
        
        if (remainder === 1) spans[0] = 3;
        else if (remainder === 2) spans[0] = 2;
        
        return { cols: 3, spans };
    }, [images.length]);

    if (!images?.length) return null;


    const handleImageLoad = ({ naturalWidth, naturalHeight }) => {

      console.log('naturalWidth -->', naturalWidth)
      console.log('naturalHeight -->', naturalHeight)

       if (naturalWidth <= MAX_IMAGE_SIZE && naturalHeight <= MAX_IMAGE_SIZE) {
                  setDimensions({ width: naturalWidth, height: naturalHeight });
                } else {
                  const scale = Math.min(
                    MAX_IMAGE_SIZE / naturalWidth,
                    MAX_IMAGE_SIZE / naturalHeight,
                  );
                  setDimensions({
                    width: Math.round(naturalWidth * scale),
                    height: Math.round(naturalHeight * scale),
                  });
                }
       
  };


  const renderSingleImage = () => (
    <div
      className={`rounded-2xl overflow-hidden relative flex`}
      style={{ height: dimensions.height, width: dimensions.width>=MAX_IMAGE_SIZE ?'100%': dimensions.width }}>
     
      <Image
        src={images[0]?.url}
        alt={images[0]?.name || 'Image'}
        onLoadingComplete={handleImageLoad}
        width={dimensions.width}
        height={dimensions.height}
        style={{ 
          objectFit: 'cover',
        }}
      />
    </div>
  );


  const renderGridImage = (image, index) => {
    const colSpan = gridConfig.spans[index] || 1;
    
    return (
      <div
        key={image.id || index}
        className={`relative  h-36 ${
          colSpan === 3 ? 'col-span-3' : colSpan === 2 ? 'col-span-2' : ''
        }`}
      >
        <Image
          src={image.url}
          alt={image.name || 'Image'}
          fill
          sizes="100vw"
          style={{ 
            objectFit: 'cover',
           
          }}
        />
        
      </div>
    );
  };

  const renderGrid = () => (
    <div className={`grid rounded-3xl overflow-hidden w-full grid-cols-${gridConfig.cols}`}>
      {images.map(renderGridImage)}
    </div>
  );

  return images.length === 1 ? renderSingleImage() : renderGrid()

      
}

ImagesPreview.displayName = 'ImagesPreview';

export default ImagesPreview;