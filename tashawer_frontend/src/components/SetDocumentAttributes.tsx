'use client';

import { useEffect } from 'react';

interface SetDocumentAttributesProps {
  locale: string;
  dir: 'ltr' | 'rtl';
}

export function SetDocumentAttributes({ locale, dir }: SetDocumentAttributesProps) {
  useEffect(() => {
    // Set lang and dir on the html element
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  return null;
}
