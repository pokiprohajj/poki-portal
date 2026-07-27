const original = require('./posts/original');
const tips = require('./posts/tips');
const lists = require('./posts/lists');
const comparisons = require('./posts/comparisons');
const evergreen = require('./posts/evergreen');
const challenges = require('./posts/challenges');
const bulk = require('./posts/bulk');
const bulk2 = require('./posts/bulk2');
const bulk3 = require('./posts/bulk3');
const bulk4 = require('./posts/bulk4');
const bulk5 = require('./posts/bulk5');
const bulk6 = require('./posts/bulk6');

const all = [].concat(original, tips, lists, comparisons, evergreen, challenges, bulk, bulk2, bulk3, bulk4, bulk5, bulk6);

module.exports = all;
