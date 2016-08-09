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
        logLevel: 6
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
     // - UI > drop down tag menu
     // - UI > Sorting
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
            $('#addtag').click(function(e) {
                tagger.saveHandler();
            });
            $('#tagbar #taglist').click(function(e) {
                console.log(e);
                var clickedTag = $(e.target).text();
                if ($(e.target).hasClass('name')) {
                    tagger.loadHandler(clickedTag, e.target);
                } else if ($(e.target).hasClass('up')) {
                    tagger.updateHandler(clickedTag, e.target);
                } else if ($(e.target).hasClass('del')) {
                    tagger.deleteHandler(clickedTag, e.target);
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
                '<a class="showmenu" href="#">▼</a>' +
                '<div class="menu">' +
                '<ul>' +
                '<li><a class="action up" title="Update" href="#">Update</a></li>' +
                '<li><a class="action del" title="Delete" href="#">Delete</a></li>' +
                '</ul>' +
                '</div>' +
                '</div>' +
                '</li>';
            $('#tagbar #taglist').append(tagTemplate.replace('__tagname__', tag));
        },
        loadHandler: function(tag, el) {
            log('DEBUG', 'Attempting loading of tag "' + tag + '"');
            var content = ls.getItem(tag, 'tag');
            editor.getSession().setValue(content);
            log('INFO', 'Tag "' + tag + '" loaded');
        },
        saveHandler: function() {
            var tag = prompt('Enter a tag name');
            if (tag) {
                log('DEBUG', 'Attempting creating of tag "' + tag + '"');
                if (tags.indexOf(tag) == -1) {
                    tags.push(tag);
                    ls.setItem(tagListKey, 'config', tags.toString());
                    ls.setItem(tag, 'tag', editor.getSession().getValue());
                    tagger.addToUi(tag);
                    log('INFO', 'Tag "' + tag + '" created (tags:' + tags.toString() + ')');
                }
            }
        },
        updateHandler: function(tag, el) {
            if (tags.indexOf(tag) != -1) {
                ls.setItem(tag, 'tag', editor.getSession().getValue());
                log('INFO', 'Tag "' + tag + '" updated (tags:' + tags.toString() + ')');
            }
        },
        deleteHandler: function(tag, el) {
            var del = confirm('Really delete the tag "' + tag + '"?');
            log('DEBUG', 'Attempting deletion of tag "' + tag + '"');
            if (del && tags.indexOf(tag) != -1) {
                tags.splice(tags.indexOf(tag), 1);
                ls.clearItem(tag, 'tag');
                ls.setItem(tagListKey, 'config', tags.toString());
                $(el).parent('li').remove();
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
