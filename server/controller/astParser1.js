export default function(context) {
    
        var variableList =  {};
        var variables = [];
          var memberFuncitons= {};
       var ignoreObjectList = ['GlideRecord','gs','',undefined];
      
          var result = [];
      
          function parseMemberExpression(node,context,name, string) {
              var string =  string||'';
              if(node.parent && node.type != 'Property'){
              //console.log(node.parent);
              parseMemberExpression(node.parent, context,name, string);
            }else if(node.type == 'Property') {
                  string =  'ClassName : '+ variables[0]+'-'+'functionName : '+ node.key.name + '- Method Name' + ': ' +string+'.'+name;
                  context.report(node, string);
            }
        }
      
          function parseExpressionStatement(nodeList, context,name) {
          nodeList.forEach(function(node){
                parseCalleeExpression(node, context,name);
          });
        }
      
          function parseCalleeExpression(node, context,name) {
           var ignoreObjectList = ['GlideRecord','gs'];
                if (node.expression && node.expression.type === 'CallExpression' && node.expression.callee) {
                      if(ignoreObjectList.indexOf(variableList[node.expression.callee.property.name]) < -1 ){
                        context.report(node, 'Do not use eval() function... Use GlideEvaluator '+name);
                    }else if(node.expression.callee && node.expression.callee.object && node.expression.callee.object.type =='ThisExpression') {
                         context.report(node, 'method call '+ variables[0]+'.'+node.expression.callee.property.name + '-' +name );	 
                    } else if(node.expression.callee && node.expression.callee.object && node.expression.callee.object.type =='MemberExpression') {
                        context.report(node, 'method call '+ variables[0]+'.'+node.expression.callee.property.name + '-' +name );	                  	 
                    }
                }
        }
    
        function printData(node, context) {
          
          var object  = {functionName:node.property.name, class:Object.keys(variableList)[0],methodName:''};
            
              if(node.object.type == 'ThisExpression') {
              object.class= Object.keys(variableList)[0];
              context.report(node, node.property.name);
            }else {
                  var object_name = node.object.name;
                  object.type = variableList[object_name];
                  //context.report(node,'KM:'+node.object.name);
            }
            // get parent function name
            context.report(node,node.property);
            var parnetNode = node.parent;
            while(parnetNode.parent) {
                if( parnetNode.type != 'Property' ) {
                    parnetNode = parnetNode.parent;
                }else {
                    //console.log(variableList[object_name]);
                   context.report(parnetNode,'Km1 '+ parnetNode.key.name +' , ' + node.property.name);
                  if(node.property.name === 'setValue')
                       console.log(node);
                      object.methodName = parnetNode.key.name;
                    parnetNode = undefined;
                    break;
                }
            }
          result.push(object);
        }
    
        return {
            TemplateLiteral(node) {
                context.report(node, 'Do not use template literals');
            },
          
              "Property:exit" (node) {
                  if(node.key && node.value.type === 'FunctionExpression') {
                  parseExpressionStatement(node.value.body.body, context, node.key.name);
                  //context.report(node, 'inside of memeber function ');
                  //var object  = {functionName:node.key.name, class:Object.keys(variableList)[0],methodName:''};
                  //result.push(object);
                  
                }
            },
    
            "Program:exit"(node) {
                if(node.body.length  === 0) {
                    context.report(node, "Client Scripts should not have an empty script field")
                }
            },
    
            "VariableDeclarator:exit" (node) {
                if(node.id && node.init && node.init.callee) {
                      //console.log();
                    var object = node.init.callee.name;
                    if(!node.init.callee.name) {
                      object = node.init.callee.object.name+'.'+node.init.callee.property.name
                      //variableList[node.id.name] = !node.init.callee.name ? node.init.callee.object.name+'.'+node.init.callee.property.name : node.init.callee.name ;
                    }
                      
                    variableList[node.id.name] = object;
                      variables.push(node.id.name);
                   console.log(variableList);
                }
            },
    
            "MemberExpression:exit" (node) { // latest code...
               //	console.log(variableList);
                if(node.property && node.property.name && node.object && node.object.name && ignoreObjectList.indexOf(variableList[node.object.name]) < 0) {
                  context.report(node,'Lint rule fired');
                  parseMemberExpression(node, context, node.property.name, variableList[node.object.name]);
                    //printData(node, context);
                }
            },
    
            "CallExpression:exit" (node) {
                  var ignoreObjectList = ['GlideRecord','gs'];
                if (node.callee && node.callee.object ) {
                      if(ignoreObjectList.indexOf(variableList[node.callee.object.name]) < -1 ){
                        //context.report(node, 'Do not use eval() function... Use GlideEvaluator ');
                    }else if(node.callee && node.callee.object && node.callee.object.type =='ThisExpression') {
                         //context.report(node, 'method call '+ variables[0]+'.'+node.callee.property.name);	 
                    }
                }
            }
        };
    };