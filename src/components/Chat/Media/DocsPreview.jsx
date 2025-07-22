import DocPreview from "./DocPreview";

const DocsPreview = ({ files }) => {
  return (
    files.length > 0 && (
      <div className="flex flex-wrap">
        {files.map((file) => {
          return (
            <DocPreview file={file} key={file.id || file.temp_id} />
          );
        })}
      </div>
    )
  );
}

DocsPreview.displayName = 'DocsPreview';

export default DocsPreview;