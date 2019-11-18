"use strict";

const getHashTags = require("./hashtag");
const Message = require("./message");
const normalizeMsg = require('./normalizeMsg');

const LOG_ID = "TAGS - ";

class Tags {

    constructor(json) {
        this._tags = json;
        this._logger = null;
        this._event = null;
    }

    log(level, message, content) {
        if(this._logger) {
            this._logger.log(level, message);
        } else {
            console.log(message, content);
        }
    }

    start(event, logger) {
        
        let that = this;

        return new Promise((resolve) => {
            that._logger = logger;
            that.log("debug", LOG_ID + "start() - Enter");
            that._event = event;
            that.log("debug", LOG_ID + "start() - Exit");
            resolve();
        });
    }

    isDefined(tag) {
        if(tag && this._tags) {
            return (tag in this._tags);
        }
        return false;
    }

    get listOfTags() {
        return this._tags;
    }

    qualify(msg, isHashTagRequired) {
        let tags = getHashTags(msg.value);
        if(tags.length === 0 && !isHashTagRequired){
            tags = [msg.value && normalizeMsg(msg.value.split(' ').shift())];
        }
        let tag = undefined;
        do {
            tag = tags.pop();
            if(this.isDefined(tag)) {
                msg.tag = tag;
                msg.type = Message.MESSAGE_TYPE.COMMAND;
            }
        } while(tag);

        if(msg.tag && (msg.tag in this._tags)) {
            return this._tags[msg.tag];
        }

        return null;
    }
}

module.exports = Tags;