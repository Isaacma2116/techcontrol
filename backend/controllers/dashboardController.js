const asyncHandler = require('../utils/asyncHandler');
const dashboardModel = require('../models/dashboardModel');

// GET /api/dashboard  (cualquier usuario autenticado; el contenido se ajusta segun su rol)
const dashboard = asyncHandler(async (req, res) => {
  const data = await dashboardModel.dashboard(req.user.role);
  res.status(200).json({ success: true, data });
});

module.exports = { dashboard };
