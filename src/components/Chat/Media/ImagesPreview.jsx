import { cn } from "@/lib/utils";
import useMessageStore from "@/stores/MessageStore";
import { Loader } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";

const ImagesPreview = ({ images }) => {

  const {uploadingMessages} = useMessageStore()

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



  const renderUploadingImage = (image) => {


    const { content, tempId, message_id, name, attributes: { width, height } } = image

    const message = uploadingMessages.get(message_id)

    const media = message?.media

    const imageUploading = media.find(file => file.tempId === tempId);


    const isUploading =  imageUploading?.isUploading

    const maxHeight = 350;
    const aspectRatio = width / height;
    const displayHeight = Math.min(height, maxHeight);
    const displayWidth = displayHeight * aspectRatio;
    return (<div
      className={cn("rounded-[10px] overflow-hidden relative flex")}
      style={{
        maxHeight: `${maxHeight}px`,
        width: 'fit-content'
      }}
    >
      {
        isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-background">
                <Loader className="animate-spin" />
            </div>
        )
      }
       <Image
        src={decodeURIComponent(content)}
        alt={name || 'Image'}
        width={displayWidth}
        height={displayHeight}
        style={{
          objectFit: 'contain',
          maxWidth: '100%',
          height: 'auto'
        }}
      />
      </div>)
  }

  const renderUploadedImage = (image) => {

    const { original_url,  name, blur_placeholder, attributes: { width, height } } = image
    // Calculate the actual dimensions based on maxHeight constraint
    const maxHeight = 350;
    const aspectRatio = width / height;
    const displayHeight = Math.min(height, maxHeight);
    const displayWidth = displayHeight * aspectRatio;
    return (<div
      className={cn("rounded-[10px] overflow-hidden relative flex")}
      style={{
        maxHeight: `${maxHeight}px`,
        width: 'fit-content'
      }}
    >
  
      <Image
        src={original_url}
        alt={name || 'Image'}
         placeholder="blur"
          blurDataURL={blur_placeholder}
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


  const renderSingleImage = () => {
    
    const imageData = images[0];
    const {isUploading} = imageData

    if(isUploading)
    {
      return renderUploadingImage(imageData)
    }

    return renderUploadedImage(imageData)
  }


  const renderGridImage = (image, index) => {
    const colSpan = gridConfig.spans[index] || 1;
    const { id, original_url, name, blur_placeholder, attributes: { width, height } } = image
    return (
      <div
        key={id || index}

        className={cn('relative h-36', {
          'col-span-3': colSpan === 3,
          'col-span-2': colSpan === 2,
        })}
      >
        <Image
          src={original_url}
          alt={name || 'Image'}
          sizes="50vw"
          placeholder="blur"
          blurDataURL={blur_placeholder}
          fill
          style={{
            objectFit: 'cover',
          }}
        />

      </div>
    );
  };

  const renderGrid = () => (
    <div className={cn("grid rounded-[10px] overflow-hidden", images.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
      {images.map(renderGridImage)}
    </div>
  );

  return (<div style={{
    height: "100%",
    maxWidth: "550px",
    overflow: "hidden",
    width: "100%"
  }}>
    {images.length === 1 ? renderSingleImage() : renderGrid()}
  </div>)

}


export default ImagesPreview;