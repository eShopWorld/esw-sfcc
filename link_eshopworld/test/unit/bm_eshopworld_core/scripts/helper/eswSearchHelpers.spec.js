'use strict';

var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var ArrayList = require('../../../../mocks/dw.util.Collection');
var Status = require('../../../../mocks/dw/system/Status');

describe('bm_eshopworld_core/cartridge/scripts/helper/eswSearchHelpers.js', function () {
    let eswSearchHelpers = proxyquire('../../../../../cartridges/bm_eshopworld_core/cartridge/scripts/helpers/eswSearchHelpers.js', {
        '*/cartridge/scripts/util/collections': ArrayList,
        'dw/system/Status': Status
    });
    describe('success case', function () {
        it('Should return filtered object', function () {
            let filteredRes = eswSearchHelpers.getFilterObject('Unsynced');
            chai.expect(filteredRes).to.deep.equal({ ID: 'eswSync', value: false });
        });
    });
    describe('failure case', function () {
        it('Should return null', function () {
            let filteredRes = eswSearchHelpers.getFilterObject('');
            chai.expect(filteredRes).to.deep.equal(null);
        });
    });
    describe('Apply cache', function () {
        it('Should return null', function () {
            let appliedCached = eswSearchHelpers.applyCache({});
            chai.expect(appliedCached).to.deep.equal(undefined);
        });
    });
});
