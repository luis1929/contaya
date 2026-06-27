module.exports = {
  check: (req, res) => {
    res.json({ status: 'ok', message: 'Contaya API running' });
  },
};
