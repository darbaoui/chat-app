import ProgressCircle from "@/components/ui/ProgressCircle";
import { MessageStatus } from "@/constants";
import { cn } from "@/lib/utils";
import useMessageStore from "@/stores/MessageStore";
import { Loader, LoaderCircle } from "lucide-react";
import Image from "next/image";
import { useMemo, useCallback } from "react";


const SingleImageDisplay = ({ image, uploadStatus, isUploadingFromLocal, uploadProgress, maxHeight = 200 }) => {

  //TODO add uploadProgress UI
  const { content, original_url, name, blur_placeholder, attributes: { width, height } = {} } = image;

  const readingFromLocalContent = isUploadingFromLocal && uploadStatus !== MessageStatus.COMPLETED
  const src = readingFromLocalContent ? content : original_url;
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
      {uploadStatus === MessageStatus.PENDING ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-background">
          <LoaderCircle className="animate-spin" />
        </div>
      ) : uploadStatus === MessageStatus.UPLOADING ?
        (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-background z-[2]">
            <div className="w-14 h-14 rounded-full bg-background flex items-center justify-center">
              <ProgressCircle progressValue={uploadProgress >= 95 ? 95 : uploadProgress} progressColor="text-black/50" size={44} />
            </div>
          </div>
        ) : null
      }

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
        {...(!readingFromLocalContent && blur_placeholder && { placeholder: "blur", blurDataURL: blur_placeholder })}
      />
    </div>
  );
};



const GridImageDisplay = ({ image, uploadStatus, isUploadingFromLocal, uploadProgress, colSpan }) => {

  //TODO add uploadProgress UI
  const { content, original_url, name, blur_placeholder } = image;

  const readingFromLocalContent = isUploadingFromLocal && uploadStatus !== MessageStatus.COMPLETED
  const src = readingFromLocalContent ? content : original_url;

  const alt = name || 'Image';


  return (
    <div
      key={image.temp_id || image.id}
      className={cn('relative h-36 w-full', {
        'col-span-3': colSpan === 3,
        'col-span-2': colSpan === 2,
      })}
    >
      {uploadStatus === MessageStatus.PENDING ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-background z-[2]">
          <LoaderCircle className="animate-spin" />
        </div>
      ) : uploadStatus === MessageStatus.UPLOADING ?
        (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-background z-[2]">
            <div className="w-14 h-14 rounded-full bg-background flex items-center justify-center">
              <ProgressCircle progressValue={uploadProgress >= 95 ? 95 : uploadProgress} progressColor="text-black/50" size={44} />
            </div>
          </div>
        ) : null
      }


      <Image
        src={src}
        alt={alt}
        sizes="50vw"
        fill
        style={{
          objectFit: 'cover',
        }}
        {...(!readingFromLocalContent && blur_placeholder && { placeholder: "blur", blurDataURL: blur_placeholder })}
      />
    </div>
  );
};


const ImagesPreview = ({ images }) => {

  const { uploadingMessages } = useMessageStore()

  console.log('uploadingMessages -->', uploadingMessages)

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

  const getUploadMediaData = useCallback((image) => {
    if (!image.isUploading) {
      return null;
    }
    const { temp_id, message_id, message_temp_id } = image;
    const message = uploadingMessages.get(message_id || message_temp_id);
    const imageUploading = message?.media?.find(file => file.temp_id === temp_id);
    return imageUploading;
  }, [uploadingMessages]);


  const renderSingleImage = () => {

    const imageData = images[0];
    const imageUploading = getUploadMediaData(imageData);

    console.log('imageUploading -->', imageUploading)
    const uploadProgress = imageUploading?.upload_progress ?? 0;
    // const isPending = imageUploading.upload_status === MessageStatus.PENDING;
    const isUploadingFromLocal = imageData?.isUploading;

    const image = isUploadingFromLocal ? imageUploading : imageData;
    if (!image) {
      return null;
    }
    return <SingleImageDisplay
      image={image}
      uploadStatus={imageUploading?.upload_status}
      isUploadingFromLocal={isUploadingFromLocal}
      uploadProgress={uploadProgress} />;
  }


  const renderGridImage = (imageData, index) => {

    const colSpan = gridConfig.spans[index] || 1;
    const imageUploading = getUploadMediaData(imageData);
    const isUploadingFromLocal = imageData?.isUploading;
    const uploadProgress = imageUploading?.upload_progress ?? 0;
    const image = isUploadingFromLocal ? imageUploading : imageData;
    if (!image) {
      return null;
    }
    return <GridImageDisplay
      image={image}
      uploadStatus={imageUploading?.upload_status}
      isUploadingFromLocal={isUploadingFromLocal}
      uploadProgress={uploadProgress}
      colSpan={colSpan} key={image.temp_id || image.id} />
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