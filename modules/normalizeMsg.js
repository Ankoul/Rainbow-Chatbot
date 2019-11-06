function normalizeMsg(msg) {
    return msg && msg.trim().toLowerCase().normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/["'!@#$£%¢¨¬&\\*|()_\-+=§`´{}[\]ªº^~,<>.?/°;:]/g, "")
        .replace(/  +/g, " ")
        ;
}
module.exports = normalizeMsg;