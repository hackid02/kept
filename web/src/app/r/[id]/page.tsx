import ReceiptView from "./view";
export const dynamic = "force-dynamic";
// Existence + 404 status are handled in layout.tsx (generateMetadata runs before the response starts).
export default function ReceiptPage({ params }: { params: { id: string } }) { return <ReceiptView params={params} />; }
