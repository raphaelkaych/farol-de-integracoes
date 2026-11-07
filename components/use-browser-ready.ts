"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export function useBrowserReady() {
  return useSyncExternalStore(subscribe, clientReady, serverReady);
}
