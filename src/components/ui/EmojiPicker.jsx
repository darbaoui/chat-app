import { useState, useCallback, Suspense, lazy } from 'react';

// import EmojiPicker from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { LoaderCircle, Smile } from 'lucide-react';
const LazyEmojiPicker = lazy(() => import('emoji-picker-react'));

export const DefaultEmojis = [
    '😊', '😅', '🙁', '❤️', '🤲🏼', '🇸🇦', '👍'
]
export const EmojiPickerLoading = () => (
    <div className="flex items-center justify-center h-96 w-80">
        <div className="flex flex-col items-center gap-3">
            <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading emojis...</p>
        </div>
    </div>
);
// Reusable EmojiPickerComponent
export const EmojiPicker = ({
    children,
    onEmojiSelect,
    trigger,
    side = "right",
    align = "end",
    className = "",
    disabled = false,
    ...pickerProps
}) => {
    const [open, setOpen] = useState(false);

    const handleEmojiClick = useCallback((emojiData) => {
        onEmojiSelect?.(emojiData);
        setOpen(false);
    }, [onEmojiSelect]);

    // Default trigger button
    const defaultTrigger = (
        <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className={className}
        >
            <Smile className="h-4 w-4" />
        </Button>
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {children || defaultTrigger}
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-0 border-0 rounded-lg"
                side={side}
                align={align}
            >
                <Suspense fallback={<EmojiPickerLoading />}>
                    <LazyEmojiPicker
                        onEmojiClick={handleEmojiClick}
                        width={350}
                        height={400}
                        previewConfig={{
                            showPreview: true,
                            defaultEmoji: "1f60a",
                            defaultCaption: "What's your mood?"
                        }}
                        searchPlaceholder="Search emojis..."
                        skinTonesDisabled={false}
                        lazyLoadEmojis={true}
                        emojiStyle="native"
                        {...pickerProps}
                    />
                </Suspense>
            </PopoverContent>
        </Popover>
    );
};

EmojiPicker.displayName = "EmojiPicker";
