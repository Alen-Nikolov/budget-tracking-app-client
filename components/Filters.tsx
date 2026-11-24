"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Category } from "@/lib/types";

interface Props {
  from: string;
  to: string;
  selected: number[];
  categories: Category[];
}

/** Applies filters immediately by updating the URL, so the server re-renders with new data. */
export default function Filters({ from, to, selected, categories }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);
  const [ids, setIds] = useState(selected);

  function apply(next: { from: string; to: string; ids: number[] }) {
    const p = new URLSearchParams({ from: next.from, to: next.to });
    next.ids.forEach((id) => p.append("categoryIds", String(id)));
    startTransition(() => router.replace(`/dashboard?${p}`));
  }

  function toggle(id: number) {
    const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
    setIds(next);
    apply({ from: f, to: t, ids: next });
  }

  return (
    <div className="card filters" aria-busy={pending}>
      <label>
        From
        <input
          type="date"
          value={f}
          max={t}
          onChange={(e) => {
            setF(e.target.value);
            if (e.target.value) apply({ from: e.target.value, to: t, ids });
          }}
        />
      </label>
      <label>
        To
        <input
          type="date"
          value={t}
          min={f}
          onChange={(e) => {
            setT(e.target.value);
            if (e.target.value) apply({ from: f, to: e.target.value, ids });
          }}
        />
      </label>
      <fieldset>
        <legend>Categories {ids.length === 0 && "(none selected = all)"}</legend>
        {categories.length === 0 && <span className="hint">No categories yet.</span>}
        {categories.map((c) => (
          <label key={c.id} className="chip" style={{ "--c": c.colour } as React.CSSProperties}>
            <input type="checkbox" checked={ids.includes(c.id)} onChange={() => toggle(c.id)} />
            <span className="box" aria-hidden />
            {c.name}
          </label>
        ))}
      </fieldset>
    </div>
  );
}
