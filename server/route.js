module.exports = function(app) {
     // ast routes
    const ast = require('./controller/controller');
    const astTree = require('./controller/parserController');
    //const tree = require('./controller/treeController');
    const scorm = require('./controller/scromController');
    const cors = require('cors');
    // whitelisting url to accepts the request from below domains
    const whiteList = ['https://surfpoc.service-now.com','https://surfqa.service-now.com', 'https://surfseqa.service-now.com','http://localhost:4200'];

    // defining cors options
    const corsOptions = {
      origin: function(origin, callback) {
        if (whiteList.indexOf(origin) !== -1) {
          callback(null, true)
        } else {
          callback(new Error('Not allowd request from domain '+ origin));
        }
      }
    }

    app.options('*', cors(corsOptions));
    app.post('/api/ast/parse', cors(corsOptions), ast.getASTTree);
    app.post('/api/ast/tree/parse', cors(corsOptions), astTree.getASTtreeJSON);
    app.get('/api/scorm/course/list', cors(corsOptions), scorm.getCourseList);
    app.get('/api/scorm/registration/list', cors(corsOptions), scorm.getRegistrationList);
    app.post('/api/scorm/course/reg', cors(corsOptions), scorm.createRegistration);
    app.get('/api/scorm/course/launch/url/:regId', cors(corsOptions), scorm.getLaunchUrl);
    app.get('/api/scorm/course/:courseId', cors(corsOptions), scorm.getCourseDetails);
    app.post('/api/scorm/course/import', cors(corsOptions), scorm.importCourse);

}
