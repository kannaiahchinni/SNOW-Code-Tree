module.exports = function(app) {
     // ast routes
    const ast = require('./controller/controller');
    app.post('/api/ast/parse', ast.getASTTree);
    
}