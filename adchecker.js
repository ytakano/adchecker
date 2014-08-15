var filterFiles = {
    "Adblock_Plus_list.txt": "Japan 1",
    "Liste_AR.txt": "Arabia",
    "abp_jp.txt": "Japan 2",
    "abpindo.txt": "Indonesia",
    "adblock.txt": "Norway",
    "adblock_bg.txt": "Bulgaria",
    "easylist.txt": "General",
    "easylistdutch.txt": "Netherland",
    "easylistgermany.txt": "Germaly",
    "easylistitaly.txt": "Italy",
    "easylistlithuania.txt": "Lithuania",
    "easyprivacy.txt": "English 1",
    "fanboy-annoyance.txt": "English 2",
    "filters.txt": "Czech and Slovakia",
    "liste_fr.txt": "France",
    "malwaredomains_full.txt": "Malware",
    "easylistchina.txt": "China",
    "void-gr-filters.txt": "Greek",
    "rolist.txt": "Romania",
    "ab.txt": "Estonia",
    "advblock.txt": "Russia"
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
        var text  = fs.readFileSync(i, 'utf8');
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

var filters = loadFilter();
var reader = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

reader.setPrompt('');
reader.prompt();

reader.on('line', function (line) {
    var result = {result: false, rules: {}};
    for (var key in filters) {
        if (filters[key].matches(line)) {
            result['result'] = true;
            result['rules'][filters[key].filter.text] = filters[key].files;
        }
    }

    console.log(JSON.stringify(result));
});

process.stdin.on('end', function () {
    //do something
});
