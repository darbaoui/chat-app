import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { DefaultEmojis, EmojiPicker } from '@/components/ui/EmojiPicker';

const AttachmentMenu = ({
    isOpenDropDown,
    setIsDropDownOpen,
    handleEmojiSelect,
    handleFileChange,
    itemVariants,
}) => {

    return (
        <motion.div
            key="plus-btn"
            variants={itemVariants}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            <DropdownMenu open={isOpenDropDown} onOpenChange={setIsDropDownOpen}>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="!w-8 !h-8 rounded-full bg-chat border-none text-meta-icon">
                        <Plus />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-3xl p-4" align="center">
                    <div className="w-full flex flex-col gap-2.5">
                        <div className="grid grid-cols-4">
                            {DefaultEmojis.map((emoji, index) => (
                                <Button
                                    key={index}
                                    variant="ghost"
                                    size="sm"
                                    className="!w-10 !h-7.5 text-2xl hover:scale-110 transition-transform"
                                    onClick={() => handleEmojiSelect({
                                        emoji
                                    })}
                                >
                                    {emoji}
                                </Button>
                            ))}

                            <div className="w-10 h-7.5 flex items-center justify-center">
                                <EmojiPicker
                                    onEmojiSelect={(emoji) => handleEmojiSelect(emoji)}
                                    preload={true} // Preload for better UX
                                >

                                    <Button variant="secondary" className="rounded-full !h-[22px] !w-[22px] !p-0">
                                        <Plus />
                                    </Button>
                                </EmojiPicker>
                            </div>
                        </div>
                        <Separator />

                        <label
                            htmlFor="file-upload"
                            className="inline-flex items-center justify-center rounded-md bg-chatBox hover:bg-accent h-9 hover:text-accent-foreground p-0 hover:opacity-100 cursor-pointer  text-title"
                        >

                            <span className="text-sm font-medium">
                                Attach a file
                            </span>
                            <input
                                id="file-upload"
                                multiple
                                name="file-upload"
                                type="file"
                                className="sr-only"
                                // accept="image/*"
                                onChange={handleFileChange}
                            />
                        </label>

                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </motion.div>
    )
}

export default AttachmentMenu