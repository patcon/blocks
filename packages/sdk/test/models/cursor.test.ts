import MockAirtableInterface from '../airtable_interface_mocks/mock_airtable_interface';
import getSdk, {clearSdkForTest} from '../../src/get_sdk';
import Sdk from '../../src/sdk';
import Cursor from '../../src/models/cursor';

const mockAirtableInterface = MockAirtableInterface.projectTrackerExample();
jest.mock('../../src/injected/airtable_interface', () => ({
    __esModule: true,
    default() {
        return mockAirtableInterface;
    },
}));

describe('Base', () => {
    let sdk: Sdk;
    let cursor: Cursor;

    beforeEach(() => {
        sdk = getSdk();
        cursor = sdk.cursor;
        mockAirtableInterface.fetchAndSubscribeToCursorDataAsync.mockReturnValue(
            Promise.resolve({
                selectedFieldIdSet: {},
                selectedRecordIdSet: {},
            }),
        );

        return new Promise(resolve => {
            cursor.watch('isDataLoaded', function init() {
                cursor.unwatch('isDataLoaded', init);
                resolve();
            });
        });
    });

    afterEach(() => {
        mockAirtableInterface.reset();
        clearSdkForTest();
    });

    describe('model updates', () => {
        it('tolerates unrecognized paths', () => {
            const mock = jest.fn();

            mockAirtableInterface.triggerModelUpdates([
                {path: ['cursorData', 'a path component that is unlikely to exist'], value: null},
            ]);

            expect(mock).toHaveBeenCalledTimes(0);
        });
    });

    describe('constructor', () => {
        test('tolerates initialization data which does not designate an active table', () => {
            const baseData = Object.assign({}, mockAirtableInterface.sdkInitData.baseData);
            baseData.activeTableId = null;
            new Cursor(baseData, mockAirtableInterface);
        });

        test('tolerates initialization data whose table data has not yet populated', () => {
            const baseData = Object.assign({}, mockAirtableInterface.sdkInitData.baseData);
            baseData.tablesById = {};
            new Cursor(baseData, mockAirtableInterface);
        });
    });

    describe('#activeViewId', () => {
        test('initial', () => {
            expect(cursor.activeViewId).toEqual('viwkNnS94RQAQQTMn');
        });

        test('following update', () => {
            mockAirtableInterface.triggerModelUpdates([
                {
                    path: ['tablesById', 'tbly388E8NA1CNhnF', 'activeViewId'],
                    value: 'viw8v5XkLudbiCJfD',
                },
            ]);
            expect(cursor.activeViewId).toEqual('viw8v5XkLudbiCJfD');
        });
    });

    describe('#isRecordSelected', () => {
        beforeEach(() => {
            mockAirtableInterface.fetchAndSubscribeToCellValuesInFieldsAsync.mockReturnValue(
                Promise.resolve({recordsById: {}}),
            );
            mockAirtableInterface.fetchAndSubscribeToTableDataAsync.mockReturnValueOnce(
                Promise.resolve({
                    recordsById: {
                        recA: {
                            id: 'recA',
                            cellValuesByFieldId: {fldMockLookup: null},
                            commentCount: 0,
                            createdTime: new Date().toJSON(),
                        },
                    },
                }),
            );
        });

        test('by record ID - positive', () => {
            mockAirtableInterface.triggerModelUpdates([
                {
                    path: ['cursorData', 'selectedRecordIdSet'],
                    value: {
                        rec22222222222222: true,
                        rec33333333333333: true,
                        rec44444444444444: true,
                    },
                },
            ]);

            expect(cursor.isRecordSelected('rec22222222222222')).toBe(true);
            expect(cursor.isRecordSelected('rec33333333333333')).toBe(true);
            expect(cursor.isRecordSelected('rec44444444444444')).toBe(true);
        });

        test('by record ID - negative', () => {
            mockAirtableInterface.triggerModelUpdates([
                {
                    path: ['cursorData', 'selectedRecordIdSet'],
                    value: {
                        rec22222222222222: true,
                        rec33333333333333: true,
                        rec44444444444444: true,
                    },
                },
            ]);

            expect(cursor.isRecordSelected('rec11111111111111')).toBe(false);
            expect(cursor.isRecordSelected('rec55555555555555')).toBe(false);
        });

        test('by Record - positive', async () => {
            mockAirtableInterface.triggerModelUpdates([
                {
                    path: ['cursorData', 'selectedRecordIdSet'],
                    value: {recA: true},
                },
            ]);
            const queryResult = await sdk.base
                .getTableByName('Design projects')
                .selectRecordsAsync();
            expect(cursor.isRecordSelected(queryResult.getRecordById('recA'))).toBe(true);
        });

        test('by Record - negative', async () => {
            mockAirtableInterface.triggerModelUpdates([
                {
                    path: ['cursorData', 'selectedRecordIdSet'],
                    value: {recB: true},
                },
            ]);
            const queryResult = await sdk.base
                .getTableByName('Design projects')
                .selectRecordsAsync();
            expect(cursor.isRecordSelected(queryResult.getRecordById('recA'))).toBe(false);
        });
    });

    describe('#setActiveTable', () => {
        test('given a Table instance', () => {
            cursor.setActiveTable(sdk.base.getTableByName('Design projects'));

            expect(mockAirtableInterface.setActiveViewOrTable).toHaveBeenCalledTimes(1);
            expect(mockAirtableInterface.setActiveViewOrTable).toHaveBeenCalledWith(
                'tbly388E8NA1CNhnF',
            );
        });

        test('given a Table identifier', () => {
            cursor.setActiveTable('tbl0001');

            expect(mockAirtableInterface.setActiveViewOrTable).toHaveBeenCalledTimes(1);
            expect(mockAirtableInterface.setActiveViewOrTable).toHaveBeenCalledWith('tbl0001');
        });
    });

    describe('#setActiveView', () => {
        test('given a Table instance and a View instance', () => {
            cursor.setActiveView(
                sdk.base.getTableByName('Design projects'),
                sdk.base.getTableByName('Design projects').views[1],
            );

            expect(mockAirtableInterface.setActiveViewOrTable).toHaveBeenCalledTimes(1);
            expect(mockAirtableInterface.setActiveViewOrTable).toHaveBeenCalledWith(
                'tbly388E8NA1CNhnF',
                'viwqo8mFAqy2HYSCL',
            );
        });

        test('given a Table identifier and a View identifier', () => {
            cursor.setActiveView('tbl0001', 'viw0002');
            expect(mockAirtableInterface.setActiveViewOrTable).toHaveBeenCalledTimes(1);
            expect(mockAirtableInterface.setActiveViewOrTable).toHaveBeenCalledWith(
                'tbl0001',
                'viw0002',
            );
        });
    });

    describe('#selectedRecordIds', () => {
        test('unset', () => {
            expect(cursor.selectedRecordIds).toStrictEqual([]);
        });

        test('one record', () => {
            mockAirtableInterface.triggerModelUpdates([
                {
                    path: ['cursorData', 'selectedRecordIdSet'],
                    value: {rec11111111111111: true},
                },
            ]);

            expect(cursor.selectedRecordIds).toStrictEqual(['rec11111111111111']);
        });

        test('many records', () => {
            mockAirtableInterface.triggerModelUpdates([
                {
                    path: ['cursorData', 'selectedRecordIdSet'],
                    value: {
                        rec22222222222222: true,
                        rec33333333333333: true,
                    },
                },
            ]);

            expect(cursor.selectedRecordIds.sort()).toStrictEqual([
                'rec22222222222222',
                'rec33333333333333',
            ]);
        });
    });

    describe('#selectedFieldIds', () => {
        test('unset', () => {
            expect(cursor.selectedFieldIds).toStrictEqual([]);
        });

        test('one record', () => {
            mockAirtableInterface.triggerModelUpdates([
                {
                    path: ['cursorData', 'selectedFieldIdSet'],
                    value: {fld11111111111111: true},
                },
            ]);

            expect(cursor.selectedFieldIds).toStrictEqual(['fld11111111111111']);
        });

        test('many records', () => {
            mockAirtableInterface.triggerModelUpdates([
                {
                    path: ['cursorData', 'selectedFieldIdSet'],
                    value: {
                        fld22222222222222: true,
                        fld33333333333333: true,
                    },
                },
            ]);

            expect(cursor.selectedFieldIds.sort()).toStrictEqual([
                'fld22222222222222',
                'fld33333333333333',
            ]);
        });
    });

    describe('#watch', () => {
        test('key: selectedRecordIds', async () => {
            const watched = new Promise(resolve => {
                cursor.watch('selectedRecordIds', resolve);
            });

            mockAirtableInterface.triggerModelUpdates([
                {
                    path: ['cursorData', 'selectedRecordIdSet'],
                    value: {recQgzEV1JYj3Fc01: true},
                },
            ]);

            return watched;
        });

        test('key: selectedFieldIds', () => {
            const watched = new Promise(resolve => {
                cursor.watch('selectedFieldIds', resolve);
            });

            mockAirtableInterface.triggerModelUpdates([
                {
                    path: ['cursorData', 'selectedFieldIdSet'],
                    value: {fld3J1M1Yvqmuqkd2: true},
                },
            ]);

            return watched;
        });

        describe('key: activeTableId', () => {
            test('valid Table identifier', async () => {
                const activeTableMock = jest.fn();
                const activeViewMock = jest.fn();
                cursor.watch('activeTableId', activeTableMock);
                cursor.watch('activeViewId', activeViewMock);

                mockAirtableInterface.triggerModelUpdates([
                    {
                        path: ['activeTableId'],
                        value: 'tbly388E8NA1CNhnF',
                    },
                ]);

                expect(activeTableMock).toHaveBeenCalledTimes(1);
                expect(activeViewMock).toHaveBeenCalledTimes(0);
                expect(cursor.activeTableId).toBe('tbly388E8NA1CNhnF');
                expect(cursor.activeViewId).toBe('viwkNnS94RQAQQTMn');
            });

            test('null - updates activeTableId', async () => {
                const tableId = new Promise(resolve => {
                    cursor.watch('activeTableId', resolve);
                });

                mockAirtableInterface.triggerModelUpdates([
                    {
                        path: ['activeTableId'],
                        value: null,
                    },
                ]);

                await tableId;

                expect(cursor.activeTableId).toBe(null);
            });

            test('null - updates activeViewId', async () => {
                const viewId = new Promise(resolve => {
                    cursor.watch('activeViewId', resolve);
                });

                mockAirtableInterface.triggerModelUpdates([
                    {
                        path: ['activeTableId'],
                        value: null,
                    },
                ]);

                await viewId;

                expect(cursor.activeViewId).toBe(null);
            });
        });

        test('key: activeViewId', async () => {
            const watched = new Promise(resolve => {
                cursor.watch('activeViewId', resolve);
            });

            mockAirtableInterface.triggerModelUpdates([
                {
                    path: ['tablesById', 'tbly388E8NA1CNhnF', 'activeViewId'],
                    value: 'viw8v5XkLudbiCJfD',
                },
            ]);

            return watched;
        });

        test('key: isDataLoaded', () => {
            return new Promise(resolve => {
                cursor.watch('isDataLoaded', resolve);
                cursor.unloadData();
            });
        });
    });
});
