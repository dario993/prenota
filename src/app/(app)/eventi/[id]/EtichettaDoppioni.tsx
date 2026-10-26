import type { Doppione } from "@/lib/doppioni";

// «Possibile doppione: <nome>» (+ «· LiveTicket»): segnala soltanto, non blocca nulla
export const EtichettaDoppioni = ({ doppioni }: { doppioni?: Doppione[] }) => doppioni && (
  <ul className="mt-1 space-y-0.5 text-caption font-medium text-warning print:hidden">
    {doppioni.map((d) => <li key={d.id}>Possibile doppione: {d.nome}{d.liveticket && " · LiveTicket"}</li>)}
  </ul>
);
