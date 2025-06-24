/**
 * Renders the date separator UI.
 */
const DateSeparator = ({ dateString }) => {
  return (
     <div className="sticky top-2.5 w-full flex items-center text-xs  justify-center pointer-events-none my-2  opacity-100 transition-opacity duration-300 z-10">
          <span className="text-meta-icon cursor-none pointer-events-auto py-[3px] px-2 rounded-full">
            {dateString}
          </span>
    </div>
  )
};

export default DateSeparator;