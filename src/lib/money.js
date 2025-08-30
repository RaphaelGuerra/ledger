export function toCentavos(brl) {
  if (typeof brl !== 'string') throw new TypeError('brl must be string');
  const cleaned = brl
    .replace(/\s|R\$/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const match = cleaned.match(/^(-?\d+(?:\.\d{0,2})?)$/);
  if (!match) throw new Error('invalid BRL string');
  const [reais, cents = ''] = match[1].split('.');
  const value = BigInt(reais) * 100n + BigInt((cents + '00').slice(0, 2));
  return value;
}

export function fromCentavos(amount) {
  if (typeof amount !== 'bigint') throw new TypeError('amount must be bigint');
  const negative = amount < 0n;
  const abs = negative ? -amount : amount;
  const reais = abs / 100n;
  const cents = abs % 100n;
  const str = `${reais},${cents.toString().padStart(2, '0')}`;
  return `${negative ? '-' : ''}R$ ${str}`;
}

function bankersRound(n, divisor) {
  const quotient = n / divisor;
  const remainder = n % divisor;
  const half = divisor / 2n;
  if (remainder < half) return quotient;
  if (remainder > half) return quotient + 1n;
  return quotient % 2n === 0n ? quotient : quotient + 1n;
}

export function applyRate(amountCents, rateDecimal, rounding = 'bankers') {
  if (typeof amountCents !== 'bigint') throw new TypeError('amountCents must be bigint');
  const rate = typeof rateDecimal === 'number' ? rateDecimal.toString() : rateDecimal;
  const rateScaled = BigInt(Math.round(Number(rate) * 1_000_000));
  const product = amountCents * rateScaled;
  const divisor = 1_000_000n;
  if (rounding === 'bankers') {
    return bankersRound(product, divisor);
  }
  if (rounding === 'up') {
    return (product + divisor - 1n) / divisor;
  }
  return product / divisor; // 'down'
}
