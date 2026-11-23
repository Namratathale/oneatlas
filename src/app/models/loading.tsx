export default function Loading(): React.JSX.Element {
  return <div className="animate-pulse"><div className="mb-8 h-48 rounded-2xl bg-[#eeece6] dark:bg-[#22231e]" /><div className="mb-4 h-10 rounded-lg bg-[#eeece6] dark:bg-[#22231e]" /><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-64 rounded-xl bg-[#eeece6] dark:bg-[#22231e]" />)}</div></div>;
}
