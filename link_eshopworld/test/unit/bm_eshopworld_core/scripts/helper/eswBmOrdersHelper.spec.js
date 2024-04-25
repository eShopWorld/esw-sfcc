const chai = require('chai');
const proxyquire = require('proxyquire').noCallThru();

const ResourceMock = require('../../../../mocks/dw/web/Resource');

const OrderMock = require('../../../../mocks/dw/order/Order');

describe('link_eshopworld/cartridges/bm_eshopworld_core/cartridge/scripts/helpers/eswBmOrdersHelper.js', function () {
    let eswBmOrdersHelpers = proxyquire('../../../../../cartridges/bm_eshopworld_core/cartridge/scripts/helpers/eswBmOrdersHelper.js', {
        'dw/web/Resource': ResourceMock,
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                getCatalogUploadMethod: function () { return 'api'; },
                beautifyJsonAsString: function () {
                    return null;
                }
            }
        },
        '*/cartridge/scripts/helper/eswBmHelper': {},
        '*/cartridge/scripts/util/Constants': require('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/util/Constants')
    });
    it('returns NOT_EXPORTED status for a valid order', function () {
        // Assuming getOrderExportStatus returns a status string for a valid order
        OrderMock.getShipments = function () {
            return {
                iterator: function () { return { hasNext: function () { return false; } }; }
            };
        };
        OrderMock.custom = { eswCreateOutboundShipment: false };
        const status = eswBmOrdersHelpers.getOrderExportStatus(OrderMock);
        chai.expect(status).to.deep.equal({
            status: 'NOT_EXPORTED',
            statusText: 'Not Exported',
            statusMessage: undefined,
            statusType: 'warning',
            responseAsText: null
        });
    });
    it('throws an error for an invalid order', function () {
        // Assuming getOrderExportStatus returns a status string for a valid order
        OrderMock.getShipments = function () {
            return {
                iterator: function () { return { hasNext: function () { return false; } }; }
            };
        };
        OrderMock.custom = { eswCreateOutboundShipment: true };
        const status = eswBmOrdersHelpers.getOrderExportStatus(OrderMock);
        chai.expect(status).to.throw;
    });
});
