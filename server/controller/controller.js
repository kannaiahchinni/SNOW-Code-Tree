var esprima = require('esprima');
var espree = require('espree');
var estraverse = require('estraverse');

var variableList = {};
var result = [];
var variables = [];
var memberVariableList = {};
var ignoreObjectList = ['GlideRecord','gs','',undefined];
var i = 0;

exports.getASTTree = function(req,res,next) {
    i= 0;
    var programObject = req.body;
    result = [];
    variableList = {};
    memberVariableList = {};

    var ast = espree.parse(programObject.data,{
        range:true,
        sourceType:"module",
        ecmaVersion:6,
        ecmaFeatures: {
            jsx: true,
            globalReturn: true,
            impliedStrict: true
        }
    });
    try {
        estraverse.traverse(ast, {
            enter:function(node,parent) {
                node.parent = parent;
                if (node.type === 'Property') {
                    if (node.key && node.value.type === 'FunctionExpression') {
                        memberVariableList[node.key.name] = [];
                        parseExpressionStatement(node.value.body.body, node.key.name);
                    }
                }else  if (node.type === 'MemberExpression') {
                    if (node.property && node.property.name && node.object && node.object.name && ignoreObjectList.indexOf(variableList[node.object.name]) < 0) {
                        i =0;
                        parseMemberExpression(node, node.property.name, variableList[node.object.name],parent);
                    }
                }else if(node.type === 'VariableDeclarator') {
                    getDeclaredVariables(node);
                }else if(node.type === 'CallExpression') {
                }
            }
        });
    }catch (e) {
        console.log(e);
    }
    console.log(memberVariableList);
    return res.status(200).json(memberVariableList);
}

function getDeclaredVariables(node) {

    if(node.id && node.init && node.init.callee ) {
        var object = node.init.callee.name || '';
        if(!node.init.callee.name) {
            //variableList[node.id.name] = !node.init.callee.name ? node.init.callee.object.name+'.'+node.init.callee.property.name : node.init.callee.name ;
            object = node.init.callee.object.name+'.'+node.init.callee.property.name;
        }
        variableList[node.id.name] = object;
        variables.push(node.id.name);
    }

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

function parseMemberExpression(node,name, string,parent) {
    var string1 =  string||'';
    if(node.parent && node.type !== 'Property'){
        parseMemberExpression(node.parent,name, string,parent);
    }else if(node.type === 'Property') {
        updateJson(variables[0],node.key.name,string,name);
         //console.log( 'ClassName : '+ variables[0]+'-'+'functionName : '+ node.key.name + '- Method Name' + ': ' +string+'.'+name);
    }
}

function parseExpressionStatement(nodeList,name) {
    nodeList.forEach(function(node){
        parseCalleeExpression(node,name);
    });
}

function parseCalleeExpression(node,name) {

    if (node.expression && node.expression.type === 'CallExpression' && node.expression.callee) {
        //console.log(node.expression.type);
        //console.log(node.expression.callee);
        if(ignoreObjectList.indexOf(variableList[node.expression.callee.property.name]) < -1 ){
            //context.report(node, 'Do not use eval() function... Use GlideEvaluator '+name);
        }else if(node.expression.callee && node.expression.callee.object && node.expression.callee.object.type === 'ThisExpression') {
            //console.log('ClassName: '+ variables[0]+'.'+node.expression.callee.property.name+'- '+name);
            updateJson(variables[0],node.expression.callee.property.name,variables[0],name);
            //context.report(node, 'method call '+ variables[0]+'.'+node.expression.callee.property.name + '-' +name );
        } else if(node.expression.callee && node.expression.callee.object && node.expression.callee.object.type === 'MemberExpression') {
           // context.report(node, 'method call '+ variables[0]+'.'+node.expression.callee.property.name + '-' +name );
            updateJson(variables[0],node.expression.callee.property.name,variables[0],name);
            //console.log('ClassName: '+ variables[0]+'.'+node.expression.callee.property.name+'- '+name);
        }
    }
}

function updateJson(ClassName, methodName, ObjectType, functionName) {
    memberVariableList[methodName].push(ObjectType+'.'+functionName);
}
