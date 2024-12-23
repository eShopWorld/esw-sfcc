'use strict';

var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

var dwLoggerMock = require('../../../../mocks/dw/system/Logger');
var dwStatusMock = require('../../../../mocks/dw/system/Status');
var dwFileMock = require('../../../../mocks/dw/io/File');
var dwFileWriterMock = require('../../../../mocks/dw/io/FileWriter');
var dwCsvStreamWriterMock = require('../../../../mocks/dw/io/CSVStreamWriter');
var dwSiteMock = require('../../../../mocks/dw/system/Site');
var dwStringUtilMock = require('../../../../mocks/dw/util/StringUtils');
var dwProductSearchModelMock = require('../../../../mocks/dw/catalog/ProductSearchModel');
var dwTransactionMock = require('../../../../mocks/dw/system/Transaction');
var dwOrderMgrMock = require('../../../../mocks/dw/order/OrderMgr');
const Constants = require('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/util/Constants');

describe('int_eshopworld_core/cartridge/scripts/jobs/getASNFromESW.js', function () {
    var getASNtoESW = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/jobs/getASNFromESW', {
        'dw/system/Logger': dwLoggerMock,
        'dw/order/OrderMgr': dwOrderMgrMock,
        'dw/system/Status': dwStatusMock,
        'dw/io/File': dwFileMock,
        'dw/io/FileWriter': dwFileWriterMock,
        'dw/io/CSVStreamWriter': dwCsvStreamWriterMock,
        'dw/system/Site': dwSiteMock,
        'dw/order/Order': '',
        'dw/util/StringUtils': dwStringUtilMock,
        'dw/catalog/ProductSearchModel': dwProductSearchModelMock,
        'dw/system/Transaction': dwTransactionMock,
        '*/cartridge/scripts/util/Constants': Constants,
        '*/cartridge/scripts/helper/eswPricingHelper': {
            eswPricingHelper: {

            }
        },
        '*/cartridge/scripts/services/EswCoreService': {
            getEswServices: function () {
                return {
                    getOAuthService: function () {
                        return {
                            call: function () {
                                return {
                                    status: true,
                                    object: JSON.stringify({TEST: 'serviceAsn'})
                                };
                            }
                        };
                    },
                    getAsnServiceForEswToSfcc: function () {
                        return {
                            call: function () {
                                return {
                                    isOk: function () {
                                        return true;
                                    },
                                    object: {
                                        packages: [
                                            {
                                                productCode: '123ABC',
                                                productDescription: 'Sample Product',
                                                image: 'https://example.com/image1.jpg',
                                                color: 'Red',
                                                size: 'M',
                                                quantity: 2
                                            },
                                            {
                                                productCode: '456DEF',
                                                productDescription: '',  // Simulate empty description
                                                image: 'https://example.com/image2.jpg',
                                                color: '',
                                                size: 'L',
                                                quantity: 1
                                            }
                                        ],
                                        packageReference: 'PKG789',
                                        trackingUrl: 'https://tracking.com/track/PKG789',
                                        carrierReference: 'TRACK123'
                                    }
                                };
                            }
                        };
                    }
                };
            }
        },
        countDaysBetween: function (fromDate, toDate) {
            let startDate = new Date(fromDate);
            let endDate = new Date(toDate);
        
            // Calculate the difference in milliseconds
            let timeDifference = endDate - startDate;
        
            // Convert milliseconds to days
            let daysDifference = timeDifference / (1000 * 60 * 60 * 24);
        
            return daysDifference;
        },
        formatTrackingData: function (packageData) {
            try {
                return ('packageItems' in packageData && Array.isArray(packageData.packageItems))
                    ? packageData.packageItems.map(item => ({
                        productLineItem: 'productCode' in item && !empty(item.productCode) ? item.productCode : '',
                        lineItemDetail: {
                            name: 'productDescription' in item && !empty(item.productDescription) ? item.productDescription : '',
                            productImage: 'image' in item && !empty(item.image) ? item.image : '',
                            color: 'color' in item && !empty(item.color) ? item.color : '',
                            size: 'size' in item && !empty(item.size) ? item.size : ''
                        },
                        carriedReference: 'packageReference' in packageData && !empty(packageData.packageReference) ? packageData.packageReference : '',
                        trackingUrl: 'trackingUrl' in packageData && !empty(packageData.trackingUrl) ? packageData.trackingUrl : '',
                        qty: 'quantity' in item && !empty(item.quantity) ? item.quantity : '',
                        trackingNumber: 'carrierReference' in packageData && !empty(packageData.carrierReference) ? packageData.carrierReference : ''
                    }))
                    : [];
            } catch (error) {}
            return null;
        },
        setPkgAsnDates: function (fromDate, toDate) {
            return {
                startDate: fromDate,
                endDate: toDate
            };
        },
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                getClientID: function () {
                    return 'test-client';
                },
                getClientSecret: function () {
                    return 'test-client';
                }
            }
        }
    });

    it('Should be returning success status', function () {
        let jobRes = getASNtoESW.execute({ startDate: new Date(), endDate: new Date() });
        chai.expect(jobRes).to.be.an.instanceof(dwStatusMock);
    });
    it('Should be returning Error status', function () {
        let jobRes = getASNtoESW.execute();
        chai.expect(jobRes.status).to.equal(1);
    });
});
