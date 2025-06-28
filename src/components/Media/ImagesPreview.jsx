import { cn } from "@/lib/utils";
import Image from "next/image";
import { useMemo } from "react";

const ImagesPreview = ({images}) => {

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

        className={cn('relative h-36', {
          'col-span-3': colSpan === 3,
          'col-span-2': colSpan === 2,
        })}
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
    <div className={cn("grid rounded-3xl overflow-hidden", images.length === 2 ? 'grid-cols-2': 'grid-cols-3')}>
      {images.map(renderGridImage)}
    </div>
  );

  return images.length === 1 ? renderSingleImage() : renderGrid()

      
}


export default ImagesPreview;