import { createContext, useContext } from "react";

export type HomeShellContextValue = {
  effectiveHomeTemplateRoute: string;
  effectiveHeaderVariantRoute: string;
};

const defaultValue: HomeShellContextValue = {
  effectiveHomeTemplateRoute: "/",
  effectiveHeaderVariantRoute: "/",
};

export const HomeShellContext = createContext<HomeShellContextValue>(defaultValue);

export const useHomeShellContext = (): HomeShellContextValue => useContext(HomeShellContext);
