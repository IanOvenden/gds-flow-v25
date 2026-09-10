import { createContext, RefObject } from 'react';

export const BackButtonPortalContext = createContext<RefObject<HTMLDivElement> | null>(null);
