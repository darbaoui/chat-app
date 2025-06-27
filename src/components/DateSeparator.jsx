import { MESSAGE_VARIANTS } from "@/constants";
import { motion } from 'framer-motion';
import { StickyIndexContext } from "./MessageVList";
import { useContext } from "react";
import { cn } from "@/lib/utils";
/**
 * Renders the date separator UI.
 */
const DateSeparator = ({ dateString, index }) => {
  const { activeIndex } = useContext(StickyIndexContext);

  const isSticky = activeIndex === index;

  const hrVariants = {
    visible: { opacity: 1, transition: { duration: 0.2 } },
    hidden: { opacity: 0, transition: { duration: 0.2 } },
  };

  
  return (
    <motion.div
      variants={MESSAGE_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      className="item-date flex justify-center items-center py-3 z-10"
    >
     <motion.hr
        className="flex-1 bg-border h-px"
        variants={hrVariants}
        animate={isSticky ? "hidden" : "visible"}
      />

     <motion.div
        layout
        className={cn("text-[12px] font-medium px-3", isSticky ? "bg-muted border text-muted-foreground rounded-full py-1" : "text-sidebar")}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {dateString}
      </motion.div>
      <motion.hr className="flex-1 bg-border h-px" variants={hrVariants} animate={isSticky ? "hidden" : "visible"} />
    </motion.div>
  )
};

export default DateSeparator;