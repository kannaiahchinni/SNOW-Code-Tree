var esprima = require('esprima');
var espree = require('espree');
var estraverse = require('estraverse');

var variableList = {};
var variables = [];
var memberFunctions = {};
var callStack = {};
var ignoreObjectList = ['GlideRecord', 'gs', '', undefined, 'Class', 'Object', 'GlideDateTime', 'GlideAggregate', 'current',
  'push', 'join', 'addOrCondition', 'JSUtil', 'toString', 'isArray', 'hasRole', 'getValue', 'getDisplayValue', 'addQuery',
  'next', 'query', 'Date', 'getTime', 'round', 'random', 'trim', 'JSON', 'nil', 'indexOf', 'replace', 'substring', 'Math', 'floor', 'update', 'GlideRunScriptJob', 'split'
  ,'concat','addEncodedQuery','addActiveQuery'];
var scriptName, scriptType;

var result = [];

exports.getASTtreeJSON = function (req, res, next) {
  // request should be array of objects having property name data.
  var programObject = req.body;
  if (programObject.data) {
    programObject.data.forEach(function (proCode) {
      try {
        if (proCode.data != '') {
          scriptName = proCode.name || 'ScheduleJob',
            scriptType = proCode.type;
          proCode.result = processRequest(proCode.data, proCode.type, proCode.name);
          proCode.data = "";
        }
      } catch (error) {
        Object.assign(proCode, {
          error: e
        });
      }
    });
  }
  return res.status(200).json(programObject.data);
}


function processRequest(data) {

  variables = [];
  variableList = {};
  variableList['gs'] = ['gs'];
  memberFunctions = {};
  callStack = {};
  var result = {memberFunctions: memberFunctions, callStack: callStack};


  try {
    var ast = espree.parse(data, {
      range: true,
      loc: true,
      sourceType: "script",
      ecmaVersion: 6,
      ecmaFeatures: {
        jsx: true,
        globalReturn: true,
        impliedStrict: true
      }
    });

    estraverse.traverse(ast, {
      enter: function (node, parent) {
        node.parent = parent;
        if (node.type === 'Property') {
          if (node.key.name !== 'type' && node.value && node.value.type === 'FunctionExpression') {
            referenceStore(node.key.name);
          } else if (node.value) {
            scriptName = node.value.value;
          }
        } else if (node.type === 'AssignmentExpression') {
          parseAssignmentExpression(node);
        } else if (node.type === 'NewExpression') {
          parseNewExpression(node);
        } else if (node.type === 'VariableDeclarator') {
          parseVariableDeclarator(node);
        } else if (node.type === 'ExpressionStatement') {
          parseExpressionStatement(node);
        } else if (node.type === 'CallExpression') {
          parseCallExpression(node);
        } else if (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration') {
          if (node.id)
            referenceStore(node.id.name);
        } else if (node.type === 'Literal') {
          if (node && node.value && node.value.toString().indexOf("new ") > -1) {
            var data = node.value.replace(/\((.*)\)/g, '');
            data = data.replace(/\('/g, '').replace(/^new /, '');
            findParent(node, data, node.loc);
          }
        }
      }
    });

  } catch (e) {
    Object.assign(result, {
      error: 'error' + e
    });
  }

  Object.assign(result,
    {
      memberFunctions: memberFunctions,
      callStack: callStack
    });
  return result;

}


function parseExpressionStatement(node) {
  console.log(' ***********  Karunakar1111  ************** ');
  if (node.expression.type === 'NewExpression') {
    findParent(node, node.expression.callee.name + '', node.loc);
  }else if(node.expression.type === 'CallExpression') { // to handle calling code like this  ****GlideEventManager('report_view').process();******
    // scenario 1 :  there is Member expression ex: .process()
    //console.log(node);
    if(node.expression.callee && node.expression.callee.type === 'MemberExpression' &&
      node.expression.callee.object && node.expression.callee.object.type !== 'NewExpression' && node.expression.callee.property && node.expression.callee.object.callee) {
      var methodCall = node.expression.callee.object.callee.name+'.'+ node.expression.callee.property.name;
      findParent(node, methodCall, node.loc );
    }
    if(node.callee)
      findParent(node, node.callee.name+'', node.loc);


  }
}

function parseCallExpression(node) {
  console.log(' ***********  Karunakar111  ************** ');
  // handle calling new classname().functionName()
  if (node.callee && node.callee.object && node.callee.object.type === 'NewExpression') {
    findParent(node, node.callee.object.callee.name + '.' + node.callee.property.name, node.loc);
  } else if (node.callee && node.callee.object && node.callee.object.object && node.callee.object.object.type === 'ThisExpression') {
    var cname = 'this.' + node.callee.object.property.name;
    findParent(node, getClassName(cname, variableList) + '.' + node.callee.property.name, node.loc);
  } else if (node.callee && node.callee.object && node.callee.object.type === 'ThisExpression') {
    findParent(node, variables[0] + '.' + node.callee.property.name, node.loc);
  } else if (node.callee && node.callee.object && ignoreObjectList.indexOf(getReference(node.callee.object.name)) < 0 &&
    ignoreObjectList.indexOf(node.callee.property.name) < 0) { //if(node.parent.type === 'AssignmentExpression' || node.parent.type === 'VariableDeclarator'){
    var name = getReference(node.callee.object.name);
    if (name && name !== "undefined")
      findParent(node, getReference(node.callee.object.name) + '.' + node.callee.property.name, node.loc)
  } else if (node.parent && node.callee && !node.callee.object && node.parent.type === 'ExpressionStatement') {
    findParent(node, node.callee.name, node.loc);
  }

}


function parseVariableDeclarator(node) {

  // to get Script Name to map with *this*
  if(node.init && node.init.type === 'CallExpression' && node.init.callee && node.init.callee.object && node.init.callee.object.name === 'Class') {
    varaibleStore(node.id.name , 'this');
    variables.push(node.id.name);
  }
  if (node.init && node.init.callee && (node.init.type === 'NewExpression' || node.init.callee.object) &&
    ignoreObjectList.indexOf(node.init.callee.object ? node.init.callee.object.name : node.init.callee.name) < 0) {
    var objName = node.init.callee.object ? node.init.callee.object.name + '.' + node.init.callee.property.name : node.init.callee.name;
    if (node.init.type !== 'NewExpression') {
      objName = node.init.callee.object.name;
    }
    varaibleStore(objName, node.id.name);
  } else if (node.init && node.init.callee && node.init.callee.name) {
    objName = node.init.callee.name;
    varaibleStore(objName, node.id.name);
    variables.push(node.id.name);
  }else if (node.init && node.init.callee && node.init.callee.type === 'MemberExpression' &&
    node.init.callee.object && node.init.callee.object.type !== 'NewExpression' && node.init.callee.object.callee) {
      var signature = node.init.callee.object.callee.name+'.' + node.init.callee.property.name;
      findParent(node, signature, node.loc);
  }

}

function parseNewExpression(node) {
 console.log(" inside of parseNew Expression ");
  if (node.callee && ['MemberExpression','ExpressionStatement'].indexOf(node.parent.type) < 0) {
    if (node.callee.type === 'Identifier' && ignoreObjectList.indexOf(node.callee.name) < 0) {
      findParent(node, node.callee.name, node.loc);
    } else if (node.callee.type === 'MemberExpression' && node.callee.object && ignoreObjectList.indexOf(node.callee.property.name) < 0) {
      findParent(node, node.callee.object.name + '.' + node.callee.property.name, node.loc);
    }
  }

}


function parseAssignmentExpression(node) {
  console.log(" inside of assign Expression ");
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
  }else if( node.left && node.left.type === 'Identifier' && node.right && node.right.type === 'NewExpression') {
    varaibleStore(node.right.callee.name , node.left.name);
  } else if (node.right && node.right.type === 'NewExpression' && node.right.callee && ignoreObjectList.indexOf(node.right.callee.name) < 0) {
    varaibleStore(node.right.callee.name, 'this.' + node.left.property.name);
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
  console.log(variableList);
}

function storeJson(methodName, classNamefunctionName, loc) {

  if (ignoreObjectList.indexOf(classNamefunctionName) > -1)
    return;

  var list = memberFunctions[methodName] || [];
  var functionName = classNamefunctionName + "@@" + loc.start.line + "@@" + loc.start.column;
  if (list.indexOf(functionName) < 0) {
    list.push(functionName);
  }

  memberFunctions[methodName] = list;
  // storing data to represent like call stack.
  if (loc) {
    var rList = callStack[methodName] || [];
    rList.push({reference: classNamefunctionName, line: loc.start.line, column: loc.start.column});
    callStack[methodName] = rList;
  }
}

function getClassName(variable, list) {
  var name = undefined;
  var keys = Object.keys(variableList); //variableList
  if (keys.length > 0) {
    keys.forEach(function (key) {
      variableList[key].indexOf(variable) > -1 ? name = key : name = name;
    });
  }
  return name;
}

/*
function findParent(node, classNamefunctionName, loc) {
  if (node.type === 'Property' || (node.type === 'AssignmentExpression' && node.right.type === 'FunctionExpression')) {
    storeJson((node.type === 'AssignmentExpression' ? node.left.property.name : node.key.name), classNamefunctionName, loc)
  } else if((node.id && node.type === 'FunctionExpression' ||  node.type === 'FunctionDeclaration') && node.id ) {
     storeJson(node.id.name, classNamefunctionName, loc);
  } else if (node.parent) {
    findParent(node.parent, classNamefunctionName,loc);
  }

}
*/

function findParent(node, classNamefunctionName, loc) {
  if (scriptType === 'schedule') {
    storeJson(scriptName, classNamefunctionName, loc);
  } else if ((node.type === 'Property' && node.parent.type !== 'ObjectExpression') || (node.type === 'AssignmentExpression' && node.right.type === 'FunctionExpression')) {
    storeJson((node.type === 'AssignmentExpression' ? node.left.property.name : node.key.name), classNamefunctionName, loc)
  } else if ((node.id && node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration') && node.id) {
    storeJson(node.id.name, classNamefunctionName, loc);
  } else if (node.type === 'FunctionExpression' && node.parent.type === 'Property' && !node.id) {
    storeJson(node.parent.key.name, classNamefunctionName, loc);
  } else if (node.type === 'Property' && node.parent.type === 'ObjectExpression') {
    findParent(node.parent, classNamefunctionName, loc);
  } else if (node.parent) {
    findParent(node.parent, classNamefunctionName, loc);
  }
}


function getReference(variableName) {
  var sName = getClassName(variableName);
  return sName || variableName;
}

function filterIngoreObjects(variableName) {
  var data = getClassName(variableName, variableList);
  var result = false;
  if (data && ignoreObjectList.indexOf(data) < -1) {
    result = true;
  }
  return result;
}
