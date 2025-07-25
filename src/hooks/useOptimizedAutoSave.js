// Optimized auto-save hook
import { useCallback, useRef, useMemo } from 'react';
import { useDebounce } from 'use-debounce';

export const useOptimizedAutoSave = ({
  content,
  currentDraft,
  authUser,
  isSubmitting,
  createDraft,
  updateDraftContent,
  debounceDelay = 2000,
}) => {
  // Use refs to store latest values without causing re-renders
  const contentRef = useRef(content);
  const isSubmittingRef = useRef(isSubmitting);
  const currentDraftRef = useRef(currentDraft);
  const authUserRef = useRef(authUser);

  // Update refs when values change
  contentRef.current = content;
  isSubmittingRef.current = isSubmitting;
  currentDraftRef.current = currentDraft;
  authUserRef.current = authUser;

  // Memoize the save function to prevent recreation on every render
  const performSave = useCallback(
    (debouncedContent) => {
      // Use refs to get latest values without depending on them in useCallback
      const latestIsSubmitting = isSubmittingRef.current;
      const latestCurrentDraft = currentDraftRef.current;
      const latestAuthUser = authUserRef.current;
      const latestContent = contentRef.current;

      // Early returns for conditions that should prevent saving
      if (latestIsSubmitting || !debouncedContent || !latestContent) {
        return;
      }

      // Only save if content actually changed
      if (debouncedContent === latestContent) {
        if (latestCurrentDraft?.id) {
          updateDraftContent(debouncedContent);
        } else if (latestAuthUser) {
          createDraft(latestAuthUser, debouncedContent);
        }
      }
    },
    [createDraft, updateDraftContent] // Only depend on stable functions
  );

  // Debounce only the content, not the entire save operation
  const [debouncedContent] = useDebounce(content, debounceDelay);

  // Memoize the previous debounced content to avoid unnecessary saves
  const prevDebouncedContentRef = useRef(debouncedContent);

  // Only trigger save when debounced content actually changes
  useMemo(() => {
    if (
      debouncedContent &&
      debouncedContent !== prevDebouncedContentRef.current
    ) {
      prevDebouncedContentRef.current = debouncedContent;
      performSave(debouncedContent);
    }
  }, [debouncedContent, performSave]);

  //   return {
  //     debouncedContent,
  //     isDebouncing: content !== debouncedContent,
  //   };
};
