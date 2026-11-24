import { cookies } from "next/headers";
import Filters from "@/components/Filters";
import ExpenseDoughnut from "@/components/ExpenseDoughnut";
import { ApiException, getCategories, getStats, searchExpenses } from "@/lib/api";
import { logoutAction } from "@/lib/actions";
import { EMAIL_COOKIE, ROLE_COOKIE } from "@/lib/session";
import type { Stats } from "@/lib/types";

type SP = { from?: string; to?: string; categoryIds?: string | string[] };

const iso = (d: Date) => d.toISOString().slice(0, 10);
const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function Dashboard({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const jar = await cookies();
  const email = jar.get(EMAIL_COOKIE)?.value;
  const role = jar.get(ROLE_COOKIE)?.value;

  // Default range: first day of this month .. today (same idea as the mobile app).
  const now = new Date();
  const from = sp.from || iso(new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)));
  const to = sp.to || iso(now);
  const selected = [sp.categoryIds ?? []].flat().map(Number).filter(Number.isInteger);

  let stats: Stats | null = null;
  let statsError: string | null = null;
  if (role === "ADMIN") {
    try {
      stats = await getStats();
    } catch (e) {
      statsError = e instanceof ApiException ? e.message || `Error ${e.status}` : "Could not load stats";
    }
  } else {
    statsError = "Global stats are only available to admin accounts.";
  }

  const categories = await getCategories();

  let result = null;
  let rangeError: string | null = null;
  if (from > to) {
    rangeError = "“From” must not be after “To”.";
  } else {
    try {
      result = await searchExpenses(from, to, selected);
    } catch (e) {
      rangeError = e instanceof ApiException ? e.message : "Could not load expenses";
    }
  }

  return (
    <div className="page">
      <header className="bar">
        <h1>Dashboard</h1>
        <div className="user">
          <span>
            {email} <span className="badge">{role}</span>
          </span>
          <form action={logoutAction}>
            <button>Log out</button>
          </form>
        </div>
      </header>

      <section className="stats">
        {stats ? (
          <>
            <div className="card stat"><span>Total users</span><strong>{stats.totalUsers}</strong></div>
            <div className="card stat"><span>Total expenses</span><strong>{stats.totalExpenses}</strong></div>
          </>
        ) : (
          <p className="notice">{statsError}</p>
        )}
      </section>

      <Filters from={from} to={to} selected={selected} categories={categories} />

      {rangeError && <p className="error">{rangeError}</p>}

      {result && (
        <>
        <div className="stats">
          <div className="card stat"><span>Your total expenses</span><strong>{money(result.total)}</strong></div>
        </div>
        <section className="grid">
          <div className="card">
            <h2>Spending by category</h2>
            <ExpenseDoughnut data={result.byCategory} total={result.total} />
          </div>
          <div className="card">
            <h2>Your expenses ({result.expenses.length})</h2>
            {result.expenses.length === 0 ? (
              <p className="hint">Nothing in this range.</p>
            ) : (
              <div className="scroll">
                <table>
                  <thead>
                    <tr><th>Date</th><th>Category</th><th>Note</th><th className="num">Amount</th></tr>
                  </thead>
                  <tbody>
                    {result.expenses.map((x) => (
                      <tr key={x.id}>
                        <td>{x.date}</td>
                        <td><i className="dot" style={{ background: x.categoryColour }} /> {x.categoryName}</td>
                        <td>{x.note}</td>
                        <td className="num">{money(x.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
        </>
      )}
    </div>
  );
}
