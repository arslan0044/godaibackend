const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
  const token = req.header('x-auth-token');
  if (!token) return res.status(440).send({message:'Access denied. No token provided.'});

  try {
    const decoded = jwt.verify(token, config.get('jwtPrivateKey'));//JWT need to be defined somewherelese
    req.user = decoded;
    next();
  }
  catch (ex) {
    res.status(440).send({message:'Invalid token.'});
  }
}