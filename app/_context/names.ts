import { createContext } from "react";

export type NamesMap = Map<number, string>;

export const NamesContext = createContext<NamesMap>(new Map());
