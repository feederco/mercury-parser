'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _slicedToArray = _interopDefault(require('babel-runtime/helpers/slicedToArray'));
var _toConsumableArray = _interopDefault(require('babel-runtime/helpers/toConsumableArray'));
var fs = _interopDefault(require('fs'));
var URL = _interopDefault(require('url'));
var inquirer = _interopDefault(require('inquirer'));
var ora = _interopDefault(require('ora'));
var child_process = require('child_process');
var _Reflect$ownKeys = _interopDefault(require('babel-runtime/core-js/reflect/own-keys'));
var _defineProperty = _interopDefault(require('babel-runtime/helpers/defineProperty'));
var _extends = _interopDefault(require('babel-runtime/helpers/extends'));
var iconv = _interopDefault(require('iconv-lite'));
var _typeof = _interopDefault(require('babel-runtime/helpers/typeof'));
var _getIterator = _interopDefault(require('babel-runtime/core-js/get-iterator'));
var _Object$freeze = _interopDefault(require('babel-runtime/core-js/object/freeze'));
var regenerator = _interopDefault(require('babel-runtime/regenerator'));
var asyncToGenerator = _interopDefault(require('babel-runtime/helpers/asyncToGenerator'));
var cheerio = _interopDefault(require('cheerio'));
var promise = _interopDefault(require('babel-runtime/core-js/promise'));
var request = _interopDefault(require('request'));
var keys = _interopDefault(require('babel-runtime/core-js/object/keys'));
var stringDirection = _interopDefault(require('string-direction'));
var validUrl = _interopDefault(require('valid-url'));
var momentTimezone = _interopDefault(require('moment-timezone'));
var momentParseformat = _interopDefault(require('moment-parseformat'));
var wuzzy = _interopDefault(require('wuzzy'));
var difflib = _interopDefault(require('difflib'));
var from = _interopDefault(require('babel-runtime/core-js/array/from'));
var ellipsize = _interopDefault(require('ellipsize'));
var _taggedTemplateLiteral = _interopDefault(require('babel-runtime/helpers/taggedTemplateLiteral'));

// Spacer images to be removed
var SPACER_RE = new RegExp('transparent|spacer|blank', 'i');

// The class we will use to mark elements we want to keep
// but would normally remove
var KEEP_CLASS = 'mercury-parser-keep';

var KEEP_SELECTORS = ['iframe[src^="https://www.youtube.com"]', 'iframe[src^="https://www.youtube-nocookie.com"]', 'iframe[src^="http://www.youtube.com"]', 'iframe[src^="https://player.vimeo"]', 'iframe[src^="http://player.vimeo"]'];

// A list of tags to strip from the output if we encounter them.
var STRIP_OUTPUT_TAGS = ['title', 'script', 'noscript', 'link', 'style', 'hr', 'embed', 'iframe', 'object'];

// cleanAttributes
var REMOVE_ATTRS = ['style', 'align'];
var REMOVE_ATTR_SELECTORS = REMOVE_ATTRS.map(function (selector) {
  return '[' + selector + ']';
});
var REMOVE_ATTR_LIST = REMOVE_ATTRS.join(',');
var WHITELIST_ATTRS = ['src', 'srcset', 'href', 'class', 'id', 'alt', 'xlink:href', 'width', 'height'];

var WHITELIST_ATTRS_RE = new RegExp('^(' + WHITELIST_ATTRS.join('|') + ')$', 'i');

// removeEmpty
var REMOVE_EMPTY_TAGS = ['p'];
var REMOVE_EMPTY_SELECTORS = REMOVE_EMPTY_TAGS.map(function (tag) {
  return tag + ':empty';
}).join(',');

// cleanTags
var CLEAN_CONDITIONALLY_TAGS = ['ul', 'ol', 'table', 'div', 'button', 'form'].join(',');

// cleanHeaders
var HEADER_TAGS = ['h2', 'h3', 'h4', 'h5', 'h6'];
var HEADER_TAG_LIST = HEADER_TAGS.join(',');

// // CONTENT FETCHING CONSTANTS ////

// A list of strings that can be considered unlikely candidates when
// extracting content from a resource. These strings are joined together
// and then tested for existence using re:test, so may contain simple,
// non-pipe style regular expression queries if necessary.
var UNLIKELY_CANDIDATES_BLACKLIST = ['ad-break', 'adbox', 'advert', 'addthis', 'agegate', 'aux', 'blogger-labels', 'combx', 'comment', 'conversation', 'disqus', 'entry-unrelated', 'extra', 'foot',
// 'form', // This is too generic, has too many false positives
'header', 'hidden', 'loader', 'login', // Note: This can hit 'blogindex'.
'menu', 'meta', 'nav', 'outbrain', 'pager', 'pagination', 'predicta', // readwriteweb inline ad box
'presence_control_external', // lifehacker.com container full of false positives
'popup', 'printfriendly', 'related', 'remove', 'remark', 'rss', 'share', 'shoutbox', 'sidebar', 'sociable', 'sponsor', 'taboola', 'tools'];

// A list of strings that can be considered LIKELY candidates when
// extracting content from a resource. Essentially, the inverse of the
// blacklist above - if something matches both blacklist and whitelist,
// it is kept. This is useful, for example, if something has a className
// of "rss-content entry-content". It matched 'rss', so it would normally
// be removed, however, it's also the entry content, so it should be left
// alone.
//
// These strings are joined together and then tested for existence using
// re:test, so may contain simple, non-pipe style regular expression queries
// if necessary.
var UNLIKELY_CANDIDATES_WHITELIST = ['and', 'article', 'body', 'blogindex', 'column', 'content', 'entry-content-asset', 'format', // misuse of form
'hfeed', 'hentry', 'hatom', 'main', 'page', 'posts', 'shadow'];

// A list of tags which, if found inside, should cause a <div /> to NOT
// be turned into a paragraph tag. Shallow div tags without these elements
// should be turned into <p /> tags.
var DIV_TO_P_BLOCK_TAGS = ['a', 'blockquote', 'dl', 'div', 'img', 'p', 'pre', 'table'].join(',');

// A list of tags that should be ignored when trying to find the top candidate
// for a document.




// A list of selectors that specify, very clearly, either hNews or other
// very content-specific style content, like Blogger templates.
// More examples here: http://microformats.org/wiki/blog-post-formats





// A list of strings that denote a positive scoring for this content as being
// an article container. Checked against className and id.
//
// TODO: Perhaps have these scale based on their odds of being quality?


// The above list, joined into a matching regular expression


// Readability publisher-specific guidelines


// A list of strings that denote a negative scoring for this content as being
// an article container. Checked against className and id.
//
// TODO: Perhaps have these scale based on their odds of being quality?

// The above list, joined into a matching regular expression


// XPath to try to determine if a page is wordpress. Not always successful.
var IS_WP_SELECTOR = 'meta[name=generator][value^=WordPress]';

// Match a digit. Pretty clear.


// A list of words that, if found in link text or URLs, likely mean that
// this link is not a next page link.



// Match any phrase that looks like it could be page, or paging, or pagination


// Match any link text/classname/id that looks like it could mean the next
// page. Things like: next, continue, >, >>, » but not >|, »| as those can
// mean last page.
// export const NEXT_LINK_TEXT_RE = new RegExp('(next|weiter|continue|>([^\|]|$)|»([^\|]|$))', 'i');


// Match any link text/classname/id that looks like it is an end link: things
// like "first", "last", "end", etc.


// Match any link text/classname/id that looks like it means the previous
// page.


// Match 2 or more consecutive <br> tags


// Match 1 BR tag.


// A list of all of the block level tags known in HTML5 and below. Taken from
// http://bit.ly/qneNIT
var BLOCK_LEVEL_TAGS = ['article', 'aside', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'col', 'colgroup', 'dd', 'div', 'dl', 'dt', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'li', 'map', 'object', 'ol', 'output', 'p', 'pre', 'progress', 'section', 'table', 'tbody', 'textarea', 'tfoot', 'th', 'thead', 'tr', 'ul', 'video'];
var BLOCK_LEVEL_TAGS_RE = new RegExp('^(' + BLOCK_LEVEL_TAGS.join('|') + ')$', 'i');

// The removal is implemented as a blacklist and whitelist, this test finds
// blacklisted elements that aren't whitelisted. We do this all in one
// expression-both because it's only one pass, and because this skips the
// serialization for whitelisted nodes.
var candidatesBlacklist = UNLIKELY_CANDIDATES_BLACKLIST.join('|');
var CANDIDATES_BLACKLIST = new RegExp(candidatesBlacklist, 'i');

var candidatesWhitelist = UNLIKELY_CANDIDATES_WHITELIST.join('|');
var CANDIDATES_WHITELIST = new RegExp(candidatesWhitelist, 'i');

// ## NOTES:
// Another good candidate for refactoring/optimizing.
// Very imperative code, I don't love it. - AP

//  Given cheerio object, convert consecutive <br /> tags into
//  <p /> tags instead.
//
//  :param $: A cheerio object

function brsToPs$$1($) {
  var collapsing = false;
  $('br').each(function (index, element) {
    var $element = $(element);
    var nextElement = $element.next().get(0);

    if (nextElement && nextElement.tagName.toLowerCase() === 'br') {
      collapsing = true;
      $element.remove();
    } else if (collapsing) {
      collapsing = false;
      // $(element).replaceWith('<p />')
      paragraphize(element, $, true);
    }
  });

  return $;
}

// Given a node, turn it into a P if it is not already a P, and
// make sure it conforms to the constraints of a P tag (I.E. does
// not contain any other block tags.)
//
// If the node is a <br />, it treats the following inline siblings
// as if they were its children.
//
// :param node: The node to paragraphize; this is a raw node
// :param $: The cheerio object to handle dom manipulation
// :param br: Whether or not the passed node is a br

function paragraphize(node, $) {
  var br = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  var $node = $(node);

  if (br) {
    var sibling = node.nextSibling;
    var p = $('<p></p>');

    // while the next node is text or not a block level element
    // append it to a new p node
    while (sibling && !(sibling.tagName && BLOCK_LEVEL_TAGS_RE.test(sibling.tagName))) {
      var nextSibling = sibling.nextSibling;
      $(sibling).appendTo(p);
      sibling = nextSibling;
    }

    $node.replaceWith(p);
    $node.remove();
    return $;
  }

  return $;
}

function convertDivs($) {
  $('div').each(function (index, div) {
    var $div = $(div);
    var convertable = $div.children(DIV_TO_P_BLOCK_TAGS).length === 0;

    if (convertable) {
      convertNodeTo$$1($div, $, 'p');
    }
  });

  return $;
}

function convertSpans($) {
  $('span').each(function (index, span) {
    var $span = $(span);
    var convertable = $span.parents('p, div').length === 0;
    if (convertable) {
      convertNodeTo$$1($span, $, 'p');
    }
  });

  return $;
}

function convertNodeTo$$1($node, $) {
  var tag = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'p';

  var node = $node.get(0);
  if (!node) {
    return $;
  }
  var attrs = getAttrs(node) || {};
  // console.log(attrs)

  var attribString = _Reflect$ownKeys(attrs).map(function (key) {
    return key + '=' + attrs[key];
  }).join(' ');
  var html = void 0;

  if ($.browser) {
    // In the browser, the contents of noscript tags aren't rendered, therefore
    // transforms on the noscript tag (commonly used for lazy-loading) don't work
    // as expected. This test case handles that
    html = node.tagName.toLowerCase() === 'noscript' ? $node.text() : $node.html();
  } else {
    html = $node.contents();
  }
  $node.replaceWith('<' + tag + ' ' + attribString + '>' + html + '</' + tag + '>');
  return $;
}

function cleanForHeight($img, $) {
  var height = parseInt($img.attr('height'), 10);
  var width = parseInt($img.attr('width'), 10) || 20;

  // Remove images that explicitly have very small heights or
  // widths, because they are most likely shims or icons,
  // which aren't very useful for reading.
  if ((height || 20) < 10 || width < 10) {
    $img.remove();
  } else if (height) {
    // Don't ever specify a height on images, so that we can
    // scale with respect to width without screwing up the
    // aspect ratio.
    $img.removeAttr('height');
  }

  return $;
}

// Cleans out images where the source string matches transparent/spacer/etc
// TODO This seems very aggressive - AP
function removeSpacers($img, $) {
  if (SPACER_RE.test($img.attr('src'))) {
    $img.remove();
  }

  return $;
}

function stripJunkTags(article, $) {
  var tags = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

  if (tags.length === 0) {
    tags = STRIP_OUTPUT_TAGS;
  }

  // Remove matching elements, but ignore
  // any element with a class of mercury-parser-keep
  $(tags.join(','), article).not('.' + KEEP_CLASS).remove();

  return $;
}

function removeAllButWhitelist($article, $) {
  $article.find('*').each(function (index, node) {
    var attrs = getAttrs(node);

    setAttrs(node, _Reflect$ownKeys(attrs).reduce(function (acc, attr) {
      if (WHITELIST_ATTRS_RE.test(attr)) {
        return _extends({}, acc, _defineProperty({}, attr, attrs[attr]));
      }

      return acc;
    }, {}));
  });

  // Remove the mercury-parser-keep class from result
  $('.' + KEEP_CLASS, $article).removeClass(KEEP_CLASS);

  return $article;
}

// // CONTENT FETCHING CONSTANTS ////

// A list of strings that can be considered unlikely candidates when
// extracting content from a resource. These strings are joined together
// and then tested for existence using re:test, so may contain simple,
// non-pipe style regular expression queries if necessary.
var UNLIKELY_CANDIDATES_BLACKLIST$1 = ['ad-break', 'adbox', 'advert', 'addthis', 'agegate', 'aux', 'blogger-labels', 'combx', 'comment', 'conversation', 'disqus', 'entry-unrelated', 'extra', 'foot', 'form', 'header', 'hidden', 'loader', 'login', // Note: This can hit 'blogindex'.
'menu', 'meta', 'nav', 'pager', 'pagination', 'predicta', // readwriteweb inline ad box
'presence_control_external', // lifehacker.com container full of false positives
'popup', 'printfriendly', 'related', 'remove', 'remark', 'rss', 'share', 'shoutbox', 'sidebar', 'sociable', 'sponsor', 'tools'];

// A list of strings that can be considered LIKELY candidates when
// extracting content from a resource. Essentially, the inverse of the
// blacklist above - if something matches both blacklist and whitelist,
// it is kept. This is useful, for example, if something has a className
// of "rss-content entry-content". It matched 'rss', so it would normally
// be removed, however, it's also the entry content, so it should be left
// alone.
//
// These strings are joined together and then tested for existence using
// re:test, so may contain simple, non-pipe style regular expression queries
// if necessary.
var UNLIKELY_CANDIDATES_WHITELIST$1 = ['and', 'article', 'body', 'blogindex', 'column', 'content', 'entry-content-asset', 'format', // misuse of form
'hfeed', 'hentry', 'hatom', 'main', 'page', 'posts', 'shadow'];

// A list of tags which, if found inside, should cause a <div /> to NOT
// be turned into a paragraph tag. Shallow div tags without these elements
// should be turned into <p /> tags.
var DIV_TO_P_BLOCK_TAGS$1 = ['a', 'blockquote', 'dl', 'div', 'img', 'p', 'pre', 'table'].join(',');

// A list of tags that should be ignored when trying to find the top candidate
// for a document.
var NON_TOP_CANDIDATE_TAGS$1 = ['br', 'b', 'i', 'label', 'hr', 'area', 'base', 'basefont', 'input', 'img', 'link', 'meta'];

var NON_TOP_CANDIDATE_TAGS_RE$1 = new RegExp('^(' + NON_TOP_CANDIDATE_TAGS$1.join('|') + ')$', 'i');

// A list of selectors that specify, very clearly, either hNews or other
// very content-specific style content, like Blogger templates.
// More examples here: http://microformats.org/wiki/blog-post-formats
var HNEWS_CONTENT_SELECTORS$1 = [['.hentry', '.entry-content'], ['entry', '.entry-content'], ['.entry', '.entry_content'], ['.post', '.postbody'], ['.post', '.post_body'], ['.post', '.post-body']];

var PHOTO_HINTS$1 = ['figure', 'photo', 'image', 'caption'];
var PHOTO_HINTS_RE$1 = new RegExp(PHOTO_HINTS$1.join('|'), 'i');

// A list of strings that denote a positive scoring for this content as being
// an article container. Checked against className and id.
//
// TODO: Perhaps have these scale based on their odds of being quality?
var POSITIVE_SCORE_HINTS$1 = ['article', 'articlecontent', 'instapaper_body', 'blog', 'body', 'content', 'entry-content-asset', 'entry', 'hentry', 'main', 'Normal', 'page', 'pagination', 'permalink', 'post', 'story', 'text', '[-_]copy', // usatoday
'\\Bcopy'];

// The above list, joined into a matching regular expression
var POSITIVE_SCORE_RE$1 = new RegExp(POSITIVE_SCORE_HINTS$1.join('|'), 'i');

// Readability publisher-specific guidelines
var READABILITY_ASSET$1 = new RegExp('entry-content-asset', 'i');

// A list of strings that denote a negative scoring for this content as being
// an article container. Checked against className and id.
//
// TODO: Perhaps have these scale based on their odds of being quality?
var NEGATIVE_SCORE_HINTS$1 = ['adbox', 'advert', 'author', 'bio', 'bookmark', 'bottom', 'byline', 'clear', 'com-', 'combx', 'comment', 'comment\\B', 'contact', 'copy', 'credit', 'crumb', 'date', 'deck', 'excerpt', 'featured', // tnr.com has a featured_content which throws us off
'foot', 'footer', 'footnote', 'graf', 'head', 'info', 'infotext', // newscientist.com copyright
'instapaper_ignore', 'jump', 'linebreak', 'link', 'masthead', 'media', 'meta', 'modal', 'outbrain', // slate.com junk
'promo', 'pr_', // autoblog - press release
'related', 'respond', 'roundcontent', // lifehacker restricted content warning
'scroll', 'secondary', 'share', 'shopping', 'shoutbox', 'side', 'sidebar', 'sponsor', 'stamp', 'sub', 'summary', 'tags', 'tools', 'widget'];
// The above list, joined into a matching regular expression
var NEGATIVE_SCORE_RE$1 = new RegExp(NEGATIVE_SCORE_HINTS$1.join('|'), 'i');

// Match a digit. Pretty clear.


// Match 2 or more consecutive <br> tags


// Match 1 BR tag.


// A list of all of the block level tags known in HTML5 and below. Taken from
// http://bit.ly/qneNIT



// The removal is implemented as a blacklist and whitelist, this test finds
// blacklisted elements that aren't whitelisted. We do this all in one
// expression-both because it's only one pass, and because this skips the
// serialization for whitelisted nodes.
var candidatesBlacklist$1 = UNLIKELY_CANDIDATES_BLACKLIST$1.join('|');


var candidatesWhitelist$1 = UNLIKELY_CANDIDATES_WHITELIST$1.join('|');




var PARAGRAPH_SCORE_TAGS$1 = new RegExp('^(p|li|span|pre)$', 'i');
var CHILD_CONTENT_TAGS$1 = new RegExp('^(td|blockquote|ol|ul|dl)$', 'i');
var BAD_TAGS$1 = new RegExp('^(address|form)$', 'i');

// Get the score of a node based on its className and id.
function getWeight(node) {
  var classes = node.attr('class');
  var id = node.attr('id');
  var score = 0;

  if (id) {
    // if id exists, try to score on both positive and negative
    if (POSITIVE_SCORE_RE$1.test(id)) {
      score += 25;
    }
    if (NEGATIVE_SCORE_RE$1.test(id)) {
      score -= 25;
    }
  }

  if (classes) {
    if (score === 0) {
      // if classes exist and id did not contribute to score
      // try to score on both positive and negative
      if (POSITIVE_SCORE_RE$1.test(classes)) {
        score += 25;
      }
      if (NEGATIVE_SCORE_RE$1.test(classes)) {
        score -= 25;
      }
    }

    // even if score has been set by id, add score for
    // possible photo matches
    // "try to keep photos if we can"
    if (PHOTO_HINTS_RE$1.test(classes)) {
      score += 10;
    }

    // add 25 if class matches entry-content-asset,
    // a class apparently instructed for use in the
    // Readability publisher guidelines
    // https://www.readability.com/developers/guidelines
    if (READABILITY_ASSET$1.test(classes)) {
      score += 25;
    }
  }

  return score;
}

// returns the score of a node based on
// the node's score attribute
// returns null if no score set
function getScore($node) {
  return parseFloat($node.attr('score')) || null;
}

// return 1 for every comma in text
function scoreCommas(text) {
  return (text.match(/,/g) || []).length;
}

var idkRe = new RegExp('^(p|pre)$', 'i');

function scoreLength(textLength) {
  var tagName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'p';

  var chunks = textLength / 50;

  if (chunks > 0) {
    var lengthBonus = void 0;

    // No idea why p or pre are being tamped down here
    // but just following the source for now
    // Not even sure why tagName is included here,
    // since this is only being called from the context
    // of scoreParagraph
    if (idkRe.test(tagName)) {
      lengthBonus = chunks - 2;
    } else {
      lengthBonus = chunks - 1.25;
    }

    return Math.min(Math.max(lengthBonus, 0), 3);
  }

  return 0;
}

// Score a paragraph using various methods. Things like number of
// commas, etc. Higher is better.
function scoreParagraph$$1(node) {
  var score = 1;
  var text = node.text().trim();
  var textLength = text.length;

  // If this paragraph is less than 25 characters, don't count it.
  if (textLength < 25) {
    return 0;
  }

  // Add points for any commas within this paragraph
  score += scoreCommas(text);

  // For every 50 characters in this paragraph, add another point. Up
  // to 3 points.
  score += scoreLength(textLength);

  // Articles can end with short paragraphs when people are being clever
  // but they can also end with short paragraphs setting up lists of junk
  // that we strip. This negative tweaks junk setup paragraphs just below
  // the cutoff threshold.
  if (text.slice(-1) === ':') {
    score -= 1;
  }

  return score;
}

function setScore($node, $, score) {
  $node.attr('score', score);
  return $node;
}

function addScore$$1($node, $, amount) {
  try {
    var score = getOrInitScore$$1($node, $) + amount;
    setScore($node, $, score);
  } catch (e) {
    // Ignoring; error occurs in scoreNode
  }

  return $node;
}

// Adds 1/4 of a child's score to its parent
function addToParent$$1(node, $, score) {
  var parent = node.parent();
  if (parent) {
    addScore$$1(parent, $, score * 0.25);
  }

  return node;
}

// gets and returns the score if it exists
// if not, initializes a score based on
// the node's tag type
function getOrInitScore$$1($node, $) {
  var weightNodes = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

  var score = getScore($node);

  if (score) {
    return score;
  }

  score = scoreNode$$1($node);

  if (weightNodes) {
    score += getWeight($node);
  }

  addToParent$$1($node, $, score);

  return score;
}

// Score an individual node. Has some smarts for paragraphs, otherwise
// just scores based on tag.
function scoreNode$$1($node) {
  var _$node$get = $node.get(0),
      tagName = _$node$get.tagName;

  // TODO: Consider ordering by most likely.
  // E.g., if divs are a more common tag on a page,
  // Could save doing that regex test on every node – AP


  if (PARAGRAPH_SCORE_TAGS$1.test(tagName)) {
    return scoreParagraph$$1($node);
  } else if (tagName.toLowerCase() === 'div') {
    return 5;
  } else if (CHILD_CONTENT_TAGS$1.test(tagName)) {
    return 3;
  } else if (BAD_TAGS$1.test(tagName)) {
    return -3;
  } else if (tagName.toLowerCase() === 'th') {
    return -5;
  }

  return 0;
}

function convertSpans$1($node, $) {
  if ($node.get(0)) {
    var _$node$get = $node.get(0),
        tagName = _$node$get.tagName;

    if (tagName === 'span') {
      // convert spans to divs
      convertNodeTo$$1($node, $, 'div');
    }
  }
}

function addScoreTo($node, $, score) {
  if ($node) {
    convertSpans$1($node, $);
    addScore$$1($node, $, score);
  }
}

function scorePs($, weightNodes) {
  $('p, pre').not('[score]').each(function (index, node) {
    // The raw score for this paragraph, before we add any parent/child
    // scores.
    var $node = $(node);
    $node = setScore($node, $, getOrInitScore$$1($node, $, weightNodes));

    var $parent = $node.parent();
    var rawScore = scoreNode$$1($node);

    addScoreTo($parent, $, rawScore, weightNodes);
    if ($parent) {
      // Add half of the individual content score to the
      // grandparent
      addScoreTo($parent.parent(), $, rawScore / 2, weightNodes);
    }
  });

  return $;
}

var NORMALIZE_RE = /\s{2,}/g;

function normalizeSpaces(text) {
  return text.replace(NORMALIZE_RE, ' ').trim();
}

// Given a node type to search for, and a list of regular expressions,
// look to see if this extraction can be found in the URL. Expects
// that each expression in r_list will return group(1) as the proper
// string to be cleaned.
// Only used for date_published currently.

// An expression that looks to try to find the page digit within a URL, if
// it exists.
// Matches:
//  page=1
//  pg=1
//  p=1
//  paging=12
//  pag=7
//  pagination/1
//  paging/88
//  pa/83
//  p/11
//
// Does not match:
//  pg=102
//  page:2
var PAGE_IN_HREF_RE = new RegExp('(page|paging|(p(a|g|ag)?(e|enum|ewanted|ing|ination)))?(=|/)([0-9]{1,3})', 'i');

var HAS_ALPHA_RE = /[a-z]/i;

var IS_ALPHA_RE = /^[a-z]+$/i;
var IS_DIGIT_RE = /^[0-9]+$/i;

var ENCODING_RE = /charset=([\w-]+)\b/;
var DEFAULT_ENCODING = 'utf-8';

function isGoodSegment(segment, index, firstSegmentHasLetters) {
  var goodSegment = true;

  // If this is purely a number, and it's the first or second
  // url_segment, it's probably a page number. Remove it.
  if (index < 2 && IS_DIGIT_RE.test(segment) && segment.length < 3) {
    goodSegment = true;
  }

  // If this is the first url_segment and it's just "index",
  // remove it
  if (index === 0 && segment.toLowerCase() === 'index') {
    goodSegment = false;
  }

  // If our first or second url_segment is smaller than 3 characters,
  // and the first url_segment had no alphas, remove it.
  if (index < 2 && segment.length < 3 && !firstSegmentHasLetters) {
    goodSegment = false;
  }

  return goodSegment;
}

// Given a string, return True if it appears to have an ending sentence
// within it, false otherwise.
var SENTENCE_END_RE = new RegExp('.( |$)');
function hasSentenceEnd(text) {
  return SENTENCE_END_RE.test(text);
}

// Now that we have a top_candidate, look through the siblings of
// it to see if any of them are decently scored. If they are, they
// may be split parts of the content (Like two divs, a preamble and
// a body.) Example:
// http://articles.latimes.com/2009/oct/14/business/fi-bigtvs14
function mergeSiblings($candidate, topScore, $) {
  if (!$candidate.parent().length) {
    return $candidate;
  }

  var siblingScoreThreshold = Math.max(10, topScore * 0.25);
  var wrappingDiv = $('<div></div>');

  $candidate.parent().children().each(function (index, sibling) {
    var $sibling = $(sibling);
    // Ignore tags like BR, HR, etc
    if (NON_TOP_CANDIDATE_TAGS_RE$1.test(sibling.tagName)) {
      return null;
    }

    var siblingScore = getScore($sibling);
    if (siblingScore) {
      if ($sibling.get(0) === $candidate.get(0)) {
        wrappingDiv.append($sibling);
      } else {
        var contentBonus = 0;
        var density = linkDensity($sibling);

        // If sibling has a very low link density,
        // give it a small bonus
        if (density < 0.05) {
          contentBonus += 20;
        }

        // If sibling has a high link density,
        // give it a penalty
        if (density >= 0.5) {
          contentBonus -= 20;
        }

        // If sibling node has the same class as
        // candidate, give it a bonus
        if ($sibling.attr('class') === $candidate.attr('class')) {
          contentBonus += topScore * 0.2;
        }

        var newScore = siblingScore + contentBonus;

        if (newScore >= siblingScoreThreshold) {
          return wrappingDiv.append($sibling);
        } else if (sibling.tagName === 'p') {
          var siblingContent = $sibling.text();
          var siblingContentLength = textLength(siblingContent);

          if (siblingContentLength > 80 && density < 0.25) {
            return wrappingDiv.append($sibling);
          } else if (siblingContentLength <= 80 && density === 0 && hasSentenceEnd(siblingContent)) {
            return wrappingDiv.append($sibling);
          }
        }
      }
    }

    return null;
  });

  if (wrappingDiv.children().length === 1 && wrappingDiv.children().first().get(0) === $candidate.get(0)) {
    return $candidate;
  }

  return wrappingDiv;
}

// Scoring

function removeUnlessContent($node, $, weight) {
  // Explicitly save entry-content-asset tags, which are
  // noted as valuable in the Publisher guidelines. For now
  // this works everywhere. We may want to consider making
  // this less of a sure-thing later.
  if ($node.hasClass('entry-content-asset')) {
    return;
  }

  var content = normalizeSpaces($node.text());

  if (scoreCommas(content) < 10) {
    var pCount = $('p', $node).length;
    var inputCount = $('input', $node).length;

    // Looks like a form, too many inputs.
    if (inputCount > pCount / 3) {
      $node.remove();
      return;
    }

    var contentLength = content.length;
    var imgCount = $('img', $node).length;

    // Content is too short, and there are no images, so
    // this is probably junk content.
    if (contentLength < 25 && imgCount === 0) {
      $node.remove();
      return;
    }

    var density = linkDensity($node);

    // Too high of link density, is probably a menu or
    // something similar.
    // console.log(weight, density, contentLength)
    if (weight < 25 && density > 0.2 && contentLength > 75) {
      $node.remove();
      return;
    }

    // Too high of a link density, despite the score being
    // high.
    if (weight >= 25 && density > 0.5) {
      // Don't remove the node if it's a list and the
      // previous sibling starts with a colon though. That
      // means it's probably content.
      var tagName = $node.get(0).tagName.toLowerCase();
      var nodeIsList = tagName === 'ol' || tagName === 'ul';
      if (nodeIsList) {
        var previousNode = $node.prev();
        if (previousNode && normalizeSpaces(previousNode.text()).slice(-1) === ':') {
          return;
        }
      }

      $node.remove();
      return;
    }

    var scriptCount = $('script', $node).length;

    // Too many script tags, not enough content.
    if (scriptCount > 0 && contentLength < 150) {
      $node.remove();
      return;
    }
  }
}

function absolutize($, rootUrl, attr, $content) {
  $('[' + attr + ']', $content).each(function (_, node) {
    var attrs = getAttrs(node);
    var url = attrs[attr];

    if (url) {
      var absoluteUrl = URL.resolve(rootUrl, url);
      setAttr(node, attr, absoluteUrl);
    }
  });
}

function makeLinksAbsolute$$1($content, $, url) {
  ['href', 'src'].forEach(function (attr) {
    return absolutize($, url, attr, $content);
  });

  return $content;
}

function textLength(text) {
  return text.trim().replace(/\s+/g, ' ').length;
}

// Determines what percentage of the text
// in a node is link text
// Takes a node, returns a float
function linkDensity($node) {
  var totalTextLength = textLength($node.text());

  var linkText = $node.find('a').text();
  var linkLength = textLength(linkText);

  if (totalTextLength > 0) {
    return linkLength / totalTextLength;
  } else if (totalTextLength === 0 && linkLength > 0) {
    return 1;
  }

  return 0;
}

function isGoodNode($node, maxChildren) {
  // If it has a number of children, it's more likely a container
  // element. Skip it.
  if ($node.children().length > maxChildren) {
    return false;
  }
  // If it looks to be within a comment, skip it.
  if (withinComment$$1($node)) {
    return false;
  }

  return true;
}

// strips all tags from a string of text
function stripTags(text, $) {
  // Wrapping text in html element prevents errors when text
  // has no html
  var cleanText = $('<span>' + text + '</span>').text();
  return cleanText === '' ? text : cleanText;
}

function withinComment$$1($node) {
  var parents = $node.parents().toArray();
  var commentParent = parents.find(function (parent) {
    var attrs = getAttrs(parent);
    var nodeClass = attrs.class,
        id = attrs.id;

    var classAndId = nodeClass + ' ' + id;
    return classAndId.includes('comment');
  });

  return commentParent !== undefined;
}

// Given a node, determine if it's article-like enough to return
// param: node (a cheerio node)
// return: boolean

function getAttrs(node) {
  var attribs = node.attribs,
      attributes = node.attributes;


  if (!attribs && attributes) {
    var attrs = _Reflect$ownKeys(attributes).reduce(function (acc, index) {
      var attr = attributes[index];

      if (!attr.name || !attr.value) return acc;

      acc[attr.name] = attr.value;
      return acc;
    }, {});
    return attrs;
  }

  return attribs;
}

function setAttr(node, attr, val) {
  if (node.attribs) {
    node.attribs[attr] = val;
  } else if (node.attributes) {
    node.setAttribute(attr, val);
  }

  return node;
}

function setAttrs(node, attrs) {
  if (node.attribs) {
    node.attribs = attrs;
  } else if (node.attributes) {
    while (node.attributes.length > 0) {
      node.removeAttribute(node.attributes[0].name);
    }

    _Reflect$ownKeys(attrs).forEach(function (key) {
      node.setAttribute(key, attrs[key]);
    });
  }

  return node;
}

// DOM manipulation

function _interopDefault$1(ex){return ex&&(typeof ex==='undefined'?'undefined':_typeof(ex))==='object'&&'default'in ex?ex['default']:ex;}var _regeneratorRuntime=_interopDefault$1(regenerator);var _extends$1=_interopDefault$1(_extends);var _asyncToGenerator=_interopDefault$1(asyncToGenerator);var URL$1=_interopDefault$1(URL);var cheerio$1=_interopDefault$1(cheerio);var iconv$1=_interopDefault$1(iconv);var _slicedToArray$1=_interopDefault$1(_slicedToArray);var _Promise=_interopDefault$1(promise);var request$1=_interopDefault$1(request);var _Reflect$ownKeys$1=_interopDefault$1(_Reflect$ownKeys);var _toConsumableArray$1=_interopDefault$1(_toConsumableArray);var _defineProperty$1=_interopDefault$1(_defineProperty);var _typeof$1=_interopDefault$1(_typeof);var _getIterator$1=_interopDefault$1(_getIterator);var _Object$keys=_interopDefault$1(keys);var stringDirection$1=_interopDefault$1(stringDirection);var validUrl$1=_interopDefault$1(validUrl);var moment=_interopDefault$1(momentTimezone);var parseFormat=_interopDefault$1(momentParseformat);var wuzzy$1=_interopDefault$1(wuzzy);var difflib$1=_interopDefault$1(difflib);var _Array$from=_interopDefault$1(from);var ellipsize$1=_interopDefault$1(ellipsize);var NORMALIZE_RE$1=/\s{2,}/g;function normalizeSpaces$1(text){return text.replace(NORMALIZE_RE$1,' ').trim();}// Given a node type to search for, and a list of regular expressions,
// look to see if this extraction can be found in the URL. Expects
// that each expression in r_list will return group(1) as the proper
// string to be cleaned.
// Only used for date_published currently.
function extractFromUrl$1(url,regexList){var matchRe=regexList.find(function(re){return re.test(url);});if(matchRe){return matchRe.exec(url)[1];}return null;}// An expression that looks to try to find the page digit within a URL, if
// it exists.
// Matches:
//  page=1
//  pg=1
//  p=1
//  paging=12
//  pag=7
//  pagination/1
//  paging/88
//  pa/83
//  p/11
//
// Does not match:
//  pg=102
//  page:2
var PAGE_IN_HREF_RE$1=new RegExp('(page|paging|(p(a|g|ag)?(e|enum|ewanted|ing|ination)))?(=|/)([0-9]{1,3})','i');var HAS_ALPHA_RE$1=/[a-z]/i;var IS_ALPHA_RE$1=/^[a-z]+$/i;var IS_DIGIT_RE$1=/^[0-9]+$/i;var ENCODING_RE$1=/charset=([\w-]+)\b/;var DEFAULT_ENCODING$1='utf-8';function pageNumFromUrl$1(url){var matches=url.match(PAGE_IN_HREF_RE$1);if(!matches)return null;var pageNum=parseInt(matches[6],10);// Return pageNum < 100, otherwise
// return null
return pageNum<100?pageNum:null;}function removeAnchor$1(url){return url.split('#')[0].replace(/\/$/,'');}function isGoodSegment$1(segment,index,firstSegmentHasLetters){var goodSegment=true;// If this is purely a number, and it's the first or second
// url_segment, it's probably a page number. Remove it.
if(index<2&&IS_DIGIT_RE$1.test(segment)&&segment.length<3){goodSegment=true;}// If this is the first url_segment and it's just "index",
// remove it
if(index===0&&segment.toLowerCase()==='index'){goodSegment=false;}// If our first or second url_segment is smaller than 3 characters,
// and the first url_segment had no alphas, remove it.
if(index<2&&segment.length<3&&!firstSegmentHasLetters){goodSegment=false;}return goodSegment;}// Take a URL, and return the article base of said URL. That is, no
// pagination data exists in it. Useful for comparing to other links
// that might have pagination data within them.
function articleBaseUrl$1(url,parsed){var parsedUrl=parsed||URL$1.parse(url);var protocol=parsedUrl.protocol,host=parsedUrl.host,path=parsedUrl.path;var firstSegmentHasLetters=false;var cleanedSegments=path.split('/').reverse().reduce(function(acc,rawSegment,index){var segment=rawSegment;// Split off and save anything that looks like a file type.
if(segment.includes('.')){var _segment$split=segment.split('.'),_segment$split2=_slicedToArray$1(_segment$split,2),possibleSegment=_segment$split2[0],fileExt=_segment$split2[1];if(IS_ALPHA_RE$1.test(fileExt)){segment=possibleSegment;}}// If our first or second segment has anything looking like a page
// number, remove it.
if(PAGE_IN_HREF_RE$1.test(segment)&&index<2){segment=segment.replace(PAGE_IN_HREF_RE$1,'');}// If we're on the first segment, check to see if we have any
// characters in it. The first segment is actually the last bit of
// the URL, and this will be helpful to determine if we're on a URL
// segment that looks like "/2/" for example.
if(index===0){firstSegmentHasLetters=HAS_ALPHA_RE$1.test(segment);}// If it's not marked for deletion, push it to cleaned_segments.
if(isGoodSegment$1(segment,index,firstSegmentHasLetters)){acc.push(segment);}return acc;},[]);return protocol+'//'+host+cleanedSegments.reverse().join('/');}// Given a string, return True if it appears to have an ending sentence
// within it, false otherwise.
var SENTENCE_END_RE$1=new RegExp('.( |$)');function hasSentenceEnd$1(text){return SENTENCE_END_RE$1.test(text);}function excerptContent$1(content){var words=arguments.length>1&&arguments[1]!==undefined?arguments[1]:10;return content.trim().split(/\s+/).slice(0,words).join(' ');}// check a string for encoding; this is
// used in our fetchResource function to
// ensure correctly encoded responses
function getEncoding$1(str){var encoding=DEFAULT_ENCODING$1;if(ENCODING_RE$1.test(str)){var testEncode=ENCODING_RE$1.exec(str)[1];if(iconv$1.encodingExists(testEncode)){encoding=testEncode;}}return encoding;}var _marked=[range].map(_regeneratorRuntime.mark);function range(){var start=arguments.length>0&&arguments[0]!==undefined?arguments[0]:1;var end=arguments.length>1&&arguments[1]!==undefined?arguments[1]:1;return _regeneratorRuntime.wrap(function range$(_context){while(1){switch(_context.prev=_context.next){case 0:if(!(start<=end)){_context.next=5;break;}_context.next=3;return start+=1;case 3:_context.next=0;break;case 5:case"end":return _context.stop();}}},_marked[0],this);}// extremely simple url validation as a first step
function validateUrl(_ref){var hostname=_ref.hostname;// If this isn't a valid url, return an error message
return!!hostname;}var Errors={badUrl:{error:true,messages:'The url parameter passed does not look like a valid URL. Please check your data and try again.'}};// Browser does not like us setting user agent
var REQUEST_HEADERS=cheerio$1.browser?{}:{'User-Agent':'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36'};// The number of milliseconds to attempt to fetch a resource before timing out.
var FETCH_TIMEOUT=10000;// Content types that we do not extract content from
var BAD_CONTENT_TYPES=['audio/mpeg','image/gif','image/jpeg','image/jpg'];var BAD_CONTENT_TYPES_RE=new RegExp('^('+BAD_CONTENT_TYPES.join('|')+')$','i');// Use this setting as the maximum size an article can be
// for us to attempt parsing. Defaults to 5 MB.
var MAX_CONTENT_LENGTH=5242880;// Turn the global proxy on or off
// Proxying is not currently enabled in Python source
// so not implementing logic in port.
function get(options){return new _Promise(function(resolve,reject){request$1(options,function(err,response,body){if(err){reject(err);}else{resolve({body:body,response:response});}});});}// Evaluate a response to ensure it's something we should be keeping.
// This does not validate in the sense of a response being 200 level or
// not. Validation here means that we haven't found reason to bail from
// further processing of this url.
function validateResponse(response){var parseNon2xx=arguments.length>1&&arguments[1]!==undefined?arguments[1]:false;// Check if we got a valid status code
// This isn't great, but I'm requiring a statusMessage to be set
// before short circuiting b/c nock doesn't set it in tests
// statusMessage only not set in nock response, in which case
// I check statusCode, which is currently only 200 for OK responses
// in tests
if(response.statusMessage&&response.statusMessage!=='OK'||response.statusCode!==200){if(!response.statusCode){throw new Error('Unable to fetch content. Original exception was '+response.error);}else if(!parseNon2xx){throw new Error('Resource returned a response status code of '+response.statusCode+' and resource was instructed to reject non-2xx level status codes.');}}var _response$headers=response.headers,contentType=_response$headers['content-type'],contentLength=_response$headers['content-length'];// Check that the content is not in BAD_CONTENT_TYPES
if(BAD_CONTENT_TYPES_RE.test(contentType)){throw new Error('Content-type for this resource was '+contentType+' and is not allowed.');}// Check that the content length is below maximum
if(contentLength>MAX_CONTENT_LENGTH){throw new Error('Content for this resource was too large. Maximum content length is '+MAX_CONTENT_LENGTH+'.');}return true;}// Grabs the last two pieces of the URL and joins them back together
// This is to get the 'livejournal.com' from 'erotictrains.livejournal.com'
// Set our response attribute to the result of fetching our URL.
// TODO: This should gracefully handle timeouts and raise the
//       proper exceptions on the many failure cases of HTTP.
// TODO: Ensure we are not fetching something enormous. Always return
//       unicode content for HTML, with charset conversion.
var fetchResource$1=function(){var _ref2=_asyncToGenerator(_regeneratorRuntime.mark(function _callee(url,parsedUrl){var options,_ref3,response,body;return _regeneratorRuntime.wrap(function _callee$(_context){while(1){switch(_context.prev=_context.next){case 0:parsedUrl=parsedUrl||URL$1.parse(encodeURI(url));options={url:parsedUrl.href,headers:_extends$1({},REQUEST_HEADERS),timeout:FETCH_TIMEOUT,// Accept cookies
jar:true,// Set to null so the response returns as binary and body as buffer
// https://github.com/request/request#requestoptions-callback
encoding:null,// Accept and decode gzip
gzip:true,// Follow any redirect
followAllRedirects:true};_context.next=4;return get(options);case 4:_ref3=_context.sent;response=_ref3.response;body=_ref3.body;_context.prev=7;validateResponse(response);return _context.abrupt('return',{body:body,response:response});case 12:_context.prev=12;_context.t0=_context['catch'](7);return _context.abrupt('return',Errors.badUrl);case 15:case'end':return _context.stop();}}},_callee,this,[[7,12]]);}));function fetchResource(_x2,_x3){return _ref2.apply(this,arguments);}return fetchResource;}();function convertMetaProp($,from$$1,to){$('meta['+from$$1+']').each(function(_,node){var $node=$(node);var value=$node.attr(from$$1);$node.attr(to,value);$node.removeAttr(from$$1);});return $;}// For ease of use in extracting from meta tags,
// replace the "content" attribute on meta tags with the
// "value" attribute.
//
// In addition, normalize 'property' attributes to 'name' for ease of
// querying later. See, e.g., og or twitter meta tags.
function normalizeMetaTags($){$=convertMetaProp($,'content','value');$=convertMetaProp($,'property','name');return $;}// Spacer images to be removed
var SPACER_RE$1=new RegExp('transparent|spacer|blank','i');// The class we will use to mark elements we want to keep
// but would normally remove
var KEEP_CLASS$1='mercury-parser-keep';var KEEP_SELECTORS$1=['iframe[src^="https://www.youtube.com"]','iframe[src^="https://www.youtube-nocookie.com"]','iframe[src^="http://www.youtube.com"]','iframe[src^="https://player.vimeo"]','iframe[src^="http://player.vimeo"]'];// A list of tags to strip from the output if we encounter them.
var STRIP_OUTPUT_TAGS$1=['title','script','noscript','link','style','hr','embed','iframe','object'];// cleanAttributes
var REMOVE_ATTRS$1=['style','align'];var REMOVE_ATTR_SELECTORS$1=REMOVE_ATTRS$1.map(function(selector){return'['+selector+']';});var REMOVE_ATTR_LIST$1=REMOVE_ATTRS$1.join(',');var WHITELIST_ATTRS$1=['src','srcset','href','class','id','alt','xlink:href','width','height'];var WHITELIST_ATTRS_RE$1=new RegExp('^('+WHITELIST_ATTRS$1.join('|')+')$','i');// removeEmpty
var REMOVE_EMPTY_TAGS$1=['p'];var REMOVE_EMPTY_SELECTORS$1=REMOVE_EMPTY_TAGS$1.map(function(tag){return tag+':empty';}).join(',');// cleanTags
var CLEAN_CONDITIONALLY_TAGS$1=['ul','ol','table','div','button','form'].join(',');// cleanHeaders
var HEADER_TAGS$1=['h2','h3','h4','h5','h6'];var HEADER_TAG_LIST$1=HEADER_TAGS$1.join(',');// // CONTENT FETCHING CONSTANTS ////
// A list of strings that can be considered unlikely candidates when
// extracting content from a resource. These strings are joined together
// and then tested for existence using re:test, so may contain simple,
// non-pipe style regular expression queries if necessary.
var UNLIKELY_CANDIDATES_BLACKLIST$2=['ad-break','adbox','advert','addthis','agegate','aux','blogger-labels','combx','comment','conversation','disqus','entry-unrelated','extra','foot',// 'form', // This is too generic, has too many false positives
'header','hidden','loader','login',// Note: This can hit 'blogindex'.
'menu','meta','nav','outbrain','pager','pagination','predicta',// readwriteweb inline ad box
'presence_control_external',// lifehacker.com container full of false positives
'popup','printfriendly','related','remove','remark','rss','share','shoutbox','sidebar','sociable','sponsor','taboola','tools'];// A list of strings that can be considered LIKELY candidates when
// extracting content from a resource. Essentially, the inverse of the
// blacklist above - if something matches both blacklist and whitelist,
// it is kept. This is useful, for example, if something has a className
// of "rss-content entry-content". It matched 'rss', so it would normally
// be removed, however, it's also the entry content, so it should be left
// alone.
//
// These strings are joined together and then tested for existence using
// re:test, so may contain simple, non-pipe style regular expression queries
// if necessary.
var UNLIKELY_CANDIDATES_WHITELIST$2=['and','article','body','blogindex','column','content','entry-content-asset','format',// misuse of form
'hfeed','hentry','hatom','main','page','posts','shadow'];// A list of tags which, if found inside, should cause a <div /> to NOT
// be turned into a paragraph tag. Shallow div tags without these elements
// should be turned into <p /> tags.
var DIV_TO_P_BLOCK_TAGS$2=['a','blockquote','dl','div','img','p','pre','table'].join(',');// A list of tags that should be ignored when trying to find the top candidate
// for a document.
// A list of selectors that specify, very clearly, either hNews or other
// very content-specific style content, like Blogger templates.
// More examples here: http://microformats.org/wiki/blog-post-formats
// A list of strings that denote a positive scoring for this content as being
// an article container. Checked against className and id.
//
// TODO: Perhaps have these scale based on their odds of being quality?
var POSITIVE_SCORE_HINTS$2=['article','articlecontent','instapaper_body','blog','body','content','entry-content-asset','entry','hentry','main','Normal','page','pagination','permalink','post','story','text','[-_]copy',// usatoday
'\\Bcopy'];// The above list, joined into a matching regular expression
var POSITIVE_SCORE_RE$2=new RegExp(POSITIVE_SCORE_HINTS$2.join('|'),'i');// Readability publisher-specific guidelines
// A list of strings that denote a negative scoring for this content as being
// an article container. Checked against className and id.
//
// TODO: Perhaps have these scale based on their odds of being quality?
var NEGATIVE_SCORE_HINTS$2=['adbox','advert','author','bio','bookmark','bottom','byline','clear','com-','combx','comment','comment\\B','contact','copy','credit','crumb','date','deck','excerpt','featured',// tnr.com has a featured_content which throws us off
'foot','footer','footnote','graf','head','info','infotext',// newscientist.com copyright
'instapaper_ignore','jump','linebreak','link','masthead','media','meta','modal','outbrain',// slate.com junk
'promo','pr_',// autoblog - press release
'related','respond','roundcontent',// lifehacker restricted content warning
'scroll','secondary','share','shopping','shoutbox','side','sidebar','sponsor','stamp','sub','summary','tags','tools','widget'];// The above list, joined into a matching regular expression
var NEGATIVE_SCORE_RE$2=new RegExp(NEGATIVE_SCORE_HINTS$2.join('|'),'i');// XPath to try to determine if a page is wordpress. Not always successful.
var IS_WP_SELECTOR$1='meta[name=generator][value^=WordPress]';// Match a digit. Pretty clear.
// A list of words that, if found in link text or URLs, likely mean that
// this link is not a next page link.
// Match any phrase that looks like it could be page, or paging, or pagination
var PAGE_RE$1=new RegExp('pag(e|ing|inat)','i');// Match any link text/classname/id that looks like it could mean the next
// page. Things like: next, continue, >, >>, » but not >|, »| as those can
// mean last page.
// export const NEXT_LINK_TEXT_RE = new RegExp('(next|weiter|continue|>([^\|]|$)|»([^\|]|$))', 'i');
// Match any link text/classname/id that looks like it is an end link: things
// like "first", "last", "end", etc.
// Match any link text/classname/id that looks like it means the previous
// page.
// Match 2 or more consecutive <br> tags
// Match 1 BR tag.
// A list of all of the block level tags known in HTML5 and below. Taken from
// http://bit.ly/qneNIT
var BLOCK_LEVEL_TAGS$2=['article','aside','blockquote','body','br','button','canvas','caption','col','colgroup','dd','div','dl','dt','embed','fieldset','figcaption','figure','footer','form','h1','h2','h3','h4','h5','h6','header','hgroup','hr','li','map','object','ol','output','p','pre','progress','section','table','tbody','textarea','tfoot','th','thead','tr','ul','video'];var BLOCK_LEVEL_TAGS_RE$2=new RegExp('^('+BLOCK_LEVEL_TAGS$2.join('|')+')$','i');// The removal is implemented as a blacklist and whitelist, this test finds
// blacklisted elements that aren't whitelisted. We do this all in one
// expression-both because it's only one pass, and because this skips the
// serialization for whitelisted nodes.
var candidatesBlacklist$2=UNLIKELY_CANDIDATES_BLACKLIST$2.join('|');var CANDIDATES_BLACKLIST$2=new RegExp(candidatesBlacklist$2,'i');var candidatesWhitelist$2=UNLIKELY_CANDIDATES_WHITELIST$2.join('|');var CANDIDATES_WHITELIST$2=new RegExp(candidatesWhitelist$2,'i');function stripUnlikelyCandidates$1($){//  Loop through the provided document and remove any non-link nodes
//  that are unlikely candidates for article content.
//
//  Links are ignored because there are very often links to content
//  that are identified as non-body-content, but may be inside
//  article-like content.
//
//  :param $: a cheerio object to strip nodes from
//  :return $: the cleaned cheerio object
$('*').not('a').each(function(index,node){var $node=$(node);var classes=$node.attr('class');var id=$node.attr('id');if(!id&&!classes)return;var classAndId=(classes||'')+' '+(id||'');if(CANDIDATES_WHITELIST$2.test(classAndId)){return;}else if(CANDIDATES_BLACKLIST$2.test(classAndId)){$node.remove();}});return $;}// ## NOTES:
// Another good candidate for refactoring/optimizing.
// Very imperative code, I don't love it. - AP
//  Given cheerio object, convert consecutive <br /> tags into
//  <p /> tags instead.
//
//  :param $: A cheerio object
function brsToPs$$1($){var collapsing=false;$('br').each(function(index,element){var $element=$(element);var nextElement=$element.next().get(0);if(nextElement&&nextElement.tagName.toLowerCase()==='br'){collapsing=true;$element.remove();}else if(collapsing){collapsing=false;// $(element).replaceWith('<p />')
paragraphize$1(element,$,true);}});return $;}// Given a node, turn it into a P if it is not already a P, and
// make sure it conforms to the constraints of a P tag (I.E. does
// not contain any other block tags.)
//
// If the node is a <br />, it treats the following inline siblings
// as if they were its children.
//
// :param node: The node to paragraphize; this is a raw node
// :param $: The cheerio object to handle dom manipulation
// :param br: Whether or not the passed node is a br
function paragraphize$1(node,$){var br=arguments.length>2&&arguments[2]!==undefined?arguments[2]:false;var $node=$(node);if(br){var sibling=node.nextSibling;var p=$('<p></p>');// while the next node is text or not a block level element
// append it to a new p node
while(sibling&&!(sibling.tagName&&BLOCK_LEVEL_TAGS_RE$2.test(sibling.tagName))){var nextSibling=sibling.nextSibling;$(sibling).appendTo(p);sibling=nextSibling;}$node.replaceWith(p);$node.remove();return $;}return $;}function convertDivs$1($){$('div').each(function(index,div){var $div=$(div);var convertable=$div.children(DIV_TO_P_BLOCK_TAGS$2).length===0;if(convertable){convertNodeTo$$1($div,$,'p');}});return $;}function convertSpans$2($){$('span').each(function(index,span){var $span=$(span);var convertable=$span.parents('p, div').length===0;if(convertable){convertNodeTo$$1($span,$,'p');}});return $;}// Loop through the provided doc, and convert any p-like elements to
// actual paragraph tags.
//
//   Things fitting this criteria:
//   * Multiple consecutive <br /> tags.
//   * <div /> tags without block level elements inside of them
//   * <span /> tags who are not children of <p /> or <div /> tags.
//
//   :param $: A cheerio object to search
//   :return cheerio object with new p elements
//   (By-reference mutation, though. Returned just for convenience.)
function convertToParagraphs$$1($){$=brsToPs$$1($);$=convertDivs$1($);$=convertSpans$2($);return $;}function convertNodeTo$$1($node,$){var tag=arguments.length>2&&arguments[2]!==undefined?arguments[2]:'p';var node=$node.get(0);if(!node){return $;}var attrs=getAttrs$1(node)||{};// console.log(attrs)
var attribString=_Reflect$ownKeys$1(attrs).map(function(key){return key+'='+attrs[key];}).join(' ');var html=void 0;if($.browser){// In the browser, the contents of noscript tags aren't rendered, therefore
// transforms on the noscript tag (commonly used for lazy-loading) don't work
// as expected. This test case handles that
html=node.tagName.toLowerCase()==='noscript'?$node.text():$node.html();}else{html=$node.contents();}$node.replaceWith('<'+tag+' '+attribString+'>'+html+'</'+tag+'>');return $;}function cleanForHeight$1($img,$){var height=parseInt($img.attr('height'),10);var width=parseInt($img.attr('width'),10)||20;// Remove images that explicitly have very small heights or
// widths, because they are most likely shims or icons,
// which aren't very useful for reading.
if((height||20)<10||width<10){$img.remove();}else if(height){// Don't ever specify a height on images, so that we can
// scale with respect to width without screwing up the
// aspect ratio.
$img.removeAttr('height');}return $;}// Cleans out images where the source string matches transparent/spacer/etc
// TODO This seems very aggressive - AP
function removeSpacers$1($img,$){if(SPACER_RE$1.test($img.attr('src'))){$img.remove();}return $;}function cleanImages$1($article,$){$article.find('img').each(function(index,img){var $img=$(img);cleanForHeight$1($img,$);removeSpacers$1($img,$);});return $;}function markToKeep$1(article,$,url){var tags=arguments.length>3&&arguments[3]!==undefined?arguments[3]:[];if(tags.length===0){tags=KEEP_SELECTORS$1;}if(url){var _URL$parse=URL$1.parse(url),protocol=_URL$parse.protocol,hostname=_URL$parse.hostname;tags=[].concat(_toConsumableArray$1(tags),['iframe[src^="'+protocol+'//'+hostname+'"]']);}$(tags.join(','),article).addClass(KEEP_CLASS$1);return $;}function stripJunkTags$1(article,$){var tags=arguments.length>2&&arguments[2]!==undefined?arguments[2]:[];if(tags.length===0){tags=STRIP_OUTPUT_TAGS$1;}// Remove matching elements, but ignore
// any element with a class of mercury-parser-keep
$(tags.join(','),article).not('.'+KEEP_CLASS$1).remove();return $;}// H1 tags are typically the article title, which should be extracted
// by the title extractor instead. If there's less than 3 of them (<3),
// strip them. Otherwise, turn 'em into H2s.
function cleanHOnes$$1(article,$){var $hOnes=$('h1',article);if($hOnes.length<3){$hOnes.each(function(index,node){return $(node).remove();});}else{$hOnes.each(function(index,node){convertNodeTo$$1($(node),$,'h2');});}return $;}function removeAllButWhitelist$1($article,$){$article.find('*').each(function(index,node){var attrs=getAttrs$1(node);setAttrs$1(node,_Reflect$ownKeys$1(attrs).reduce(function(acc,attr){if(WHITELIST_ATTRS_RE$1.test(attr)){return _extends$1({},acc,_defineProperty$1({},attr,attrs[attr]));}return acc;},{}));});// Remove the mercury-parser-keep class from result
$('.'+KEEP_CLASS$1,$article).removeClass(KEEP_CLASS$1);return $article;}// function removeAttrs(article, $) {
//   REMOVE_ATTRS.forEach((attr) => {
//     $(`[${attr}]`, article).removeAttr(attr);
//   });
// }
// Remove attributes like style or align
function cleanAttributes$$1($article,$){// Grabbing the parent because at this point
// $article will be wrapped in a div which will
// have a score set on it.
return removeAllButWhitelist$1($article.parent().length?$article.parent():$article,$);}function removeEmpty$1($article,$){$article.find('p').each(function(index,p){var $p=$(p);if($p.find('iframe, img').length===0&&$p.text().trim()==='')$p.remove();});return $;}// // CONTENT FETCHING CONSTANTS ////
// A list of strings that can be considered unlikely candidates when
// extracting content from a resource. These strings are joined together
// and then tested for existence using re:test, so may contain simple,
// non-pipe style regular expression queries if necessary.
var UNLIKELY_CANDIDATES_BLACKLIST$1$1=['ad-break','adbox','advert','addthis','agegate','aux','blogger-labels','combx','comment','conversation','disqus','entry-unrelated','extra','foot','form','header','hidden','loader','login',// Note: This can hit 'blogindex'.
'menu','meta','nav','pager','pagination','predicta',// readwriteweb inline ad box
'presence_control_external',// lifehacker.com container full of false positives
'popup','printfriendly','related','remove','remark','rss','share','shoutbox','sidebar','sociable','sponsor','tools'];// A list of strings that can be considered LIKELY candidates when
// extracting content from a resource. Essentially, the inverse of the
// blacklist above - if something matches both blacklist and whitelist,
// it is kept. This is useful, for example, if something has a className
// of "rss-content entry-content". It matched 'rss', so it would normally
// be removed, however, it's also the entry content, so it should be left
// alone.
//
// These strings are joined together and then tested for existence using
// re:test, so may contain simple, non-pipe style regular expression queries
// if necessary.
var UNLIKELY_CANDIDATES_WHITELIST$1$1=['and','article','body','blogindex','column','content','entry-content-asset','format',// misuse of form
'hfeed','hentry','hatom','main','page','posts','shadow'];// A list of tags which, if found inside, should cause a <div /> to NOT
// be turned into a paragraph tag. Shallow div tags without these elements
// should be turned into <p /> tags.
var DIV_TO_P_BLOCK_TAGS$1$1=['a','blockquote','dl','div','img','p','pre','table'].join(',');// A list of tags that should be ignored when trying to find the top candidate
// for a document.
var NON_TOP_CANDIDATE_TAGS$1$1=['br','b','i','label','hr','area','base','basefont','input','img','link','meta'];var NON_TOP_CANDIDATE_TAGS_RE$1$1=new RegExp('^('+NON_TOP_CANDIDATE_TAGS$1$1.join('|')+')$','i');// A list of selectors that specify, very clearly, either hNews or other
// very content-specific style content, like Blogger templates.
// More examples here: http://microformats.org/wiki/blog-post-formats
var HNEWS_CONTENT_SELECTORS$1$1=[['.hentry','.entry-content'],['entry','.entry-content'],['.entry','.entry_content'],['.post','.postbody'],['.post','.post_body'],['.post','.post-body']];var PHOTO_HINTS$1$1=['figure','photo','image','caption'];var PHOTO_HINTS_RE$1$1=new RegExp(PHOTO_HINTS$1$1.join('|'),'i');// A list of strings that denote a positive scoring for this content as being
// an article container. Checked against className and id.
//
// TODO: Perhaps have these scale based on their odds of being quality?
var POSITIVE_SCORE_HINTS$1$1=['article','articlecontent','instapaper_body','blog','body','content','entry-content-asset','entry','hentry','main','Normal','page','pagination','permalink','post','story','text','[-_]copy',// usatoday
'\\Bcopy'];// The above list, joined into a matching regular expression
var POSITIVE_SCORE_RE$1$1=new RegExp(POSITIVE_SCORE_HINTS$1$1.join('|'),'i');// Readability publisher-specific guidelines
var READABILITY_ASSET$1$1=new RegExp('entry-content-asset','i');// A list of strings that denote a negative scoring for this content as being
// an article container. Checked against className and id.
//
// TODO: Perhaps have these scale based on their odds of being quality?
var NEGATIVE_SCORE_HINTS$1$1=['adbox','advert','author','bio','bookmark','bottom','byline','clear','com-','combx','comment','comment\\B','contact','copy','credit','crumb','date','deck','excerpt','featured',// tnr.com has a featured_content which throws us off
'foot','footer','footnote','graf','head','info','infotext',// newscientist.com copyright
'instapaper_ignore','jump','linebreak','link','masthead','media','meta','modal','outbrain',// slate.com junk
'promo','pr_',// autoblog - press release
'related','respond','roundcontent',// lifehacker restricted content warning
'scroll','secondary','share','shopping','shoutbox','side','sidebar','sponsor','stamp','sub','summary','tags','tools','widget'];// The above list, joined into a matching regular expression
var NEGATIVE_SCORE_RE$1$1=new RegExp(NEGATIVE_SCORE_HINTS$1$1.join('|'),'i');// Match a digit. Pretty clear.
// Match 2 or more consecutive <br> tags
// Match 1 BR tag.
// A list of all of the block level tags known in HTML5 and below. Taken from
// http://bit.ly/qneNIT
// The removal is implemented as a blacklist and whitelist, this test finds
// blacklisted elements that aren't whitelisted. We do this all in one
// expression-both because it's only one pass, and because this skips the
// serialization for whitelisted nodes.
var candidatesBlacklist$1$1=UNLIKELY_CANDIDATES_BLACKLIST$1$1.join('|');var candidatesWhitelist$1$1=UNLIKELY_CANDIDATES_WHITELIST$1$1.join('|');var PARAGRAPH_SCORE_TAGS$1$1=new RegExp('^(p|li|span|pre)$','i');var CHILD_CONTENT_TAGS$1$1=new RegExp('^(td|blockquote|ol|ul|dl)$','i');var BAD_TAGS$1$1=new RegExp('^(address|form)$','i');// Get the score of a node based on its className and id.
function getWeight$1(node){var classes=node.attr('class');var id=node.attr('id');var score=0;if(id){// if id exists, try to score on both positive and negative
if(POSITIVE_SCORE_RE$1$1.test(id)){score+=25;}if(NEGATIVE_SCORE_RE$1$1.test(id)){score-=25;}}if(classes){if(score===0){// if classes exist and id did not contribute to score
// try to score on both positive and negative
if(POSITIVE_SCORE_RE$1$1.test(classes)){score+=25;}if(NEGATIVE_SCORE_RE$1$1.test(classes)){score-=25;}}// even if score has been set by id, add score for
// possible photo matches
// "try to keep photos if we can"
if(PHOTO_HINTS_RE$1$1.test(classes)){score+=10;}// add 25 if class matches entry-content-asset,
// a class apparently instructed for use in the
// Readability publisher guidelines
// https://www.readability.com/developers/guidelines
if(READABILITY_ASSET$1$1.test(classes)){score+=25;}}return score;}// returns the score of a node based on
// the node's score attribute
// returns null if no score set
function getScore$1($node){return parseFloat($node.attr('score'))||null;}// return 1 for every comma in text
function scoreCommas$1(text){return(text.match(/,/g)||[]).length;}var idkRe$1=new RegExp('^(p|pre)$','i');function scoreLength$1(textLength){var tagName=arguments.length>1&&arguments[1]!==undefined?arguments[1]:'p';var chunks=textLength/50;if(chunks>0){var lengthBonus=void 0;// No idea why p or pre are being tamped down here
// but just following the source for now
// Not even sure why tagName is included here,
// since this is only being called from the context
// of scoreParagraph
if(idkRe$1.test(tagName)){lengthBonus=chunks-2;}else{lengthBonus=chunks-1.25;}return Math.min(Math.max(lengthBonus,0),3);}return 0;}// Score a paragraph using various methods. Things like number of
// commas, etc. Higher is better.
function scoreParagraph$$1(node){var score=1;var text=node.text().trim();var textLength=text.length;// If this paragraph is less than 25 characters, don't count it.
if(textLength<25){return 0;}// Add points for any commas within this paragraph
score+=scoreCommas$1(text);// For every 50 characters in this paragraph, add another point. Up
// to 3 points.
score+=scoreLength$1(textLength);// Articles can end with short paragraphs when people are being clever
// but they can also end with short paragraphs setting up lists of junk
// that we strip. This negative tweaks junk setup paragraphs just below
// the cutoff threshold.
if(text.slice(-1)===':'){score-=1;}return score;}function setScore$1($node,$,score){$node.attr('score',score);return $node;}function addScore$$1($node,$,amount){try{var score=getOrInitScore$$1($node,$)+amount;setScore$1($node,$,score);}catch(e){// Ignoring; error occurs in scoreNode
}return $node;}// Adds 1/4 of a child's score to its parent
function addToParent$$1(node,$,score){var parent=node.parent();if(parent){addScore$$1(parent,$,score*0.25);}return node;}// gets and returns the score if it exists
// if not, initializes a score based on
// the node's tag type
function getOrInitScore$$1($node,$){var weightNodes=arguments.length>2&&arguments[2]!==undefined?arguments[2]:true;var score=getScore$1($node);if(score){return score;}score=scoreNode$$1($node);if(weightNodes){score+=getWeight$1($node);}addToParent$$1($node,$,score);return score;}// Score an individual node. Has some smarts for paragraphs, otherwise
// just scores based on tag.
function scoreNode$$1($node){var _$node$get=$node.get(0),tagName=_$node$get.tagName;// TODO: Consider ordering by most likely.
// E.g., if divs are a more common tag on a page,
// Could save doing that regex test on every node – AP
if(PARAGRAPH_SCORE_TAGS$1$1.test(tagName)){return scoreParagraph$$1($node);}else if(tagName.toLowerCase()==='div'){return 5;}else if(CHILD_CONTENT_TAGS$1$1.test(tagName)){return 3;}else if(BAD_TAGS$1$1.test(tagName)){return-3;}else if(tagName.toLowerCase()==='th'){return-5;}return 0;}function convertSpans$1$1($node,$){if($node.get(0)){var _$node$get=$node.get(0),tagName=_$node$get.tagName;if(tagName==='span'){// convert spans to divs
convertNodeTo$$1($node,$,'div');}}}function addScoreTo$1($node,$,score){if($node){convertSpans$1$1($node,$);addScore$$1($node,$,score);}}function scorePs$1($,weightNodes){$('p, pre').not('[score]').each(function(index,node){// The raw score for this paragraph, before we add any parent/child
// scores.
var $node=$(node);$node=setScore$1($node,$,getOrInitScore$$1($node,$,weightNodes));var $parent=$node.parent();var rawScore=scoreNode$$1($node);addScoreTo$1($parent,$,rawScore,weightNodes);if($parent){// Add half of the individual content score to the
// grandparent
addScoreTo$1($parent.parent(),$,rawScore/2,weightNodes);}});return $;}// score content. Parents get the full value of their children's
// content score, grandparents half
function scoreContent$$1($){var weightNodes=arguments.length>1&&arguments[1]!==undefined?arguments[1]:true;// First, look for special hNews based selectors and give them a big
// boost, if they exist
HNEWS_CONTENT_SELECTORS$1$1.forEach(function(_ref){var _ref2=_slicedToArray$1(_ref,2),parentSelector=_ref2[0],childSelector=_ref2[1];$(parentSelector+' '+childSelector).each(function(index,node){addScore$$1($(node).parent(parentSelector),$,80);});});// Doubling this again
// Previous solution caused a bug
// in which parents weren't retaining
// scores. This is not ideal, and
// should be fixed.
scorePs$1($,weightNodes);scorePs$1($,weightNodes);return $;}// Now that we have a top_candidate, look through the siblings of
// it to see if any of them are decently scored. If they are, they
// may be split parts of the content (Like two divs, a preamble and
// a body.) Example:
// http://articles.latimes.com/2009/oct/14/business/fi-bigtvs14
function mergeSiblings$1($candidate,topScore,$){if(!$candidate.parent().length){return $candidate;}var siblingScoreThreshold=Math.max(10,topScore*0.25);var wrappingDiv=$('<div></div>');$candidate.parent().children().each(function(index,sibling){var $sibling=$(sibling);// Ignore tags like BR, HR, etc
if(NON_TOP_CANDIDATE_TAGS_RE$1$1.test(sibling.tagName)){return null;}var siblingScore=getScore$1($sibling);if(siblingScore){if($sibling.get(0)===$candidate.get(0)){wrappingDiv.append($sibling);}else{var contentBonus=0;var density=linkDensity$1($sibling);// If sibling has a very low link density,
// give it a small bonus
if(density<0.05){contentBonus+=20;}// If sibling has a high link density,
// give it a penalty
if(density>=0.5){contentBonus-=20;}// If sibling node has the same class as
// candidate, give it a bonus
if($sibling.attr('class')===$candidate.attr('class')){contentBonus+=topScore*0.2;}var newScore=siblingScore+contentBonus;if(newScore>=siblingScoreThreshold){return wrappingDiv.append($sibling);}else if(sibling.tagName==='p'){var siblingContent=$sibling.text();var siblingContentLength=textLength$1(siblingContent);if(siblingContentLength>80&&density<0.25){return wrappingDiv.append($sibling);}else if(siblingContentLength<=80&&density===0&&hasSentenceEnd$1(siblingContent)){return wrappingDiv.append($sibling);}}}}return null;});if(wrappingDiv.children().length===1&&wrappingDiv.children().first().get(0)===$candidate.get(0)){return $candidate;}return wrappingDiv;}// After we've calculated scores, loop through all of the possible
// candidate nodes we found and find the one with the highest score.
function findTopCandidate$$1($){var $candidate=void 0;var topScore=0;$('[score]').each(function(index,node){// Ignore tags like BR, HR, etc
if(NON_TOP_CANDIDATE_TAGS_RE$1$1.test(node.tagName)){return;}var $node=$(node);var score=getScore$1($node);if(score>topScore){topScore=score;$candidate=$node;}});// If we don't have a candidate, return the body
// or whatever the first element is
if(!$candidate){return $('body')||$('*').first();}$candidate=mergeSiblings$1($candidate,topScore,$);return $candidate;}// Scoring
function removeUnlessContent$1($node,$,weight){// Explicitly save entry-content-asset tags, which are
// noted as valuable in the Publisher guidelines. For now
// this works everywhere. We may want to consider making
// this less of a sure-thing later.
if($node.hasClass('entry-content-asset')){return;}var content=normalizeSpaces$1($node.text());if(scoreCommas$1(content)<10){var pCount=$('p',$node).length;var inputCount=$('input',$node).length;// Looks like a form, too many inputs.
if(inputCount>pCount/3){$node.remove();return;}var contentLength=content.length;var imgCount=$('img',$node).length;// Content is too short, and there are no images, so
// this is probably junk content.
if(contentLength<25&&imgCount===0){$node.remove();return;}var density=linkDensity$1($node);// Too high of link density, is probably a menu or
// something similar.
// console.log(weight, density, contentLength)
if(weight<25&&density>0.2&&contentLength>75){$node.remove();return;}// Too high of a link density, despite the score being
// high.
if(weight>=25&&density>0.5){// Don't remove the node if it's a list and the
// previous sibling starts with a colon though. That
// means it's probably content.
var tagName=$node.get(0).tagName.toLowerCase();var nodeIsList=tagName==='ol'||tagName==='ul';if(nodeIsList){var previousNode=$node.prev();if(previousNode&&normalizeSpaces$1(previousNode.text()).slice(-1)===':'){return;}}$node.remove();return;}var scriptCount=$('script',$node).length;// Too many script tags, not enough content.
if(scriptCount>0&&contentLength<150){$node.remove();return;}}}// Given an article, clean it of some superfluous content specified by
// tags. Things like forms, ads, etc.
//
// Tags is an array of tag name's to search through. (like div, form,
// etc)
//
// Return this same doc.
function cleanTags$$1($article,$){$(CLEAN_CONDITIONALLY_TAGS$1,$article).each(function(index,node){var $node=$(node);// If marked to keep, skip it
if($node.hasClass(KEEP_CLASS$1)||$node.find('.'+KEEP_CLASS$1).length>0)return;var weight=getScore$1($node);if(!weight){weight=getOrInitScore$$1($node,$);setScore$1($node,$,weight);}// drop node if its weight is < 0
if(weight<0){$node.remove();}else{// deteremine if node seems like content
removeUnlessContent$1($node,$,weight);}});return $;}function cleanHeaders$1($article,$){var title=arguments.length>2&&arguments[2]!==undefined?arguments[2]:'';$(HEADER_TAG_LIST$1,$article).each(function(index,header){var $header=$(header);// Remove any headers that appear before all other p tags in the
// document. This probably means that it was part of the title, a
// subtitle or something else extraneous like a datestamp or byline,
// all of which should be handled by other metadata handling.
if($($header,$article).prevAll('p').length===0){return $header.remove();}// Remove any headers that match the title exactly.
if(normalizeSpaces$1($(header).text())===title){return $header.remove();}// If this header has a negative weight, it's probably junk.
// Get rid of it.
if(getWeight$1($(header))<0){return $header.remove();}return $header;});return $;}// Rewrite the tag name to div if it's a top level node like body or
// html to avoid later complications with multiple body tags.
function rewriteTopLevel$$1(article,$){// I'm not using context here because
// it's problematic when converting the
// top-level/root node - AP
$=convertNodeTo$$1($('html'),$,'div');$=convertNodeTo$$1($('body'),$,'div');return $;}function absolutize$1($,rootUrl,attr,$content){$('['+attr+']',$content).each(function(_,node){var attrs=getAttrs$1(node);var url=attrs[attr];if(url){var absoluteUrl=URL$1.resolve(rootUrl,url);setAttr$1(node,attr,absoluteUrl);}});}function makeLinksAbsolute$$1($content,$,url){['href','src'].forEach(function(attr){return absolutize$1($,url,attr,$content);});return $content;}function textLength$1(text){return text.trim().replace(/\s+/g,' ').length;}// Determines what percentage of the text
// in a node is link text
// Takes a node, returns a float
function linkDensity$1($node){var totalTextLength=textLength$1($node.text());var linkText=$node.find('a').text();var linkLength=textLength$1(linkText);if(totalTextLength>0){return linkLength/totalTextLength;}else if(totalTextLength===0&&linkLength>0){return 1;}return 0;}// Given a node type to search for, and a list of meta tag names to
// search for, find a meta tag associated.
function extractFromMeta$$1($,metaNames,cachedNames){var cleanTags$$1=arguments.length>3&&arguments[3]!==undefined?arguments[3]:true;var foundNames=metaNames.filter(function(name){return cachedNames.indexOf(name)!==-1;});var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{var _loop=function _loop(){var name=_step.value;var type='name';var value='value';var nodes=$('meta['+type+'="'+name+'"]');// Get the unique value of every matching node, in case there
// are two meta tags with the same name and value.
// Remove empty values.
var values=nodes.map(function(index,node){return $(node).attr(value);}).toArray().filter(function(text){return text!=='';});// If we have more than one value for the same name, we have a
// conflict and can't trust any of them. Skip this name. If we have
// zero, that means our meta tags had no values. Skip this name
// also.
if(values.length===1){var metaValue=void 0;// Meta values that contain HTML should be stripped, as they
// weren't subject to cleaning previously.
if(cleanTags$$1){metaValue=stripTags$1(values[0],$);}else{metaValue=values[0];}return{v:metaValue};}};for(var _iterator=_getIterator$1(foundNames),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){var _ret=_loop();if((typeof _ret==='undefined'?'undefined':_typeof$1(_ret))==="object")return _ret.v;}// If nothing is found, return null
}catch(err){_didIteratorError=true;_iteratorError=err;}finally{try{if(!_iteratorNormalCompletion&&_iterator.return){_iterator.return();}}finally{if(_didIteratorError){throw _iteratorError;}}}return null;}function isGoodNode$1($node,maxChildren){// If it has a number of children, it's more likely a container
// element. Skip it.
if($node.children().length>maxChildren){return false;}// If it looks to be within a comment, skip it.
if(withinComment$$1($node)){return false;}return true;}// Given a a list of selectors find content that may
// be extractable from the document. This is for flat
// meta-information, like author, title, date published, etc.
function extractFromSelectors$$1($,selectors){var maxChildren=arguments.length>2&&arguments[2]!==undefined?arguments[2]:1;var textOnly=arguments.length>3&&arguments[3]!==undefined?arguments[3]:true;var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=_getIterator$1(selectors),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){var selector=_step.value;var nodes=$(selector);// If we didn't get exactly one of this selector, this may be
// a list of articles or comments. Skip it.
if(nodes.length===1){var $node=$(nodes[0]);if(isGoodNode$1($node,maxChildren)){var content=void 0;if(textOnly){content=$node.text();}else{content=$node.html();}if(content){return content;}}}}}catch(err){_didIteratorError=true;_iteratorError=err;}finally{try{if(!_iteratorNormalCompletion&&_iterator.return){_iterator.return();}}finally{if(_didIteratorError){throw _iteratorError;}}}return null;}// strips all tags from a string of text
function stripTags$1(text,$){// Wrapping text in html element prevents errors when text
// has no html
var cleanText=$('<span>'+text+'</span>').text();return cleanText===''?text:cleanText;}function withinComment$$1($node){var parents=$node.parents().toArray();var commentParent=parents.find(function(parent){var attrs=getAttrs$1(parent);var nodeClass=attrs.class,id=attrs.id;var classAndId=nodeClass+' '+id;return classAndId.includes('comment');});return commentParent!==undefined;}// Given a node, determine if it's article-like enough to return
// param: node (a cheerio node)
// return: boolean
function nodeIsSufficient$1($node){return $node.text().trim().length>=100;}function isWordpress$1($){return $(IS_WP_SELECTOR$1).length>0;}function getAttrs$1(node){var attribs=node.attribs,attributes=node.attributes;if(!attribs&&attributes){var attrs=_Reflect$ownKeys$1(attributes).reduce(function(acc,index){var attr=attributes[index];if(!attr.name||!attr.value)return acc;acc[attr.name]=attr.value;return acc;},{});return attrs;}return attribs;}function setAttr$1(node,attr,val){if(node.attribs){node.attribs[attr]=val;}else if(node.attributes){node.setAttribute(attr,val);}return node;}function setAttrs$1(node,attrs){if(node.attribs){node.attribs=attrs;}else if(node.attributes){while(node.attributes.length>0){node.removeAttribute(node.attributes[0].name);}_Reflect$ownKeys$1(attrs).forEach(function(key){node.setAttribute(key,attrs[key]);});}return node;}// DOM manipulation
var IS_LINK=new RegExp('https?://','i');var IS_IMAGE=new RegExp('.(png|gif|jpe?g)','i');var TAGS_TO_REMOVE=['script','style','form'].join(',');// Convert all instances of images with potentially
// lazy loaded images into normal images.
// Many sites will have img tags with no source, or an image tag with a src
// attribute that a is a placeholer. We need to be able to properly fill in
// the src attribute so the images are no longer lazy loaded.
function convertLazyLoadedImages($){$('img').each(function(_,img){var attrs=getAttrs$1(img);_Reflect$ownKeys$1(attrs).forEach(function(attr){var value=attrs[attr];if(attr!=='src'&&IS_LINK.test(value)&&IS_IMAGE.test(value)){$(img).attr('src',value);}});});return $;}function isComment(index,node){return node.type==='comment';}function cleanComments($){$.root().find('*').contents().filter(isComment).remove();return $;}function clean($){$(TAGS_TO_REMOVE).remove();$=cleanComments($);return $;}var Resource={// Create a Resource.
//
// :param url: The URL for the document we should retrieve.
// :param response: If set, use as the response rather than
//                  attempting to fetch it ourselves. Expects a
//                  string.
create:function create(url,preparedResponse,parsedUrl){var _this=this;return _asyncToGenerator(_regeneratorRuntime.mark(function _callee(){var result,validResponse;return _regeneratorRuntime.wrap(function _callee$(_context){while(1){switch(_context.prev=_context.next){case 0:result=void 0;if(!preparedResponse){_context.next=6;break;}validResponse={statusMessage:'OK',statusCode:200,headers:{'content-type':'text/html','content-length':500}};result={body:preparedResponse,response:validResponse};_context.next=9;break;case 6:_context.next=8;return fetchResource$1(url,parsedUrl);case 8:result=_context.sent;case 9:if(!result.error){_context.next=12;break;}result.failed=true;return _context.abrupt('return',result);case 12:return _context.abrupt('return',_this.generateDoc(result));case 13:case'end':return _context.stop();}}},_callee,_this);}))();},generateDoc:function generateDoc(_ref){var content=_ref.body,response=_ref.response;var contentType=response.headers['content-type'];// TODO: Implement is_text function from
// https://github.com/ReadabilityHoldings/readability/blob/8dc89613241d04741ebd42fa9fa7df1b1d746303/readability/utils/text.py#L57
if(!contentType.includes('html')&&!contentType.includes('text')){throw new Error('Content does not appear to be text.');}var $=this.encodeDoc({content:content,contentType:contentType});if($.root().children().length===0){throw new Error('No children, likely a bad parse.');}$=normalizeMetaTags($);$=convertLazyLoadedImages($);$=clean($);return $;},encodeDoc:function encodeDoc(_ref2){var content=_ref2.content,contentType=_ref2.contentType;var encoding=getEncoding$1(contentType);var decodedContent=iconv$1.decode(content,encoding);var $=cheerio$1.load(decodedContent);// after first cheerio.load, check to see if encoding matches
var metaContentType=$('meta[http-equiv=content-type]').attr('content');var properEncoding=getEncoding$1(metaContentType);// if encodings in the header/body dont match, use the one in the body
if(properEncoding!==encoding){decodedContent=iconv$1.decode(content,properEncoding);$=cheerio$1.load(decodedContent);}return $;}};var merge=function merge(extractor,domains){return domains.reduce(function(acc,domain){acc[domain]=extractor;return acc;},{});};function mergeSupportedDomains(extractor){return extractor.supportedDomains?merge(extractor,[extractor.domain].concat(_toConsumableArray$1(extractor.supportedDomains))):merge(extractor,[extractor.domain]);}var BloggerExtractor={domain:'blogspot.com',content:{// Blogger is insane and does not load its content
// initially in the page, but it's all there
// in noscript
selectors:['.post-content noscript'],// Selectors to remove from the extracted content
clean:[],// Convert the noscript tag to a div
transforms:{noscript:'div'}},author:{selectors:['.post-author-name']},title:{selectors:['.post h2.title']},date_published:{selectors:['span.publishdate']}};var NYMagExtractor={domain:'nymag.com',content:{// Order by most likely. Extractor will stop on first occurrence
selectors:['div.article-content','section.body','article.article'],// Selectors to remove from the extracted content
clean:['.ad','.single-related-story'],// Object of tranformations to make on matched elements
// Each key is the selector, each value is the tag to
// transform to.
// If a function is given, it should return a string
// to convert to or nothing (in which case it will not perform
// the transformation.
transforms:{// Convert h1s to h2s
h1:'h2',// Convert lazy-loaded noscript images to figures
noscript:function noscript($node,$){var $children=$.browser?$($node.text()):$node.children();if($children.length===1&&$children.get(0)!==undefined&&$children.get(0).tagName.toLowerCase()==='img'){return'figure';}return null;}}},title:{selectors:['h1.lede-feature-title','h1.headline-primary','h1']},author:{selectors:['.by-authors','.lede-feature-author']},dek:{selectors:['.lede-feature-teaser']},date_published:{selectors:[['time.article-timestamp[datetime]','datetime'],'time.article-timestamp']}};var WikipediaExtractor={domain:'wikipedia.org',content:{selectors:['#mw-content-text'],defaultCleaner:false,// transform top infobox to an image with caption
transforms:{'.infobox img':function infoboxImg($node){var $parent=$node.parents('.infobox');// Only prepend the first image in .infobox
if($parent.children('img').length===0){$parent.prepend($node);}},'.infobox caption':'figcaption','.infobox':'figure'},// Selectors to remove from the extracted content
clean:['.mw-editsection','figure tr, figure td, figure tbody','#toc','.navbox']},author:'Wikipedia Contributors',title:{selectors:['h2.title']},date_published:{selectors:['#footer-info-lastmod']}};var TwitterExtractor={domain:'twitter.com',content:{transforms:{// We're transforming essentially the whole page here.
// Twitter doesn't have nice selectors, so our initial
// selector grabs the whole page, then we're re-writing
// it to fit our needs before we clean it up.
'.permalink[role=main]':function permalinkRoleMain($node,$){var tweets=$node.find('.tweet');var $tweetContainer=$('<div id="TWEETS_GO_HERE"></div>');$tweetContainer.append(tweets);$node.replaceWith($tweetContainer);},// Twitter wraps @ with s, which
// renders as a strikethrough
s:'span'},selectors:['.permalink[role=main]'],defaultCleaner:false,clean:['.stream-item-footer','button','.tweet-details-fixer']},author:{selectors:['.tweet.permalink-tweet .username']},date_published:{selectors:[['.permalink-tweet ._timestamp[data-time-ms]','data-time-ms']]}};var NYTimesExtractor={domain:'www.nytimes.com',title:{selectors:['h1.g-headline','h1[itemprop="headline"]','h1.headline']},author:{selectors:[['meta[name="author"]','value'],'.g-byline','.byline']},content:{selectors:['div.g-blocks','article#story'],transforms:{'img.g-lazy':function imgGLazy($node){var src=$node.attr('src');// const widths = $node.attr('data-widths')
//                   .slice(1)
//                   .slice(0, -1)
//                   .split(',');
// if (widths.length) {
//   width = widths.slice(-1);
// } else {
//   width = '900';
// }
var width=640;src=src.replace('{{size}}',width);$node.attr('src',src);}},clean:['.ad','header#story-header','.story-body-1 .lede.video','.visually-hidden','#newsletter-promo','.promo','.comments-button','.hidden','.comments','.supplemental','.nocontent','.story-footer-links']},date_published:{selectors:[['meta[name="article:published"]','value']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},dek:null,next_page_url:null,excerpt:null};// Rename CustomExtractor
// to fit your publication
var TheAtlanticExtractor={domain:'www.theatlantic.com',title:{selectors:['h1.hed']},author:{selectors:['article#article .article-cover-extra .metadata .byline a']},content:{selectors:[['.article-cover figure.lead-img','.article-body'],'.article-body'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:[],// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.partner-box','.callout']},date_published:{selectors:[['time[itemProp="datePublished"]','datetime']]},lead_image_url:null,next_page_url:null,excerpt:null};// Rename CustomExtractor
// to fit your publication
// (e.g., NYTimesExtractor)
var NewYorkerExtractor={domain:'www.newyorker.com',title:{selectors:['h1.title']},author:{selectors:['.contributors']},content:{selectors:['div#articleBody','div.articleBody'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:[],// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]},date_published:{selectors:[['meta[name="article:published_time"]','value'],['time[itemProp="datePublished"]','content']],timezone:'America/New_York'},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},dek:{selectors:['.dek','h2.dek']},next_page_url:null,excerpt:null};// Rename CustomExtractor
// to fit your publication
// (e.g., NYTimesExtractor)
var WiredExtractor={domain:'www.wired.com',title:{selectors:['h1.post-title']},author:{selectors:['a[rel="author"]']},content:{selectors:['article.content'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:[],// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.visually-hidden','figcaption img.photo']},date_published:{selectors:[['meta[itemprop="datePublished"]','value']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},dek:{selectors:[]},next_page_url:null,excerpt:null};// Rename CustomExtractor
// to fit your publication
// (e.g., NYTimesExtractor)
var MSNExtractor={domain:'www.msn.com',title:{selectors:['h1']},author:{selectors:['span.authorname-txt']},content:{selectors:['div.richtext'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:[],// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['span.caption']},date_published:{selectors:['span.time']},lead_image_url:{selectors:[]},dek:{selectors:[]},next_page_url:null,excerpt:null};// Rename CustomExtractor
// to fit your publication
// (e.g., NYTimesExtractor)
var YahooExtractor={domain:'www.yahoo.com',title:{selectors:['header.canvas-header']},author:{selectors:['span.provider-name']},content:{selectors:[// enter content selectors
'.content-canvas'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:[],// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.figure-caption']},date_published:{selectors:[['time.date[datetime]','datetime']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},dek:{selectors:[// enter dek selectors
]},next_page_url:null,excerpt:null};// Rename CustomExtractor
// to fit your publication
// (e.g., NYTimesExtractor)
var BuzzfeedExtractor={domain:'www.buzzfeed.com',title:{selectors:['h1[id="post-title"]']},author:{selectors:['a[data-action="user/username"]','byline__author']},content:{selectors:[['.longform_custom_header_media','#buzz_sub_buzz'],'#buzz_sub_buzz'],defaultCleaner:false,// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{h2:'b','div.longform_custom_header_media':function divLongform_custom_header_media($node){if($node.has('img')&&$node.has('.longform_header_image_source')){return'figure';}return null;},'figure.longform_custom_header_media .longform_header_image_source':'figcaption'},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.instapaper_ignore','.suplist_list_hide .buzz_superlist_item .buzz_superlist_number_inline','.share-box','.print']},date_published:{selectors:['.buzz-datetime']},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},dek:{selectors:[]},next_page_url:null,excerpt:null};// Rename CustomExtractor
// to fit your publication
// (e.g., NYTimesExtractor)
var WikiaExtractor={domain:'fandom.wikia.com',title:{selectors:['h1.entry-title']},author:{selectors:['.author vcard','.fn']},content:{selectors:['.grid-content','.entry-content'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:[],// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]},date_published:{selectors:[['meta[name="article:published_time"]','value']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},dek:{selectors:[]},next_page_url:null,excerpt:null};// Rename CustomExtractor
// to fit your publication
// (e.g., NYTimesExtractor)
var LittleThingsExtractor={domain:'www.littlethings.com',title:{selectors:['h1.post-title']},author:{selectors:[['meta[name="author"]','value']]},content:{selectors:[// enter content selectors
'.mainContentIntro','.content-wrapper'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:[],// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},next_page_url:null,excerpt:null};// Rename CustomExtractor
// to fit your publication
// (e.g., NYTimesExtractor)
var PoliticoExtractor={domain:'www.politico.com',title:{selectors:[// enter title selectors
['meta[name="og:title"]','value']]},author:{selectors:['.story-main-content .byline .vcard']},content:{selectors:[// enter content selectors
'.story-main-content','.content-group','.story-core','.story-text'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:[],// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['figcaption']},date_published:{selectors:[['.story-main-content .timestamp time[datetime]','datetime']]},lead_image_url:{selectors:[// enter lead_image_url selectors
['meta[name="og:image"]','value']]},dek:{selectors:[]},next_page_url:null,excerpt:null};var DeadspinExtractor={domain:'deadspin.com',supportedDomains:['jezebel.com','lifehacker.com','kotaku.com','gizmodo.com','jalopnik.com','kinja.com'],title:{selectors:['h1.headline']},author:{selectors:['.author']},content:{selectors:['.post-content','.entry-content'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{'iframe.lazyload[data-recommend-id^="youtube://"]':function iframeLazyloadDataRecommendIdYoutube($node){var youtubeId=$node.attr('id').split('youtube-')[1];$node.attr('src','https://www.youtube.com/embed/'+youtubeId);}},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.magnifier','.lightbox']},date_published:{selectors:[['time.updated[datetime]','datetime']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},dek:{selectors:[// enter selectors
]},next_page_url:{selectors:[// enter selectors
]},excerpt:{selectors:[// enter selectors
]}};// Rename CustomExtractor
// to fit your publication
// (e.g., NYTimesExtractor)
var BroadwayWorldExtractor={domain:'www.broadwayworld.com',title:{selectors:['h1.article-title']},author:{selectors:['span[itemprop=author]']},content:{selectors:['div[itemprop=articlebody]'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]},date_published:{selectors:[['meta[itemprop=datePublished]','value']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},dek:{selectors:[]},next_page_url:{selectors:[// enter selectors
]},excerpt:{selectors:[// enter selectors
]}};// Rename CustomExtractor
// to fit your publication
// (e.g., NYTimesExtractor)
var ApartmentTherapyExtractor={domain:'www.apartmenttherapy.com',title:{selectors:['h1.headline']},author:{selectors:['.PostByline__name']},content:{selectors:['div.post__content'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{'div[data-render-react-id="images/LazyPicture"]':function divDataRenderReactIdImagesLazyPicture($node,$){var data=JSON.parse($node.attr('data-props'));var src=data.sources[0].src;var $img=$('<img />').attr('src',src);$node.replaceWith($img);}},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]},date_published:{selectors:[['.PostByline__timestamp[datetime]','datetime']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},dek:{selectors:[]},next_page_url:{selectors:[// enter selectors
]},excerpt:{selectors:[// enter selectors
]}};var MediumExtractor={domain:'medium.com',supportedDomains:['trackchanges.postlight.com'],title:{selectors:['h1']},author:{selectors:[['meta[name="author"]','value']]},content:{selectors:[['.section-content'],'.section-content','article > div > section'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{// Re-write lazy-loaded youtube videos
iframe:function iframe($node){var ytRe=/https:\/\/i.embed.ly\/.+url=https:\/\/i\.ytimg\.com\/vi\/(\w+)\//;var thumb=decodeURIComponent($node.attr('data-thumbnail'));if(ytRe.test(thumb)){var _thumb$match=thumb.match(ytRe),_thumb$match2=_slicedToArray$1(_thumb$match,2),_=_thumb$match2[0],youtubeId=_thumb$match2[1];// eslint-disable-line
$node.attr('src','https://www.youtube.com/embed/'+youtubeId);var $parent=$node.parents('figure');var $caption=$parent.find('figcaption');$parent.empty().append([$node,$caption]);}},// rewrite figures to pull out image and caption, remove rest
figure:function figure($node){// ignore if figure has an iframe
if($node.find('iframe').length>0)return;var $img=$node.find('img').slice(-1)[0];var $caption=$node.find('figcaption');$node.empty().append([$img,$caption]);}},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]},date_published:{selectors:[['time[datetime]','datetime']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},dek:{selectors:[// enter selectors
]},next_page_url:{selectors:[// enter selectors
]},excerpt:{selectors:[// enter selectors
]}};var WwwTmzComExtractor={domain:'www.tmz.com',title:{selectors:['.post-title-breadcrumb','h1','.headline']},author:'TMZ STAFF',date_published:{selectors:['.article-posted-date'],timezone:'America/Los_Angeles'},dek:{selectors:[// enter selectors
]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['.article-content','.all-post-body'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.lightbox-link']}};var WwwWashingtonpostComExtractor={domain:'www.washingtonpost.com',title:{selectors:['h1','#topper-headline-wrapper']},author:{selectors:['.pb-byline']},date_published:{selectors:[['.pb-timestamp[itemprop="datePublished"]','content']]},dek:{selectors:[]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['.article-body'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{'div.inline-content':function divInlineContent($node){if($node.has('img,iframe,video').length>0){return'figure';}$node.remove();return null;},'.pb-caption':'figcaption'},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.interstitial-link','.newsletter-inline-unit']}};var WwwHuffingtonpostComExtractor={domain:'www.huffingtonpost.com',title:{selectors:['h1.headline__title']},author:{selectors:['span.author-card__details__name']},date_published:{selectors:[['meta[name="article:modified_time"]','value'],['meta[name="article:published_time"]','value']]},dek:{selectors:['h2.headline__subtitle']},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['div.entry__body'],defaultCleaner:false,// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{// 'div.top-media': ($node) => {
//   const $figure = $node.children('figure');
//   $node.replaceWith($figure);
// },
},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.pull-quote','.tag-cloud','.embed-asset','.below-entry','.entry-corrections','#suggested-story']}};var NewrepublicComExtractor={domain:'newrepublic.com',title:{selectors:['h1.article-headline','.minutes-primary h1.minute-title']},author:{selectors:['div.author-list','.minutes-primary h3.minute-byline']},date_published:{selectors:[['meta[name="article:published_time"]','value']],timezone:'America/New_York'},dek:{selectors:['h2.article-subhead']},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:[['.article-cover','div.content-body'],['.minute-image','.minutes-primary div.content-body']],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['aside']}};var MoneyCnnComExtractor={domain:'money.cnn.com',title:{selectors:['.article-title']},author:{selectors:['.byline a']},date_published:{selectors:[['meta[name="date"]','value']],timezone:'GMT'},dek:{selectors:['#storytext h2']},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['#storytext'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.inStoryHeading']}};var WwwThevergeComExtractor={domain:'www.theverge.com',supportedDomains:['www.polygon.com'],title:{selectors:['h1']},author:{selectors:[['meta[name="author"]','value']]},date_published:{selectors:[['meta[name="article:published_time"]','value']]},dek:{selectors:['h2.p-dek']},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:[// feature template multi-match
['.c-entry-hero .e-image','.c-entry-intro','.c-entry-content'],// regular post multi-match
['.e-image--hero','.c-entry-content'],// feature template fallback
'.l-wrapper .l-feature',// regular post fallback
'div.c-entry-content'],// Transform lazy-loaded images
transforms:{noscript:function noscript($node){var $children=$node.children();if($children.length===1&&$children.get(0).tagName==='img'){return'span';}return null;}},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.aside','img.c-dynamic-image']}};var WwwCnnComExtractor={domain:'www.cnn.com',title:{selectors:['h1.pg-headline','h1']},author:{selectors:['.metadata__byline__author']},date_published:{selectors:[['meta[name="pubdate"]','value']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:[// a more specific selector to grab the lead image and the body
['.media__video--thumbnail','.zn-body-text'],// a fallback for the above
'.zn-body-text','div[itemprop="articleBody"]'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{'.zn-body__paragraph, .el__leafmedia--sourced-paragraph':function znBody__paragraphEl__leafmediaSourcedParagraph($node){var $text=$node.html();if($text){return'p';}return null;},// this transform cleans the short, all-link sections linking
// to related content but not marked as such in any way.
'.zn-body__paragraph':function znBody__paragraph($node){if($node.has('a')){if($node.text().trim()===$node.find('a').text().trim()){$node.remove();}}},'.media__video--thumbnail':'figure'},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var WwwAolComExtractor={domain:'www.aol.com',title:{selectors:['h1.p-article__title']},author:{selectors:[['meta[name="author"]','value']]},date_published:{selectors:['.p-article__byline__date'],timezone:'America/New_York'},dek:{selectors:[// enter selectors
]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['.article-content'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var WwwYoutubeComExtractor={domain:'www.youtube.com',title:{selectors:['.watch-title','h1.watch-title-container']},author:{selectors:['.yt-user-info']},date_published:{selectors:[['meta[itemProp="datePublished"]','value']],timezone:'GMT'},dek:{selectors:[// enter selectors
]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{defaultCleaner:false,selectors:[['#player-api','#eow-description']],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{'#player-api':function playerApi($node,$){var videoId=$('meta[itemProp="videoId"]').attr('value');$node.html('\n          <iframe src="https://www.youtube.com/embed/'+videoId+'" frameborder="0" allowfullscreen></iframe>');}},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var WwwTheguardianComExtractor={domain:'www.theguardian.com',title:{selectors:['.content__headline']},author:{selectors:['p.byline']},date_published:{selectors:[['meta[name="article:published_time"]','value']]},dek:{selectors:['.content__standfirst']},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['.content__article-body'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.hide-on-mobile','.inline-icon']}};var WwwSbnationComExtractor={domain:'www.sbnation.com',title:{selectors:['h1.c-page-title']},author:{selectors:[['meta[name="author"]','value']]},date_published:{selectors:[['meta[name="article:published_time"]','value']]},dek:{selectors:['h2.c-entry-summary.p-dek']},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['div.c-entry-content'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var WwwBloombergComExtractor={domain:'www.bloomberg.com',title:{selectors:[// normal articles
'.lede-headline',// /graphics/ template
'h1.article-title',// /news/ template
'h1.lede-text-only__hed']},author:{selectors:[['meta[name="parsely-author"]','value'],'.byline-details__link',// /graphics/ template
'.bydek',// /news/ template
'.author']},date_published:{selectors:[['time.published-at','datetime'],['time[datetime]','datetime'],['meta[name="date"]','value'],['meta[name="parsely-pub-date"]','value']]},dek:{selectors:[]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['.article-body__content',// /graphics/ template
['section.copy-block'],// /news/ template
'.body-copy'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.inline-newsletter','.page-ad']}};var WwwBustleComExtractor={domain:'www.bustle.com',title:{selectors:['h1.post-page__title']},author:{selectors:['div.content-meta__author']},date_published:{selectors:[['time.content-meta__published-date[datetime]','datetime']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['.post-page__body'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var WwwNprOrgExtractor={domain:'www.npr.org',title:{selectors:['h1','.storytitle']},author:{selectors:['p.byline__name.byline__name--block']},date_published:{selectors:[['.dateblock time[datetime]','datetime'],['meta[name="date"]','value']]},lead_image_url:{selectors:[['meta[name="og:image"]','value'],['meta[name="twitter:image:src"]','value']]},content:{selectors:['.storytext'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{'.bucketwrap.image':'figure','.bucketwrap.image .credit-caption':'figcaption'},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['div.enlarge_measure']}};var WwwRecodeNetExtractor={domain:'www.recode.net',title:{selectors:['h1.c-page-title']},author:{selectors:[['meta[name="author"]','value']]},date_published:{selectors:[['meta[name="article:published_time"]','value']]},dek:{selectors:['h2.c-entry-summary.p-dek']},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:[['figure.e-image--hero','.c-entry-content'],'.c-entry-content'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var QzComExtractor={domain:'qz.com',title:{selectors:['header.item-header.content-width-responsive']},author:{selectors:[['meta[name="author"]','value']]},date_published:{selectors:['.timestamp']},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:[['figure.featured-image','.item-body'],'.item-body'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.article-aside','.progressive-image-thumbnail']}};var WwwDmagazineComExtractor={domain:'www.dmagazine.com',title:{selectors:['h1.story__title']},author:{selectors:['.story__info .story__info__item:first-child']},date_published:{selectors:[// enter selectors
'.story__info'],timezone:'America/Chicago'},dek:{selectors:['.story__subhead']},lead_image_url:{selectors:[['article figure a:first-child','href']]},content:{selectors:['.story__content'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var WwwReutersComExtractor={domain:'www.reuters.com',title:{selectors:['h1.article-headline']},author:{selectors:['.author']},date_published:{selectors:[['meta[name="og:article:published_time"]','value']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['#article-text'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{'.article-subtitle':'h4'},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['#article-byline .author']}};var MashableComExtractor={domain:'mashable.com',title:{selectors:['h1.title']},author:{selectors:['span.author_name a']},date_published:{selectors:[['meta[name="og:article:published_time"]','value']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['section.article-content.blueprint'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{'.image-credit':'figcaption'},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var WwwChicagotribuneComExtractor={domain:'www.chicagotribune.com',title:{selectors:['h1.trb_ar_hl_t']},author:{selectors:['span.trb_ar_by_nm_au']},date_published:{selectors:[['meta[itemprop="datePublished"]','value']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['div.trb_ar_page'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var WwwVoxComExtractor={domain:'www.vox.com',title:{selectors:['h1.c-page-title']},author:{selectors:[['meta[name="author"]','value']]},date_published:{selectors:[['meta[name="article:published_time"]','value']]},dek:{selectors:['.p-dek']},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:[['figure.e-image--hero','.c-entry-content'],'.c-entry-content'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{'figure .e-image__image noscript':function figureEImage__imageNoscript($node){var imgHtml=$node.html();$node.parents('.e-image__image').find('.c-dynamic-image').replaceWith(imgHtml);},'figure .e-image__meta':'figcaption'},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var NewsNationalgeographicComExtractor={domain:'news.nationalgeographic.com',title:{selectors:['h1','h1.main-title']},author:{selectors:['.byline-component__contributors b span']},date_published:{selectors:[['meta[name="article:published_time"]','value']],format:'ddd MMM DD HH:mm:ss zz YYYY',timezone:'EST'},dek:{selectors:['.article__deck']},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:[['.parsys.content','.__image-lead__'],'.content'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{'.parsys.content':function parsysContent($node,$){var $imgSrc=$node.find('.image.parbase.section').find('.picturefill').first().data('platform-src');if($imgSrc){$node.prepend($('<img class="__image-lead__" src="'+$imgSrc+'"/>'));}}},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.pull-quote.pull-quote--large']}};var WwwNationalgeographicComExtractor={domain:'www.nationalgeographic.com',title:{selectors:['h1','h1.main-title']},author:{selectors:['.byline-component__contributors b span']},date_published:{selectors:[['meta[name="article:published_time"]','value']]},dek:{selectors:['.article__deck']},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:[['.parsys.content','.__image-lead__'],'.content'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{'.parsys.content':function parsysContent($node,$){var $imageParent=$node.children().first();if($imageParent.hasClass('imageGroup')){var $dataAttrContainer=$imageParent.find('.media--medium__container').children().first();var imgPath1=$dataAttrContainer.data('platform-image1-path');var imgPath2=$dataAttrContainer.data('platform-image2-path');if(imgPath2&&imgPath1){$node.prepend($('<div class="__image-lead__">\n                <img src="'+imgPath1+'"/>\n                <img src="'+imgPath2+'"/>\n              </div>'));}}else{var $imgSrc=$node.find('.image.parbase.section').find('.picturefill').first().data('platform-src');if($imgSrc){$node.prepend($('<img class="__image-lead__" src="'+$imgSrc+'"/>'));}}}},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.pull-quote.pull-quote--small']}};var WwwLatimesComExtractor={domain:'www.latimes.com',title:{selectors:['.trb_ar_hl']},author:{selectors:[['meta[name="author"]','value']]},date_published:{selectors:[['meta[itemprop="datePublished"]','value']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['.trb_ar_main'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{'.trb_ar_la':function trb_ar_la($node){var $figure=$node.find('figure');$node.replaceWith($figure);}},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.trb_ar_by','.trb_ar_cr']}};var PagesixComExtractor={domain:'pagesix.com',supportedDomains:['nypost.com'],title:{selectors:['h1 a']},author:{selectors:['.byline']},date_published:{selectors:[['meta[name="article:published_time"]','value']]},dek:{selectors:[['meta[name="description"]','value']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:[['#featured-image-wrapper','.entry-content'],'.entry-content'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{'#featured-image-wrapper':'figure','.wp-caption-text':'figcaption'},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.modal-trigger']}};var ThefederalistpapersOrgExtractor={domain:'thefederalistpapers.org',title:{selectors:['h1.entry-title']},author:{selectors:['main span.entry-author-name']},date_published:{selectors:[['meta[name="article:published_time"]','value']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['.entry-content'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[['p[style]']]}};var WwwCbssportsComExtractor={domain:'www.cbssports.com',title:{selectors:['.article-headline']},author:{selectors:['.author-name']},date_published:{selectors:[['.date-original-reading-time time','datetime']],timezone:'UTC'},dek:{selectors:['.article-subline']},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['.article'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var WwwMsnbcComExtractor={domain:'www.msnbc.com',title:{selectors:['h1','h1.is-title-pane']},author:{selectors:['.author']},date_published:{selectors:[['meta[name="DC.date.issued"]','value']]},dek:{selectors:[['meta[name="description"]','value']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['.pane-node-body'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{'.pane-node-body':function paneNodeBody($node,$){var _WwwMsnbcComExtractor=_slicedToArray$1(WwwMsnbcComExtractor.lead_image_url.selectors[0],2),selector=_WwwMsnbcComExtractor[0],attr=_WwwMsnbcComExtractor[1];var src=$(selector).attr(attr);if(src){$node.prepend('<img src="'+src+'" />');}}},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var WwwThepoliticalinsiderComExtractor={domain:'www.thepoliticalinsider.com',title:{selectors:[['meta[name="sailthru.title"]','value']]},author:{selectors:[['meta[name="sailthru.author"]','value']]},date_published:{selectors:[['meta[name="sailthru.date"]','value']],timezone:'America/New_York'},dek:{selectors:[// enter selectors
]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['div#article-body'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var WwwMentalflossComExtractor={domain:'www.mentalfloss.com',title:{selectors:['h1.title','.title-group','.inner']},author:{selectors:['.field-name-field-enhanced-authors']},date_published:{selectors:['.date-display-single'],timezone:'America/New_York'},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['div.field.field-name-body'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var AbcnewsGoComExtractor={domain:'abcnews.go.com',title:{selectors:['.article-header h1']},author:{selectors:['.authors'],clean:['.author-overlay','.by-text']},date_published:{selectors:['.timestamp'],timezone:'America/New_York'},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['.article-copy'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var WwwNydailynewsComExtractor={domain:'www.nydailynews.com',title:{selectors:['h1#ra-headline']},author:{selectors:[['meta[name="parsely-author"]','value']]},date_published:{selectors:[['meta[name="sailthru.date"]','value']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['article#ra-body'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['dl#ra-tags','.ra-related','a.ra-editor','dl#ra-share-bottom']}};var WwwCnbcComExtractor={domain:'www.cnbc.com',title:{selectors:['h1.title']},author:{selectors:[['meta[name="author"]','value']]},date_published:{selectors:[['meta[name="article:published_time"]','value']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['div#article_body.content','div.story'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var WwwPopsugarComExtractor={domain:'www.popsugar.com',title:{selectors:['h2.post-title','title-text']},author:{selectors:[['meta[name="article:author"]','value']]},date_published:{selectors:[['meta[name="article:published_time"]','value']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['#content'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.share-copy-title','.post-tags','.reactions']}};var ObserverComExtractor={domain:'observer.com',title:{selectors:['h1.entry-title']},author:{selectors:['.author','.vcard']},date_published:{selectors:[['meta[name="article:published_time"]','value']]},dek:{selectors:['h2.dek']},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['div.entry-content'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var PeopleComExtractor={domain:'people.com',title:{selectors:[['meta[name="og:title"]','value']]},author:{selectors:['a.author.url.fn']},date_published:{selectors:[['meta[name="article:published_time"]','value']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['div.article-body__inner'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var WwwUsmagazineComExtractor={domain:'www.usmagazine.com',title:{selectors:['header h1']},author:{selectors:['a.article-byline.tracked-offpage']},date_published:{timezone:'America/New_York',selectors:['time.article-published-date']},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['div.article-body-inner'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.module-related']}};var WwwRollingstoneComExtractor={domain:'www.rollingstone.com',title:{selectors:['h1.content-title']},author:{selectors:['a.content-author.tracked-offpage']},date_published:{selectors:['time.content-published-date'],timezone:'America/New_York'},dek:{selectors:['.content-description']},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:[['.lead-container','.article-content'],'.article-content'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.module-related']}};var twofortysevensportsComExtractor={domain:'247sports.com',title:{selectors:['title','article header h1']},author:{selectors:['.author']},date_published:{selectors:[['time[data-published]','data-published']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['section.body.article'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var UproxxComExtractor={domain:'uproxx.com',title:{selectors:['div.post-top h1']},author:{selectors:['.post-top .authorname']},date_published:{selectors:[['meta[name="article:published_time"]','value']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['.post-body'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{'div.image':'figure','div.image .wp-media-credit':'figcaption'},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var WwwEonlineComExtractor={domain:'www.eonline.com',title:{selectors:['h1.article__title']},author:{selectors:['.entry-meta__author a']},date_published:{selectors:[['meta[itemprop="datePublished"]','value']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:[['.post-content section, .post-content div.post-content__image']],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{'div.post-content__image':'figure','div.post-content__image .image__credits':'figcaption'},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var WwwMiamiheraldComExtractor={domain:'www.miamiherald.com',title:{selectors:['h1.title']},date_published:{selectors:['p.published-date'],timezone:'America/New_York'},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['div.dateline-storybody'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var WwwRefinery29ComExtractor={domain:'www.refinery29.com',title:{selectors:['h1.title']},author:{selectors:['.contributor']},date_published:{selectors:[['meta[name="sailthru.date"]','value']],timezone:'America/New_York'},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:[['.full-width-opener','.article-content'],'.article-content','.body'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{'div.loading noscript':function divLoadingNoscript($node){var imgHtml=$node.html();$node.parents('.loading').replaceWith(imgHtml);},'.section-image':'figure','.section-image .content-caption':'figcaption','.section-text':'p'},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.story-share']}};var WwwMacrumorsComExtractor={domain:'www.macrumors.com',title:{selectors:['h1','h1.title']},author:{selectors:['.author-url']},date_published:{selectors:['.article .byline'],// Wednesday January 18, 2017 11:44 am PST
format:'dddd MMMM D, YYYY h:mm A zz',timezone:'America/Los_Angeles'},dek:{selectors:[['meta[name="description"]','value']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['.article'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var WwwAndroidcentralComExtractor={domain:'www.androidcentral.com',title:{selectors:['h1','h1.main-title']},author:{selectors:['.meta-by']},date_published:{selectors:[['meta[name="article:published_time"]','value']]},dek:{selectors:[['meta[name="og:description"]','value']]},lead_image_url:{selectors:[['.image-large','src']]},content:{selectors:['.article-body'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.intro','blockquote']}};var WwwSiComExtractor={domain:'www.si.com',title:{selectors:['h1','h1.headline']},author:{selectors:[['meta[name="author"]','value']]},date_published:{selectors:['.timestamp'],timezone:'America/New_York'},dek:{selectors:['.quick-hit ul']},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:[['p','.marquee_large_2x','.component.image']],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{noscript:function noscript($node){var $children=$node.children();if($children.length===1&&$children.get(0).tagName==='img'){return'figure';}return null;}},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[['.inline-thumb','.primary-message','.description','.instructions']]}};var WwwRawstoryComExtractor={domain:'www.rawstory.com',title:{selectors:['.blog-title']},author:{selectors:['.blog-author a:first-of-type']},date_published:{selectors:['.blog-author a:last-of-type'],timezone:'EST'},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['.blog-content'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var WwwCnetComExtractor={domain:'www.cnet.com',title:{selectors:[['meta[name="og:title"]','value']]},author:{selectors:['a.author']},date_published:{selectors:['time'],timezone:'America/Los_Angeles'},dek:{selectors:['.article-dek']},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:[['img.__image-lead__','.article-main-body'],'.article-main-body'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{'figure.image':function figureImage($node){var $img=$node.find('img');$img.attr('width','100%');$img.attr('height','100%');$img.addClass('__image-lead__');$node.remove('.imgContainer').prepend($img);}},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var WwwCinemablendComExtractor={domain:'www.cinemablend.com',title:{selectors:['.story_title']},author:{selectors:['.author']},date_published:{selectors:[['meta[name="article:published_time"]','value']],timezone:'EST'},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['div#wrap_left_content'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var WwwTodayComExtractor={domain:'www.today.com',title:{selectors:['h1.entry-headline']},author:{selectors:[['meta[name="author"]','value']]},date_published:{selectors:[['meta[name="DC.date.issued"]','value']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['.entry-container'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.label-comment']}};var WwwHowtogeekComExtractor={domain:'www.howtogeek.com',title:{selectors:['title']},author:{selectors:['#authorinfobox a']},date_published:{selectors:['#authorinfobox + div li'],timezone:'GMT'},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['.thecontent'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var WwwAlComExtractor={domain:'www.al.com',title:{selectors:[['meta[name="title"]','value']]},author:{selectors:[['meta[name="article_author"]','value']]},date_published:{selectors:[['meta[name="article_date_original"]','value']],timezone:'EST'},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['.entry-content'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var WwwThepennyhoarderComExtractor={domain:'www.thepennyhoarder.com',title:{selectors:[['meta[name="dcterms.title"]','value']]},author:{selectors:[['link[rel="author"]','title']]},date_published:{selectors:[['meta[name="article:published_time"]','value']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:[['.post-img','.post-text'],'.post-text'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var WwwWesternjournalismComExtractor={domain:'www.westernjournalism.com',title:{selectors:['title','h1.entry-title']},author:{selectors:[['meta[name="author"]','value']]},date_published:{selectors:[['meta[name="DC.date.issued"]','value']]},dek:{selectors:['.subtitle']},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['div.article-sharing.top + div'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.ad-notice-small']}};var FusionNetExtractor={domain:'fusion.net',title:{selectors:['.post-title','.single-title','.headline']},author:{selectors:['.show-for-medium .byline']},date_published:{selectors:[['time.local-time','datetime']]},dek:{selectors:[// enter selectors
]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:[['.post-featured-media','.article-content'],'.article-content'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{'.fusion-youtube-oembed':'figure'},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var WwwAmericanowComExtractor={domain:'www.americanow.com',title:{selectors:['.title',['meta[name="title"]','value']]},author:{selectors:['.byline']},date_published:{selectors:[['meta[name="publish_date"]','value']]},dek:{selectors:[// enter selectors
]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:[['.article-content','.image','.body'],'.body'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.article-video-wrapper','.show-for-small-only']}};var ScienceflyComExtractor={domain:'sciencefly.com',title:{selectors:['.entry-title','.cb-entry-title','.cb-single-title']},author:{selectors:['div.cb-author','div.cb-author-title']},date_published:{selectors:[['meta[name="article:published_time"]','value']]},dek:{selectors:[// enter selectors
]},lead_image_url:{selectors:[['div.theiaPostSlider_slides img','src']]},content:{selectors:['div.theiaPostSlider_slides'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var HellogigglesComExtractor={domain:'hellogiggles.com',title:{selectors:['.title']},author:{selectors:['.author-link']},date_published:{selectors:[['meta[name="article:published_time"]','value']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['.entry-content'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var ThoughtcatalogComExtractor={domain:'thoughtcatalog.com',title:{selectors:['h1.title',['meta[name="og:title"]','value']]},author:{selectors:['div.col-xs-12.article_header div.writer-container.writer-container-inline.writer-no-avatar h4.writer-name','h1.writer-name']},date_published:{selectors:[['meta[name="article:published_time"]','value']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['.entry.post'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.tc_mark']}};var WwwNjComExtractor={domain:'www.nj.com',title:{selectors:[['meta[name="title"]','value']]},author:{selectors:[['meta[name="article_author"]','value']]},date_published:{selectors:[['meta[name="article_date_original"]','value']],timezone:'America/New_York'},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['.entry-content'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var WwwInquisitrComExtractor={domain:'www.inquisitr.com',title:{selectors:['h1.entry-title.story--header--title']},author:{selectors:['div.story--header--author']},date_published:{selectors:[['meta[name="datePublished"]','value']]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['article.story','.entry-content.'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.post-category','.story--header--socials','.story--header--content']}};var WwwNbcnewsComExtractor={domain:'www.nbcnews.com',title:{selectors:['div.article-hed h1']},author:{selectors:['span.byline_author']},date_published:{selectors:[['.flag_article-wrapper time.timestamp_article[datetime]','datetime'],'.flag_article-wrapper time'],timezone:'America/New_York'},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['div.article-body'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var FortuneComExtractor={domain:'fortune.com',title:{selectors:['h1']},author:{selectors:[['meta[name="author"]','value']]},date_published:{selectors:['.MblGHNMJ'],timezone:'UTC'},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:[['picture','article.row'],'article.row'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var WwwLinkedinComExtractor={domain:'www.linkedin.com',title:{selectors:['.article-title','h1']},author:{selectors:[['meta[name="article:author"]','value'],'.entity-name a[rel=author]']},date_published:{selectors:[['time[itemprop="datePublished"]','datetime']],timezone:'America/Los_Angeles'},dek:{selectors:[// enter selectors
]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:[['header figure','.prose'],'.prose'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.entity-image']}};var ObamawhitehouseArchivesGovExtractor={domain:'obamawhitehouse.archives.gov',supportedDomains:['whitehouse.gov'],title:{selectors:['h1','.pane-node-title']},author:{selectors:['.blog-author-link','.node-person-name-link']},date_published:{selectors:[['meta[name="article:published_time"]','value']]},dek:{selectors:['.field-name-field-forall-summary']},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{defaultCleaner:false,selectors:['div#content-start','.pane-node-field-forall-body'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.pane-node-title','.pane-custom.pane-1']}};var WwwOpposingviewsComExtractor={domain:'www.opposingviews.com',title:{selectors:['h1.title']},author:{selectors:['div.date span span a']},date_published:{selectors:[['meta[name="publish_date"]','value']]},dek:{selectors:[// enter selectors
]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['.article-content'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.show-for-small-only']}};var WwwProspectmagazineCoUkExtractor={domain:'www.prospectmagazine.co.uk',title:{selectors:['.page-title']},author:{selectors:['.aside_author .title']},date_published:{selectors:['.post-info'],timezone:'Europe/London'},dek:{selectors:['.page-subtitle']},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:[// ['article.type-post div.post_content p'],
'article .post_content'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var ForwardComExtractor={domain:'forward.com',title:{selectors:[['meta[name="og:title"]','value']]},author:{selectors:['.author-name',['meta[name="sailthru.author"]','value']]},date_published:{selectors:[['meta[name="date"]','value']]},dek:{selectors:[// enter selectors
]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:[['.post-item-media-wrap','.post-item p']],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.donate-box','.message','.subtitle']}};var WwwQdailyComExtractor={domain:'www.qdaily.com',title:{selectors:['h2','h2.title']},author:{selectors:['.name']},date_published:{selectors:[['.date.smart-date','data-origindate']]},dek:{selectors:['.excerpt']},lead_image_url:{selectors:[['.article-detail-hd img','src']]},content:{selectors:['.detail'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.lazyload','.lazylad','.lazylood']}};var GothamistComExtractor={domain:'gothamist.com',supportedDomains:['chicagoist.com','laist.com','sfist.com','shanghaiist.com','dcist.com'],title:{selectors:['h1','.entry-header h1']},author:{selectors:['.author']},date_published:{selectors:['abbr','abbr.published'],timezone:'America/New_York'},dek:{selectors:[null]},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['.entry-body'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{'div.image-none':'figure','.image-none i':'figcaption','div.image-left':'figure','.image-left i':'figcaption','div.image-right':'figure','.image-right i':'figcaption'},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.image-none br','.image-left br','.image-right br','.galleryEase']}};var WwwFoolComExtractor={domain:'www.fool.com',title:{selectors:['h1']},author:{selectors:['.author-inline .author-name']},date_published:{selectors:[['meta[name="date"]','value']]},dek:{selectors:['header h2']},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['.article-content'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{'.caption img':function captionImg($node){var src=$node.attr('src');$node.parent().replaceWith('<figure><img src="'+src+'"/></figure>');},'.caption':'figcaption'},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['#pitch']}};var WwwSlateComExtractor={domain:'www.slate.com',title:{selectors:['.hed','h1']},author:{selectors:['a[rel=author]']},date_published:{selectors:['.pub-date'],timezone:'America/New_York'},dek:{selectors:['.dek']},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:['.body'],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:['.about-the-author','.pullquote','.newsletter-signup-component','.top-comment']}};var IciRadioCanadaCaExtractor={domain:'ici.radio-canada.ca',title:{selectors:['h1']},author:{selectors:[['meta[name="dc.creator"]','value']]},date_published:{selectors:[['meta[name="dc.date.created"]','value']],timezone:'America/New_York'},dek:{selectors:['.bunker-component.lead']},lead_image_url:{selectors:[['meta[name="og:image"]','value']]},content:{selectors:[['.main-multimedia-item','.news-story-content']],// Is there anything in the content you selected that needs transformed
// before it's consumable content? E.g., unusual lazy loaded images
transforms:{},// Is there anything that is in the result that shouldn't be?
// The clean selectors will remove anything that matches from
// the result
clean:[]}};var CustomExtractors=_Object$freeze({BloggerExtractor:BloggerExtractor,NYMagExtractor:NYMagExtractor,WikipediaExtractor:WikipediaExtractor,TwitterExtractor:TwitterExtractor,NYTimesExtractor:NYTimesExtractor,TheAtlanticExtractor:TheAtlanticExtractor,NewYorkerExtractor:NewYorkerExtractor,WiredExtractor:WiredExtractor,MSNExtractor:MSNExtractor,YahooExtractor:YahooExtractor,BuzzfeedExtractor:BuzzfeedExtractor,WikiaExtractor:WikiaExtractor,LittleThingsExtractor:LittleThingsExtractor,PoliticoExtractor:PoliticoExtractor,DeadspinExtractor:DeadspinExtractor,BroadwayWorldExtractor:BroadwayWorldExtractor,ApartmentTherapyExtractor:ApartmentTherapyExtractor,MediumExtractor:MediumExtractor,WwwTmzComExtractor:WwwTmzComExtractor,WwwWashingtonpostComExtractor:WwwWashingtonpostComExtractor,WwwHuffingtonpostComExtractor:WwwHuffingtonpostComExtractor,NewrepublicComExtractor:NewrepublicComExtractor,MoneyCnnComExtractor:MoneyCnnComExtractor,WwwThevergeComExtractor:WwwThevergeComExtractor,WwwCnnComExtractor:WwwCnnComExtractor,WwwAolComExtractor:WwwAolComExtractor,WwwYoutubeComExtractor:WwwYoutubeComExtractor,WwwTheguardianComExtractor:WwwTheguardianComExtractor,WwwSbnationComExtractor:WwwSbnationComExtractor,WwwBloombergComExtractor:WwwBloombergComExtractor,WwwBustleComExtractor:WwwBustleComExtractor,WwwNprOrgExtractor:WwwNprOrgExtractor,WwwRecodeNetExtractor:WwwRecodeNetExtractor,QzComExtractor:QzComExtractor,WwwDmagazineComExtractor:WwwDmagazineComExtractor,WwwReutersComExtractor:WwwReutersComExtractor,MashableComExtractor:MashableComExtractor,WwwChicagotribuneComExtractor:WwwChicagotribuneComExtractor,WwwVoxComExtractor:WwwVoxComExtractor,NewsNationalgeographicComExtractor:NewsNationalgeographicComExtractor,WwwNationalgeographicComExtractor:WwwNationalgeographicComExtractor,WwwLatimesComExtractor:WwwLatimesComExtractor,PagesixComExtractor:PagesixComExtractor,ThefederalistpapersOrgExtractor:ThefederalistpapersOrgExtractor,WwwCbssportsComExtractor:WwwCbssportsComExtractor,WwwMsnbcComExtractor:WwwMsnbcComExtractor,WwwThepoliticalinsiderComExtractor:WwwThepoliticalinsiderComExtractor,WwwMentalflossComExtractor:WwwMentalflossComExtractor,AbcnewsGoComExtractor:AbcnewsGoComExtractor,WwwNydailynewsComExtractor:WwwNydailynewsComExtractor,WwwCnbcComExtractor:WwwCnbcComExtractor,WwwPopsugarComExtractor:WwwPopsugarComExtractor,ObserverComExtractor:ObserverComExtractor,PeopleComExtractor:PeopleComExtractor,WwwUsmagazineComExtractor:WwwUsmagazineComExtractor,WwwRollingstoneComExtractor:WwwRollingstoneComExtractor,twofortysevensportsComExtractor:twofortysevensportsComExtractor,UproxxComExtractor:UproxxComExtractor,WwwEonlineComExtractor:WwwEonlineComExtractor,WwwMiamiheraldComExtractor:WwwMiamiheraldComExtractor,WwwRefinery29ComExtractor:WwwRefinery29ComExtractor,WwwMacrumorsComExtractor:WwwMacrumorsComExtractor,WwwAndroidcentralComExtractor:WwwAndroidcentralComExtractor,WwwSiComExtractor:WwwSiComExtractor,WwwRawstoryComExtractor:WwwRawstoryComExtractor,WwwCnetComExtractor:WwwCnetComExtractor,WwwCinemablendComExtractor:WwwCinemablendComExtractor,WwwTodayComExtractor:WwwTodayComExtractor,WwwHowtogeekComExtractor:WwwHowtogeekComExtractor,WwwAlComExtractor:WwwAlComExtractor,WwwThepennyhoarderComExtractor:WwwThepennyhoarderComExtractor,WwwWesternjournalismComExtractor:WwwWesternjournalismComExtractor,FusionNetExtractor:FusionNetExtractor,WwwAmericanowComExtractor:WwwAmericanowComExtractor,ScienceflyComExtractor:ScienceflyComExtractor,HellogigglesComExtractor:HellogigglesComExtractor,ThoughtcatalogComExtractor:ThoughtcatalogComExtractor,WwwNjComExtractor:WwwNjComExtractor,WwwInquisitrComExtractor:WwwInquisitrComExtractor,WwwNbcnewsComExtractor:WwwNbcnewsComExtractor,FortuneComExtractor:FortuneComExtractor,WwwLinkedinComExtractor:WwwLinkedinComExtractor,ObamawhitehouseArchivesGovExtractor:ObamawhitehouseArchivesGovExtractor,WwwOpposingviewsComExtractor:WwwOpposingviewsComExtractor,WwwProspectmagazineCoUkExtractor:WwwProspectmagazineCoUkExtractor,ForwardComExtractor:ForwardComExtractor,WwwQdailyComExtractor:WwwQdailyComExtractor,GothamistComExtractor:GothamistComExtractor,WwwFoolComExtractor:WwwFoolComExtractor,WwwSlateComExtractor:WwwSlateComExtractor,IciRadioCanadaCaExtractor:IciRadioCanadaCaExtractor});var Extractors=_Object$keys(CustomExtractors).reduce(function(acc,key){var extractor=CustomExtractors[key];return _extends$1({},acc,mergeSupportedDomains(extractor));},{});// CLEAN AUTHOR CONSTANTS
var CLEAN_AUTHOR_RE=/^\s*(posted |written )?by\s*:?\s*(.*)/i;//     author = re.sub(r'^\s*(posted |written )?by\s*:?\s*(.*)(?i)',
// CLEAN DEK CONSTANTS
var TEXT_LINK_RE=new RegExp('http(s)?://','i');// An ordered list of meta tag names that denote likely article deks.
// From most distinct to least distinct.
//
// NOTE: There are currently no meta tags that seem to provide the right
// content consistenty enough. Two options were:
//  - og:description
//  - dc.description
// However, these tags often have SEO-specific junk in them that's not
// header-worthy like a dek is. Excerpt material at best.
// An ordered list of Selectors to find likely article deks. From
// most explicit to least explicit.
//
// Should be more restrictive than not, as a failed dek can be pretty
// detrimental to the aesthetics of an article.
// CLEAN DATE PUBLISHED CONSTANTS
var MS_DATE_STRING=/^\d{13}$/i;var SEC_DATE_STRING=/^\d{10}$/i;var CLEAN_DATE_STRING_RE=/^\s*published\s*:?\s*(.*)/i;var TIME_MERIDIAN_SPACE_RE=/(.*\d)(am|pm)(.*)/i;var TIME_MERIDIAN_DOTS_RE=/\.m\./i;var months=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];var allMonths=months.join('|');var timestamp1='[0-9]{1,2}:[0-9]{2,2}( ?[ap].?m.?)?';var timestamp2='[0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4}';var timestamp3='-[0-9]{3,4}$';var SPLIT_DATE_STRING=new RegExp('('+timestamp1+')|('+timestamp2+')|('+timestamp3+')|([0-9]{1,4})|('+allMonths+')','ig');// 2016-11-22T08:57-500
// Check if datetime string has an offset at the end
var TIME_WITH_OFFSET_RE=/-\d{3,4}$/;// CLEAN TITLE CONSTANTS
// A regular expression that will match separating characters on a
// title, that usually denote breadcrumbs or something similar.
var TITLE_SPLITTERS_RE=/(: | - | \| )/g;var DOMAIN_ENDINGS_RE=new RegExp('.com$|.net$|.org$|.co.uk$','g');// Take an author string (like 'By David Smith ') and clean it to
// just the name(s): 'David Smith'.
function cleanAuthor(author){return normalizeSpaces$1(author.replace(CLEAN_AUTHOR_RE,'$2').trim());}function clean$1(leadImageUrl){leadImageUrl=leadImageUrl.trim();if(validUrl$1.isWebUri(leadImageUrl)){return leadImageUrl;}return null;}// Take a dek HTML fragment, and return the cleaned version of it.
// Return None if the dek wasn't good enough.
function cleanDek(dek,_ref){var $=_ref.$,excerpt=_ref.excerpt;// Sanity check that we didn't get too short or long of a dek.
if(dek.length>1000||dek.length<5)return null;// Check that dek isn't the same as excerpt
if(excerpt&&excerptContent$1(excerpt,10)===excerptContent$1(dek,10))return null;var dekText=stripTags$1(dek,$);// Plain text links shouldn't exist in the dek. If we have some, it's
// not a good dek - bail.
if(TEXT_LINK_RE.test(dekText))return null;return normalizeSpaces$1(dekText.trim());}// Is there a compelling reason to use moment here?
// Mostly only being used for the isValid() method,
// but could just check for 'Invalid Date' string.
function cleanDateString(dateString){return(dateString.match(SPLIT_DATE_STRING)||[]).join(' ').replace(TIME_MERIDIAN_DOTS_RE,'m').replace(TIME_MERIDIAN_SPACE_RE,'$1 $2 $3').replace(CLEAN_DATE_STRING_RE,'$1').trim();}function createDate(dateString,timezone,format){if(TIME_WITH_OFFSET_RE.test(dateString)){return moment(new Date(dateString));}return timezone?moment.tz(dateString,format||parseFormat(dateString),timezone):moment(dateString,format||parseFormat(dateString));}// Take a date published string, and hopefully return a date out of
// it. Return none if we fail.
function cleanDatePublished(dateString){var _ref=arguments.length>1&&arguments[1]!==undefined?arguments[1]:{},timezone=_ref.timezone,format=_ref.format;// If string is in milliseconds or seconds, convert to int and return
if(MS_DATE_STRING.test(dateString)||SEC_DATE_STRING.test(dateString)){return new Date(parseInt(dateString,10)).toISOString();}var date=createDate(dateString,timezone,format);if(!date.isValid()){dateString=cleanDateString(dateString);date=createDate(dateString,timezone,format);}return date.isValid()?date.toISOString():null;}// Clean our article content, returning a new, cleaned node.
function extractCleanNode(article,_ref){var $=_ref.$,_ref$cleanConditional=_ref.cleanConditionally,cleanConditionally=_ref$cleanConditional===undefined?true:_ref$cleanConditional,_ref$title=_ref.title,title=_ref$title===undefined?'':_ref$title,_ref$url=_ref.url,url=_ref$url===undefined?'':_ref$url,_ref$defaultCleaner=_ref.defaultCleaner,defaultCleaner=_ref$defaultCleaner===undefined?true:_ref$defaultCleaner;// Rewrite the tag name to div if it's a top level node like body or
// html to avoid later complications with multiple body tags.
rewriteTopLevel$$1(article,$);// Drop small images and spacer images
// Only do this is defaultCleaner is set to true;
// this can sometimes be too aggressive.
if(defaultCleaner)cleanImages$1(article,$);// Make links absolute
makeLinksAbsolute$$1(article,$,url);// Mark elements to keep that would normally be removed.
// E.g., stripJunkTags will remove iframes, so we're going to mark
// YouTube/Vimeo videos as elements we want to keep.
markToKeep$1(article,$,url);// Drop certain tags like <title>, etc
// This is -mostly- for cleanliness, not security.
stripJunkTags$1(article,$);// H1 tags are typically the article title, which should be extracted
// by the title extractor instead. If there's less than 3 of them (<3),
// strip them. Otherwise, turn 'em into H2s.
cleanHOnes$$1(article,$);// Clean headers
cleanHeaders$1(article,$,title);// We used to clean UL's and OL's here, but it was leading to
// too many in-article lists being removed. Consider a better
// way to detect menus particularly and remove them.
// Also optionally running, since it can be overly aggressive.
if(defaultCleaner)cleanTags$$1(article,$,cleanConditionally);// Remove empty paragraph nodes
removeEmpty$1(article,$);// Remove unnecessary attributes
cleanAttributes$$1(article,$);return article;}function cleanTitle$$1(title,_ref){var url=_ref.url,$=_ref.$;// If title has |, :, or - in it, see if
// we can clean it up.
if(TITLE_SPLITTERS_RE.test(title)){title=resolveSplitTitle(title,url);}// Final sanity check that we didn't get a crazy title.
// if (title.length > 150 || title.length < 15) {
if(title.length>150){// If we did, return h1 from the document if it exists
var h1=$('h1');if(h1.length===1){title=h1.text();}}// strip any html tags in the title text
return normalizeSpaces$1(stripTags$1(title,$).trim());}function extractBreadcrumbTitle(splitTitle,text){// This must be a very breadcrumbed title, like:
// The Best Gadgets on Earth : Bits : Blogs : NYTimes.com
// NYTimes - Blogs - Bits - The Best Gadgets on Earth
if(splitTitle.length>=6){var _ret=function(){// Look to see if we can find a breadcrumb splitter that happens
// more than once. If we can, we'll be able to better pull out
// the title.
var termCounts=splitTitle.reduce(function(acc,titleText){acc[titleText]=acc[titleText]?acc[titleText]+1:1;return acc;},{});var _Reflect$ownKeys$redu=_Reflect$ownKeys$1(termCounts).reduce(function(acc,key){if(acc[1]<termCounts[key]){return[key,termCounts[key]];}return acc;},[0,0]),_Reflect$ownKeys$redu2=_slicedToArray$1(_Reflect$ownKeys$redu,2),maxTerm=_Reflect$ownKeys$redu2[0],termCount=_Reflect$ownKeys$redu2[1];// We found a splitter that was used more than once, so it
// is probably the breadcrumber. Split our title on that instead.
// Note: max_term should be <= 4 characters, so that " >> "
// will match, but nothing longer than that.
if(termCount>=2&&maxTerm.length<=4){splitTitle=text.split(maxTerm);}var splitEnds=[splitTitle[0],splitTitle.slice(-1)];var longestEnd=splitEnds.reduce(function(acc,end){return acc.length>end.length?acc:end;},'');if(longestEnd.length>10){return{v:longestEnd};}return{v:text};}();if((typeof _ret==='undefined'?'undefined':_typeof$1(_ret))==="object")return _ret.v;}return null;}function cleanDomainFromTitle(splitTitle,url){// Search the ends of the title, looking for bits that fuzzy match
// the URL too closely. If one is found, discard it and return the
// rest.
//
// Strip out the big TLDs - it just makes the matching a bit more
// accurate. Not the end of the world if it doesn't strip right.
var _URL$parse=URL$1.parse(url),host=_URL$parse.host;var nakedDomain=host.replace(DOMAIN_ENDINGS_RE,'');var startSlug=splitTitle[0].toLowerCase().replace(' ','');var startSlugRatio=wuzzy$1.levenshtein(startSlug,nakedDomain);if(startSlugRatio>0.4&&startSlug.length>5){return splitTitle.slice(2).join('');}var endSlug=splitTitle.slice(-1)[0].toLowerCase().replace(' ','');var endSlugRatio=wuzzy$1.levenshtein(endSlug,nakedDomain);if(endSlugRatio>0.4&&endSlug.length>=5){return splitTitle.slice(0,-2).join('');}return null;}// Given a title with separators in it (colons, dashes, etc),
// resolve whether any of the segments should be removed.
function resolveSplitTitle(title){var url=arguments.length>1&&arguments[1]!==undefined?arguments[1]:'';// Splits while preserving splitters, like:
// ['The New New York', ' - ', 'The Washington Post']
var splitTitle=title.split(TITLE_SPLITTERS_RE);if(splitTitle.length===1){return title;}var newTitle=extractBreadcrumbTitle(splitTitle,title);if(newTitle)return newTitle;newTitle=cleanDomainFromTitle(splitTitle,url);if(newTitle)return newTitle;// Fuzzy ratio didn't find anything, so this title is probably legit.
// Just return it all.
return title;}var Cleaners={author:cleanAuthor,lead_image_url:clean$1,dek:cleanDek,date_published:cleanDatePublished,content:extractCleanNode,title:cleanTitle$$1};// Using a variety of scoring techniques, extract the content most
// likely to be article text.
//
// If strip_unlikely_candidates is True, remove any elements that
// match certain criteria first. (Like, does this element have a
// classname of "comment")
//
// If weight_nodes is True, use classNames and IDs to determine the
// worthiness of nodes.
//
// Returns a cheerio object $
function extractBestNode($,opts){// clone the node so we can get back to our
// initial parsed state if needed
// TODO Do I need this? – AP
// let $root = $.root().clone()
if(opts.stripUnlikelyCandidates){$=stripUnlikelyCandidates$1($);}$=convertToParagraphs$$1($);$=scoreContent$$1($,opts.weightNodes);var $topCandidate=findTopCandidate$$1($);return $topCandidate;}var GenericContentExtractor={defaultOpts:{stripUnlikelyCandidates:true,weightNodes:true,cleanConditionally:true},// Extract the content for this resource - initially, pass in our
// most restrictive opts which will return the highest quality
// content. On each failure, retry with slightly more lax opts.
//
// :param return_type: string. If "node", should return the content
// as a cheerio node rather than as an HTML string.
//
// Opts:
// stripUnlikelyCandidates: Remove any elements that match
// non-article-like criteria first.(Like, does this element
//   have a classname of "comment")
//
// weightNodes: Modify an elements score based on whether it has
// certain classNames or IDs. Examples: Subtract if a node has
// a className of 'comment', Add if a node has an ID of
// 'entry-content'.
//
// cleanConditionally: Clean the node to return of some
// superfluous content. Things like forms, ads, etc.
extract:function extract(_ref,opts){var $=_ref.$,html=_ref.html,title=_ref.title,url=_ref.url;opts=_extends$1({},this.defaultOpts,opts);$=$||cheerio$1.load(html);// Cascade through our extraction-specific opts in an ordered fashion,
// turning them off as we try to extract content.
var node=this.getContentNode($,title,url,opts);if(nodeIsSufficient$1(node)){return this.cleanAndReturnNode(node,$);}// We didn't succeed on first pass, one by one disable our
// extraction opts and try again.
var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=_getIterator$1(_Reflect$ownKeys$1(opts).filter(function(k){return opts[k]===true;})),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){var key=_step.value;opts[key]=false;$=cheerio$1.load(html);node=this.getContentNode($,title,url,opts);if(nodeIsSufficient$1(node)){break;}}}catch(err){_didIteratorError=true;_iteratorError=err;}finally{try{if(!_iteratorNormalCompletion&&_iterator.return){_iterator.return();}}finally{if(_didIteratorError){throw _iteratorError;}}}return this.cleanAndReturnNode(node,$);},// Get node given current options
getContentNode:function getContentNode($,title,url,opts){return extractCleanNode(extractBestNode($,opts),{$:$,cleanConditionally:opts.cleanConditionally,title:title,url:url});},// Once we got here, either we're at our last-resort node, or
// we broke early. Make sure we at least have -something- before we
// move forward.
cleanAndReturnNode:function cleanAndReturnNode(node,$){if(!node){return null;}return normalizeSpaces$1($.html(node));// if return_type == "html":
//     return normalize_spaces(node_to_html(node))
// else:
//     return node
}};// TODO: It would be great if we could merge the meta and selector lists into
// a list of objects, because we could then rank them better. For example,
// .hentry .entry-title is far better suited than <meta title>.
// An ordered list of meta tag names that denote likely article titles. All
// attributes should be lowercase for faster case-insensitive matching. From
// most distinct to least distinct.
var STRONG_TITLE_META_TAGS=['tweetmeme-title','dc.title','rbtitle','headline','title'];// og:title is weak because it typically contains context that we don't like,
// for example the source site's name. Gotta get that brand into facebook!
var WEAK_TITLE_META_TAGS=['og:title'];// An ordered list of XPath Selectors to find likely article titles. From
// most explicit to least explicit.
//
// Note - this does not use classes like CSS. This checks to see if the string
// exists in the className, which is not as accurate as .className (which
// splits on spaces/endlines), but for our purposes it's close enough. The
// speed tradeoff is worth the accuracy hit.
var STRONG_TITLE_SELECTORS=['.hentry .entry-title','h1#articleHeader','h1.articleHeader','h1.article','.instapaper_title','#meebo-title'];var WEAK_TITLE_SELECTORS=['article h1','#entry-title','.entry-title','#entryTitle','#entrytitle','.entryTitle','.entrytitle','#articleTitle','.articleTitle','post post-title','h1.title','h2.article','h1','html head title','title'];var GenericTitleExtractor={extract:function extract(_ref){var $=_ref.$,url=_ref.url,metaCache=_ref.metaCache;// First, check to see if we have a matching meta tag that we can make
// use of that is strongly associated with the headline.
var title=void 0;title=extractFromMeta$$1($,STRONG_TITLE_META_TAGS,metaCache);if(title)return cleanTitle$$1(title,{url:url,$:$});// Second, look through our content selectors for the most likely
// article title that is strongly associated with the headline.
title=extractFromSelectors$$1($,STRONG_TITLE_SELECTORS);if(title)return cleanTitle$$1(title,{url:url,$:$});// Third, check for weaker meta tags that may match.
title=extractFromMeta$$1($,WEAK_TITLE_META_TAGS,metaCache);if(title)return cleanTitle$$1(title,{url:url,$:$});// Last, look for weaker selector tags that may match.
title=extractFromSelectors$$1($,WEAK_TITLE_SELECTORS);if(title)return cleanTitle$$1(title,{url:url,$:$});// If no matches, return an empty string
return'';}};// An ordered list of meta tag names that denote likely article authors. All
// attributes should be lowercase for faster case-insensitive matching. From
// most distinct to least distinct.
//
// Note: "author" is too often the -developer- of the page, so it is not
// added here.
var AUTHOR_META_TAGS=['byl','clmst','dc.author','dcsext.author','dc.creator','rbauthors','authors'];var AUTHOR_MAX_LENGTH=300;// An ordered list of XPath Selectors to find likely article authors. From
// most explicit to least explicit.
//
// Note - this does not use classes like CSS. This checks to see if the string
// exists in the className, which is not as accurate as .className (which
// splits on spaces/endlines), but for our purposes it's close enough. The
// speed tradeoff is worth the accuracy hit.
var AUTHOR_SELECTORS=['.entry .entry-author','.author.vcard .fn','.author .vcard .fn','.byline.vcard .fn','.byline .vcard .fn','.byline .by .author','.byline .by','.byline .author','.post-author.vcard','.post-author .vcard','a[rel=author]','#by_author','.by_author','#entryAuthor','.entryAuthor','.byline a[href*=author]','#author .authorname','.author .authorname','#author','.author','.articleauthor','.ArticleAuthor','.byline'];// An ordered list of Selectors to find likely article authors, with
// regular expression for content.
var bylineRe=/^[\n\s]*By/i;var BYLINE_SELECTORS_RE=[['#byline',bylineRe],['.byline',bylineRe]];var GenericAuthorExtractor={extract:function extract(_ref){var $=_ref.$,metaCache=_ref.metaCache;var author=void 0;// First, check to see if we have a matching
// meta tag that we can make use of.
author=extractFromMeta$$1($,AUTHOR_META_TAGS,metaCache);if(author&&author.length<AUTHOR_MAX_LENGTH){return cleanAuthor(author);}// Second, look through our selectors looking for potential authors.
author=extractFromSelectors$$1($,AUTHOR_SELECTORS,2);if(author&&author.length<AUTHOR_MAX_LENGTH){return cleanAuthor(author);}// Last, use our looser regular-expression based selectors for
// potential authors.
var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=_getIterator$1(BYLINE_SELECTORS_RE),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){var _ref4=_step.value;var _ref3=_slicedToArray$1(_ref4,2);var selector=_ref3[0];var regex=_ref3[1];var node=$(selector);if(node.length===1){var text=node.text();if(regex.test(text)){return cleanAuthor(text);}}}}catch(err){_didIteratorError=true;_iteratorError=err;}finally{try{if(!_iteratorNormalCompletion&&_iterator.return){_iterator.return();}}finally{if(_didIteratorError){throw _iteratorError;}}}return null;}};// An ordered list of meta tag names that denote
// likely date published dates. All attributes
// should be lowercase for faster case-insensitive matching.
// From most distinct to least distinct.
var DATE_PUBLISHED_META_TAGS=['article:published_time','displaydate','dc.date','dc.date.issued','rbpubdate','publish_date','pub_date','pagedate','pubdate','revision_date','doc_date','date_created','content_create_date','lastmodified','created','date'];// An ordered list of XPath Selectors to find
// likely date published dates. From most explicit
// to least explicit.
var DATE_PUBLISHED_SELECTORS=['.hentry .dtstamp.published','.hentry .published','.hentry .dtstamp.updated','.hentry .updated','.single .published','.meta .published','.meta .postDate','.entry-date','.byline .date','.postmetadata .date','.article_datetime','.date-header','.story-date','.dateStamp','#story .datetime','.dateline','.pubdate'];// An ordered list of compiled regular expressions to find likely date
// published dates from the URL. These should always have the first
// reference be a date string that is parseable by dateutil.parser.parse
var abbrevMonthsStr='(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)';var DATE_PUBLISHED_URL_RES=[// /2012/01/27/ but not /2012/01/293
new RegExp('/(20\\d{2}/\\d{2}/\\d{2})/','i'),// 20120127 or 20120127T but not 2012012733 or 8201201733
// /[^0-9](20\d{2}[01]\d[0-3]\d)([^0-9]|$)/i,
// 2012-01-27
new RegExp('(20\\d{2}-[01]\\d-[0-3]\\d)','i'),// /2012/jan/27/
new RegExp('/(20\\d{2}/'+abbrevMonthsStr+'/[0-3]\\d)/','i')];var GenericDatePublishedExtractor={extract:function extract(_ref){var $=_ref.$,url=_ref.url,metaCache=_ref.metaCache;var datePublished=void 0;// First, check to see if we have a matching meta tag
// that we can make use of.
// Don't try cleaning tags from this string
datePublished=extractFromMeta$$1($,DATE_PUBLISHED_META_TAGS,metaCache,false);if(datePublished)return cleanDatePublished(datePublished);// Second, look through our selectors looking for potential
// date_published's.
datePublished=extractFromSelectors$$1($,DATE_PUBLISHED_SELECTORS);if(datePublished)return cleanDatePublished(datePublished);// Lastly, look to see if a dately string exists in the URL
datePublished=extractFromUrl$1(url,DATE_PUBLISHED_URL_RES);if(datePublished)return cleanDatePublished(datePublished);return null;}};// import {
//   DEK_META_TAGS,
//   DEK_SELECTORS,
//   DEK_URL_RES,
// } from './constants';
// import { cleanDek } from 'cleaners';
// import {
//   extractFromMeta,
//   extractFromSelectors,
// } from 'utils/dom';
// Currently there is only one selector for
// deks. We should simply return null here
// until we have a more robust generic option.
// Below is the original source for this, for reference.
var GenericDekExtractor={// extract({ $, content, metaCache }) {
extract:function extract(){return null;}};// def extract_dek(self):
//     # First, check to see if we have a matching meta tag that we can make
//     # use of.
//     dek = self.extract_from_meta('dek', constants.DEK_META_TAGS)
//     if not dek:
//         # Second, look through our CSS/XPath selectors. This may return
//         # an HTML fragment.
//         dek = self.extract_from_selectors('dek',
//                                            constants.DEK_SELECTORS,
//                                            text_only=False)
//
//     if dek:
//         # Make sure our dek isn't in the first few thousand characters
//         # of the content, otherwise it's just the start of the article
//         # and not a true dek.
//         content = self.extract_content()
//         content_chunk = normalize_spaces(strip_tags(content[:2000]))
//         dek_chunk = normalize_spaces(dek[:100]) # Already has no tags.
//
//         # 80% or greater similarity means the dek was very similar to some
//         # of the starting content, so we skip it.
//         if fuzz.partial_ratio(content_chunk, dek_chunk) < 80:
//             return dek
//
//     return None
// An ordered list of meta tag names that denote likely article leading images.
// All attributes should be lowercase for faster case-insensitive matching.
// From most distinct to least distinct.
var LEAD_IMAGE_URL_META_TAGS=['og:image','twitter:image','image_src'];var LEAD_IMAGE_URL_SELECTORS=['link[rel=image_src]'];var POSITIVE_LEAD_IMAGE_URL_HINTS=['upload','wp-content','large','photo','wp-image'];var POSITIVE_LEAD_IMAGE_URL_HINTS_RE=new RegExp(POSITIVE_LEAD_IMAGE_URL_HINTS.join('|'),'i');var NEGATIVE_LEAD_IMAGE_URL_HINTS=['spacer','sprite','blank','throbber','gradient','tile','bg','background','icon','social','header','hdr','advert','spinner','loader','loading','default','rating','share','facebook','twitter','theme','promo','ads','wp-includes'];var NEGATIVE_LEAD_IMAGE_URL_HINTS_RE=new RegExp(NEGATIVE_LEAD_IMAGE_URL_HINTS.join('|'),'i');var GIF_RE=/\.gif(\?.*)?$/i;var JPG_RE=/\.jpe?g(\?.*)?$/i;function getSig($node){return($node.attr('class')||'')+' '+($node.attr('id')||'');}// Scores image urls based on a variety of heuristics.
function scoreImageUrl(url){url=url.trim();var score=0;if(POSITIVE_LEAD_IMAGE_URL_HINTS_RE.test(url)){score+=20;}if(NEGATIVE_LEAD_IMAGE_URL_HINTS_RE.test(url)){score-=20;}// TODO: We might want to consider removing this as
// gifs are much more common/popular than they once were
if(GIF_RE.test(url)){score-=10;}if(JPG_RE.test(url)){score+=10;}// PNGs are neutral.
return score;}// Alt attribute usually means non-presentational image.
function scoreAttr($img){if($img.attr('alt')){return 5;}return 0;}// Look through our parent and grandparent for figure-like
// container elements, give a bonus if we find them
function scoreByParents($img){var score=0;var $figParent=$img.parents('figure').first();if($figParent.length===1){score+=25;}var $parent=$img.parent();var $gParent=void 0;if($parent.length===1){$gParent=$parent.parent();}[$parent,$gParent].forEach(function($node){if(PHOTO_HINTS_RE$1$1.test(getSig($node))){score+=15;}});return score;}// Look at our immediate sibling and see if it looks like it's a
// caption. Bonus if so.
function scoreBySibling($img){var score=0;var $sibling=$img.next();var sibling=$sibling.get(0);if(sibling&&sibling.tagName.toLowerCase()==='figcaption'){score+=25;}if(PHOTO_HINTS_RE$1$1.test(getSig($sibling))){score+=15;}return score;}function scoreByDimensions($img){var score=0;var width=parseFloat($img.attr('width'));var height=parseFloat($img.attr('height'));var src=$img.attr('src');// Penalty for skinny images
if(width&&width<=50){score-=50;}// Penalty for short images
if(height&&height<=50){score-=50;}if(width&&height&&!src.includes('sprite')){var area=width*height;if(area<5000){// Smaller than 50 x 100
score-=100;}else{score+=Math.round(area/1000);}}return score;}function scoreByPosition($imgs,index){return $imgs.length/2-index;}// Given a resource, try to find the lead image URL from within
// it. Like content and next page extraction, uses a scoring system
// to determine what the most likely image may be. Short circuits
// on really probable things like og:image meta tags.
//
// Potential signals to still take advantage of:
//   * domain
//   * weird aspect ratio
var GenericLeadImageUrlExtractor={extract:function extract(_ref){var $=_ref.$,content=_ref.content,metaCache=_ref.metaCache,html=_ref.html;var cleanUrl=void 0;if(!$.browser&&$('head').length===0){$('*').first().prepend(html);}// Check to see if we have a matching meta tag that we can make use of.
// Moving this higher because common practice is now to use large
// images on things like Open Graph or Twitter cards.
// images usually have for things like Open Graph.
var imageUrl=extractFromMeta$$1($,LEAD_IMAGE_URL_META_TAGS,metaCache,false);if(imageUrl){cleanUrl=clean$1(imageUrl);if(cleanUrl)return cleanUrl;}// Next, try to find the "best" image via the content.
// We'd rather not have to fetch each image and check dimensions,
// so try to do some analysis and determine them instead.
var $content=$(content);var imgs=$('img',$content).toArray();var imgScores={};imgs.forEach(function(img,index){var $img=$(img);var src=$img.attr('src');if(!src)return;var score=scoreImageUrl(src);score+=scoreAttr($img);score+=scoreByParents($img);score+=scoreBySibling($img);score+=scoreByDimensions($img);score+=scoreByPosition(imgs,index);imgScores[src]=score;});var _Reflect$ownKeys$redu=_Reflect$ownKeys$1(imgScores).reduce(function(acc,key){return imgScores[key]>acc[1]?[key,imgScores[key]]:acc;},[null,0]),_Reflect$ownKeys$redu2=_slicedToArray$1(_Reflect$ownKeys$redu,2),topUrl=_Reflect$ownKeys$redu2[0],topScore=_Reflect$ownKeys$redu2[1];if(topScore>0){cleanUrl=clean$1(topUrl);if(cleanUrl)return cleanUrl;}// If nothing else worked, check to see if there are any really
// probable nodes in the doc, like <link rel="image_src" />.
var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=_getIterator$1(LEAD_IMAGE_URL_SELECTORS),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){var selector=_step.value;var $node=$(selector).first();var src=$node.attr('src');if(src){cleanUrl=clean$1(src);if(cleanUrl)return cleanUrl;}var href=$node.attr('href');if(href){cleanUrl=clean$1(href);if(cleanUrl)return cleanUrl;}var value=$node.attr('value');if(value){cleanUrl=clean$1(value);if(cleanUrl)return cleanUrl;}}}catch(err){_didIteratorError=true;_iteratorError=err;}finally{try{if(!_iteratorNormalCompletion&&_iterator.return){_iterator.return();}}finally{if(_didIteratorError){throw _iteratorError;}}}return null;}};// def extract(self):
//     """
//     # First, try to find the "best" image via the content.
//     # We'd rather not have to fetch each image and check dimensions,
//     # so try to do some analysis and determine them instead.
//     content = self.extractor.extract_content(return_type="node")
//     imgs = content.xpath('.//img')
//     img_scores = defaultdict(int)
//     logger.debug('Scoring %d images from content', len(imgs))
//     for (i, img) in enumerate(imgs):
//         img_score = 0
//
//         if not 'src' in img.attrib:
//             logger.debug('No src attribute found')
//             continue
//
//         try:
//             parsed_img = urlparse(img.attrib['src'])
//             img_path = parsed_img.path.lower()
//         except ValueError:
//             logger.debug('ValueError getting img path.')
//             continue
//         logger.debug('Image path is %s', img_path)
//
//         if constants.POSITIVE_LEAD_IMAGE_URL_HINTS_RE.match(img_path):
//             logger.debug('Positive URL hints match. Adding 20.')
//             img_score += 20
//
//         if constants.NEGATIVE_LEAD_IMAGE_URL_HINTS_RE.match(img_path):
//             logger.debug('Negative URL hints match. Subtracting 20.')
//             img_score -= 20
//
//         # Gifs are more often structure than photos
//         if img_path.endswith('gif'):
//             logger.debug('gif found. Subtracting 10.')
//             img_score -= 10
//
//         # JPGs are more often photographs
//         if img_path.endswith('jpg'):
//             logger.debug('jpg found. Adding 10.')
//             img_score += 10
//
//         # PNGs are neutral.
//
//         # Alt attribute usually means non-presentational image.
//         if 'alt' in img.attrib and len(img.attrib['alt']) > 5:
//             logger.debug('alt attribute found. Adding 5.')
//             img_score += 5
//
//         # Look through our parent and grandparent for figure-like
//         # container elements, give a bonus if we find them
//         parents = [img.getparent()]
//         if parents[0] is not None and parents[0].getparent() is not None:
//             parents.append(parents[0].getparent())
//         for p in parents:
//             if p.tag == 'figure':
//                 logger.debug('Parent with <figure> tag found. Adding 25.')
//                 img_score += 25
//
//             p_sig = ' '.join([p.get('id', ''), p.get('class', '')])
//             if constants.PHOTO_HINTS_RE.search(p_sig):
//                 logger.debug('Photo hints regex match. Adding 15.')
//                 img_score += 15
//
//         # Look at our immediate sibling and see if it looks like it's a
//         # caption. Bonus if so.
//         sibling = img.getnext()
//         if sibling is not None:
//             if sibling.tag == 'figcaption':
//                 img_score += 25
//
//             sib_sig = ' '.join([sibling.get('id', ''),
//                                 sibling.get('class', '')]).lower()
//             if 'caption' in sib_sig:
//                 img_score += 15
//
//         # Pull out width/height if they were set.
//         img_width = None
//         img_height = None
//         if 'width' in img.attrib:
//             try:
//                 img_width = float(img.get('width'))
//             except ValueError:
//                 pass
//         if 'height' in img.attrib:
//             try:
//                 img_height = float(img.get('height'))
//             except ValueError:
//                 pass
//
//         # Penalty for skinny images
//         if img_width and img_width <= 50:
//             logger.debug('Skinny image found. Subtracting 50.')
//             img_score -= 50
//
//         # Penalty for short images
//         if img_height and img_height <= 50:
//             # Wide, short images are more common than narrow, tall ones
//             logger.debug('Short image found. Subtracting 25.')
//             img_score -= 25
//
//         if img_width and img_height and not 'sprite' in img_path:
//             area = img_width * img_height
//
//             if area < 5000: # Smaller than 50x100
//                 logger.debug('Image with small area found. Subtracting 100.')
//                 img_score -= 100
//             else:
//                 img_score += round(area/1000.0)
//
//         # If the image is higher on the page than other images,
//         # it gets a bonus. Penalty if lower.
//         logger.debug('Adding page placement bonus of %d.', len(imgs)/2 - i)
//         img_score += len(imgs)/2 - i
//
//         # Use the raw src here because we munged img_path for case
//         # insensitivity
//         logger.debug('Final score is %d.', img_score)
//         img_scores[img.attrib['src']] += img_score
//
//     top_score = 0
//     top_url = None
//     for (url, score) in img_scores.items():
//         if score > top_score:
//             top_url = url
//             top_score = score
//
//     if top_score > 0:
//         logger.debug('Using top score image from content. Score was %d', top_score)
//         return top_url
//
//
//     # If nothing else worked, check to see if there are any really
//     # probable nodes in the doc, like <link rel="image_src" />.
//     logger.debug('Trying to find lead image in probable nodes')
//     for selector in constants.LEAD_IMAGE_URL_SELECTORS:
//         nodes = self.resource.extract_by_selector(selector)
//         for node in nodes:
//             clean_value = None
//             if node.attrib.get('src'):
//                 clean_value = self.clean(node.attrib['src'])
//
//             if not clean_value and node.attrib.get('href'):
//                 clean_value = self.clean(node.attrib['href'])
//
//             if not clean_value and node.attrib.get('value'):
//                 clean_value = self.clean(node.attrib['value'])
//
//             if clean_value:
//                 logger.debug('Found lead image in probable nodes.')
//                 logger.debug('Node was: %s', node)
//                 return clean_value
//
//     return None
function scoreSimilarity(score,articleUrl,href){// Do this last and only if we have a real candidate, because it's
// potentially expensive computationally. Compare the link to this
// URL using difflib to get the % similarity of these URLs. On a
// sliding scale, subtract points from this link based on
// similarity.
if(score>0){var similarity=new difflib$1.SequenceMatcher(null,articleUrl,href).ratio();// Subtract .1 from diff_percent when calculating modifier,
// which means that if it's less than 10% different, we give a
// bonus instead. Ex:
//  3% different = +17.5 points
// 10% different = 0 points
// 20% different = -25 points
var diffPercent=1.0-similarity;var diffModifier=-(250*(diffPercent-0.2));return score+diffModifier;}return 0;}function scoreLinkText(linkText,pageNum){// If the link text can be parsed as a number, give it a minor
// bonus, with a slight bias towards lower numbered pages. This is
// so that pages that might not have 'next' in their text can still
// get scored, and sorted properly by score.
var score=0;if(IS_DIGIT_RE$1.test(linkText.trim())){var linkTextAsNum=parseInt(linkText,10);// If it's the first page, we already got it on the first call.
// Give it a negative score. Otherwise, up to page 10, give a
// small bonus.
if(linkTextAsNum<2){score=-30;}else{score=Math.max(0,10-linkTextAsNum);}// If it appears that the current page number is greater than
// this links page number, it's a very bad sign. Give it a big
// penalty.
if(pageNum&&pageNum>=linkTextAsNum){score-=50;}}return score;}function scorePageInLink(pageNum,isWp){// page in the link = bonus. Intentionally ignore wordpress because
// their ?p=123 link style gets caught by this even though it means
// separate documents entirely.
if(pageNum&&!isWp){return 50;}return 0;}var DIGIT_RE$2=/\d/;// A list of words that, if found in link text or URLs, likely mean that
// this link is not a next page link.
var EXTRANEOUS_LINK_HINTS$1=['print','archive','comment','discuss','e-mail','email','share','reply','all','login','sign','single','adx','entry-unrelated'];var EXTRANEOUS_LINK_HINTS_RE$1=new RegExp(EXTRANEOUS_LINK_HINTS$1.join('|'),'i');// Match any link text/classname/id that looks like it could mean the next
// page. Things like: next, continue, >, >>, » but not >|, »| as those can
// mean last page.
var NEXT_LINK_TEXT_RE$1=new RegExp('(next|weiter|continue|>([^|]|$)|»([^|]|$))','i');// Match any link text/classname/id that looks like it is an end link: things
// like "first", "last", "end", etc.
var CAP_LINK_TEXT_RE$1=new RegExp('(first|last|end)','i');// Match any link text/classname/id that looks like it means the previous
// page.
var PREV_LINK_TEXT_RE$1=new RegExp('(prev|earl|old|new|<|«)','i');// Match any phrase that looks like it could be page, or paging, or pagination
function scoreExtraneousLinks(href){// If the URL itself contains extraneous values, give a penalty.
if(EXTRANEOUS_LINK_HINTS_RE$1.test(href)){return-25;}return 0;}function makeSig$1($link){return($link.attr('class')||'')+' '+($link.attr('id')||'');}function scoreByParents$1($link){// If a parent node contains paging-like classname or id, give a
// bonus. Additionally, if a parent_node contains bad content
// (like 'sponsor'), give a penalty.
var $parent=$link.parent();var positiveMatch=false;var negativeMatch=false;var score=0;_Array$from(range(0,4)).forEach(function(){if($parent.length===0){return;}var parentData=makeSig$1($parent,' ');// If we have 'page' or 'paging' in our data, that's a good
// sign. Add a bonus.
if(!positiveMatch&&PAGE_RE$1.test(parentData)){positiveMatch=true;score+=25;}// If we have 'comment' or something in our data, and
// we don't have something like 'content' as well, that's
// a bad sign. Give a penalty.
if(!negativeMatch&&NEGATIVE_SCORE_RE$2.test(parentData)&&EXTRANEOUS_LINK_HINTS_RE$1.test(parentData)){if(!POSITIVE_SCORE_RE$2.test(parentData)){negativeMatch=true;score-=25;}}$parent=$parent.parent();});return score;}function scorePrevLink(linkData){// If the link has something like "previous", its definitely
// an old link, skip it.
if(PREV_LINK_TEXT_RE$1.test(linkData)){return-200;}return 0;}function shouldScore(href,articleUrl,baseUrl,parsedUrl,linkText,previousUrls){// skip if we've already fetched this url
if(previousUrls.find(function(url){return href===url;})!==undefined){return false;}// If we've already parsed this URL, or the URL matches the base
// URL, or is empty, skip it.
if(!href||href===articleUrl||href===baseUrl){return false;}var hostname=parsedUrl.hostname;var _URL$parse=URL$1.parse(href),linkHost=_URL$parse.hostname;// Domain mismatch.
if(linkHost!==hostname){return false;}// If href doesn't contain a digit after removing the base URL,
// it's certainly not the next page.
var fragment=href.replace(baseUrl,'');if(!DIGIT_RE$2.test(fragment)){return false;}// This link has extraneous content (like "comment") in its link
// text, so we skip it.
if(EXTRANEOUS_LINK_HINTS_RE$1.test(linkText)){return false;}// Next page link text is never long, skip if it is too long.
if(linkText.length>25){return false;}return true;}function scoreBaseUrl(href,baseRegex){// If the baseUrl isn't part of this URL, penalize this
// link. It could still be the link, but the odds are lower.
// Example:
// http://www.actionscript.org/resources/articles/745/1/JavaScript-and-VBScript-Injection-in-ActionScript-3/Page1.html
if(!baseRegex.test(href)){return-25;}return 0;}function scoreNextLinkText(linkData){// Things like "next", ">>", etc.
if(NEXT_LINK_TEXT_RE$1.test(linkData)){return 50;}return 0;}function scoreCapLinks(linkData){// Cap links are links like "last", etc.
if(CAP_LINK_TEXT_RE$1.test(linkData)){// If we found a link like "last", but we've already seen that
// this link is also "next", it's fine. If it's not been
// previously marked as "next", then it's probably bad.
// Penalize.
if(NEXT_LINK_TEXT_RE$1.test(linkData)){return-65;}}return 0;}function makeBaseRegex(baseUrl){return new RegExp('^'+baseUrl,'i');}function makeSig($link,linkText){return(linkText||$link.text())+' '+($link.attr('class')||'')+' '+($link.attr('id')||'');}function scoreLinks(_ref){var links=_ref.links,articleUrl=_ref.articleUrl,baseUrl=_ref.baseUrl,parsedUrl=_ref.parsedUrl,$=_ref.$,_ref$previousUrls=_ref.previousUrls,previousUrls=_ref$previousUrls===undefined?[]:_ref$previousUrls;parsedUrl=parsedUrl||URL$1.parse(articleUrl);var baseRegex=makeBaseRegex(baseUrl);var isWp=isWordpress$1($);// Loop through all links, looking for hints that they may be next-page
// links. Things like having "page" in their textContent, className or
// id, or being a child of a node with a page-y className or id.
//
// After we do that, assign each page a score, and pick the one that
// looks most like the next page link, as long as its score is strong
// enough to have decent confidence.
var scoredPages=links.reduce(function(possiblePages,link){// Remove any anchor data since we don't do a good job
// standardizing URLs (it's hard), we're going to do
// some checking with and without a trailing slash
var attrs=getAttrs$1(link);// if href is undefined, return
if(!attrs.href)return possiblePages;var href=removeAnchor$1(attrs.href);var $link=$(link);var linkText=$link.text();if(!shouldScore(href,articleUrl,baseUrl,parsedUrl,linkText,previousUrls)){return possiblePages;}// ## PASSED THE FIRST-PASS TESTS. Start scoring. ##
if(!possiblePages[href]){possiblePages[href]={score:0,linkText:linkText,href:href};}else{possiblePages[href].linkText=possiblePages[href].linkText+'|'+linkText;}var possiblePage=possiblePages[href];var linkData=makeSig($link,linkText);var pageNum=pageNumFromUrl$1(href);var score=scoreBaseUrl(href,baseRegex);score+=scoreNextLinkText(linkData);score+=scoreCapLinks(linkData);score+=scorePrevLink(linkData);score+=scoreByParents$1($link);score+=scoreExtraneousLinks(href);score+=scorePageInLink(pageNum,isWp);score+=scoreLinkText(linkText,pageNum);score+=scoreSimilarity(score,articleUrl,href);possiblePage.score=score;return possiblePages;},{});return _Reflect$ownKeys$1(scoredPages).length===0?null:scoredPages;}// Looks for and returns next page url
// for multi-page articles
var GenericNextPageUrlExtractor={extract:function extract(_ref){var $=_ref.$,url=_ref.url,parsedUrl=_ref.parsedUrl,_ref$previousUrls=_ref.previousUrls,previousUrls=_ref$previousUrls===undefined?[]:_ref$previousUrls;parsedUrl=parsedUrl||URL$1.parse(url);var articleUrl=removeAnchor$1(url);var baseUrl=articleBaseUrl$1(url,parsedUrl);var links=$('a[href]').toArray();var scoredLinks=scoreLinks({links:links,articleUrl:articleUrl,baseUrl:baseUrl,parsedUrl:parsedUrl,$:$,previousUrls:previousUrls});// If no links were scored, return null
if(!scoredLinks)return null;// now that we've scored all possible pages,
// find the biggest one.
var topPage=_Reflect$ownKeys$1(scoredLinks).reduce(function(acc,link){var scoredLink=scoredLinks[link];return scoredLink.score>acc.score?scoredLink:acc;},{score:-100});// If the score is less than 50, we're not confident enough to use it,
// so we fail.
if(topPage.score>=50){return topPage.href;}return null;}};var CANONICAL_META_SELECTORS=['og:url'];function parseDomain(url){var parsedUrl=URL$1.parse(url);var hostname=parsedUrl.hostname;return hostname;}function result(url){return{url:url,domain:parseDomain(url)};}var GenericUrlExtractor={extract:function extract(_ref){var $=_ref.$,url=_ref.url,metaCache=_ref.metaCache;var $canonical=$('link[rel=canonical]');if($canonical.length!==0){var href=$canonical.attr('href');if(href){return result(href);}}var metaUrl=extractFromMeta$$1($,CANONICAL_META_SELECTORS,metaCache);if(metaUrl){return result(metaUrl);}return result(url);}};var EXCERPT_META_SELECTORS=['og:description','twitter:description'];function clean$2(content,$){var maxLength=arguments.length>2&&arguments[2]!==undefined?arguments[2]:200;content=content.replace(/[\s\n]+/g,' ').trim();return ellipsize$1(content,maxLength,{ellipse:'&hellip;'});}var GenericExcerptExtractor={extract:function extract(_ref){var $=_ref.$,content=_ref.content,metaCache=_ref.metaCache;var excerpt=extractFromMeta$$1($,EXCERPT_META_SELECTORS,metaCache);if(excerpt){return clean$2(stripTags$1(excerpt,$));}// Fall back to excerpting from the extracted content
var maxLength=200;var shortContent=content.slice(0,maxLength*5);return clean$2($(shortContent).text(),$,maxLength);}};var GenericWordCountExtractor={extract:function extract(_ref){var content=_ref.content;var $=cheerio$1.load(content);var $content=$('div').first();var text=normalizeSpaces$1($content.text());return text.split(/\s/).length;}};var GenericExtractor={// This extractor is the default for all domains
domain:'*',title:GenericTitleExtractor.extract,date_published:GenericDatePublishedExtractor.extract,author:GenericAuthorExtractor.extract,content:GenericContentExtractor.extract.bind(GenericContentExtractor),lead_image_url:GenericLeadImageUrlExtractor.extract,dek:GenericDekExtractor.extract,next_page_url:GenericNextPageUrlExtractor.extract,url_and_domain:GenericUrlExtractor.extract,excerpt:GenericExcerptExtractor.extract,word_count:GenericWordCountExtractor.extract,direction:function direction(_ref){var title=_ref.title;return stringDirection$1.getDirection(title);},extract:function extract(options){var html=options.html,$=options.$;if(html&&!$){var loaded=cheerio$1.load(html);options.$=loaded;}var title=this.title(options);var date_published=this.date_published(options);var author=this.author(options);var content=this.content(_extends$1({},options,{title:title}));var lead_image_url=this.lead_image_url(_extends$1({},options,{content:content}));var dek=this.dek(_extends$1({},options,{content:content}));var next_page_url=this.next_page_url(options);var excerpt=this.excerpt(_extends$1({},options,{content:content}));var word_count=this.word_count(_extends$1({},options,{content:content}));var direction=this.direction({title:title});var _url_and_domain=this.url_and_domain(options),url=_url_and_domain.url,domain=_url_and_domain.domain;return{title:title,author:author,date_published:date_published||null,dek:dek,lead_image_url:lead_image_url,content:content,next_page_url:next_page_url,url:url,domain:domain,excerpt:excerpt,word_count:word_count,direction:direction};}};var Detectors={'meta[name="al:ios:app_name"][value="Medium"]':MediumExtractor,'meta[name="generator"][value="blogger"]':BloggerExtractor};function detectByHtml($){var selector=_Reflect$ownKeys$1(Detectors).find(function(s){return $(s).length>0;});return Detectors[selector];}function getExtractor(url,parsedUrl,$){parsedUrl=parsedUrl||URL$1.parse(url);var _parsedUrl=parsedUrl,hostname=_parsedUrl.hostname;var baseDomain=hostname.split('.').slice(-2).join('.');return Extractors[hostname]||Extractors[baseDomain]||detectByHtml($)||GenericExtractor;}// Remove elements by an array of selectors
function cleanBySelectors($content,$,_ref){var clean=_ref.clean;if(!clean)return $content;$(clean.join(','),$content).remove();return $content;}// Transform matching elements
function transformElements($content,$,_ref2){var transforms=_ref2.transforms;if(!transforms)return $content;_Reflect$ownKeys$1(transforms).forEach(function(key){var $matches=$(key,$content);var value=transforms[key];// If value is a string, convert directly
if(typeof value==='string'){$matches.each(function(index,node){convertNodeTo$$1($(node),$,transforms[key]);});}else if(typeof value==='function'){// If value is function, apply function to node
$matches.each(function(index,node){var result=value($(node),$);// If function returns a string, convert node to that value
if(typeof result==='string'){convertNodeTo$$1($(node),$,result);}});}});return $content;}function findMatchingSelector($,selectors,extractHtml){return selectors.find(function(selector){if(Array.isArray(selector)){if(extractHtml){return selector.reduce(function(acc,s){return acc&&$(s).length>0;},true);}var _selector=_slicedToArray$1(selector,2),s=_selector[0],attr=_selector[1];return $(s).length===1&&$(s).attr(attr)&&$(s).attr(attr).trim()!=='';}return $(selector).length===1&&$(selector).text().trim()!=='';});}function select(opts){var $=opts.$,type=opts.type,extractionOpts=opts.extractionOpts,_opts$extractHtml=opts.extractHtml,extractHtml=_opts$extractHtml===undefined?false:_opts$extractHtml;// Skip if there's not extraction for this type
if(!extractionOpts)return null;// If a string is hardcoded for a type (e.g., Wikipedia
// contributors), return the string
if(typeof extractionOpts==='string')return extractionOpts;var selectors=extractionOpts.selectors,_extractionOpts$defau=extractionOpts.defaultCleaner,defaultCleaner=_extractionOpts$defau===undefined?true:_extractionOpts$defau;var matchingSelector=findMatchingSelector($,selectors,extractHtml);if(!matchingSelector)return null;// Declaring result; will contain either
// text or html, which will be cleaned
// by the appropriate cleaner type
// If the selector type requests html as its return type
// transform and clean the element with provided selectors
var $content=void 0;if(extractHtml){// If matching selector is an array, we're considering this a
// multi-match selection, which allows the parser to choose several
// selectors to include in the result. Note that all selectors in the
// array must match in order for this selector to trigger
if(Array.isArray(matchingSelector)){(function(){$content=$(matchingSelector.join(','));var $wrapper=$('<div></div>');$content.each(function(index,element){$wrapper.append(element);});$content=$wrapper;})();}else{$content=$(matchingSelector);}// Wrap in div so transformation can take place on root element
$content.wrap($('<div></div>'));$content=$content.parent();$content=transformElements($content,$,extractionOpts);$content=cleanBySelectors($content,$,extractionOpts);$content=Cleaners[type]($content,_extends$1({},opts,{defaultCleaner:defaultCleaner}));return $.html($content);}var result=void 0;// if selector is an array (e.g., ['img', 'src']),
// extract the attr
if(Array.isArray(matchingSelector)){var _matchingSelector=_slicedToArray$1(matchingSelector,2),selector=_matchingSelector[0],attr=_matchingSelector[1];result=$(selector).attr(attr).trim();}else{var $node=$(matchingSelector);$node=cleanBySelectors($node,$,extractionOpts);$node=transformElements($node,$,extractionOpts);result=$node.text().trim();}// Allow custom extractor to skip default cleaner
// for this type; defaults to true
if(defaultCleaner){return Cleaners[type](result,_extends$1({},opts,extractionOpts));}return result;}function extractResult(opts){var type=opts.type,extractor=opts.extractor,_opts$fallback=opts.fallback,fallback=_opts$fallback===undefined?true:_opts$fallback;var result=select(_extends$1({},opts,{extractionOpts:extractor[type]}));// If custom parser succeeds, return the result
if(result){return result;}// If nothing matches the selector, and fallback is enabled,
// run the Generic extraction
if(fallback)return GenericExtractor[type](opts);return null;}var RootExtractor={extract:function extract(){var extractor=arguments.length>0&&arguments[0]!==undefined?arguments[0]:GenericExtractor;var opts=arguments[1];var _opts=opts,contentOnly=_opts.contentOnly,extractedTitle=_opts.extractedTitle;// This is the generic extractor. Run its extract method
if(extractor.domain==='*')return extractor.extract(opts);opts=_extends$1({},opts,{extractor:extractor});if(contentOnly){var _content=extractResult(_extends$1({},opts,{type:'content',extractHtml:true,title:extractedTitle}));return{content:_content};}var title=extractResult(_extends$1({},opts,{type:'title'}));var date_published=extractResult(_extends$1({},opts,{type:'date_published'}));var author=extractResult(_extends$1({},opts,{type:'author'}));var next_page_url=extractResult(_extends$1({},opts,{type:'next_page_url'}));var content=extractResult(_extends$1({},opts,{type:'content',extractHtml:true,title:title}));var lead_image_url=extractResult(_extends$1({},opts,{type:'lead_image_url',content:content}));var excerpt=extractResult(_extends$1({},opts,{type:'excerpt',content:content}));var dek=extractResult(_extends$1({},opts,{type:'dek',content:content,excerpt:excerpt}));var word_count=extractResult(_extends$1({},opts,{type:'word_count',content:content}));var direction=extractResult(_extends$1({},opts,{type:'direction',title:title}));var _ref3=extractResult(_extends$1({},opts,{type:'url_and_domain'}))||{url:null,domain:null},url=_ref3.url,domain=_ref3.domain;return{title:title,content:content,author:author,date_published:date_published,lead_image_url:lead_image_url,dek:dek,next_page_url:next_page_url,url:url,domain:domain,excerpt:excerpt,word_count:word_count,direction:direction};}};var collectAllPages=function(){var _ref=_asyncToGenerator(_regeneratorRuntime.mark(function _callee(_ref2){var next_page_url=_ref2.next_page_url,html=_ref2.html,$=_ref2.$,metaCache=_ref2.metaCache,result=_ref2.result,Extractor=_ref2.Extractor,title=_ref2.title,url=_ref2.url;var pages,previousUrls,extractorOpts,nextPageResult,word_count;return _regeneratorRuntime.wrap(function _callee$(_context){while(1){switch(_context.prev=_context.next){case 0:// At this point, we've fetched just the first page
pages=1;previousUrls=[removeAnchor$1(url)];// If we've gone over 26 pages, something has
// likely gone wrong.
case 2:if(!(next_page_url&&pages<26)){_context.next=15;break;}pages+=1;_context.next=6;return Resource.create(next_page_url);case 6:$=_context.sent;html=$.html();extractorOpts={url:next_page_url,html:html,$:$,metaCache:metaCache,contentOnly:true,extractedTitle:title,previousUrls:previousUrls};nextPageResult=RootExtractor.extract(Extractor,extractorOpts);previousUrls.push(next_page_url);result=_extends$1({},result,{content:result.content+'<hr><h4>Page '+pages+'</h4>'+nextPageResult.content});next_page_url=nextPageResult.next_page_url;_context.next=2;break;case 15:word_count=GenericExtractor.word_count({content:'<div>'+result.content+'</div>'});return _context.abrupt('return',_extends$1({},result,{total_pages:pages,pages_rendered:pages,word_count:word_count}));case 17:case'end':return _context.stop();}}},_callee,this);}));function collectAllPages(_x){return _ref.apply(this,arguments);}return collectAllPages;}();var Mercury={parse:function parse(url,html){var _this=this;var opts=arguments.length>2&&arguments[2]!==undefined?arguments[2]:{};return _asyncToGenerator(_regeneratorRuntime.mark(function _callee(){var _opts$fetchAllPages,fetchAllPages,_opts$fallback,fallback,parsedUrl,$,Extractor,metaCache,result,_result,title,next_page_url;return _regeneratorRuntime.wrap(function _callee$(_context){while(1){switch(_context.prev=_context.next){case 0:_opts$fetchAllPages=opts.fetchAllPages,fetchAllPages=_opts$fetchAllPages===undefined?true:_opts$fetchAllPages,_opts$fallback=opts.fallback,fallback=_opts$fallback===undefined?true:_opts$fallback;// if no url was passed and this is the browser version,
// set url to window.location.href and load the html
// from the current page
if(!url&&cheerio$1.browser){url=window.location.href;// eslint-disable-line no-undef
html=html||cheerio$1.html();}parsedUrl=URL$1.parse(url);if(validateUrl(parsedUrl)){_context.next=5;break;}return _context.abrupt('return',Errors.badUrl);case 5:_context.next=7;return Resource.create(url,html,parsedUrl);case 7:$=_context.sent;Extractor=getExtractor(url,parsedUrl,$);// console.log(`Using extractor for ${Extractor.domain}`);
// If we found an error creating the resource, return that error
if(!$.failed){_context.next=11;break;}return _context.abrupt('return',$);case 11:// if html still has not been set (i.e., url passed to Mercury.parse),
// set html from the response of Resource.create
if(!html){html=$.html();}// Cached value of every meta name in our document.
// Used when extracting title/author/date_published/dek
metaCache=$('meta').map(function(_,node){return $(node).attr('name');}).toArray();result=RootExtractor.extract(Extractor,{url:url,html:html,$:$,metaCache:metaCache,parsedUrl:parsedUrl,fallback:fallback});_result=result,title=_result.title,next_page_url=_result.next_page_url;// Fetch more pages if next_page_url found
if(!(fetchAllPages&&next_page_url)){_context.next=21;break;}_context.next=18;return collectAllPages({Extractor:Extractor,next_page_url:next_page_url,html:html,$:$,metaCache:metaCache,result:result,title:title,url:url});case 18:result=_context.sent;_context.next=22;break;case 21:result=_extends$1({},result,{total_pages:1,rendered_pages:1});case 22:return _context.abrupt('return',result);case 23:case'end':return _context.stop();}}},_callee,_this);}))();},browser:!!cheerio$1.browser,// A convenience method for getting a resource
// to work with, e.g., for custom extractor generator
fetchResource:function fetchResource(url){var _this2=this;return _asyncToGenerator(_regeneratorRuntime.mark(function _callee2(){return _regeneratorRuntime.wrap(function _callee2$(_context2){while(1){switch(_context2.prev=_context2.next){case 0:_context2.next=2;return Resource.create(url);case 2:return _context2.abrupt('return',_context2.sent);case 3:case'end':return _context2.stop();}}},_callee2,_this2);}))();}};var mercury=Mercury;

function insertValues(strings) {
  for (var _len = arguments.length, values = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    values[_key - 1] = arguments[_key];
  }

  if (values.length) {
    return strings.reduce(function (result, part, idx) {
      var value = values[idx];

      if (value && typeof value.toString === 'function') {
        value = value.toString();
      } else {
        value = '';
      }

      return result + part + value;
    }, '');
  }

  return strings.join('');
}

var bodyPattern = /^\n([\s\S]+)\s{2}$/gm;
var trailingWhitespace = /\s+$/;

function template(strings) {
  for (var _len = arguments.length, values = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    values[_key - 1] = arguments[_key];
  }

  var compiled = insertValues.apply(undefined, [strings].concat(values));

  var _ref = compiled.match(bodyPattern) || [],
      _ref2 = _slicedToArray(_ref, 1),
      body = _ref2[0];

  var indentLevel = /^\s{0,4}(.+)$/g;

  if (!body) {
    body = compiled;
    indentLevel = /^\s{0,2}(.+)$/g;
  }

  return body.split('\n').slice(1).map(function (line) {
    line = line.replace(indentLevel, '$1');

    if (trailingWhitespace.test(line)) {
      line = line.replace(trailingWhitespace, '');
    }

    return line;
  }).join('\n');
}

var _templateObject = _taggedTemplateLiteral(['\n    export const ', ' = {\n      domain: \'', '\',\n\n      title: {\n        selectors: [\n          // enter title selectors\n        ],\n      },\n\n      author: {\n        selectors: [\n          // enter author selectors\n        ],\n      },\n\n      date_published: {\n        selectors: [\n          // enter selectors\n        ],\n      },\n\n      dek: {\n        selectors: [\n          // enter selectors\n        ],\n      },\n\n      lead_image_url: {\n        selectors: [\n          // enter selectors\n        ],\n      },\n\n      content: {\n        selectors: [\n          // enter content selectors\n        ],\n\n        // Is there anything in the content you selected that needs transformed\n        // before it\'s consumable content? E.g., unusual lazy loaded images\n        transforms: {\n        },\n\n        // Is there anything that is in the result that shouldn\'t be?\n        // The clean selectors will remove anything that matches from\n        // the result\n        clean: [\n\n        ]\n      },\n    }\n  '], ['\n    export const ', ' = {\n      domain: \'', '\',\n\n      title: {\n        selectors: [\n          // enter title selectors\n        ],\n      },\n\n      author: {\n        selectors: [\n          // enter author selectors\n        ],\n      },\n\n      date_published: {\n        selectors: [\n          // enter selectors\n        ],\n      },\n\n      dek: {\n        selectors: [\n          // enter selectors\n        ],\n      },\n\n      lead_image_url: {\n        selectors: [\n          // enter selectors\n        ],\n      },\n\n      content: {\n        selectors: [\n          // enter content selectors\n        ],\n\n        // Is there anything in the content you selected that needs transformed\n        // before it\'s consumable content? E.g., unusual lazy loaded images\n        transforms: {\n        },\n\n        // Is there anything that is in the result that shouldn\'t be?\n        // The clean selectors will remove anything that matches from\n        // the result\n        clean: [\n\n        ]\n      },\n    }\n  ']);

var extractorTemplate = function (hostname, name) {
  return template(_templateObject, name, hostname);
};

var _templateObject$1 = _taggedTemplateLiteral(['\n  it(\'returns the ', '\', async () => {\n            // To pass this test, fill out the ', ' selector\n            // in ', '/index.js.\n            const { ', ' } = await result\n\n            // Update these values with the expected values from\n            // the article.\n            assert.equal(', ', ', ')\n          });\n    '], ['\n  it(\'returns the ', '\', async () => {\n            // To pass this test, fill out the ', ' selector\n            // in ', '/index.js.\n            const { ', ' } = await result\n\n            // Update these values with the expected values from\n            // the article.\n            assert.equal(', ', ', ')\n          });\n    ']);
var _templateObject2 = _taggedTemplateLiteral(['\n    import assert from \'assert\';\n    import fs from \'fs\';\n    import URL from \'url\';\n    import cheerio from \'cheerio\';\n\n    import Mercury from \'mercury\';\n    import getExtractor from \'extractors/get-extractor\';\n    import { excerptContent } from \'utils/text\';\n\n    describe(\'', '\', () => {\n      describe(\'initial test case\', () => {\n        let result;\n        let url;\n        beforeAll(() => {\n          url =\n            \'', '\';\n          const html =\n            fs.readFileSync(\'', '\');\n          result =\n            Mercury.parse(url, html, { fallback: false });\n        });\n\n        it(\'is selected properly\', () => {\n          // This test should be passing by default.\n          // It sanity checks that the correct parser\n          // is being selected for URLs from this domain\n          const extractor = getExtractor(url);\n          assert.equal(extractor.domain, URL.parse(url).hostname)\n        })\n\n          ', '\n\n        it(\'returns the content\', async () => {\n          // To pass this test, fill out the content selector\n          // in ', '/index.js.\n          // You may also want to make use of the clean and transform\n          // options.\n          const { content } = await result;\n\n          const $ = cheerio.load(content || \'\');\n\n          const first13 = excerptContent($(\'*\').first().text(), 13)\n\n          // Update these values with the expected values from\n          // the article.\n          assert.equal(first13, \'Add the first 13 words of the article here\');\n        });\n      });\n    });\n  '], ['\n    import assert from \'assert\';\n    import fs from \'fs\';\n    import URL from \'url\';\n    import cheerio from \'cheerio\';\n\n    import Mercury from \'mercury\';\n    import getExtractor from \'extractors/get-extractor\';\n    import { excerptContent } from \'utils/text\';\n\n    describe(\'', '\', () => {\n      describe(\'initial test case\', () => {\n        let result;\n        let url;\n        beforeAll(() => {\n          url =\n            \'', '\';\n          const html =\n            fs.readFileSync(\'', '\');\n          result =\n            Mercury.parse(url, html, { fallback: false });\n        });\n\n        it(\'is selected properly\', () => {\n          // This test should be passing by default.\n          // It sanity checks that the correct parser\n          // is being selected for URLs from this domain\n          const extractor = getExtractor(url);\n          assert.equal(extractor.domain, URL.parse(url).hostname)\n        })\n\n          ', '\n\n        it(\'returns the content\', async () => {\n          // To pass this test, fill out the content selector\n          // in ', '/index.js.\n          // You may also want to make use of the clean and transform\n          // options.\n          const { content } = await result;\n\n          const $ = cheerio.load(content || \'\');\n\n          const first13 = excerptContent($(\'*\').first().text(), 13)\n\n          // Update these values with the expected values from\n          // the article.\n          assert.equal(first13, \'Add the first 13 words of the article here\');\n        });\n      });\n    });\n  ']);

var IGNORE = ['url', 'domain', 'content', 'word_count', 'next_page_url', 'excerpt', 'direction', 'total_pages', 'rendered_pages'];

function testFor(key, value, dir) {
  if (IGNORE.find(function (k) {
    return k === key;
  })) return '';

  return template(_templateObject$1, key, key, dir, key, key, value ? '`' + value + '`' : "''");
}

var extractorTestTemplate = function (file, url, dir, result, name) {
  return template(_templateObject2, name, url, file, _Reflect$ownKeys(result).map(function (k) {
    return testFor(k, result[k], dir);
  }).join('\n\n'), dir);
};

/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-use-before-define */
/* eslint-disable no-console */
var questions = [{
  type: 'input',
  name: 'website',
  message: 'Paste a url to an article you\'d like to create or extend a parser for:',
  validate: function validate(value) {
    var _URL$parse = URL.parse(value),
        hostname = _URL$parse.hostname;

    if (hostname) return true;

    return false;
  }
}];
var spinner = void 0;

function confirm(fn, args, msg, newParser) {
  spinner = ora({ text: msg });
  spinner.start();
  var result = fn.apply(undefined, _toConsumableArray(args));

  if (result && result.then) {
    result.then(function (r) {
      return savePage(r, args, newParser);
    });
  } else {
    spinner.succeed();
  }

  return result;
}

function confirmCreateDir(dir, msg) {
  if (!fs.existsSync(dir)) {
    confirm(fs.mkdirSync, [dir], msg);
  }
}

function getDir(url) {
  var _URL$parse2 = URL.parse(url),
      hostname = _URL$parse2.hostname;

  return './src/extractors/custom/' + hostname;
}

function scaffoldCustomParser(url) {
  var dir = getDir(url);

  var _URL$parse3 = URL.parse(url),
      hostname = _URL$parse3.hostname;

  var newParser = false;

  if (!fs.existsSync(dir)) {
    newParser = true;
    confirmCreateDir(dir, 'Creating ' + hostname + ' directory');
    confirmCreateDir('./fixtures/' + hostname, 'Creating fixtures directory');
  }

  confirm(mercury.fetchResource, [url], 'Fetching fixture', newParser);
}

// if has arg, just assume that arg is a url and skip prmopt
var urlArg = process.argv[2];
if (urlArg) {
  scaffoldCustomParser(urlArg);
} else {
  inquirer.prompt(questions).then(function (answers) {
    scaffoldCustomParser(answers.website);
  });
}

function generateScaffold(url, file, result) {
  var _URL$parse4 = URL.parse(url),
      hostname = _URL$parse4.hostname;

  var extractor = extractorTemplate(hostname, extractorName(hostname));
  var extractorTest = extractorTestTemplate(file, url, getDir(url), result, extractorName(hostname));

  fs.writeFileSync(getDir(url) + '/index.js', extractor);
  fs.writeFileSync(getDir(url) + '/index.test.js', extractorTest);
  fs.appendFileSync('./src/extractors/custom/index.js', exportString(url));
  child_process.exec('npm run lint-fix-quiet -- ' + getDir(url) + '/*.js');
}

function savePage($, _ref, newParser) {
  var _ref2 = _slicedToArray(_ref, 1),
      url = _ref2[0];

  var _URL$parse5 = URL.parse(url),
      hostname = _URL$parse5.hostname;

  spinner.succeed();

  var filename = new Date().getTime();
  var file = './fixtures/' + hostname + '/' + filename + '.html';
  // fix http(s) relative links:
  makeLinksAbsolute$$1($('*').first(), $, url);
  $('[src], [href]').each(function (index, node) {
    var $node = $(node);
    var link = $node.attr('src');
    if (link && link.slice(0, 2) === '//') {
      $node.attr('src', 'http:' + link);
    }
  });
  var html = stripJunkTags($('*').first(), $, ['script']).html();

  fs.writeFileSync(file, html);

  mercury.parse(url, html).then(function (result) {
    if (newParser) {
      confirm(generateScaffold, [url, file, result], 'Generating parser and tests');
      console.log('Your custom site extractor has been set up. To get started building it, run\n      yarn watch:test -- ' + hostname + '\n        -- OR --\n      npm run watch:test -- ' + hostname);
    } else {
      console.log('\n  It looks like you already have a custom parser for this url.\n  The page you linked to has been added to ' + file + '. Copy and paste\n  the following code to use that page in your tests:\n  const html = fs.readFileSync(\'' + file + '\');');
    }
  });
}

function exportString(url) {
  var _URL$parse6 = URL.parse(url),
      hostname = _URL$parse6.hostname;

  return 'export * from \'./' + hostname + '\';';
}

function extractorName(hostname) {
  var name = hostname.split('.').map(function (w) {
    return '' + w.charAt(0).toUpperCase() + w.slice(1);
  }).join('');
  return name + 'Extractor';
}
//# sourceMappingURL=generate-custom-parser.js.map
