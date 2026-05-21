import { redirect } from 'next/navigation';

/** Mobile nav and legacy links — orders live at /orders */
export default function AccountOrdersRedirect() {
  redirect('/orders');
}
