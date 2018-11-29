export default function (context) {
  
    var variableList = {};
    var variables = [];
    var memberFuncitons = {};
    var ignoreObjectList = ['GlideRecord', 'gs', '', undefined, 'Class', 'Object','GlideDateTime','GlideAggregate','push','join','addOrCondition', 'JSUtil', 'toString', 'isArray','hasRole'];
    var scriptName;
    variableList['gs'] = 'gs';
  
    var result = [];
  
    function referenceStore(methodName) {
      //console.log('11')
      var list = memberFuncitons[methodName] || [];
      memberFuncitons[methodName] = list;
  
      console.log(memberFuncitons);
    }
  
    function varaibleStore(className, variableName) {
      var list = variableList[className] || [];
      if (list.indexOf(variableName) < 0) {
        list.push(variableName);
      }
      variableList[className] = list;
      console.log(variableList);
    }
  
    function storeJson(methodName, classNamefunctionName) {
      //console.log("***** methodName " + classNamefunctionName);
      var list = memberFuncitons[methodName] || [];
      if (list.indexOf(classNamefunctionName) < 0) {
        list.push(classNamefunctionName);
      }
      memberFuncitons[methodName] = list;
      console.log(memberFuncitons);
    }
  
    function getClassName(variable, list) {
      //debugger;
      var name;
      var keys = Object.keys(variableList); //variableList
      if (keys.length > 0) {
        keys.forEach(function (key) {
          variableList[key].indexOf(variable) > -1 ? name = key : name = name;
        });
      }
      return name;
    }
  
  
    function findParent(node, classNamefunctionName) {
      context.report(node, ''+node.type);
      if (node.type === 'Property' || (node.type === 'AssignmentExpression' && node.right.type === 'FunctionExpression')) {
        //context.report(node, ''+ classNamefunctionName + ' ' + (node.type === 'AssignmentExpression' ? node.left.property.name : node.key.name));
        storeJson((node.type === 'AssignmentExpression' ? node.left.property.name : node.key.name), classNamefunctionName)
      }else if(( node.type === 'FunctionExpression' ||  node.type === 'FunctionDeclaration') && node.id) {
         context.report(node, ''+ node.id.name+ classNamefunctionName);
         storeJson(node.id.name, classNamefunctionName);
      }
      else if (node.parent) {
        
        findParent(node.parent, classNamefunctionName);
      }
  
    }
  
    function getReference(variableName) {
      var sName = getClassName(variableName);
      return sName|| variableName;
    }
  
    function filterIngoreObjects(variableName) {
      //console.log(variableName);
      var data = getClassName(variableName, variableList);
      var result = false;
      if (data && ignoreObjectList.indexOf(data) < -1) {
        result = true;
      }
      return result;
    }
  
  
    return {
      TemplateLiteral(node) {
        context.report(node, 'Do not use template literals');
      },
  
      "Property:exit"(node) {
        if (node.key && node.key.name !== 'type') {
          referenceStore(node.key.name);
        } else if(node.value) {
          scriptName = node.value.value;
          //context.report(node, scriptName);
        } 
      },
      "AssignmentExpression:exit"(node) { // to handle  SalesTeamAccessDAO.triggerSSARollupsWithLineItem = function
        var ignore = ['Identifier', 'ObjectExpression', 'Literal', 'UnaryExpression']
        if (node.left && node.right && node.right.type === 'FunctionExpression') {
          referenceStore(node.left.property.name);
        } else if (node.left && node.right && ignore.indexOf(node.right.type) < 0 && node.left.object && node.left.object.type === 'ThisExpression' && node.right.callee && node.right.callee.object) {
          var objName = node.right.callee.object.name;
          //context.report(node, 'New '+objName+ node.right.type +'-- '+ node.left.property.name);
          if (node.right.callee.object.type === 'NewExpression' && node.right.callee.object.callee) {
            objName = node.right.callee.object.callee.name
            //context.report(node, 'New '+objName+ node.right.type +'-- '+ node.left.property.name);
          }
          else if (node.right.callee.object.type === 'Identifier' && node.right.callee.object.name === 'global') {
            objName = node.right.callee.object.name + '.' + node.right.callee.property.name
          }
          varaibleStore(objName, 'this.' + node.left.property.name);
        } else if (node.right && node.right.type === 'NewExpression' && node.right.callee && ignoreObjectList.indexOf(node.right.callee.name) < 0) {
          //context.report(node, '' + node.right.callee.name);
          varaibleStore(node.right.callee.name, 'this.'+node.left.property.name);
        }  
      },
  
      "NewExpression:exit"(node) {
        if(node.callee && node.parent.type !== 'MemberExpression') {
          if(node.callee.type && node.callee && node.callee.type === 'Identifier' && ignoreObjectList.indexOf(node.callee.name) < 0) {
            //context.report(node, 'NewExpression with out member expression ' +  node.callee.name );
            findParent(node, node.callee.name);
          } else if( node.callee && node.callee.object && node.callee.property && node.callee.type === 'MemberExpression' && ignoreObjectList.indexOf(node.callee.property.name) < 0) {
            //context.report(node, 'NewExpression with  member expression ' +  node.callee.property.name + '-- ' + node.callee.object.name );
            findParent(node,  node.callee.object.name +' . '+ node.callee.property.name);
          } 
          //
        }  
      },
      "VariableDeclarator:exit"(node) {
  
        if (node.init && node.init.callee && (node.init.type === 'NewExpression' || node.init.callee.object) && ignoreObjectList.indexOf(node.init.callee.object ? node.init.callee.object.name : node.init.callee.name) < 0) {
          var objName = node.init.callee.object ? node.init.callee.object.name + '.' + node.init.callee.property.name : node.init.callee.name;
          if (node.init.type !== 'NewExpression') {
            objName = node.init.callee.object.name;
          }
          varaibleStore(objName, node.id.name);
          //context.report(node, '' + objName +'  ---  '+node.id.name);
        } else if (node.init && node.init.callee) {
  
          objName = node.init.callee.name;
          //context.report(node, '' + objName +'  ---  '+node.id.name);
          varaibleStore(objName, node.id.name);
          variables.push(node.id.name);
        } 
      },
  
      "MemberExpression:exit"(node) { // latest code...
  
      },
  
      "ExpressionStatement:exit"(node) {
        if (node.expression.type === 'NewExpression') {
          //context.report(node, '');
          findParent(node, node.expression.callee.name + '');
        }
      },
      "FunctionExpression:exit"(node) {
         //context.report(node, 'functionExpression: ' + node.id.name); 
          if(node.id)
           referenceStore(node.id.name);
      },
      "FunctionDeclaration:exit"(node) {
        if(node.id)
           referenceStore(node.id.name);
      },
  
      "CallExpression:exit"(node) {
        // handle calling new classname().functionName()
        if (node.callee && node.callee.object && node.callee.object.type === 'NewExpression') {
          context.report(node, node.callee.object.callee.name);
          //findParent(node, node.callee.object.callee.name + '.' + node.callee.property.name);
        } else if (node.callee && node.callee.object && node.callee.object.object && node.callee.object.object.type === 'ThisExpression') {
          var cname = 'this.' + node.callee.object.property.name;
          context.report(node, 'cname= '+cname+ '----' + getClassName(cname, variableList)+' ' + node.callee.property.name);
          //console.log(getReference(cname));
          //console.log(getClassName(cname));
          //findParent(node, getClassName(cname, variableList) + '.' + node.callee.property.name);
        } else if (node.callee && node.callee.object && node.callee.object.type === 'ThisExpression') {
          context.report(node, '');
          //findParent(node, variables[0] + '.' + node.callee.property.name);
  
        } else if( node.callee && node.callee.object && ignoreObjectList.indexOf(getReference(node.callee.object.name)) < 0  && ignoreObjectList.indexOf(node.callee.property.name) < 0 ) { //if(node.parent.type === 'AssignmentExpression' || node.parent.type === 'VariableDeclarator'){
          context.report(node,'***************** '+ node.callee.object.name +' '+ getReference(node.callee.object.name));
           context.report(node, '' +node.parent.type+' ' + node.callee.object.name  + (getClassName(node.callee.object.name) || node.callee.object.name  ) + node.callee.property.name);
          if(filterIngoreObjects(node.callee.object.name)) {
          console.log('#########' + (getClassName(node.callee.object.name, variableList) || node.callee.object.name));
  
          var name = getReference(node.callee.object.name);
          if(name && name !== "undefined")
            findParent(node, getReference(node.callee.object.name) + '.' + node.callee.property.name)
          }
        }
      }
    };
  };
  