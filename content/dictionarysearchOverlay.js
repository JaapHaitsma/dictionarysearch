/* -*- Mode: js; indent-tabs-mode: t; c-basic-offset: 4; tab-width: 4 -*- */
// $Id: dictionarysearchOverlay.js,v 1.35 2012/02/12 12:11:51 jaap Exp $

/* ***** BEGIN LICENSE BLOCK ***** 
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Initial Developer of the Original Code is Jaap Haitsma.
 * Portions created by the Initial Developer are Copyright (C) 2003
 * by the Initial Developer. All Rights Reserved.
 *
 * Contributor(s): Jaap Haitsma <jaap@haitsma.org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */
if(!org) var org={};
if(!org.mozdev) org.mozdev={};
if(!org.mozdev.dictionarysearch) org.mozdev.dictionarysearch={};


org.mozdev.dictionarysearch = {
    DEBUG: true,
    NUM_DICTIONARIES: 6,
    stringBundle: null,
    prefs: null,
    APP_NAME: "DictionarySearch",
    VERSION: "28.0.0",
    inThunderbird: false,

    dumpObject: function(obj) {
        for(i in obj){         
            this.debug(i + " = " + obj[i] + "\n");
        }
    },

    debug: function(str) {
        if (!this.DEBUG) {
            return;
        }
        if (navigator.userAgent.search(/Thunderbird/gi) != -1){ // In Thunderbird
            var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
            consoleService.logStringMessage(this.APP_NAME + ": " + str);
        } else {
            var console = Components.utils.import("resource://gre/modules/devtools/Console.jsm", {}).console;
            console.log(this.APP_NAME + ": " + str);            
        }
    },

    openURL: function(url){
        if (!this.inThunderbird){       
            setTimeout(function() { window.openUILinkIn(url, "tab"); }, 500);
        } else {
            var messenger = Components.classes["@mozilla.org/messenger;1"].createInstance();         
            messenger = messenger.QueryInterface(Components.interfaces.nsIMessenger);
            messenger.launchExternalURL(url);         
        }
    },

    init: function(){
    	this.prefs = Components.classes["@mozilla.org/preferences-service;1"].
                            getService(Components.interfaces.nsIPrefService).getBranch("dictionarysearch.");

    	if (!this.prefs.prefHasUserValue("debug")) {
    		this.debug("init(): no preferences found in prefs.js taking default for debug");
    		this.prefs.setBoolPref("debug", false);
    	} else {
    		this.DEBUG = this.prefs.getBoolPref("debug");
        }

        this.debug("init()");

    	this.inThunderbird = false;
    	this.debug ("userAgent: " + navigator.userAgent);
        if (navigator.userAgent.search(/Thunderbird/gi) != -1){
            this.inThunderbird = true;
        } 
    	this.debug("inThunderbird: " + this.inThunderbird);


        this.stringBundle = document.getElementById("dictionarysearch_string_bundle");


        if (!this.prefs.prefHasUserValue("menutext1") || this.prefs.getCharPref("menutext1") == ""){
            this.debug ("init(): no preferences found taking defaults");
            // Assign default values
            this.prefs.setCharPref("url1", this.stringBundle.getString("dictionarysearch.default.URL"));
            this.prefs.setCharPref("menutext1", this.stringBundle.getString("dictionarysearch.default.menutext"));
        }
        for (var i = 2; i <= this.NUM_DICTIONARIES; i++) {
            if (!this.prefs.prefHasUserValue("menutext"+i)) {
                this.prefs.setCharPref("url"+i, "");
                this.prefs.setCharPref("menutext"+i, "");
            }
        }            
        if (document.getElementById("contentAreaContextMenu")) {
            document.getElementById("contentAreaContextMenu").addEventListener("popupshowing", function () {org.mozdev.dictionarysearch.popup()}, false);
        } else if (document.getElementById("messagePaneContext")){
            document.getElementById("messagePaneContext").addEventListener("popupshowing", function () {org.mozdev.dictionarysearch.popup()}, false);    
        } else if (document.getElementById("mailContext")){
            document.getElementById("mailContext").addEventListener("popupshowing", function () {org.mozdev.dictionarysearch.popup()}, false);    
        } else if (document.getElementById("msgComposeContext")){
            document.getElementById("msgComposeContext").addEventListener("popupshowing", function () {org.mozdev.dictionarysearch.popup()}, false);    
        }

        if (!this.prefs.prefHasUserValue("version")) {
            this.debug("init(): no version found");
            this.openURL ("http://dictionarysearch.mozdev.org/thanks-install.html");
            this.prefs.setCharPref("version", this.VERSION);
        }
        if (this.prefs.getCharPref("version") != this.VERSION) {
            this.debug("init(): newer version");
            this.openURL ("http://dictionarysearch.mozdev.org/thanks.html");
            this.prefs.setCharPref("version", this.VERSION);
        }

    },

    popup: function() { 
        // hide the Dictionary Search item when apropriate (use same logic as for web search)
        this.debug("popup" + this.prefs);
        var selectedText = this.getSelectedText(" ");
           
        if (selectedText!=""){
            this.debug("popup() text selected");
            if (selectedText.length > 18){
                selectedText = selectedText.substr(0,14) + "...";
            }
            var menuText;
            var item;

            for (i=1 ;i<=this.NUM_DICTIONARIES; i++){
                menuText = this.prefs.getCharPref("menutext"+i);
                item = document.getElementById("context_dictionarysearchselect"+i);
                item.hidden = true;
                if (menuText!=""){        
                    item.hidden = false;        
                    menuText = menuText.split("$");
                    menuText = menuText[0] + selectedText + menuText[1];
                    item.setAttribute("label", menuText);
                }
            }
        }
        else{

           for (i=1 ;i<=this.NUM_DICTIONARIES; i++){
                item = document.getElementById("context_dictionarysearchselect"+i);
                item.hidden = true;
           }
        }
    },

    search: function(n){ 
        var url = this.prefs.getCharPref("url"+n);
        url = url.split("$");
        url = url[0] + this.getSelectedText("+").toLocaleLowerCase() + url[1];
        this.debug ("search() : url = " + url);

        if (!this.inThunderbird){
            openNewTabWith(url, null, null, true);
        }
        else{
            var messenger = Components.classes["@mozilla.org/messenger;1"].createInstance();         
            messenger = messenger.QueryInterface(Components.interfaces.nsIMessenger);
    		this.debug(messenger);
    		this.debug("launchExternalURL: " + url);
            messenger.launchExternalURL(url);         
        }
    },


    getSelectedText: function(concationationChar){
        this.debug("getSelectedText()");
        
        var node = document.popupNode;
        var selection = "";

        if (node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement && node.type == "text") {
            selection = node.value.substring(node.selectionStart, node.selectionEnd);
        } 
        else {
            var focusedWindow = new XPCNativeWrapper(document.commandDispatcher.focusedWindow, 'document', 'getSelection()');
            selection = focusedWindow.getSelection().toString();
        }

        // Limit length to 150 to optimize performance. Longer does not make sense
        if (selection.length>=150){
            selection = selection.substring(0, 149);
        }
        selection = selection.replace(/(\n|\r|\t)+/g, " ");
        // Strip spaces at start and end.
        selection = selection.replace(/(^\s+)|(\s+$)/g, "");

        selection = selection.split(" ");
       
        // Remove certain characters at the beginning and end of every word
        for (i=0; i<selection.length; i++){
            selection[i]=selection[i].replace(/^(\&|\(|\)|\[|\]|\{|\}|"|,|\.|!|\?|'|:|;)+/, "");
            selection[i]=selection[i].replace(/(\&|\(|\)|\[|\]|\{|\}|"|,|\.|!|\?|'|:|;)+$/, "");
        }   
        selection = selection.join(concationationChar);   
        return selection; 
    },

    saveSettings: function(){    
        this.debug("saveSettings()");

        var url;
        var menuText;
        var accessKey;
        for (i=1; i<=this.NUM_DICTIONARIES; i++){
            url = document.getElementById("dictionarysearchURL"+i).value;
            menuText = document.getElementById("dictionarysearchMenuText"+i).value;
            if (menuText != ""){       
                if (!this.checkDollarSign(menuText)){
                    alert(this.stringBundle.getString("dictionarysearch.menuText.error1")  + " " + i
                          + " " + this.stringBundle.getString("dictionarysearch.menuText.error2"));
                    return false;
                }

                if (!this.checkDollarSign(url)){
                    alert(this.stringBundle.getString("dictionarysearch.URL.error1") + " " + i
                      + " " + this.stringBundle.getString("dictionarysearch.URL.error2"));
                    return false;
                }

            }
            this.prefs.setCharPref("url"+i, url);
            this.prefs.setCharPref("menutext"+i, menuText);
        }
        return true;
    },

    loadSettings: function(){
        this.debug("loadSettings()");
        // We need to set the prefs and string bundle again, because we get another instance of the object in the pref dialog :-(
        this.prefs = Components.classes["@mozilla.org/preferences-service;1"].
                                getService(Components.interfaces.nsIPrefService).getBranch("dictionarysearch.");

        this.stringBundle = document.getElementById("dictionarysearch_string_bundle");


        for (i=1; i<=this.NUM_DICTIONARIES; i++){
            document.getElementById("dictionarysearchURL"+i).value = this.prefs.getCharPref("url"+i);
            document.getElementById("dictionarysearchMenuText"+i).value = this.prefs.getCharPref("menutext"+i);
        }
    },

    checkDollarSign: function(str){    
        this.debug("checkDollarSign(str)");

        ind = str.indexOf('$');
        if (ind == -1){
            return false;
        }
        if (ind != str.lastIndexOf('$')){
            return false;
        }
        return true;
    }
};


// Every time a new browser window is made init will be called
window.addEventListener("load", function() {org.mozdev.dictionarysearch.init()},false);

