import { MESSAGE_VARIANTS } from "@/constants";
import { motion } from 'framer-motion';
/**
 * Renders the date separator UI.
 */
const DateSeparator = ({ dateString }) => {
  return (
    <motion.div

      variants={MESSAGE_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      className="item-date flex justify-center items-baseline py-3"
      style={{
        // backdropFilter: 'blur(10px)'
      }}
    >
      <hr className="flex-1 border-t border" />
      {/* <div className="text-muted-foreground px-3 py-1 rounded-full text-xs font-medium">
                      </div> */}
      <span className="px-3 text-sidebar text-[12px] font-medium" style={{ width: 'fit-content' }}>
        {dateString}
      </span>
      <hr className="flex-1 border-t border" />
    </motion.div>
  )
};

export default DateSeparator;