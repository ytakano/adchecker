var filterFiles = [
    "Liste_AR.txt",
    "abp_jp.txt",
    "abpindo.txt",
    "adblock.txt",
    "adblock_bg.txt",
    "easylist.txt",
    "easylistdutch.txt",
    "easylistgermany.txt",
    "easylistitaly.txt",
    "easylistlithuania.txt",
    "easyprivacy.txt",
    "fanboy-annoyance.txt",
    "filters.txt",
    "latvian-list.txt",
    "liste_fr.txt"
];

var fc = require('./filterClasses.js');

function filterRule (rule) {
    this.files  = {};
    this.filter = fc.Filter.fromText(rule);
}

filterRule.prototype.addFile = function (file) {
    this.files[file] = null;
}


function loadFilter() {
    var fs = require('fs');
    var filters = {};
    var n = 0;

    for (var i = 0; i < filterFiles.length; i++) {
        var text  = fs.readFileSync(filterFiles[i], 'utf8');
        var rules = text.split('\n').slice(1);

        for (var j = 0; j < rules.length; j++) {
            if (rules[j] == '' || rules[j][0] == '!' ||
                rules[j].slice(0, 2) == "##") {
                continue;
            }

            if (rules[j] in filters) {
                filters[rules[j]].addFile(filterFiles[i]);
            } else {
                var rule = new filterRule(rules[j]);
                rule.addFile(filterFiles[i]);

                filters[rules[j]] = rule;
                n++;
            }
        }
    }

    console.log(n);

    return filters;
}

loadFilter();
