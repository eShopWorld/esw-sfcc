
'use strict';


/* API includes */
const logger = require('dw/system/Logger');
const ContentMgr = require('dw/content/ContentMgr');
const RESTResponseMgr = require('dw/system/RESTResponseMgr');

exports.getEswTestContent = function () {
    let responseJSON;
    try {
        let contentBody = {};
        let content = ContentMgr.getContent('esw-test-content');
        if (content) {
            contentBody.body = content.custom ? content.custom.body.markup : '';
        }
        responseJSON = contentBody;
    } catch (e) {
        logger.error('ESW BMConfigs Error: {0}', e.message);
        responseJSON = {
            ResponseCode: '400',
            ResponseText: 'Error: Internal error',
            errorMessage: e.message
        };
    }
    RESTResponseMgr
        .createSuccess(responseJSON)
        .render();
};

exports.getEswTestContent.public = true;
