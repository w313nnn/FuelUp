import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppState } from "../domain/models";
import { LocalRepository, type FuelUpRepository } from "../services/repository";
type Store = {
  state: AppState | null;
  update: (fn: (s: AppState) => AppState) => void;
  error: string;
  clearError: () => void;
};
const Context = createContext<Store | null>(null);
export function FuelUpProvider({
  children,
  repository,
}: {
  children: ReactNode;
  repository?: FuelUpRepository;
}) {
  const repo = useRef(
    repository ??
      new LocalRepository({
        getItem: (key) => window.localStorage.getItem(key),
        setItem: (key, value) => window.localStorage.setItem(key, value),
      }),
  );
  const [state, setState] = useState<AppState | null>(null),
    [error, setError] = useState("");
  const ready = useRef(false),
    queue = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    repo.current
      .load()
      .then((s) => {
        if (active) {
          setState(s);
          ready.current = true;
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!ready.current || !state) return;
    queue.current = queue.current
      .then(() => repo.current.save(state))
      .catch((e) => setError(e.message));
  }, [state]);
  return (
    <Context.Provider
      value={{
        state,
        update: setState as Store["update"],
        error,
        clearError: () => setError(""),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useFuelUp() {
  const value = useContext(Context);
  if (!value) throw new Error("FuelUpProvider is required.");
  return value;
}
