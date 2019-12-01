"use strict";

const normalizeMsg = require('../normalizeMsg');

const LOG_ID = "CHOICEPLG - ";

class ChoicePlug {

    constructor() {
        this.execute.bind(this);
    }

    getNextStep(work, step, logger) {
        // Get the historized message

        let next = null;

        if (Array.isArray(step.next) && step.next.length > 1) {

            logger.log("info", LOG_ID + "getNextStep() - Work[" + work.id + "] - has a complexe next step");

            if (!work.history) {
                logger.log("info", LOG_ID + "getNextStep() - Work[" + work.id + "] - found next step " + next);
                return next;
            }
            let historyItem = work.history.find((item) => {
                return item.step === work.step;
            });

            if (!historyItem) {
                logger.log("info", LOG_ID + "getNextStep() - Work[" + work.id + "] - found next step " + next);
                return next;
            }
            logger.log("info", LOG_ID + "getNextStep() - Work[" + work.id + "] - has an history item for step " + work.step);

            let message = historyItem.content;

            logger.log("info", LOG_ID + "getNextStep() - Work[" + work.id + "] - has an history value " + message);

            // Check the accept
            if (step.accept && Array.isArray(step.accept)) {
                // noinspection JSUnresolvedVariable
                let index = step.acceptRegex ? this.indexOfMatches(message, step.accept) : step.accept.indexOf(normalizeMsg(message));
                logger.log("info", LOG_ID + "getNextStep() - Work[" + work.id + "] - has a an index response of " + index);
                next = step.next[index] || null;
            } else if (step.list && Array.isArray(step.list)) {
                let index = step.list.indexOf(message);
                logger.log("info", LOG_ID + "getNextStep() - Work[" + work.id + "] - has a an index response of " + index);
                next = step.next[index] || null;
            }
        } else {

            logger.log("info", LOG_ID + "getNextStep() - Work[" + work.id + "] - has a simple next step");

            if (Array.isArray(step.next)) {
                if (step.next.length === 1) {
                    next = step.next[0];
                }
            } else {
                next = step.next || null;
            }
        }

        logger.log("info", LOG_ID + "getNextStep() - Work[" + work.id + "] - found next step " + next);

        return next;
    }

    execute(work, step, event, logger) {
        logger.log("info", LOG_ID + "execute() - Work[" + work.id + "] - choice");
        this.replaceAccept(work, step, logger);

        if (step.value) {
            event.emit("onSendMessage", {
                message: step.value,
                jid: work.jid,
                type: "choice"
            });
        }

        let emitList = (list) => {
            let {message, messageMarkdown} = this.makeListMessage(list);

            event.emit("onSendMessage", {
                message: message,
                messageMarkdown: messageMarkdown,
                jid: work.jid,
                type: "list"
            });
        };
        if (step.list) {
            emitList(step.list);
        }
        // noinspection JSUnresolvedVariable
        if (step.list2) {
            setTimeout((() => emitList(step.list2)), 100);
        }

        work.pending = true;
        work.waiting = step.waiting ? step.waiting : 0;
        logger.log("info", LOG_ID + "execute() - Work[" + work.id + "] - finished choice");
    }

    replaceAccept(work, step, logger) {
        if (!step.accept || !Array.isArray(step.accept)) {
            return;
        }
        if(!Array.isArray(step.next)){
            step.next = step.accept.map(()=> step.next);
        }
        for (let i = 0; i < step.accept.length; i++) {
            let acceptId = step.accept[i];
            if (!acceptId.startsWith('$')) {
                continue;
            }
            let acceptStep = work.scenario[acceptId];
            step.accept.splice(i, 1, ...acceptStep.accept);

            let next = acceptStep.accept.map(() => step.next[i]);
            step.next.splice(i, 1, ...next);
            i += next.length - 1;
            logger.log("info", LOG_ID + "replaceAccept() - [" + acceptId + "]");
        }
    }

    isValid(work, step, content, event, logger) {
        logger.log("info", LOG_ID + "isValid() - Work[" + work.id + "] - check answer validity...");

        // An accept tag is defined - Use it to check the content sent
        if (step.accept) {
            // If yes check that the content matches one of the item accepted
            // noinspection JSUnresolvedVariable
            if (step.acceptRegex && this.matches(content, step.accept) || step.accept.includes(normalizeMsg(content))) {
                logger.log("info", LOG_ID + "isValid() - Work[" + work.id + "] - answer is valid (accept)");
                return true;
            }
            this.emitInvalidMessage(work, step, content, event, logger);
            return false;
        }

        // Answer is not valid if list tag and accept tag are not defined
        if (!step.list) {
            return false;
        }
        // No accept values defined - Use the list to check the content sent
        if (step.list.includes(content)) {
            logger.log("info", LOG_ID + "isValid() - Work[" + work.id + "] - answer is valid (list)");
            return true;
        }
        this.emitInvalidMessage(work, step, content, event, logger);
        return false;
    }

    emitInvalidMessage(work, step, content, event, logger) {
        logger.log("warn", LOG_ID + "isValid() - Work[" + work.id + "] - answer is not valid", content);

        if ("invalid" in step) {
            event.emit("onSendMessage", {
                message: step.invalid,
                jid: work.jid,
                type: "list"
            });
        }
        if ("invalidList" in step && step.invalidList) {
            let {message, messageMarkdown} =
                this.makeListMessage(Array.isArray(step.invalidList) ? step.invalidList : step.list);

            event.emit("onSendMessage", {
                message: message,
                messageMarkdown: messageMarkdown,
                jid: work.jid,
                type: "list"
            });
        }
    }

    makeListMessage(list) {
        let messageMarkdown = "";
        let message = "";

        list.forEach((choice, index) => {
            messageMarkdown += index === 0 ? "- " + choice : "  \r\n- " + choice;
            message += message.length === 0 ? choice : ' ' + choice;
        });
        return {message, messageMarkdown};
    }

    matches(message, accept) {
        return this.indexOfMatches(message, accept) > -1;
    }

    indexOfMatches(message, accept) {
        const normalizedMsg = normalizeMsg(message);
        for (const [index, value] of accept.entries()) {
            if (normalizedMsg.indexOf(value) > -1) return index;
        }
        return -1;
    }
}

module.exports = new ChoicePlug();