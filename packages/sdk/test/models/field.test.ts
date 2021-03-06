import MockAirtableInterface from '../airtable_interface_mocks/mock_airtable_interface';
import Field from '../../src/models/field';
import {FieldType} from '../../src/types/field';
import Sdk from '../../src/sdk';
import getSdk, {clearSdkForTest} from '../../src/get_sdk';
import {MutationTypes} from '../../src/types/mutations';

const mockAirtableInterface = MockAirtableInterface.projectTrackerExample();
jest.mock('../../src/injected/airtable_interface', () => ({
    __esModule: true,
    default() {
        return mockAirtableInterface;
    },
}));

describe('Field', () => {
    let sdk: Sdk;
    let field: Field;

    const makeField = (fieldType: FieldType) => {
        const fieldId = 'fldTest';
        const baseData = mockAirtableInterface.sdkInitData.baseData;
        const parentTable = baseData.tablesById.tbly388E8NA1CNhnF;
        parentTable.fieldsById[fieldId] = {
            id: fieldId,
            name: 'Field 1',
            type: '',
            typeOptions: null,
            description: null,
            lock: null,
        };

        const newField = new Field(baseData, sdk.base.getTableById('tbly388E8NA1CNhnF'), fieldId);

        Object.defineProperty(newField, 'type', {
            get: jest.fn(() => fieldType),
        });

        return newField;
    };

    beforeEach(() => {
        sdk = getSdk();
        field = sdk.base.tables[0].fields[1];
    });

    afterEach(() => {
        mockAirtableInterface.reset();
        clearSdkForTest();
    });

    describe('updateOptionsAsync', () => {
        it('accepts non-null field options', async () => {
            const newField = makeField(FieldType.SINGLE_SELECT);

            await newField.updateOptionsAsync({
                choices: [{name: 'pick me'}],
            });

            expect(mockAirtableInterface.applyMutationAsync).toHaveBeenCalledTimes(1);
            expect(mockAirtableInterface.applyMutationAsync).toHaveBeenLastCalledWith(
                {
                    type: MutationTypes.UPDATE_SINGLE_FIELD_CONFIG,
                    tableId: 'tbly388E8NA1CNhnF',
                    id: 'fldTest',
                    config: {
                        type: FieldType.SINGLE_SELECT,
                        options: {
                            choices: [{name: 'pick me'}],
                        },
                    },
                },
                {holdForMs: 100},
            );
        });
    });

    test.skip('#availableAggregators', () => {});

    describe('#checkPermissionsForUpdateOptions', () => {
        test('request to AirtableInterface - without options', () => {
            field.checkPermissionsForUpdateOptions();

            expect(mockAirtableInterface.checkPermissionsForMutation).toHaveBeenCalledTimes(1);
            expect(mockAirtableInterface.checkPermissionsForMutation).toHaveBeenCalledWith(
                {
                    config: {
                        options: undefined,
                        type: 'foreignKey',
                    },
                    id: 'fld3DvZllJtyaNYpm',
                    tableId: 'tbly388E8NA1CNhnF',
                    type: 'updateSingleFieldConfig',
                },
                mockAirtableInterface.sdkInitData.baseData,
            );
        });

        test('request to AirtableInterface - with options', () => {
            field.checkPermissionsForUpdateOptions({foo: 'bar'});
            expect(mockAirtableInterface.checkPermissionsForMutation).toHaveBeenCalledTimes(1);
            expect(mockAirtableInterface.checkPermissionsForMutation).toHaveBeenCalledWith(
                {
                    config: {
                        options: {foo: 'bar'},
                        type: 'foreignKey',
                    },
                    id: 'fld3DvZllJtyaNYpm',
                    tableId: 'tbly388E8NA1CNhnF',
                    type: 'updateSingleFieldConfig',
                },
                mockAirtableInterface.sdkInitData.baseData,
            );
        });

        test('forwarding of response from AirtableInterface', () => {
            mockAirtableInterface.checkPermissionsForMutation.mockReturnValue({
                hasPermission: true,
            });
            expect(field.checkPermissionsForUpdateOptions()).toStrictEqual({
                hasPermission: true,
            });
        });
    });

    describe('#convertStringToCellValue', () => {
        test('request to AirtableInterface: conversion', () => {
            field.convertStringToCellValue('hello');

            expect(
                mockAirtableInterface.fieldTypeProvider.convertStringToCellValue,
            ).toHaveBeenCalledTimes(1);
            expect(
                mockAirtableInterface.fieldTypeProvider.convertStringToCellValue,
            ).toHaveBeenCalledWith(sdk.__appInterface, 'hello', field._data);
        });

        test('computed value (no validation applied)', () => {
            mockAirtableInterface.fieldTypeProvider.convertStringToCellValue.mockReturnValue(
                'converted value 1',
            );
            mockAirtableInterface.fieldTypeProvider.validateCellValueForUpdate.mockReturnValue({
                isValid: false,
                reason: '',
            });
            mockAirtableInterface.fieldTypeProvider.isComputed.mockReturnValue(true);

            expect(field.convertStringToCellValue('hello')).toBe('converted value 1');
        });

        test('request to AirtableInterface: validation', () => {
            mockAirtableInterface.fieldTypeProvider.convertStringToCellValue.mockReturnValue(
                'converted value 2',
            );

            field.convertStringToCellValue('hello');

            expect(
                mockAirtableInterface.fieldTypeProvider.validateCellValueForUpdate,
            ).toHaveBeenCalledTimes(1);
            expect(
                mockAirtableInterface.fieldTypeProvider.validateCellValueForUpdate,
            ).toHaveBeenCalledWith(sdk.__appInterface, 'converted value 2', null, field._data);
        });

        test('non-computed value, passing validation', () => {
            mockAirtableInterface.fieldTypeProvider.convertStringToCellValue.mockReturnValue(
                'converted value 3',
            );
            mockAirtableInterface.fieldTypeProvider.validateCellValueForUpdate.mockReturnValue({
                isValid: true,
            });
            mockAirtableInterface.fieldTypeProvider.isComputed.mockReturnValue(false);

            expect(field.convertStringToCellValue('hello')).toBe('converted value 3');
        });

        test('non-computed value, passing validation', () => {
            mockAirtableInterface.fieldTypeProvider.convertStringToCellValue.mockReturnValue(
                'converted value 4',
            );
            mockAirtableInterface.fieldTypeProvider.validateCellValueForUpdate.mockReturnValue({
                isValid: false,
                reason: '',
            });
            mockAirtableInterface.fieldTypeProvider.isComputed.mockReturnValue(false);

            expect(field.convertStringToCellValue('hello')).toBe(null);
        });
    });

    test('#description', () => {
        expect(field.description).toBe('the project client');
    });

    describe('#hasPermissionToUpdateOptions', () => {
        test('return value: true', () => {
            mockAirtableInterface.checkPermissionsForMutation.mockReturnValue({
                hasPermission: true,
            });
            expect(field.hasPermissionToUpdateOptions()).toBe(true);
        });

        test('return value: true', () => {
            mockAirtableInterface.checkPermissionsForMutation.mockReturnValue({
                hasPermission: false,
                reasonDisplayString: '',
            });
            expect(field.hasPermissionToUpdateOptions()).toBe(false);
        });
    });

    describe('#isComputed', () => {
        test('affirmative', () => {
            mockAirtableInterface.fieldTypeProvider.isComputed.mockReturnValue(true);

            expect(field.isComputed).toBe(true);
        });

        test('negative', () => {
            expect(field.isComputed).toBe(false);
        });
    });

    describe('#isDeleted', () => {
        test('affirmative', () => {
            mockAirtableInterface.triggerModelUpdates([
                {
                    path: ['tablesById', 'tbly388E8NA1CNhnF', 'fieldsById', 'fld3DvZllJtyaNYpm'],
                    value: null,
                },
            ]);

            expect(field.isDeleted).toBe(true);
        });

        test('negative', () => {
            expect(field.isDeleted).toBe(false);
        });
    });

    describe('#isPrimaryField', () => {
        test('affirmative', () => {
            expect(sdk.base.tables[0].fields[0].isPrimaryField).toBe(true);
        });

        test('negative', () => {
            expect(field.isPrimaryField).toBe(false);
        });
    });

    test('#name', () => {
        expect(field.name).toBe('Client');
    });

    describe('#options', () => {
        test('no options available', () => {
            expect(sdk.base.tables[0].fields[0].options).toBe(null);
        });

        test('options available', () => {
            expect(field.options).toStrictEqual({
                foreignTableId: 'tblyt8B45wJQIx1c3',
                relationship: 'many',
                symmetricColumnId: 'fld3nuJVc9ivC8IJF',
            });
        });
    });

    describe('#type', () => {
        test('lookup type', () => {
            mockAirtableInterface.sdkInitData.baseData.tablesById.tbly388E8NA1CNhnF.fieldsById.fld3DvZllJtyaNYpm.type =
                'lookup';
            expect(field.type).toBe(FieldType.MULTIPLE_LOOKUP_VALUES);
        });

        test('other types', () => {
            expect(sdk.base.tables[0].fields[3].type).toBe(FieldType.CHECKBOX);
        });
    });

    describe('#watch', () => {
        let mocks: {[key: string]: jest.Mock};

        beforeEach(() => {
            mocks = {
                description: jest.fn(),
                isComputed: jest.fn(),
                name: jest.fn(),
                options: jest.fn(),
                type: jest.fn(),
            };
            field.watch('description', mocks.description);
            field.watch('isComputed', mocks.isComputed);
            field.watch('name', mocks.name);
            field.watch('options', mocks.options);
            field.watch('type', mocks.type);
        });

        test('key: description', () => {
            mockAirtableInterface.triggerModelUpdates([
                {
                    path: [
                        'tablesById',
                        'tbly388E8NA1CNhnF',
                        'fieldsById',
                        'fld3DvZllJtyaNYpm',
                        'description',
                    ],
                    value: 'some other description',
                },
            ]);

            expect(mocks.description).toHaveBeenCalledTimes(1);
            expect(mocks.isComputed).toHaveBeenCalledTimes(0);
            expect(mocks.name).toHaveBeenCalledTimes(0);
            expect(mocks.options).toHaveBeenCalledTimes(0);
            expect(mocks.type).toHaveBeenCalledTimes(0);
        });

        test('key: isComputed', () => {
            mockAirtableInterface.triggerModelUpdates([
                {
                    path: [
                        'tablesById',
                        'tbly388E8NA1CNhnF',
                        'fieldsById',
                        'fld3DvZllJtyaNYpm',
                        'type',
                    ],
                    value: 'select',
                },
            ]);

            expect(mocks.description).toHaveBeenCalledTimes(0);
            expect(mocks.isComputed).toHaveBeenCalledTimes(1);
            expect(mocks.name).toHaveBeenCalledTimes(0);
            expect(mocks.options).toHaveBeenCalledTimes(0);
            expect(mocks.type).toHaveBeenCalledTimes(1);
        });

        test('key: name', () => {
            mockAirtableInterface.triggerModelUpdates([
                {
                    path: [
                        'tablesById',
                        'tbly388E8NA1CNhnF',
                        'fieldsById',
                        'fld3DvZllJtyaNYpm',
                        'name',
                    ],
                    value: 'some other name',
                },
            ]);

            expect(mocks.description).toHaveBeenCalledTimes(0);
            expect(mocks.isComputed).toHaveBeenCalledTimes(0);
            expect(mocks.name).toHaveBeenCalledTimes(1);
            expect(mocks.options).toHaveBeenCalledTimes(0);
            expect(mocks.type).toHaveBeenCalledTimes(0);
        });

        test('key: options', () => {
            mockAirtableInterface.triggerModelUpdates([
                {
                    path: [
                        'tablesById',
                        'tbly388E8NA1CNhnF',
                        'fieldsById',
                        'fld3DvZllJtyaNYpm',
                        'typeOptions',
                    ],
                    value: {},
                },
            ]);

            expect(mocks.description).toHaveBeenCalledTimes(0);
            expect(mocks.isComputed).toHaveBeenCalledTimes(0);
            expect(mocks.name).toHaveBeenCalledTimes(0);
            expect(mocks.options).toHaveBeenCalledTimes(1);
            expect(mocks.type).toHaveBeenCalledTimes(0);
        });

        test('key: type', () => {
            mockAirtableInterface.triggerModelUpdates([
                {
                    path: [
                        'tablesById',
                        'tbly388E8NA1CNhnF',
                        'fieldsById',
                        'fld3DvZllJtyaNYpm',
                        'type',
                    ],
                    value: 'select',
                },
            ]);

            expect(mocks.description).toHaveBeenCalledTimes(0);
            expect(mocks.isComputed).toHaveBeenCalledTimes(1);
            expect(mocks.name).toHaveBeenCalledTimes(0);
            expect(mocks.options).toHaveBeenCalledTimes(0);
            expect(mocks.type).toHaveBeenCalledTimes(1);
        });
    });
});
