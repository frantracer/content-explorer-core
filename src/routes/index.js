const contenmarkC = require('../controllers/contentmark')
const userC = require('../controllers/user')

module.exports = (router) => {
  router.route('/login').get(login),

  router.route('/contentmarks').get(getAllContentmarksByUser),
  router.route('/contentmarks/:id').get(getSingleContentmarkByUser),
  router.route('/contentmarks/:id').delete(foo),
  router.route('/contentmarks/:id').put(foo),

  router.route('/contentmarks/:id/feeds').get(foo)
}

// ROUTE FUNCTIONS

function login(req, res, next) {
  res.status(200).send({sid: 'sid'});
}

function getAllContentmarksByUser(req, res, next) {
  user = userC.getUserBySid(req.body.sid);
  if(user != null) {
    contentmarks = contenmarkC.getAllContentmarksByUser(user);
    res.status(200).send({contentmarks: contentmarks});
  } else {
    res.status(401).send({error: 'Invalid credentials'});
  }
}

function getSingleContentmarkByUser(req, res, next) {
  res.status(200).send({foo: 'foo'});
}

function foo(req, res, next) {
  res.status(200).send({foo: 'foo'});
}

// COMMON FUNCTIONS
