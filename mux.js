// cd protocol-parser/html
// $ lein run| node ../../../js/adchecker/mux.js 2&> /dev/null

var path = require('path');
var fs   = require('fs');
var cp   = require('child_process');
var dir  = path.dirname(fs.realpathSync(__filename));
var adchekcer = dir + '/adchecker.js'
var children = new Array(18);
var idx = 0;

var reader = require('readline').createInterface({
    input: process.stdin,
    output: process.stderr
});

console.log(adchekcer);

for (var i = 0; i < children.length; i++) {
    children[i] = cp.fork(adchekcer);
}

reader.setPrompt('');
reader.prompt();

reader.on('line', function (line) {
    try {
        var obj = JSON.parse(line);

        children[idx].send({'line': line, 'obj': obj});

        idx++;

        if (idx == children.length)
            idx = 0;
    } catch (e) {
        console.log(e);
    }
});
