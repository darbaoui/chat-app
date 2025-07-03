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
      // Calculate the actual dimensions based on maxHeight constraint
    const maxHeight = 350;
    const aspectRatio = width / height;
    const displayHeight = Math.min(height, maxHeight);
    const displayWidth = displayHeight * aspectRatio;
      return (<div
        className={cn("rounded-2xl overflow-hidden relative flex")}
        style={{
          maxHeight: `${maxHeight}px`,
          width: 'fit-content'
        }}
        >
      
        <Image
          src={url}
          alt={name || 'Image'}
          width={displayWidth}
          height={displayHeight}
          style={{ 
            objectFit: 'contain',
            maxWidth: '100%',
            height: 'auto'
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
          src={url}
          alt={name || 'Image'}
          sizes="50vw"
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

  return (<div style={{ borderRadius: "8px",
  height: "100%",
  maxWidth: "550px",
  overflow: "hidden",
  width: "100%"}}>
  {images.length === 1 ? renderSingleImage() : renderGrid()}
</div>)
      
}


export default ImagesPreview;