const service = require("../services/currency.service");

exports.convert = async (req, res, next) => {
  try {
    const { amount, from = "crc", to = "usd" } = req.query;
    if (!Number.isFinite(Number(amount)) || Number(amount) < 0)
      return res
        .status(400)
        .json({ ok: false, error: "amount debe ser un número positivo" });
    res.json({ ok: true, data: await service.convert(amount, from, to) });
  } catch (e) {
    e.status = 502;
    next(e);
  }
};
