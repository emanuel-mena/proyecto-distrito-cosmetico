const service = require("../services/currency.service");

exports.convert = async (req, res, next) => {
  try {
    const { amount, from = "crc", to = "usd" } = req.query;
    if (typeof amount !== "string" || !amount.trim() || !Number.isFinite(Number(amount)) || Number(amount) < 0 || Number(amount) > 1e9 ||
        typeof from !== "string" || typeof to !== "string" || !/^[a-z]{3}$/i.test(from) || !/^[a-z]{3}$/i.test(to))
      return res
        .status(400)
        .json({ ok: false, error: "amount debe ser un número positivo" });
    res.json({ ok: true, data: await service.convert(amount, from, to) });
  } catch (e) {
    e.status = 502;
    next(e);
  }
};
