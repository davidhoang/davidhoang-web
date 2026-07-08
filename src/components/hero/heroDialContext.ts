import { createContext } from 'react';
import { heroDialDefaults, type HeroDialValues } from './heroDialDefaults';

export const HeroDialContext = createContext<HeroDialValues>(heroDialDefaults);
