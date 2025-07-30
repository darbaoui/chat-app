
import InputMediaPreview from './Media/InputMediaPreview';

const MediaPreviewBar = ({ hasMedia, currentUploadingMessage, handleRemoveFile }) => {
    if (!hasMedia) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-2 pt-2">
            {currentUploadingMessage.media.map((file) => (
                <InputMediaPreview
                    key={file.temp_id || file.id}
                    file={file}
                    onRemove={handleRemoveFile}
                />
            ))}
        </div>
    );
};

export default MediaPreviewBar;