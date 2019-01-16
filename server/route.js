module.exports = function(app) {
     // ast routes
    const ast = require('./controller/controller');
    const astTree = require('./controller/parserController');
    //const tree = require('./controller/treeController');
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

}
