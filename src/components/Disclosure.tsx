import { useId, useState, type ReactNode } from "react";
import { Menu, X } from "lucide";
import { UiMorphIcon } from "./UiMorphIcon";

export function Disclosure({ label, count, hint, children, className = "", primary = false }: {
  label: string;
  count?: number;
  hint?: string;
  children: ReactNode;
  className?: string;
  primary?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return <div className={`disclosure ${className}`}>
    <button type="button" className={`disclosure-trigger${primary ? " disclosure-primary" : ""}`}
      aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
      <span className="disclosure-label">{label}{hint && <span className="disclosure-hint">{hint}</span>}</span>
      {count !== undefined && <span className="disclosure-count">{count}</span>}
      <UiMorphIcon icon={open ? X : Menu} size={22} />
    </button>
    <div id={id} hidden={!open} className="disclosure-content">{children}</div>
  </div>;
}
