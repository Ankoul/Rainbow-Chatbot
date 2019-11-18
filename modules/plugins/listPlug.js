"use strict";

const LOG_ID = "LISTPLG - ";

class ListPlug {

    constructor() {
        this.execute.bind(this);
    }

    getNextStep(work, step) {
        return step.next || null;
    }

    execute(work, step, event, logger) {
        logger.log("info", LOG_ID + "execute() - Work[" + work.id + "] - list");

        let {message, messageMarkdown} = this.makeListMessage(step.list, step.value);

        event.emit("onSendMessage", {
            message: message,
            messageMarkdown: messageMarkdown,
            jid: work.jid,
            type: "list"
        });

        work.pending = false;
        work.waiting = step.waiting ? step.waiting : 0;
        logger.log("info", LOG_ID + "execute() - Work[" + work.id + "] - finished list");
    }

    isValid(work, step, content, event, logger) {
        let isValidList = Array.isArray(step.list);
        if(isValidList){
            logger.log("info", LOG_ID + "isValid() - Work[" + work.id + "] - list is valid");
        } else {
            logger.log("warn", LOG_ID + "isValid() - Work[" + work.id + "] - list is NOT valid");
        }
        return isValidList;
    }


    makeListMessage(list, msg) {
        let messageMarkdown = "";
        let message = "";
        if (msg) {
            messageMarkdown = msg + "  \r\n";
            message = msg + "  \r\n";
        }

        list.forEach((item, index) => {
            if(typeof item == 'object' && Array.isArray(item.list)){
                let subList = this.makeListMessage(item.list, item.value);
                messageMarkdown += "  \r\n" + subList.messageMarkdown;
                message += "  \r\n" + subList.message;
            } else {
                messageMarkdown += index === 0 ? "- " + item :  "  \r\n- " + item;
                message += message.length === 0 ? item : ' ' + item;
            }
        });
        return {message, messageMarkdown};
    }
}

module.exports = new ListPlug();