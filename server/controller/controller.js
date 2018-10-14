var esprima = require('esprima');
var espree = require('espree');
var estraverse = require('estraverse');

var variableList = {};
var result = [];
var variables = [];
var memberVariableList = {};
var ignoreObjectList = ['GlideRecord', 'gs', '', undefined,'GlideAggregate'];
var i = 0;

exports.getASTTree = function (req, res, next) {
    i = 0;
    var programObject = req.body;
    result = [];
    variableList = {};
    variables = [];
    memberVariableList = {};

    var ast = espree.parse(programObject.data, {
        range: true,
        sourceType: "module",
        ecmaVersion: 6,
        ecmaFeatures: {
            jsx: true,
            globalReturn: true,
            impliedStrict: true
        }
    });
    try {
        estraverse.traverse(ast, {
            enter: function (node, parent) {
                node.parent = parent;
                if (node.type === 'Property') {

                    if (node.key && node.value.type === 'FunctionExpression') {
                        memberVariableList[node.key.name] = [];
                        parseExpressionStatement(node.value.body.body, node.key.name);
                    }

                } else if (node.type === 'MemberExpression') {

                    if (node.property && node.property.name && node.object && node.object.name && ignoreObjectList.indexOf(variableList[node.object.name]) < 0) {
                        i = 0;
                        parseMemberExpression(node, node.property.name, variableList[node.object.name], parent);
                    }

                } else if (node.type === 'VariableDeclarator') {

                    getDeclaredVariables(node);

                } else if (node.type === 'CallExpression') {

                } else if (node.type === 'NewExpression') {

                    if (node && node.parent && node.parent.type == 'MemberExpression') {
                        console.log('className:' + node.callee.name + "method Name :" + node.parent.property.name);
                        parseNewExpression(node, node.callee.name, node.parent.property.name);
                    } else if (node && node.parent && node.parent.type === 'ExpressionStatement') {
                        console.log('New Call with out method call ');
                        parseNewExpression(node, node.callee.name, '');
                    }

                }
            }
        });
    } catch (e) {
        console.log(e);
    }
    console.log(memberVariableList);
    return res.status(200).json(memberVariableList);
}

function getDeclaredVariables(node) {

    if (node.id && node.init && node.init.callee) {
        var object = node.init.callee.name || '';
        if (!node.init.callee.name) {
            //variableList[node.id.name] = !node.init.callee.name ? node.init.callee.object.name+'.'+node.init.callee.property.name : node.init.callee.name ;
            object = node.init.callee.object.name + '.' + node.init.callee.property.name;
        }
        variableList[node.id.name] = object;
        variables.push(node.id.name);
    }

}


function parseMemberExpression(node, name, string, parent) {

    var string1 = string || '';
    if (node.parent && node.type !== 'Property') {
        parseMemberExpression(node.parent, name, string, parent);
    } else if (node.type === 'Property') {
        updateJson(variables[0], node.key.name, string, name);
    }

}

function parseNewExpression(node, className, methodName) {

    if (node && node.type !== 'AssignmentExpression' && node.type !== 'Property') {
        parseNewExpression(node.parent, className, methodName);
    } else if (node.type === 'AssignmentExpression' || node.type === 'Property') {
        if (node.type == 'AssignmentExpression') {
            updateJson(node.left.object.name, node.left.property.name, className, methodName)
        } else {
            updateJson(variables[0], node.key.name, className, methodName);
        }
    }

}

/*function parseNewExpression(node) {
    if(node && node.parent && node.parent.type == 'MemberExpression'){
        console.log('className:'+node.callee.name+ "method Name :" +node.parent.property.name);
        parseNewExpression(node.parent);
   }else if(node && node.parent && node.parent.type === 'ExpressionStatement' ) {
      console.log('New Call with out method call ');
   }else if(node.type !== 'Property' || node.type !== 'AssignmentExpression') {
       console.log(node.type);
       parseNewExpression(node.parent);
   }else if(node.type === 'Property' || node.type === 'AssignmentExpression'){
       console.log('at the top '+ node.type);
   }else {
    updateJson(node.left.object.name,node.left.property.name,className, methodName)
   }
}
*/

function parseExpressionStatement(nodeList, name) {
    nodeList.forEach(function (node) {
        parseCalleeExpression(node, name);
    });
}

function parseCalleeExpression(node, name) {

    if (node.expression && node.expression.type === 'CallExpression' && node.expression.callee) {
        if (ignoreObjectList.indexOf(variableList[node.expression.callee.property.name]) < -1) {
        } else if (node.expression.callee && node.expression.callee.object && node.expression.callee.object.type === 'ThisExpression') {
            updateJson(variables[0], node.expression.callee.property.name, variables[0], name);
        } else if (node.expression.callee && node.expression.callee.object && node.expression.callee.object.type === 'MemberExpression') {
            updateJson(variables[0], node.expression.callee.property.name, variables[0], name);
        }
    }
}


function updateJson(ClassName, methodName, ObjectType, functionName) {

    if (!memberVariableList[methodName]) {
        memberVariableList[methodName] = [];
    }
    memberVariableList[methodName].push(ObjectType + '.' + functionName);
}





/*
function printData(node) {
    var object  = {functionName:node.property.name, class:Object.keys(variableList)[0],methodName:''};
    if(node.object.type == 'ThisExpression') {
        object.class= Object.keys(variableList)[0];
    }else {
        var object_name = node.object.name;
        object.type = variableList[object_name];
    }
    // get parent function name
    var parentNode = node.parent|| {};
    while(parentNode.parent) {
        if( parentNode.type != 'Property' ) {
            parentNode = parentNode.parent;
        }else {
            object.methodName = parentNode.key.name;
            parentNode = undefined;
            break;
        }
    }
    result.push(object);
}
*/