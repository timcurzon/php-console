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

    var initialize, log, getItem, setItem, clearItem, clearItems, 
        snippetButtonSetup, snippetClickHandler, 
        snippetDblClickHandler; // 'protected' instance methods
    var editor, options, logLevel, snippetWrapper, keys = []; // instance vars
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
        snippetWrapper = $('.snippet-wrapper');

        // setup UI
        snippetButtonSetup();
    }

    /**
     * log helper
     */
    log = function(level, msg, data) {
        data = data || '';
        if (options.log && logLevel[level] <= options.logLevel) {
            console.log('[' + level + ']', msg, data);
        }
    }

    /**
     * stores editor content in localStorage
     */
    setItem = function (key, content) {
        localStorage.setItem(key, content);
        var stored = localStorage.getItem(key);
        log('INFO', 'Content stored in key ' + key);
        log('DEBUG', 'Content was: ' + stored);
        return stored;
    };

    /**
     * get stored editor content from localStorage
     */
    getItem = function (key) {
        var content = localStorage.getItem(key);
        log('INFO', 'Getting stored content for key ' + key);
        log('DEBUG', 'Content was: ' + content);
        return content;
    };

    /**
     * clear a snippet
     */
    clearItem = function(key) {
        localStorage.removeItem(key);
        $('#' + key, snippetWrapper).removeClass('set');
        log('INFO', 'Cleared stored content for key ' + key);
    }

    /**
     * clear all snippets
     */
    clearItems = function() {
        $.each(keys, function(idx, key) {
            clearItem(key);
        });
    }

    /**
     * setup UI save button functionality
     */
    snippetButtonSetup = function() {
        var buttonWrapper = $(snippetWrapper).find('.snippet');
        $(buttonWrapper).each(function(idx, wrapper) {
            var key = wrapper.id;
            keys.push(key);
            if (getItem(key)) {
                $(wrapper).addClass('set');
                log('INFO', 'Set class "set" for save button wrapper ' + key);
            }
            $(wrapper).click({key: key, wrapper: wrapper}, snippetClickHandler);
            $(wrapper).dblclick({key: key, wrapper: wrapper}, snippetDblClickHandler);
        });
    }

    /**
     * click handler for snippet button set
     */
    snippetClickHandler = function(e) {
        var src = e.target,
            key = e.data.key,
            wrapper = e.data.wrapper;

        if ($(src).hasClass('save')) {
            // handle save
            log('NOTICE', 'Handling save event', e);
            var stored = setItem(key, editor.getSession().getValue());
            if (stored) {
                $(wrapper).addClass('set');
            }

        } else if ($(src).hasClass('load')) {
            // handle load
            log('NOTICE', 'Handling load event', e);
            var content = getItem(key);
            editor.getSession().setValue(content);
            localStorage.setItem(options.editorKey, content);

        } else if ($(src).hasClass('exec')) {
            // handle execute
            log('NOTICE', 'Handling exec event', e);
            editor.getSession().setValue(getItem(key));
            $('form').submit();
        }
    }

    /**
     * double click handler for snippet button set
     */
    snippetDblClickHandler = function(e) {
        var src = e.target,
            key = e.data.key,
            wrapper = e.data.wrapper;
        if ($(src).hasClass('status')) {
            // handle status query
            log('NOTICE', 'Handling status double click event', e);
            clearItem(key);
        }
    }

    /**
     * fire up module, but wait a mo for php-console to init
     */
    $(document).ready(function() {
        setTimeout(initialize, 1);
    });

}(jQuery, ace));
