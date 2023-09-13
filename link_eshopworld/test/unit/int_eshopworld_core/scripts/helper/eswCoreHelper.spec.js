var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;
var sinon = require('sinon');


var Money = require('../../../../mocks/dw.value.Money');
var empty = require('../../../../mocks/dw.global.empty');
var siteMock = require('../../../../mocks/dw/system/Site');
var Logger = require('../../../../mocks/dw/system/Logger');
var StringUtils = require('../../../../mocks/dw/util/StringUtils');
global.empty = empty(global);

var stubTransaction = sinon.stub();
var stubCookie = sinon.stub();
var stubArrayList = sinon.stub();
var stubURLUtils = sinon.stub();

var session = {
    getCurrency: function () {
        return 'USD';
    },
    privacy: {
        fxRate: ''
    }
};

global.session = session;
var LocalServiceRegMock = require('../../../../mocks/dw/svc/LocalServiceRegistry');
const Constants = require('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/util/Constants');
describe('/link_eshopworld/cartridges/int_eshopworld_core/cartridge/scripts/helper/eswCoreHelper.js', function () {
    var eswHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/eswCoreHelper.js', {
        '*/cartridge/scripts/util/collections': '',
        'dw/system/Transaction': stubTransaction,
        'dw/web/Cookie': stubCookie,
        'dw/value/Money': Money,
        'dw/system/Logger': Logger,
        'dw/util/ArrayList': stubArrayList,
        'dw/web/URLUtils': stubURLUtils,
        'dw/system/Site': siteMock,
        'dw/util/StringUtils': StringUtils,
        'dw/svc/LocalServiceRegistry': LocalServiceRegMock,
        '*/cartridge/scripts/util/Constants': Constants
    }).getEswHelper;
    describe('Happy path', function () {
        it('Should getPaVersion', function () {
            let paVersion = eswHelper.getPaVersion();
            chai.expect(paVersion).to.equals(Constants.UNKNOWN);
        });
    });
});
