import LiveFeed from "@/components/LiveFeed";
export default function ReceiptsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Receipts</h1>
      <p className="text-sm text-white/60">Every commitment any protected agent made to any human, newest first. Public by design.</p>
      <div className="card p-5"><LiveFeed limit={100} refreshMs={6000} /></div>
    </div>
  );
}
