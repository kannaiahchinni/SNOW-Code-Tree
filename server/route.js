module.exports = function(app) {
     // ast routes
    const ast = require('./controller/controller');
    const astTree = require('./controller/parserController');
    app.post('/api/ast/parse', ast.getASTTree);
    app.post('/api/ast/tree/parse', astTree.getASTtreeJSON);

}
