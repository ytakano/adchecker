var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    mongodb = require('mongodb').MongoClient,
    port = process.argv[2] || 8888,
    db = 'wide1409',
    collection = 'http';

var dbcol = null;


mongodb.connect('mongodb://127.0.0.1:27017/' + db, function(err, db) {
    if (err)
        throw err;

    dbcol = db.collection(collection);
    dbcol.ensureIndex({date: -1}, function(err, idx) { });
});

function get_url(data) {
    if (! 'client' in data)
        return 'NO URL';

    if (! 'method' in data['client'])
        return 'NO METHOD';

    if ('header' in data['client'] && 'host' in data['client']['header']) {
        return 'http://' + data['client']['header']['host'] + data['client']['method']['uri'];
    } else {
        return data['client']['method']['uri'];
    }
}

function write_url_count(Response, body, count) {
    body += '<p>' + count + ' requests are captured<br>';

    dbcol.find({ads: {$exists: true}}).count(function(err, count) {
        if (err) {
            Response['500'](err);
            return;
        }

        write_ads_count(Response, body, count);
    });
}

function write_ads_count(Response, body, count) {
    body += count + ' requests are for ads</p>';

    dbcol.find({ads: {$exists: true}})
        .sort({date: -1})
        .limit(100).toArray(function(err, result) {
            if (err) {
                Response['500'](err);
                return;
            }

            write_url(Response, body, result);
        });
}

function write_url(Response, body, result) {
    body += '<table style="table-layout:fixed;width:100%;"><colgroup><col style="width:20%"><col style="width:10%"><col style="width:70%"></colgroup><tr><th>Date</th><th>Filter</th><th>URL</th></tr>'

    for (var i = 0; i < result.length; i++) {
        var ads = '';
        var filter = {};
        for (var j = 0; j < result[i]['ads'].length; j++) {
            for (var k in result[i]['ads'][j][1]) {
                filter[result[i]['ads'][j][1][k]] = true;
            }
        }

        for (var f in filter) {
            ads += f + '<br>';
        }

        body += '<tr>';
        body += '<td>' + result[i]['date'] + '</td>';
        body += '<td>' + ads + '</td>';
        body += '<td>' + get_url(result[i]) + '</td>';
        body += '</tr>';
    }

    body += '</table></body></html>'

    Response['200'](body);
}


http.createServer(function(request, response) {
    var Response = {
        "200": function(file) {
            var header = {
                "Access-Control-Allow-Origin":"*",
                "Pragma": "no-cache",
                "Cache-Control" : "no-cache",
                "Content-Type": "text/html; charset=utf-8"
            }

            response.writeHead(200, header);
            response.write(file, "binary");
            response.end();
        },
        "404": function() {
            response.writeHead(404, {"Content-Type": "text/plain"});
            response.write("404 Not Found\n");
            response.end();

        },
        "500": function(err) {
            response.writeHead(500, {"Content-Type": "text/plain"});
            response.write(err + "\n");
            response.end();
        }
    }

    var uri = url.parse(request.url).pathname,
        filename = path.join(process.cwd(), uri);

    if (request.url == '/') {
        dbcol.find().count(function(err, count) {
            if (err) {
                Response['500'](err);
                return;
            }
            var body = '<html><head><style type="text/css">table,td,th{border:2px #2b2b2b solid;word-wrap:break-word;}</style><title>Recent HTTP Requests to Ads</title><body><h1>Recent HTTP Requests of Attendees of the Camp to Ads</h1>'

            write_url_count(Response, body, count);
        });
    } else {
        Response['404']();
    }
}).listen(parseInt(port, 10));
