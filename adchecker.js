// npm:
//     lru-cache
//     mongodb

var path = require('path');
var fs   = require('fs');
var dir  = path.dirname(fs.realpathSync(__filename));

var LRU = require("lru-cache");
var cache = LRU(10000);

var filterFiles = {
    "Adblock_Plus_list": "Japan (Tofu)",
//    "Liste_AR": "Arabia",
//    "abp_jp": "Japan (adb)",
//    "abpindo": "Indonesia",
//    "adblock": "Norway",
//    "adblock_bg": "Bulgaria",
    "easylist": "Easy List",
//    "easylistdutch": "Netherland",
//    "easylistgermany": "Germaly",
//    "easylistitaly": "Italy",
//    "easylistlithuania": "Lithuania",
    "easyprivacy": "Easy Privacy",
//    "fanboy-annoyance": "Fanboy Annoyance",
//    "filters": "Czech and Slovakia",
//    "liste_fr": "France",
//    "malwaredomains_full": "Malware",
//    "easylistchina": "China",
//    "void-gr-filters": "Greek",
//    "rolist": "Romania",
//    "ab": "Estonia",
//    "advblock": "Russia"
};

var fc = require('./filterClasses.js');

function filterRule (rule) {
    this.files  = {};
    this.filter = fc.Filter.fromText(rule);
}

filterRule.prototype.addFile = function (file) {
    this.files[file] = filterFiles[file];
}

filterRule.prototype.matches = function (url) {
    var sp = url.split('/');

    if (sp.length > 3) {
        return this.filter.matches(url, sp[2]);
    } else {
        return this.filter.matches(url);
    }
}

function loadFilter() {
    var fs = require('fs');
    var filters = {};
    var n = 0;

    for (i in filterFiles) {
        var text  = fs.readFileSync(dir + '/' + i + '.txt', 'utf8');
        var rules = text.split('\n').slice(1);

        for (var j = 0; j < rules.length; j++) {
            if (rules[j] == '' || rules[j][0] == '!' ||
                rules[j].slice(0, 2) == "##") {
                continue;
            }

            if (rules[j] in filters) {
                filters[rules[j]].addFile(i);
            } else {
                var rule = new filterRule(rules[j]);

                if (rule.filter == null)
                    continue;

                rule.addFile(i);

                filters[rules[j]] = rule;
                n++;
            }
        }
    }

    // console.log(n);

    return filters;
}

if (process.argv.length < 4) {
    console.log('usage: node jstore.js db collection');
    process.exit(1);
}

var mongo_client = require('mongodb').MongoClient;
var uri = 'mongodb://127.0.0.1:27017/' + process.argv[2];

console.log(uri);

mongo_client.connect(uri, function(err, db) {
    if (err)
        throw err;

    var collection = db.collection(process.argv[3]);

    var reader = require('readline').createInterface({
        input: process.stdin,
        output: process.stderr
    });

    var filters = loadFilter();

    reader.setPrompt('');
    reader.prompt();

    reader.on('line', function (line) {
        var result;

        try {
            result = JSON.parse(line);
            result['date'] = new Date();

            var uri;

            if ('client' in result) {
                if ('host' in result['client']['header']) {
                    uri = result['client']['header']['host'] + result['client']['method']['uri'];
                } else {
                    uri = result['client']['method']['uri'];
                }
            }

            var ads_rules = {};
            var is_ads = false;

            var c = cache.get(uri);

            if (c == undefined) {
                for (var key in filters) {
                    if (filters[key].matches(line)) {
                        is_ads = true;
                        ads_rules[filters[key].filter.text] = filters[key].files;
                    }
                }

                if (is_ads) {
                    cache.set(uri, ads_rules);
                } else {
                    cache.set(uri, false);
                }
            } else if (c != false) {
                is_ads = true;
                ads_rules = c;
            }

            if (is_ads) {
                var rules = [];
                for (rule in ads_rules) {
                    rules.push([rule, ads_rules[rule]]);
                }

                result['ads'] = rules;

                console.log(uri);
                console.log(rules);
            }

            collection.insert(result, function(err, result) {
                if (err) console.warn(err.message);
            });
        } catch (e) {
            console.log(e);
        }
    });

    process.stdin.on('end', function () {
        //do something
    });
});
