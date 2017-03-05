var express = require('express');
var Partnership = require('../models/partnership');
var router = express.Router();

router.get('/myPartners', function(req, res) {
  var selfId = req.user.sub;

  Partnership.getPartnersByUserId(selfId, function (partners) {
    res.send(partners);
  });
});

module.exports = router;
