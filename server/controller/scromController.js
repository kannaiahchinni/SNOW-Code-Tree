var scorm = require('scormcloud-api-wrapper');

var scormApi;
var appId = '14J462F4I9',
  secretKey = 'OeaATPgtIdhFPynbhlesQbQQ4lyXuReoiHpF4t5B';
const uuidV1 = require('uuid/v1');

function getApiObject() {
  if(!scormApi) {
     scormApi = new scorm(appId,secretKey);
  }
}

function prepareResponse(res,error, result) {
    if(error) {
      res.status(400).json({'error':error});
    }else {
      res.status(200).json(result);
    }
    return res;
}

exports.getCourseList = function(req, res, next) {
   getApiObject();
   scormApi.getCourseList(function(error, result) {
      if(error) {
        return res.status(500).json({'error':error});
      }else {
        res.status(200).json(result);
      }
   })
}


exports.getCourseDetails = function(req, res, next) {
  getApiObject();
   var params = req.params || {};
   if(params.courseId) {
      scormApi.getCourseDetail(params.courseId,function(error, result) {
         return prepareResponse(res, error,result);
      });
   }
}

exports.createRegistration = function(req, res, next) {
  getApiObject();
  var body = req.body;
  console.log(body);
  if(body.courseId) {
    var uuid = uuidV1(),
    options = {
      email: body.learerid,
      postbackurl: 'https://blueskiesdev.service-now.com/api/x_snc_lxp/scrom_registration_completion',
      resultsformat:'course,activity,'
    };
    console.log(uuid);
        scormApi.createRegistration(body.courseId,uuid, body.fName, body.lName, body.learnerId, function(error, result) {
          console.log(result);
          console.log(error);
          return prepareResponse(res,error, result);
        });
  }
}

exports.getRegistrationList = function(req,res,next) {
   getApiObject();
   let options = {
     learnerid:'karunakar.medamoni@servicenow.com'
   }
   scormApi.getRegistrationList(function(error, result) {
      return prepareResponse(res,error, result);
   });
}

exports.getLaunchUrl = function(req, res, next ) {
   getApiObject();
   let params = req.params || {};
   if(params.regId) {
     let url = scormApi.getLaunchUrl(params.regId, 'http://localhost:4200');
      return res.status(200).json({url:url});
   }else {
     return res.status(400).json({'error': 'regId is mandatory '});
   }
}

exports.importCourse = function(req, res, next) {
    getApiObject();
    let reqBody = reg.body;
    scormApi.importCourse(reqBody.courseId, reqBody.coursePath, function(error, result) {
      console.log(result);
      return res.status(200).json({'result': result});
    });
}
