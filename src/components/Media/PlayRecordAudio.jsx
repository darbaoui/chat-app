import { Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const PlayRecordAudio = () => {


    return (
        <div
            className={cn(
                'flex items-center justify-start h-auto gap-2.5 w-full px-1',

            )}
        >
            <Button
                className="rounded-full w-6.5 h-6.5 p-0 bg-chatBoxMe-foreground border-none"
            >
                <Play className="w-[14px]" size={14} />
            </Button>

            <div className={cn('relative w-[calc(100%_-_1.625rem_-_2.5rem)] bg-red-400 h-full')}>
                <span>Body</span>
            </div>

            <span
                key="duration"

                className="relative w-10 text-center text-chatBoxMe-foreground"
            >
                02:24
            </span>

        </div>
    )
}

export default PlayRecordAudio