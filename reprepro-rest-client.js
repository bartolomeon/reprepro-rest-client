var express = require('express')
var sh = require('shelljs');
var q = require('q')
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
    var deferred = q.defer();

    if (!this.verifyPackageName(packageName)) {
      console.error( new Error('Invalid package name format given!'))
    }

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
      console.error( new Error('Cannot run without '+this.EXEC_NAME+' installed!'));
      sh.exit(1);
    }

    if (!sh.test('-d', config.reprepro.homeDir)) {
      console.error( new Error('Cannot find root directory for reprepro: '+config.reprepro.homeDir));
      sh.exit(1);
    }
  }
};

reprepro.checkIfInstalled();


app.get('/', function (req, res) {
  var routes = 
    _.filter(app._router.stack, function(el) {return el.route;})
  .map(function(el){ return el.route })
  .map(function(el){ return JSON.stringify(el)+'<br>'});
  res.send(npmConfig.name + ' ' + npmConfig.version + '<br><br>' + routes );
});

app.get('/reprepro/:packagename', function(req, res) {
  var packageName = req.params.packagename;

  var p = reprepro.findPackage(packageName);
  p.then( function(result) {
    res.send(result);
  });

});


app.listen(3000);
