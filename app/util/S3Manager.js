var Upload = require('s3-uploader');
var multer  = require('multer')
var uploader = multer({ dest: '/tmp' })

var S3Manager = function(_path_) {
  var s3UserClient = new Upload('www.phonebankduel.com', {
    aws: {
      path: _path_,
      region: 'us-east-1',
      acl: 'public-read'
    },
    cleanup: {
      versions: true,
      original: false
    },
    original: {
      awsImageAcl: 'private'
    },
    versions: [{
      maxHeight: 100,
      aspect: '1:1',
      format: 'png',
      suffix: '-thumb1'
    }]
  });

  return {
    upload: function(file)  {
    }
  };
}

module.exports = S3Manager;
