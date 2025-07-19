import { useEffect, useState, useCallback, useRef } from 'react';
import {
  dropTargetForExternal,
  monitorForExternal,
} from '@atlaskit/pragmatic-drag-and-drop/external/adapter';
import {
  containsFiles,
  getFiles,
} from '@atlaskit/pragmatic-drag-and-drop/external/file';
import invariant from 'tiny-invariant';
import { preventUnhandled } from '@atlaskit/pragmatic-drag-and-drop/prevent-unhandled';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';

/**
 * Custom hook for handling file drag-and-drop functionality.
 * @param {React.RefObject} dropTargetRef - A ref to the DOM element that will serve as the drop target.
 * @returns {{dragState: string, droppedFiles: File[] | null, clearDroppedFiles: () => void}}
 *          - Current drag state, array of dropped files, and a function to clear dropped files.
 */
export const useFileDrop = (dropTargetRef) => {
  const [dragState, setDragState] = useState('idle');
  const [droppedFiles, setDroppedFiles] = useState(null);

  useEffect(() => {
    if (!dropTargetRef.current) {
      return;
    }

    const el = dropTargetRef.current;
    invariant(el);

    const cleanup = combine(
      dropTargetForExternal({
        element: el,
        canDrop: containsFiles,
        onDragEnter: () => setDragState('over'),
        onDragLeave: () => setDragState('potential'),
        onDrop: async ({ source }) => {
          const files = await getFiles({ source });
          setDroppedFiles(files);
        },
      }),
      monitorForExternal({
        canMonitor: containsFiles,
        onDragStart: () => {
          setDragState('potential');
          preventUnhandled.start();
        },
        onDrop: () => {
          setDragState('idle');
          preventUnhandled.stop();
        },
      }),
    );

    return cleanup;
  }, [dropTargetRef]);

  // Reset droppedFiles after they have been processed by the consumer
  const clearDroppedFiles = useCallback(() => {
    setDroppedFiles(null);
  }, []);

  return { dragState, droppedFiles, clearDroppedFiles };
};