'use client'

import { Button } from '@/components/ui/button';

const MenuItem = (props) => {
  const { iconComp, action, isActive } = props;

  const isActiveClass = isActive?.() ? 'text-title' : 'text-description';

  return (
    <div className='w-7 h-7'>
      <Button variant="ghost" onClick={action} className="!w-7 !h-7" size="icon">
        {iconComp(isActiveClass)}
      </Button>
    </div>
  );
}

export default MenuItem;
