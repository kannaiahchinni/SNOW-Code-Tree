var esprima = require('esprima');
var espree = require('espree');
var estraverse = require('estraverse');

var variableList = {};
var result = [];
var variables = [];
var memberVariableList = {};
var ignoreObjectList = ['GlideRecord', 'gs', '', 'GlideAggregate'];
var excludeProperties = ['create', 'extendsObject','push','join','length','i'];
variableList['gs'] = 'gs';

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
                    //need below functionality to popluate information.
                    if (node.key && node.value.type === 'FunctionExpression') {
                        memberVariableList[node.key.name] = [];
                        parseExpressionStatement(node.value.body.body, node.key.name);
                    }

                } else if (node.type === 'MemberExpression') {
                    // handle *this.logger.debug* to get logger as class variable name and debug is method.
                    if( node.object && node.object.type === 'MemberExpression' && node.object.object && node.object.object.type === 'ThisExpression') {
                        if(ignoreObjectList.indexOf(variableList[node.object.property.name]) < 0) {
                            console.log('node.property.name '+ node.property.name +' = '+ node.object.property.name);
                            parseMemberExpression(node,node.property.name,variableList[node.object.property.name],node.parent);
                        }
                    }

                    // Please handle Call Expression first and try Member Expression if can't achieved by CallExpression. Re think about this usecase.
                    else if (node.property && node.property.name && node.object && node.object.name && ignoreObjectList.indexOf(variableList[node.object.name]) < 0) {
                        i = 0;
                        console.log(" insde of member expression 1 " + node.property.name);
                        parseMemberExpression(node, node.property.name, node.object.name, parent);
                    } else if (node.parent && node.parent.type === 'CallExpression' && node.parent.arguments) {
                        console.log(" insde of member expression 2 "+ node.property.name);
                        if(node.object.type === 'ThisExpression' && excludeProperties.indexOf(node.property.name) < 0) 
                            parseMemberExpression(node, node.property.name, variables[0], node.parent);
                        else if (variableList[node.object.name] && ignoreObjectList.indexOf(variableList[node.object.name]) > -1){
                            return;
                        }else{
                            parseMemberExpression(node, node.property.name, variableList[node.object.name], node.parent);
                        }
                            
                        //parseMemberExpression(node, node.property.name, node.object.name, node.parent);
                    }

                } else if (node.type === 'VariableDeclarator') {

                    getDeclaredVariables(node);

                } else if (node.type === 'CallExpression') {  // latest refine code by KM... 
                    // exclude this.logger.debug here.. we handled in Memeber expression.. 
                    if (node.callee && node.callee.object && node.callee.object.type !== 'MemberExpression' &&
                        ignoreObjectList.indexOf(variableList[node.callee.object.name]) < 0
                        && excludeProperties.indexOf(node.callee.property.name) < 0) {
                        console.log("Inside call expression "+ node.callee.property.name);
                        console.log("Inside call expression "+ node.callee.object.name);
                        parseMemberExpression(node, node.callee.property.name, node.callee.object.name, node.parent)
                    }

                } else if (node.type === 'NewExpression') {

                    if (node && node.parent && node.parent.type == 'MemberExpression' || node.parent.type == 'AssignmentExpression') {
                       // console.log('New Expression '+ node.property.name);
                        parseNewExpression(node, node.callee.name, (node.parent.property ? node.parent.property.name : ''));
                    } else if (node && node.parent && node.parent.type === 'ExpressionStatement') {
                        //console.log('New Call with out method call ');
                        parseNewExpression(node, node.callee.name, '');
                    }

                } //else if(node.type === '')
            }
        });
    } catch (e) {
        console.log(e);
    }
    console.log(memberVariableList);
    return res.status(200).json(memberVariableList);
}

function getDeclaredVariables(node) {

    if (node.id && node.init && node.init.callee ) {
        var object = node.init.callee.name || '';
        if (!node.init.callee.name) {
            //variableList[node.id.name] = !node.init.callee.name ? node.init.callee.object.name+'.'+node.init.callee.property.name : node.init.callee.name ;
            object = (node.init.callee.object.name && node.init.callee.object.name !== 'Class' ? node.init.callee.object.name : '' ) + '.' + node.init.callee.property.name;
        }
        if(!variableList[node.id.name])
            variableList[node.id.name] = object;
        variables.push(node.id.name);
        console.log(JSON.stringify(variableList));
    }

}


function parseMemberExpression(node, name, string, parent) {
    var string1 = string || '';
    if (node.parent && node.type !== 'Property') {
        parseMemberExpression(node.parent, name, string, parent);
    } else if (node.type === 'Property' && string !== undefined && !argumentValidation(node.value.params, string)  ) {
        // check if member function is part of argument. if yes don't insert into json.
        updateJson(variables[0], node.key.name, variableList[string]||string, name);
    }
}

// return true when property found in param list;
function argumentValidation(paramsList, keyName) {
    var found = false;
    paramsList.forEach(function(param) {
        param.name === keyName ? found = true : found = found;
    });
    return found;
}

/*
    This function to parse and get the method of ClassName
*/
function parseNewExpression(node, className, methodName) {

    if (node && node.type !== 'AssignmentExpression' && node.type !== 'Property') {
        parseNewExpression(node.parent, className, methodName);
    } else if (node.type === 'AssignmentExpression' || node.type === 'Property') {
        // code handle only for new with classname and assigning to variable
        if (node.type === 'AssignmentExpression' && node.parent.type === 'ExpressionStatement') {
            parseNewExpression(node.parent, className, methodName);
        }
        else if (node.type == 'AssignmentExpression') {
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
        // example :  this.logger = SalesTeamLogger.getInstance("SalesTeamAccessDAO");
        // output : logger = SalesTeamLogger in variableList to refer..
        if (node.expression && node.expression.type === 'AssignmentExpression' &&
            node.expression.left && node.expression.left.type === 'MemberExpression' &&
            (node.expression.right.type === 'CallExpression' || node.expression.right.type === 'NewExpression')) {
            //context.report(node, ''+node.expression.left.property.name);
            if (node.expression.right.type === 'CallExpression') {
                variableList[node.expression.left.property.name] = node.expression.right.callee.object.name;
                // this.jfDAO = new SalesTeamJobFunctionDAO();
            } else if (node.expression.right.type === 'NewExpression') {
                variableList[node.expression.left.property.name] = node.expression.right.callee.name;
            }
        } else {
            parseCalleeExpression(node, name);
        }
    });
}

function parseCalleeExpression(node, name) {

    if (node.expression && node.expression.type === 'CallExpression' && node.expression.callee) {
        if (ignoreObjectList.indexOf(variableList[node.expression.callee.property.name]) < -1) {
        } else if (node.expression.callee && node.expression.callee.object && node.expression.callee.object.type === 'ThisExpression') {
            updateJson(variables[0], node.expression.callee.property.name, variables[0], name);
        } else if (node.expression.callee && node.expression.callee.object && node.expression.callee.type === 'MemberExpression') {
           /* console.log(" a;sdfasdfja "+ name + node.expression.callee.type + node.expression.callee.property.name);
            (node.expression.callee.type )
            updateJson(variables[0], node.expression.callee.property.name, variables[0], name); 
                no longer required for this.. 
            */
        }
    }
}


function updateJson(ClassName, methodName, ObjectType, functionName) {
    if (ObjectType === undefined)
        return;

    if (!memberVariableList[methodName]) {
        memberVariableList[methodName] = [];
    }
   var list = memberVariableList[methodName]|| [];
   var name = ObjectType + '.' + functionName;
   if(list.indexOf(name) < 0 ) {
        list.push(name);  
        memberVariableList[methodName] = list; 
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