const urls = [
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies",
  "https://latest.currency-api.pages.dev/v1/currencies",
];
exports.convert = async (amount, from, to) => {
  const code = String(from).toLowerCase();
  let last;
  for (const base of urls) {
    try {
      const r = await fetch(`${base}/${code}.json`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      const rate = data[code]?.[String(to).toLowerCase()];
      if (!rate) throw new Error("Moneda no disponible");
      return {
        amount: Number(amount),
        from: code,
        to: String(to).toLowerCase(),
        rate,
        result: Number(amount) * rate,
      };
    } catch (e) {
      last = e;
    }
  }
  throw last;
};
