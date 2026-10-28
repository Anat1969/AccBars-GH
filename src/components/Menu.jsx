import { createContext, useContext, useEffect, useRef, useState } from 'react';

export const DEV_SESSION_URL = 'https://claude.ai/code/session_018qeN18vi2Rjq2amttxBDQX';

const Ctx = createContext({ setPageItems: () => {}, pageItems: [], status: '', setStatus: () => {} });

export function MenuProvider({ children }) {
  const [pageItems, setPageItems] = useState([]);
  const [status, setStatus] = useState('');
  return <Ctx.Provider value={{ pageItems, setPageItems, status, setStatus }}>{children}</Ctx.Provider>;
}

export const useMenu = () => useContext(Ctx);

/** Pages put their editing actions (edit, delete) inside the A&I button, never as loose buttons. */
export function useMenuItems(items, deps) {
  const { setPageItems } = useContext(Ctx);
  useEffect(() => {
    setPageItems(items);
    return () => setPageItems([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** The A&I logo button from ai-menu.js. Copy link, dev chat and install live inside it. */
export function AIMenu({ extra = [] }) {
  const ref = useRef(null);
  const { pageItems, status } = useContext(Ctx);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.items = [...pageItems, ...extra];
    el.status = status;
  }, [pageItems, extra, status]);
  return <ai-menu ref={ref} chat={DEV_SESSION_URL} />;
}
