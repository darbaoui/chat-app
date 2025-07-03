
/**
 * Renders the date separator UI.
 */
const DateSeparator = ({ dateString, index }) => {
  return (
    <div
      className="item-date flex justify-center items-baseline py-3 z-10"
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
    </div>
  )
};

export default DateSeparator;