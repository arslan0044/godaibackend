
module.exports = function (req, res, next) {
  // 401 Unauthorized
  // 403 Forbidden 

  if (req.user.type == 'admin' || req.user.type == 'superadmin') {
    next();
  }else{
    return res.status(403).send('Access denied.')
  }
}