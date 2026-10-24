/** Los abonos recibidos se acumulan en la cuota, siempre en centavos. */
export function rentalPaymentState(
  total: number,
  alreadyPaid: number,
  received: number,
) {
  if (![total, alreadyPaid, received].every(Number.isFinite) || received <= 0) {
    throw new RangeError('El abono debe ser mayor que cero.');
  }
  const totalCents = Math.round(total * 100);
  const previousCents = Math.round(alreadyPaid * 100);
  const receivedCents = Math.round(received * 100);
  if (receivedCents <= 0 || previousCents + receivedCents > totalCents) {
    throw new RangeError('El abono no puede superar el saldo pendiente.');
  }
  const paidAmount = (previousCents + receivedCents) / 100;
  return {
    paidAmount,
    status: previousCents + receivedCents === totalCents ? 'PAID' : 'PARTIAL',
  };
}
