/**
 * Copyright 2023-present DreamNum Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { LocaleType, LogLevel, Tools, Univer, UniverInstanceType, UserManagerService } from '@univerjs/core';
import { FUniver } from '@univerjs/core/facade';
import { UniverDocsPlugin } from '@univerjs/docs';
import { UniverDocsUIPlugin } from '@univerjs/docs-ui';
import { UniverFormulaEnginePlugin } from '@univerjs/engine-formula';
import { UniverRenderEnginePlugin } from '@univerjs/engine-render';
import { DEFAULT_WORKBOOK_DATA_DEMO } from '@univerjs/mockdata';
import { getEmptySnapshot } from '@univerjs/core/sheets/empty-snapshot.ts';
import caES from '@univerjs/mockdata/locales/ca-ES';
import enUS from '@univerjs/mockdata/locales/en-US';
import esES from '@univerjs/mockdata/locales/es-ES';
import faIR from '@univerjs/mockdata/locales/fa-IR';
import frFR from '@univerjs/mockdata/locales/fr-FR';
import koKR from '@univerjs/mockdata/locales/ko-KR';
import ruRU from '@univerjs/mockdata/locales/ru-RU';
import viVN from '@univerjs/mockdata/locales/vi-VN';
import zhCN from '@univerjs/mockdata/locales/zh-CN';
import zhTW from '@univerjs/mockdata/locales/zh-TW';
import { UniverRPCMainThreadPlugin } from '@univerjs/rpc';
import { UniverSheetsPlugin } from '@univerjs/sheets';
import { UniverSheetsConditionalFormattingPlugin } from '@univerjs/sheets-conditional-formatting';
import { UniverSheetsDataValidationPlugin } from '@univerjs/sheets-data-validation';
import { UniverSheetsFilterPlugin } from '@univerjs/sheets-filter';
import { UniverSheetsFormulaPlugin } from '@univerjs/sheets-formula';
import { UniverSheetsHyperLinkPlugin } from '@univerjs/sheets-hyper-link';
import { UniverSheetsNotePlugin } from '@univerjs/sheets-note';
import { UniverSheetsNumfmtPlugin } from '@univerjs/sheets-numfmt';
import { UniverSheetsSortPlugin } from '@univerjs/sheets-sort';
import { UniverSheetsTablePlugin } from '@univerjs/sheets-table';
import { UniverSheetsUIPlugin } from '@univerjs/sheets-ui';
import { UniverSheetsZenEditorPlugin } from '@univerjs/sheets-zen-editor';
import { UniverUIPlugin } from '@univerjs/ui';
import { customRegisterEvent } from './custom/custom-register-event';
import { UniverSheetsCustomShortcutPlugin } from './custom/custom-shortcut';
import ImportCSVButtonPlugin from './custom/import-csv-button';
import ExportXlsxPlugin from './custom/export-xlsx-plugin';
import ImportXlsxPlugin from './custom/import-xlsx-plugin';
import SaveAutosavePlugin from './custom/save-autosave-plugin';

import '@univerjs/sheets/facade';
import '@univerjs/ui/facade';
import '@univerjs/docs-ui/facade';
import '@univerjs/sheets-ui/facade';
import '@univerjs/sheets-data-validation/facade';
import '@univerjs/engine-formula/facade';
import '@univerjs/sheets-filter/facade';
import '@univerjs/sheets-formula/facade';
import '@univerjs/sheets-numfmt/facade';
import '@univerjs/sheets-hyper-link-ui/facade';
import '@univerjs/sheets-conditional-formatting/facade';
import '@univerjs/sheets-find-replace/facade';
import '@univerjs/sheets-drawing-ui/facade';
import '@univerjs/sheets-zen-editor/facade';
import '@univerjs/sheets-crosshair-highlight/facade';
import '@univerjs/sheets-formula-ui/facade';
import '@univerjs/sheets-table/facade';
import '@univerjs/sheets-sort/facade';
import '@univerjs/sheets-note/facade';
import '../global.css';

/* eslint-disable-next-line node/prefer-global/process */
const IS_E2E: boolean = !!process.env.IS_E2E;

const LOAD_LAZY_PLUGINS_TIMEOUT = 50;
const LOAD_VERY_LAZY_PLUGINS_TIMEOUT = 100;

export const mockUser = {
    userID: 'Owner_qxVnhPbQ',
    name: 'Owner',
    avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAInSURBVHgBtZU9TxtBEIbfWRzFSIdkikhBSqRQkJqkCKTCFkqVInSUSaT0wC8w/gXxD4gU2nRJkXQWhAZowDUUWKIwEgWWbEEB3mVmx3dn4DA2nB/ppNuPeWd29mMIPXDr+RxwtgRHeW6+guNPRxogqnL7Dwz9psJ27S4NShaeZTH3kwXy6I81dlRKcmRui88swdq9AcSFL7Buz1Vmlns64MiLsCjzwnIYHLH57tbfFbs7KRaXyEU8FVZofqccOfA5l7Q8LPIkGrwnb2RPNEXWFVMUF3L+kDCk0btDDAMzOm5YfAHDwp4tG74wnzAsiOYMnJ3GoDybA7IT98/jm5+JNnfiIzAS6LlqHQBN/i6b2t/cV1Hh6BfwYlHnHP4AXi5q/8kmMMpOs8+BixZw/Fd6xUEHEbnkgclvQP2fGp7uShRKnQ3G32rkjV1th8JhIGG7tR/JyjGteSOZELwGMmNqIIigRCLRh2OZIE6BjItdd7pCW6Uhm1zzkUtungSxwEUzNpQ+GQumtH1ej1MqgmNT6vwmhCq5yuwq56EYTbgeQUz3yvrpV1b4ok3nYJ+eYhgYmjRUqErx2EDq0Fr8FhG++iqVGqxlUJI/70Ar0UgJaWHj6hYVHJrfKssAHot1JfqwE9WVWzXZVd5z2Ws/4PnmtEjkXeKJDvxUecLbWOXH/DP6QQ4J72NS0adedp1aseBfXP8odlZFfPvBF7SN/8hky1TYuPOAXAEipMx15u5ToAAAAABJRU5ErkJggg==',
    anonymous: false,
    canBindAnonymous: false,
};

// eslint-disable-next-line max-lines-per-function
function createNewInstance() {
    // univer
    const univer = new Univer({
        // theme: greenTheme,
        darkMode: localStorage.getItem('local.darkMode') === 'dark',
        locale: LocaleType.EN_US,
        locales: {
            [LocaleType.CA_ES]: caES,
            [LocaleType.EN_US]: enUS,
            [LocaleType.ES_ES]: esES,
            [LocaleType.FA_IR]: faIR,
            [LocaleType.FR_FR]: frFR,
            [LocaleType.KO_KR]: koKR,
            [LocaleType.RU_RU]: ruRU,
            [LocaleType.VI_VN]: viVN,
            [LocaleType.ZH_CN]: zhCN,
            [LocaleType.ZH_TW]: zhTW,
        },
        logLevel: LogLevel.VERBOSE,
    });

    const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

    univer.registerPlugins([
        [UniverRPCMainThreadPlugin, { workerURL: worker }],
        [UniverDocsPlugin],
        [UniverRenderEnginePlugin],
        [UniverUIPlugin, {
            container: 'app',
        }],
        [UniverDocsUIPlugin],
        [UniverSheetsPlugin, {
            notExecuteFormula: true,
            autoHeightForMergedCells: true,
        }],
        [UniverSheetsUIPlugin],
        [UniverSheetsNumfmtPlugin],
        [UniverSheetsZenEditorPlugin],
        [UniverFormulaEnginePlugin, { notExecuteFormula: true }],
        [UniverSheetsFormulaPlugin, { notExecuteFormula: true }],
        [UniverSheetsDataValidationPlugin],
        [UniverSheetsConditionalFormattingPlugin],
        [UniverSheetsFilterPlugin],
        [UniverSheetsSortPlugin],
        [UniverSheetsHyperLinkPlugin],
        [UniverSheetsTablePlugin],
        [UniverSheetsNotePlugin],
        [ImportCSVButtonPlugin],
        [ImportXlsxPlugin],
        [ExportXlsxPlugin],
        [SaveAutosavePlugin],
        [UniverSheetsCustomShortcutPlugin],
    ]);

    const injector = univer.__getInjector();
    const userManagerService = injector.get(UserManagerService);
    userManagerService.setCurrentUser(mockUser);

    // create univer sheet instance (blank and editable)
    if (!IS_E2E) {
        const blank = getEmptySnapshot('workbook-local', LocaleType.EN_US, '');
        univer.createUnit(UniverInstanceType.UNIVER_SHEET, blank);
    }

    setTimeout(() => {
        import('./lazy').then((lazy) => {
            const plugins = lazy.default();
            univer.registerPlugins(plugins);
        });
    }, LOAD_LAZY_PLUGINS_TIMEOUT);

    setTimeout(() => {
        import('./very-lazy').then((lazy) => {
            const plugins = lazy.default();
            univer.registerPlugins(plugins);
        });
    }, LOAD_VERY_LAZY_PLUGINS_TIMEOUT);

    univer.onDispose(() => {
        worker.terminate();
        window.univer = undefined;
        window.univerAPI = undefined;
    });

    window.univer = univer;
    window.univerAPI = FUniver.newAPI(univer);

    customRegisterEvent(univer, window.univerAPI!);
}

createNewInstance();
window.createNewInstance = createNewInstance;

declare global {
    // eslint-disable-next-line ts/naming-convention
    interface Window {
        univer?: Univer;
        univerAPI?: ReturnType<typeof FUniver.newAPI>;
        createNewInstance?: typeof createNewInstance;
    }
}
