import { createContext } from "react";
import type { I18nInstance } from "../types/index.js";

export const TranslationContext = createContext<I18nInstance | null>(null);
