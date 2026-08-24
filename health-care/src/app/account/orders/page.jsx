import { permanentRedirect } from 'next/navigation';

/** Mobile nav and legacy links — orders live at /orders (308 permanent) */
export default function AccountOrdersRedirect() {
  permanentRedirect('/orders');
}
