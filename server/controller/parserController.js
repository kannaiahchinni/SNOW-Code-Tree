var esprima = require('esprima');
var espree = require('espree');
var estraverse = require('estraverse');

var variableList = {};
var variables = [];
var memberFunctions = {};
var callStack =  {};
var ignoreObjectList = ['GlideRecord', 'gs', '', undefined, 'Class', 'Object','GlideDateTime','GlideAggregate',
  'push','join','addOrCondition', 'JSUtil', 'toString', 'isArray','hasRole', 'getValue', 'getDisplayValue','addQuery',
  'next','query','Date','getTime','round','random','trim'];
var scriptName;


var result = [];

exports.getASTtreeJSON = function(req,res,next) {
  // request should be array of objects having property name data.
  var programObject = req.body;
  if(programObject.data) {
     programObject.data.forEach(function(proCode) {
        proCode.result = processRequest(proCode.data);
        proCode.data = "";
     });
  }
  return res.status(200).json(programObject.data);
}


function processRequest(data) {
 // var programObject = req.body;
  variables = [];
  variableList = {};
  variableList['gs'] = ['gs'];
  //result = [];
  memberFunctions = {};
  callStack = {};


  var ast = espree.parse(data, {
    range: true,
    loc:true,
    sourceType: "script",
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

          if (node.key.name !== 'type' && node.value && node.value.type === 'FunctionExpression') {
            referenceStore(node.key.name);
          } else if(node.value ) {
            scriptName = node.value.value;
          }

        }else if( node.type === 'AssignmentExpression' ) {
            parseAssignmentExpression(node);
        }else if( node.type === 'NewExpression' ) {
            parseNewExpression(node);
        }else if(node.type === 'VariableDeclarator' ) {
            parseVariableDeclarator(node);
        }else if(node.type === 'ExpressionStatement' ) {
           parseExpressionStatement(node);
        }else if( node.type === 'CallExpression' ) {
            parseCallExpression(node);
        }else if( node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration' ) {
           if( node.id )
            referenceStore(node.id.name);
        }
      }
    });

  }catch(e) {
    console.log(e);
  }
  var result = {memberFunctions: memberFunctions, callStack: callStack};
  return result;

}



function parseExpressionStatement(node) {
  if (node.expression.type === 'NewExpression') {
    findParent(node, node.expression.callee.name + '', node.loc);
  }
}

function parseCallExpression(node) {

  // handle calling new classname().functionName()
  if (node.callee && node.callee.object && node.callee.object.type === 'NewExpression') {
    findParent(node, node.callee.object.callee.name + '.' + node.callee.property.name, node.loc);
  } else if (node.callee && node.callee.object && node.callee.object.object && node.callee.object.object.type === 'ThisExpression') {
    var cname = 'this.' + node.callee.object.property.name;
    findParent(node, getClassName(cname, variableList) + '.' + node.callee.property.name, node.loc);
  } else if (node.callee && node.callee.object && node.callee.object.type === 'ThisExpression') {
    findParent(node, variables[0] + '.' + node.callee.property.name, node.loc);

  } else if( node.callee && node.callee.object && ignoreObjectList.indexOf(getReference(node.callee.object.name)) < 0  &&
    ignoreObjectList.indexOf(node.callee.property.name) < 0 ) { //if(node.parent.type === 'AssignmentExpression' || node.parent.type === 'VariableDeclarator'){
    var name = getReference(node.callee.object.name);
    if(name && name !== "undefined")
      findParent(node, getReference(node.callee.object.name) + '.' + node.callee.property.name, node.loc)
  } else if (node.parent && node.callee && !node.callee.object && node.parent.type ==='ExpressionStatement') {
    findParent(node,node.callee.name, node.loc);
  }

}


function parseVariableDeclarator(node) {

  if (node.init && node.init.callee && (node.init.type === 'NewExpression' || node.init.callee.object) &&
    ignoreObjectList.indexOf(node.init.callee.object ? node.init.callee.object.name : node.init.callee.name) < 0) {
    var objName = node.init.callee.object ? node.init.callee.object.name + '.' + node.init.callee.property.name : node.init.callee.name;
    if (node.init.type !== 'NewExpression') {
      objName = node.init.callee.object.name;
    }
    varaibleStore(objName, node.id.name);
  } else if (node.init && node.init.callee) {
    objName = node.init.callee.name;
    varaibleStore(objName, node.id.name);
    variables.push(node.id.name);
  }

}

function parseNewExpression(node) {

  if(node.callee   && node.parent.type !== 'MemberExpression') {
    if(node.callee.type === 'Identifier' && ignoreObjectList.indexOf(node.callee.name) < 0) {
      findParent(node, node.callee.name, node.loc);
    }else if ( node.callee.type === 'MemberExpression' && node.callee.object && ignoreObjectList.indexOf(node.callee.property.name) < 0) {
      findParent(node, node.callee.object.name+'.'+node.callee.property.name, node.loc);
    }
  }

}


function parseAssignmentExpression(node) {

  var ignore = ['Identifier', 'ObjectExpression', 'Literal', 'UnaryExpression']
  if (node.left && node.right && node.right.type === 'FunctionExpression') {
    referenceStore(node.left.property.name);
  } else if (node.left && node.right && ignore.indexOf(node.right.type) < 0 && node.left.object
    && node.left.object.type === 'ThisExpression' && node.right.callee && node.right.callee.object) {
    var objName = node.right.callee.object.name;
    if (node.right.callee.object.type === 'NewExpression' && node.right.callee.object.callee) {
      objName = node.right.callee.object.callee.name
    }
    else if (node.right.callee.object.type === 'Identifier' && node.right.callee.object.name === 'global') {
      objName = node.right.callee.object.name + '.' + node.right.callee.property.name
    }
    varaibleStore(objName, 'this.' + node.left.property.name);
  } else if (node.right && node.right.type === 'NewExpression' && node.right.callee && ignoreObjectList.indexOf(node.right.callee.name) < 0) {
    varaibleStore(node.right.callee.name, 'this.'+node.left.property.name);
  }

}

function referenceStore(methodName) {
  var list = memberFunctions[methodName] || [];
  memberFunctions[methodName] = list;
  var rList = callStack[methodName] || [];
  callStack[methodName] = rList;
}

function varaibleStore(className, variableName) {
  var list = variableList[className] || [];
  if (list.indexOf(variableName) < 0) {
    list.push(variableName);
  }
  variableList[className] = list;
}

function storeJson(methodName, classNamefunctionName, loc) {
  var list = memberFunctions[methodName] || [];
  var functionName = classNamefunctionName +"@@"+ loc.start.line +"@@"+ loc.start.column ;
  console.log(functionName);
  if (list.indexOf(functionName) < 0 ) {
    list.push(functionName);
  }

  memberFunctions[methodName] = list;
  // storing data to represent like call stack.
  if(loc) {
    var rList = callStack[methodName] || [];
    rList.push({ reference: classNamefunctionName, line: loc.start.line , column: loc.start.column });
    callStack[methodName] = rList;
  }
}

function getClassName(variable, list) {
  var name = undefined ;
  var keys = Object.keys(variableList); //variableList
  if (keys.length > 0) {
    keys.forEach(function (key) {
      variableList[key].indexOf(variable) > -1 ? name = key : name = name;
    });
  }
  return name;
}


function findParent(node, classNamefunctionName, loc) {
  if (node.type === 'Property' || (node.type === 'AssignmentExpression' && node.right.type === 'FunctionExpression')) {
    storeJson((node.type === 'AssignmentExpression' ? node.left.property.name : node.key.name), classNamefunctionName, loc)
  } else if((node.id && node.type === 'FunctionExpression' ||  node.type === 'FunctionDeclaration') && node.id ) {
     storeJson(node.id.name, classNamefunctionName, loc);
  } else if (node.parent) {
    findParent(node.parent, classNamefunctionName,loc);
  }

}

function getReference(variableName) {
  var sName = getClassName(variableName);
  return sName|| variableName;
}

function filterIngoreObjects(variableName) {
  var data = getClassName(variableName, variableList);
  var result = false;
  if (data && ignoreObjectList.indexOf(data) < -1) {
    result = true;
  }
  return result;
}

