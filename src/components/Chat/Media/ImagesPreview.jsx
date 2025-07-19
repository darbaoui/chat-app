import { cn } from "@/lib/utils";
import useMessageStore from "@/stores/MessageStore";
import { Loader } from "lucide-react";
import Image from "next/image";
import { useMemo, useCallback } from "react";


const SingleImageDisplay = ({ image, isUploading, uploadProgress, maxHeight = 350 }) => {

  //TODO add uploadProgress UI
  const { content, original_url, name, blur_placeholder, attributes: { width, height } = {} } = image;

  const src = isUploading ? content : original_url;
  const alt = name || 'Image';

  // Calculate dimensions for single image view
  const aspectRatio = (width && height) ? width / height : 1;
  const displayHeight = height ? Math.min(height, maxHeight) : maxHeight;
  const displayWidth = displayHeight * aspectRatio;

  return (
    <div
      className={cn("rounded-[10px] overflow-hidden relative flex")}
      style={{
        maxHeight: `${maxHeight}px`,
        width: 'fit-content'
      }}
    >
      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-background">
          <Loader className="animate-spin" />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        width={displayWidth}
        height={displayHeight}
        style={{
          objectFit: 'contain',
          maxWidth: '100%',
          height: 'auto'
        }}
        {...(!isUploading && { placeholder: "blur", blurDataURL: blur_placeholder })}
      />
    </div>
  );
};



const GridImageDisplay = ({ image, isUploading, uploadProgress, colSpan }) => {

  //TODO add uploadProgress UI

  const { content, original_url, name, blur_placeholder } = image;

  const src = isUploading ? content : original_url;

  const alt = name || 'Image';

  return (
    <div
      key={image.temp_id || image.id}
      className={cn('relative h-36', {
        'col-span-3': colSpan === 3,
        'col-span-2': colSpan === 2,
      })}
    >
      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-background z-[2]">
          <Loader className="animate-spin" />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        sizes="50vw"
        fill
        style={{
          objectFit: 'cover',
        }}
        {...(!isUploading && { placeholder: "blur", blurDataURL: blur_placeholder })}
      />
    </div>
  );
};


const ImagesPreview = ({ images }) => {

  const { uploadingMessages } = useMessageStore()

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

  const getUploadProgress = useCallback((image) => {
    if (!image.isUploading) {
      return 0;
    }
    const { temp_id, message_id } = image;
    const message = uploadingMessages.get(message_id);
    const imageUploading = message?.media?.find(file => file.temp_id === temp_id);
    return imageUploading?.upload_progress ?? 0;
  }, [uploadingMessages]);


  const renderSingleImage = () => {

    const imageData = images[0];
    const isUploading = imageData.isUploading;
    const uploadProgress = getUploadProgress(imageData);

    return <SingleImageDisplay image={imageData} isUploading={isUploading} uploadProgress={uploadProgress} />;
  }


  const renderGridImage = (image, index) => {

    const isUploading = image.isUploading;
    const colSpan = gridConfig.spans[index] || 1;
    const uploadProgress = getUploadProgress(image);

    return <GridImageDisplay image={image} isUploading={isUploading} uploadProgress={uploadProgress} colSpan={colSpan} key={image.temp_id || image.id} />
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