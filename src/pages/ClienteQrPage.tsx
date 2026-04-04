import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "qrcode";
import { obtenerClientePorId } from "../features/clientes/clientesService";

type Cliente = {
  id: string;
  nombre_completo: string;
  telefono: string | null;
};

export default function ClienteQrPage() {
  const { id } = useParams();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [qrUrl, setQrUrl] = useState("");
  const [loading, setLoading] = useState(true);

  async function cargarCliente() {
    if (!id) return;

    setLoading(true);

    const { data, error } = await obtenerClientePorId(id);

    if (error) {
      console.error("Error cargando cliente:", error);
      setLoading(false);
      return;
    }

    const clienteData = (data as Cliente) || null;
    setCliente(clienteData);

    if (clienteData) {
      const urlDestino = `${window.location.origin}/clientes/${clienteData.id}/scan`;
      const qr = await QRCode.toDataURL(urlDestino, {
        width: 320,
        margin: 2,
      });
      setQrUrl(qr);
    }

    setLoading(false);
  }

  useEffect(() => {
    void cargarCliente();
  }, [id]);

  if (loading) {
    return <div className="text-[#8b6f6f]">Generando QR...</div>;
  }

  if (!cliente) {
    return <div className="text-[#8b6f6f]">No se encontró el cliente.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#4a3535]">QR del cliente</h1>
        <p className="text-[#8b6f6f] mt-1">
          Escanea este QR para abrir rápidamente la vista de sellado
        </p>
      </div>

      <div className="rounded-3xl bg-white border border-[#ead6d6] p-8 shadow-sm text-center">
        <p className="text-xl font-semibold text-[#4a3535]">
          {cliente.nombre_completo}
        </p>

        {cliente.telefono ? (
          <p className="text-sm text-[#8b6f6f] mt-1">{cliente.telefono}</p>
        ) : null}

        {qrUrl ? (
          <div className="mt-6 flex justify-center">
            <img
              src={qrUrl}
              alt="QR del cliente"
              className="rounded-2xl border border-[#ead6d6] p-3 bg-white"
            />
          </div>
        ) : null}

        <p className="text-sm text-[#8b6f6f] mt-6">
          Este QR abre una vista rápida para agregar sellos.
        </p>
      </div>
    </div>
  );
}