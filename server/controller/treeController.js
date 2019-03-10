var js2flowchart = require('js2flowchart');

exports.getFlowChart = function(req,res,next) {
  var requestBody = req.body;
  var svg = '',
    status = 200;
  if(requestBody.data) {
    svg = js2flowchart.convertCodeToSvg(requestBody.data);
  }else {
    status = 500;
  }

  return res.status(status).json(svg);

}

