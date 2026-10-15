const notFound = (req, res) => res.status(404).json({ ok: false, error: 'Ruta no encontrada' });

const errorHandler = (err, req, res, next) => {
  const status = err.status || (['ValidationError', 'CastError', 'SyntaxError'].includes(err.name) ? 400 : 500);
  if (status >= 500) console.error(err);
  res.status(status).json({ ok: false, error: status >= 500 ? 'Error interno del servidor' : err.message || 'Solicitud inválida' });
};

module.exports = { notFound, errorHandler };
