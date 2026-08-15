const notFound = (req, res) => res.status(404).json({ ok: false, error: 'Ruta no encontrada' });

const errorHandler = (err, req, res, next) => {
  const status = err.status || (err.name === 'ValidationError' ? 400 : 500);
  res.status(status).json({ ok: false, error: err.message || 'Error interno del servidor' });
};

module.exports = { notFound, errorHandler };
