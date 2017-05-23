/*jslint browser: true */
/*global ace, jQuery */
/**
 * Snippet Manager
 *
 * Copyright (C) 2015, Tim Curzon
 *
 * Licensed under the new BSD License
 * See the LICENSE file for details
 */

(function ($, ace) {

    "use strict";

     // private instance methods
    var initialize, log;

    // private instance vars
    var editor, options, logLevel,
        ls, 
        tagger, tags = [], tagListKey = 'taglist';

    logLevel = {
        EMERG:  0,
        ALERT:  1,
        CRIT:   2,
        ERR:    3,
        WARN:   4,
        NOTICE: 5,
        INFO:   6,
        DEBUG:  7
    };
    options = {
        editor: 'editor',
        editorKey: 'phpCode',
        log: true,
        logLevel: 3
    };

    /**
     * initialise snippet manager
     */
    initialize = function () {
        editor = ace.edit(options.editor);
        tagger.setup();
    };

    /**
     * log helper
     */
    log = function(level, msg, data) {
        data = data || '';
        if (options.log && logLevel[level] <= options.logLevel) {
            console.log('[' + level + ']', msg, data);
        }
    };

    /**
     * simple localStorage wrapper
     */
    ls = {
        /**
         * stores editor content in localStorage
         */
       setItem: function (key, type, content) {
            key = type + '_' + key;
            localStorage.setItem(key, content);
            var stored = localStorage.getItem(key);
            log('INFO', 'Content stored in key "' + key + '", type "' + type + '"');
            log('DEBUG', 'Content was: ' + stored);
            return stored;
        },
        /**
         * get stored editor content from localStorage
         */
        getItem: function (key, type) {
            key = type + '_' + key;
            var content = localStorage.getItem(key);
            log('INFO', 'Getting stored content for key "' + key + '", type "' + type + '"');
            log('DEBUG', 'Content was: ' + content);
            return content;
        },
        /**
         * clear a snippet
         */
        clearItem: function(key, type) {
            key = type + '_' + key;
            localStorage.removeItem(key);
            log('INFO', 'Cleared stored content for key "' + key + '", type "' + type + '"');
        },    
        /**
         * setup UI save button functionality
         */
        clearItems: function(type) {
            $.each(keys, function(idx, key) {
                ls.clearItem(key, type);
            });
        },
    };

    /**
     * setup tag bar
     */
    // TODO:
    // - UI > Sorting
    // - UI > Quick update
    // - Rename snippet js/css files (tab something or another)
    // - Rename a tag (?)
     tagger = {
        setup: function() {
            var persistedTags = ls.getItem(tagListKey, 'config');
            if (persistedTags != null && persistedTags != '') {
                tags = persistedTags.split(',');
                tags = tags.map(function(tag) { return tag.replace('tag_', ''); })
                log('DEBUG', 'Attempting initialisation of tags "' + tags.toString() + '"');
                tagger.addAllToUi(tags);
                log('INFO', 'Tags initialised (tags:' + tags.toString() + ')');
            }
            $('#tagadd').click(function(e) {
                tagger.saveHandler();
            });
            $('#tagconfig').click(function(e) {
                $('#tagconfig').addClass('active');
                $('#tagconfigpane').show();
            });
            $('#tagbar #tagconfigpane').click(function(e) {
                if (e.target.id == 'tagconfigpane-close') {
                    $('#tagconfig').removeClass('active');
                    $('#tagconfigpane').hide();
                }
            });
            $('#tagbar #taglist').click(function(e) {
                log('DEBUG', 'Click logged: ', e);
                var tagEl = $(e.target).parents('li').filter('.tag');
                var tagName = $('.name', tagEl).text();
                if ($(e.target).hasClass('name')) {
                    tagger.loadHandler(tagName, tagEl);
                } else {
                    var menuEl = $(e.target).parents('li');
                    log('DEBUG', 'tagEl: ', tagEl, ' / tagName: ', tagName, ' / menuEl: ', menuEl);
                    if ($(menuEl).hasClass('up')) {
                        tagger.updateHandler(tagName, tagEl);
                    } else if ($(menuEl).hasClass('del')) {
                        tagger.deleteHandler(tagName, tagEl);
                    }
                }
            }); 
        },
        addAllToUi: function(tagsToAddToUi) {
            tagsToAddToUi.forEach(function(tag) {
                tagger.addToUi(tag);
            });
        },
        addToUi: function(tag) {
            var tagTemplate = '<li class="tag">' +
                '<div class="data">' +
                '<a class="name" href="#">__tagname__</a>' +
                '<a class="showmenu" href="#" title="options">▼</a>' +
                '<div class="menu">' +
                '<ul>' +
                '<li class="up"><a title="Update" href="#">Update<span>↻</span></a></li>' +
                '<li class="del"><a title="Delete" href="#">Delete<span>x</span></a></li>' +
                '</ul>' +
                '</div>' +
                '</div>' +
                '</li>';
            $('#tagbar #taglist').append(tagTemplate.replace('__tagname__', tag));
        },
        loadHandler: function(tag, tagEl) {
            log('DEBUG', 'Attempting loading of tag "' + tag + '" (element: ', tagEl, ')');
            var content = ls.getItem(tag, 'tag');
            editor.getSession().setValue(content);
            log('INFO', 'Tag "' + tag + '" loaded');
        },
        saveHandler: function() {
            var tag = prompt('Enter a tag name');
            log('DEBUG', 'Attempting creating of tag "' + tag + '"');
            if (tag) {
                if (tags.indexOf(tag) == -1) {
                    tags.push(tag);
                    ls.setItem(tagListKey, 'config', tags.toString());
                    ls.setItem(tag, 'tag', editor.getSession().getValue());
                    tagger.addToUi(tag);
                    log('INFO', 'Tag "' + tag + '" created (tags:' + tags.toString() + ')');
                }
            }
        },
        updateHandler: function(tag, tagEl) {
            log('DEBUG', 'Attempting update of tag "' + tag + '" (element: ', tagEl, ')');
            if (tags.indexOf(tag) != -1) {
                ls.setItem(tag, 'tag', editor.getSession().getValue());
                log('INFO', 'Tag "' + tag + '" updated (tags:' + tags.toString() + ')');
            }
        },
        deleteHandler: function(tag, tagEl) {
            log('DEBUG', 'Attempting deletion of tag "' + tag + '" (element: ', tagEl, ')');
            var del = confirm('Really delete the tag "' + tag + '"?');
            if (del && tags.indexOf(tag) != -1) {
                tags.splice(tags.indexOf(tag), 1);
                ls.clearItem(tag, 'tag');
                ls.setItem(tagListKey, 'config', tags.toString());
                $(tagEl).remove();
                log('INFO', 'Tag "' + tag + '" deleted (tags:' + tags.toString() + ')');
            }
        }
     };

    /**
     * fire up module, but wait a mo for php-console to init
     */
    $(document).ready(function() {
        setTimeout(initialize, 1);
    });

}(jQuery, ace));
