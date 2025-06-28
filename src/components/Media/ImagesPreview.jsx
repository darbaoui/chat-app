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



  const renderSingleImage = () => {
    const imageData = images[0];
    const {url, name, dimensions: {width, height}} = imageData
    return (<div
      className={`rounded-2xl overflow-hidden relative flex`}
      >
     
      <Image
        loading="lazy"
        src={url}
        alt={name || 'Image'}
        width={width}
        height={height}
        style={{ 
          objectFit: 'contain',
        }}
      />
    </div>
  );
}


  const renderGridImage = (image, index) => {
    const colSpan = gridConfig.spans[index] || 1;
    const {id, url, name, dimensions: {width, height}} = image
    return (
      <div
        key={id || index}
        className={`relative  h-36 ${
          colSpan === 3 ? 'grid-cols-3' : colSpan === 2 ? 'grid-cols-2' : ''
        }`}
      >
        <Image
          loading="lazy"
          src={url}
          alt={name || 'Image'}
          sizes={width}
          fill
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


export default ImagesPreview;