var express = require('express')
var sh = require('shelljs');
var Q = require('q')
var _ = require('underscore')

var npmConfig = require('./package.json');
var config = require('./config');

var app = express()

var reprepro = {
  EXEC_NAME : "reprepro",

  verifyPackageName : function(packageName) {
    return /^[\x00-\x7F;]+$/.test(packageName) && /^[^;\s]/.test(packageName);
  },

  findPackage : function(packageName) {
    var deferred = Q.defer();

    sh.cd(config.reprepro.homeDir);
    sh.exec('reprepro ls "'+packageName+'"', function(status, result) {

      if (!status) { //0 = success
	deferred.resolve(result);
      } else {
	deferred.reject(result);
      }
    });

    return deferred.promise;
  },

  checkIfInstalled : function() {
    if (!sh.which(this.EXEC_NAME)) {
      console.error( new Error('Cannot run withouth '+this.EXEC_NAME+' installed!'));
      sh.exit(1);
    }

    if (!sh.test('-d', config.reprepro.homeDir)) {
      console.error( new Error('Cannot find root directory for reprepro: '+config.reprepro.homeDir));
      sh.exit(1);
    }
  }
};

reprepro.checkIfInstalled();
app.get('/reprepro/:packagename', function(req, res) {
  var packageName = req.params.packagename;

   if (!reprepro.verifyPackageName(packageName)) {
	res.status(400).send('Invalid characters used');
   } else {
     reprepro.findPackage(packageName)
     .then(function(result) {
	var out =
	  _.filter(result.split('\n'), function(line) {return line.length>0;})
	  .map(function(line) { return _.invoke(line.split('|'), 'trim').slice(1,2); } );
	res.send({ versions : _.flatten(out) } );
     }).fail(function(error) {
	res.status(400).send(JSON.stringify(error));
     }).done();
  } 
});



app.get('*', function (req, res) {
  var routes = 
    _.filter(app._router.stack, function(el) {return el.route;})
  .map(function(el){ return el.route })
  .map(function(el){ return JSON.stringify(el)+'<br>'});
  res.send(npmConfig.name + ' ' + npmConfig.version + '<br><br>' + routes );
});



app.listen(3000);
