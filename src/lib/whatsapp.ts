export function abrirWhatsapp(telefono: string, mensaje: string) {
  const numero = telefono.replace(/\D/g, "");
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
}