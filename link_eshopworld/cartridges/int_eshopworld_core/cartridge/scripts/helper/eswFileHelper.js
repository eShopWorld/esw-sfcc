'use strict';

const eswFileHelper = {
    getCurrentDateString: function () {
        let Calendar = require('dw/util/Calendar');
        let calendar = new Calendar(new Date());
        let dateString = calendar.getTime().toDateString();
        return dateString.replace(/\s/g, '_');
    },
    getCurrnetDateIsoString: function () {
        let Calendar = require('dw/util/Calendar');
        let calendar = new Calendar(new Date());
        let dateString = calendar.getTime().toISOString();
        return dateString.replace(/\s/g, '_').replace(/:/g, '_');
    },
    /**
     * Create file on givn location
     * @param {string} filePath - file path
     * @param {string} fileName - file name
     * @returns {dw.io.File} - File path
     */
    createFile: function (filePath, fileName) {
        let File = require('dw/io/File');
        let folder = new File(filePath);

        if (!folder.exists()) {
            folder.mkdirs();
        }
        if (empty(fileName) || typeof fileName === 'undefined') {
            /* eslint no-param-reassign: off */
            fileName = '/ESWHealthLog-' + this.getCurrentDateString() + '.json';
        }
        return new File(filePath + fileName);
    },
    /**
     * Right file
     * @param {dw.io.File} fileCompletePath - File path
     * @param {boolean} isAppendMode - Append or not
     * @param {string} strToWrite - str to write in file
     * @returns {dw.io.File} fileCompletePath - File path
     */
    writeFile: function (fileCompletePath, isAppendMode, strToWrite) {
        let FileWriter = require('dw/io/FileWriter');
        let logFileWriter = new FileWriter(fileCompletePath, isAppendMode);
        logFileWriter.writeLine(strToWrite);
        logFileWriter.close();
        return fileCompletePath;
    },
    /**
     * Reads given file
     * @param {dw.io.File} fileCompletePath - Complete file path
     * @returns {string} - String of file
     */
    readFile: function (fileCompletePath) {
        let FileReader = require('dw/io/FileReader');
        let fileData = new FileReader(fileCompletePath, 'UTF-8');
        return fileData.read();
    }
};

module.exports = {
    eswFileHelper: eswFileHelper
};
