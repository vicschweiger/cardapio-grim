import { Link } from 'react-router-dom';

export function TrackOrderLink({ companySlug, phone = '' }: { companySlug: string; phone?: string }) {
  return (
    <Link to={`/${companySlug}/pedidos`} state={{ companySlug, phone }} className="flex min-h-12 w-full items-center justify-center rounded-xl border border-teal-600 px-4 font-bold text-teal-700 hover:bg-teal-50">
      Acompanhar pedido
    </Link>
  );
}
