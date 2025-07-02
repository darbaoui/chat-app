'use client'

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const MenuItem = (props) => {
  const { iconComp, title, action, isActive, className } = props;
  const [isActiveClass, setIsActiveClass] = useState('')
  useEffect(() => {
    setIsActiveClass((isActive() ? 'text-title' : 'text-description'));
  }, [props])
    

    return (
      <div className='w-7 h-7'>
        
        <Button variant="ghost" onClick={action} className="!w-7 !h-7" size="icon">
            {iconComp(isActiveClass)}
        </Button>
      </div>
    );
}

export default MenuItem;
